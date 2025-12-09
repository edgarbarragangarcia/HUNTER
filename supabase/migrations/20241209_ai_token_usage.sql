-- Create table for AI token usage tracking
CREATE TABLE IF NOT EXISTS ai_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Token metrics
    total_tokens INTEGER NOT NULL DEFAULT 0,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    
    -- Model information
    model VARCHAR(100) NOT NULL DEFAULT 'gpt-4-turbo',
    provider VARCHAR(50) NOT NULL DEFAULT 'openai', -- openai, anthropic, google
    
    -- Usage context
    feature VARCHAR(100), -- 'predictions', 'copilot', 'analytics', etc.
    request_type VARCHAR(50), -- 'chat', 'completion', 'embedding', etc.
    
    -- Cost tracking (optional)
    estimated_cost DECIMAL(10, 6),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_user_id ON ai_token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_company_id ON ai_token_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_created_at ON ai_token_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_token_usage_model ON ai_token_usage(model);

-- Create materialized view for user token statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_token_stats AS
SELECT 
    user_id,
    SUM(total_tokens) as total_tokens,
    SUM(prompt_tokens) as prompt_tokens,
    SUM(completion_tokens) as completion_tokens,
    COUNT(*) as total_requests,
    SUM(estimated_cost) as total_cost,
    MAX(created_at) as last_usage,
    -- Most used model
    (
        SELECT model 
        FROM ai_token_usage atu2 
        WHERE atu2.user_id = atu.user_id 
        GROUP BY model 
        ORDER BY COUNT(*) DESC 
        LIMIT 1
    ) as primary_model
FROM ai_token_usage atu
GROUP BY user_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_token_stats_user_id ON user_token_stats(user_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_user_token_stats()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_token_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh stats when usage is inserted
CREATE TRIGGER trigger_refresh_user_token_stats
AFTER INSERT OR UPDATE OR DELETE ON ai_token_usage
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_token_stats();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_token_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_ai_token_usage_updated_at
BEFORE UPDATE ON ai_token_usage
FOR EACH ROW
EXECUTE FUNCTION update_ai_token_usage_updated_at();

-- Enable Row Level Security
ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own token usage
CREATE POLICY "Users can view own token usage"
ON ai_token_usage
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert token usage for any user
CREATE POLICY "System can insert token usage"
ON ai_token_usage
FOR INSERT
WITH CHECK (true);

-- Users can update their own token usage
CREATE POLICY "Users can update own token usage"
ON ai_token_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON user_token_stats TO authenticated;

-- Insert some sample data for testing (optional)
-- INSERT INTO ai_token_usage (user_id, total_tokens, prompt_tokens, completion_tokens, model, feature)
-- VALUES (
--     (SELECT id FROM auth.users LIMIT 1),
--     45678,
--     23450,
--     22228,
--     'gpt-4-turbo',
--     'predictions'
-- );
