-- Missions (Project Management) Schema

-- 1. Projects (Missions)
-- Represents a specific tender application process managed by the user
DO $$ BEGIN
    CREATE TYPE project_methodology AS ENUM ('PMBOK', 'AGILE', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('DRAFT', 'ACTIVE', 'SUBMITTED', 'AWARDED', 'LOST', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  tender_id uuid references public.historical_tenders(id), -- Link to specific tender
  name text not null,
  description text,
  methodology project_methodology default 'AGILE',
  status project_status default 'ACTIVE',
  start_date date default current_date,
  deadline_date date, -- Usually tender closing date
  budget numeric, -- Internal budget for the application
  progress numeric default 0, -- 0-100
  secop_process_id text, -- To track updates from SECOP
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_company on public.projects(company_id);
create index if not exists idx_projects_tender on public.projects(tender_id);

-- 2. Project Stages (Columns/Phases)
-- For Agile: To Do, In Progress, Review, Done
-- For PMBOK: Initiation, Planning, Execution, Monitoring, Closing
create table if not exists public.project_stages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  "order" integer not null,
  color text,
  created_at timestamptz default now()
);

create index if not exists idx_project_stages_project on public.project_stages(project_id);

-- 3. Project Tasks
-- Individual tasks or requirements to fulfill
DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

create table if not exists public.project_tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  stage_id uuid references public.project_stages(id) on delete set null,
  title text not null,
  description text,
  priority task_priority default 'MEDIUM',
  status task_status default 'TODO',
  assigned_to uuid references public.profiles(id), -- If team features added later
  due_date timestamptz,
  
  -- Requirement linking
  is_requirement boolean default false,
  requirement_type text, -- 'legal', 'financial', 'technical'
  requirement_met boolean default false,
  gap_analysis_note text, -- AI suggestion on how to close the gap
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_project_tasks_project on public.project_tasks(project_id);
create index if not exists idx_project_tasks_stage on public.project_tasks(stage_id);

-- 4. Gap Analysis Cache
-- Stores the AI analysis of Company Profile vs Tender Requirements
create table if not exists public.gap_analysis (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  analysis_date timestamptz default now(),
  overall_match_score numeric, -- 0-100
  
  -- Structured analysis
  missing_requirements jsonb, -- List of what is missing
  recommendations jsonb, -- AI advice
  critical_risks jsonb, -- Deal breakers
  
  created_at timestamptz default now()
);

create index if not exists idx_gap_analysis_project on public.gap_analysis(project_id);

-- RLS Policies

alter table public.projects enable row level security;
drop policy if exists "Users can manage own company projects" on public.projects;
create policy "Users can manage own company projects" on public.projects
  for all using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = projects.company_id
      and profiles.user_id = auth.uid()
    )
  );

alter table public.project_stages enable row level security;
drop policy if exists "Users can manage own project stages" on public.project_stages;
create policy "Users can manage own project stages" on public.project_stages
  for all using (
    exists (
      select 1 from public.projects
      join public.companies on projects.company_id = companies.id
      join public.profiles on companies.profile_id = profiles.id
      where projects.id = project_stages.project_id
      and profiles.user_id = auth.uid()
    )
  );

alter table public.project_tasks enable row level security;
drop policy if exists "Users can manage own project tasks" on public.project_tasks;
create policy "Users can manage own project tasks" on public.project_tasks
  for all using (
    exists (
      select 1 from public.projects
      join public.companies on projects.company_id = companies.id
      join public.profiles on companies.profile_id = profiles.id
      where projects.id = project_tasks.project_id
      and profiles.user_id = auth.uid()
    )
  );

alter table public.gap_analysis enable row level security;
drop policy if exists "Users can view own gap analysis" on public.gap_analysis;
create policy "Users can view own gap analysis" on public.gap_analysis
  for select using (
    exists (
      select 1 from public.projects
      join public.companies on projects.company_id = companies.id
      join public.profiles on companies.profile_id = profiles.id
      where projects.id = gap_analysis.project_id
      and profiles.user_id = auth.uid()
    )
  );
