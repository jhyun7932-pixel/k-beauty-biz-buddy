-- Create experts table for customs experts
CREATE TABLE public.experts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  specialty JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  response_time TEXT DEFAULT '24시간 이내',
  verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  email TEXT,
  phone TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expert verification requests table
CREATE TABLE public.expert_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(workspace_id) ON DELETE SET NULL,
  document_ids JSONB DEFAULT '[]'::jsonb,
  request_type TEXT NOT NULL DEFAULT 'document_review',
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  priority TEXT DEFAULT 'normal',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expert_notes TEXT,
  user_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_verification_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experts (public read, admin write)
CREATE POLICY "Anyone can view active experts"
ON public.experts
FOR SELECT
USING (is_active = true);

-- RLS Policies for expert_verification_requests
CREATE POLICY "Users can view own verification requests"
ON public.expert_verification_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification requests"
ON public.expert_verification_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own verification requests"
ON public.expert_verification_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Create updated_at trigger for experts
CREATE TRIGGER update_experts_updated_at
BEFORE UPDATE ON public.experts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for expert_verification_requests
CREATE TRIGGER update_expert_verification_requests_updated_at
BEFORE UPDATE ON public.expert_verification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample expert data
INSERT INTO public.experts (name, title, organization, specialty, rating, review_count, response_time, verified, bio) VALUES
('김태현', '관세사', '삼일관세법인', '["화장품 수출", "원산지증명", "FTA 활용"]', 4.9, 127, '24시간 이내', true, 'K-뷰티 수출 전문 관세사로 10년 이상의 경력을 보유하고 있습니다.'),
('박서연', '관세사', '한국관세사회', '["K-뷰티", "동남아 수출", "HS코드"]', 4.8, 89, '12시간 이내', true, '동남아시아 시장 전문가로 다수의 화장품 수출 프로젝트를 성공적으로 수행했습니다.'),
('이준호', '관세사 / 무역학박사', '대한관세법인', '["EU 규제", "미국 FDA", "계약서 검토"]', 4.7, 64, '48시간 이내', true, 'EU와 미국 시장 규제 전문가입니다. 무역학 박사 학위를 보유하고 있습니다.'),
('정민지', '관세사', '글로벌관세컨설팅', '["일본 수출", "중국 수출", "통관 실무"]', 4.9, 156, '24시간 이내', true, '일본과 중국 시장에 특화된 통관 전문가입니다.');