-- export_projects: 수출 프로젝트 칸반 보드 데이터
CREATE TABLE IF NOT EXISTS export_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_name TEXT NOT NULL,
  buyer_id UUID,
  buyer_name TEXT,
  stage TEXT NOT NULL DEFAULT 'proposal'
    CHECK (stage IN ('proposal','sample','order','shipping','done')),
  total_amount NUMERIC(15,2),
  currency TEXT DEFAULT 'USD',
  products JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE export_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
ON export_projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_export_projects_user_id ON export_projects(user_id);
CREATE INDEX idx_export_projects_stage ON export_projects(stage);
