
-- Create expert_connection_requests table
CREATE TABLE public.expert_connection_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_name TEXT NOT NULL,
  expert_type TEXT NOT NULL DEFAULT 'customs',
  company_name TEXT,
  target_countries JSONB DEFAULT '[]'::jsonb,
  total_cbm TEXT,
  total_weight TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_partner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own expert requests"
  ON public.expert_connection_requests FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can view requests"
  ON public.expert_connection_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'partner'::app_role) AND
    (status = 'pending' OR assigned_partner_id = auth.uid())
  );

CREATE POLICY "Partners can update requests"
  ON public.expert_connection_requests FOR UPDATE
  USING (
    has_role(auth.uid(), 'partner'::app_role) AND
    (status = 'pending' OR assigned_partner_id = auth.uid())
  );

CREATE POLICY "Admins can view all expert requests"
  ON public.expert_connection_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create partner_quotes table
CREATE TABLE public.partner_quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.expert_connection_requests(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  estimated_cost_usd NUMERIC,
  estimated_cost_krw NUMERIC,
  estimated_duration TEXT,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can CRUD own quotes"
  ON public.partner_quotes FOR ALL
  USING (auth.uid() = partner_id);

CREATE POLICY "Users can view quotes on own requests"
  ON public.partner_quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_connection_requests
      WHERE id = request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all quotes"
  ON public.partner_quotes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_expert_connection_requests_updated_at
  BEFORE UPDATE ON public.expert_connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_quotes_updated_at
  BEFORE UPDATE ON public.partner_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
