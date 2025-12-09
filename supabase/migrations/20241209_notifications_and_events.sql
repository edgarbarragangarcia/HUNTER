-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_tender', 'deadline', 'market_change', 'alert')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Tabla de entidades monitoreadas
CREATE TABLE IF NOT EXISTS monitored_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_name VARCHAR(255) NOT NULL,
    entity_nit VARCHAR(50),
    notify_on_new_tender BOOLEAN DEFAULT TRUE,
    notify_on_changes BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_monitored_entities_user_id ON monitored_entities(user_id);

-- RLS Policies
ALTER TABLE monitored_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monitored entities"
    ON monitored_entities FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tabla de configuración de alertas del usuario
CREATE TABLE IF NOT EXISTS user_alert_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    new_tenders BOOLEAN DEFAULT TRUE,
    deadlines BOOLEAN DEFAULT TRUE,
    market_changes BOOLEAN DEFAULT TRUE,
    critical_alerts BOOLEAN DEFAULT TRUE,
    deadline_days_before INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert settings"
    ON user_alert_settings FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Agregar campos faltantes a la tabla projects para el flujo completo
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS submission_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS result VARCHAR(50) CHECK (result IN ('WON', 'LOST', 'PENDING'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS result_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS result_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Actualizar ENUM type para status incluyendo nuevos estados
-- Primero verificamos y agregamos los valores que faltan al ENUM
DO $$ 
BEGIN
    -- Agregar 'DRAFT' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DRAFT' AND enumtypid = 'project_status'::regtype) THEN
        ALTER TYPE project_status ADD VALUE 'DRAFT';
    END IF;
    
    -- Agregar 'IN_EVALUATION' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN_EVALUATION' AND enumtypid = 'project_status'::regtype) THEN
        ALTER TYPE project_status ADD VALUE 'IN_EVALUATION';
    END IF;
    
    -- Agregar 'WON' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WON' AND enumtypid = 'project_status'::regtype) THEN
        ALTER TYPE project_status ADD VALUE 'WON';
    END IF;
    
    -- Agregar 'LOST' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LOST' AND enumtypid = 'project_status'::regtype) THEN
        ALTER TYPE project_status ADD VALUE 'LOST';
    END IF;
    
    -- Agregar 'ARCHIVED' si no existe
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ARCHIVED' AND enumtypid = 'project_status'::regtype) THEN
        ALTER TYPE project_status ADD VALUE 'ARCHIVED';
    END IF;
END $$;

-- Tabla de calendario/eventos (fechas críticas)
CREATE TABLE IF NOT EXISTS project_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL CHECK (event_type IN (
        'question_deadline',
        'answer_release',
        'proposal_deadline',
        'opening_event',
        'adjudication',
        'contract_signing',
        'custom'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_project_events_project_id ON project_events(project_id);
CREATE INDEX idx_project_events_user_id ON project_events(user_id);
CREATE INDEX idx_project_events_date ON project_events(event_date);

-- RLS Policies
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage events for their projects"
    ON project_events FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tabla de documentos generados por la IA
CREATE TABLE IF NOT EXISTS project_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL CHECK (document_type IN (
        'technical_proposal',
        'economic_proposal',
        'cover_letter',
        'timeline',
        'risk_matrix',
        'work_plan',
        'custom'
    )),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINAL', 'SUBMITTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_project_documents_project_id ON project_documents(project_id);
CREATE INDEX idx_project_documents_user_id ON project_documents(user_id);

-- RLS Policies
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage documents for their projects"
    ON project_documents FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Función para crear alertas automáticas
CREATE OR REPLACE FUNCTION create_deadline_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear notificación 48 horas antes del deadline
    IF NEW.event_date <= NOW() + INTERVAL '2 days' AND NOT NEW.reminder_sent THEN
        INSERT INTO notifications (user_id, type, title, message, action_url)
        VALUES (
            NEW.user_id,
            'deadline',
            'Fecha límite próxima',
            NEW.title || ' - ' || NEW.description,
            '/dashboard/missions/' || NEW.project_id::text
        );
        
        NEW.reminder_sent := TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alertas automáticas
DROP TRIGGER IF EXISTS trigger_deadline_notifications ON project_events;
CREATE TRIGGER trigger_deadline_notifications
    BEFORE UPDATE ON project_events
    FOR EACH ROW
    EXECUTE FUNCTION create_deadline_notifications();

-- Comentarios para documentación
COMMENT ON TABLE notifications IS 'Sistema de notificaciones para alertas de licitaciones, fechas límite y cambios de mercado';
COMMENT ON TABLE monitored_entities IS 'Entidades estatales que el usuario está monitoreando para recibir alertas';
COMMENT ON TABLE user_alert_settings IS 'Configuración personalizada de alertas por usuario';
COMMENT ON TABLE project_events IS 'Calendario de eventos y fechas críticas para cada misión/proyecto';
COMMENT ON TABLE project_documents IS 'Documentos generados por IA para cada misión (propuestas, planes, etc.)';
