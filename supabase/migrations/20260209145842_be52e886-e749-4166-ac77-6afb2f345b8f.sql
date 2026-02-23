
-- Create compliance_rules table for 11 target countries
CREATE TABLE public.compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  banned_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  restricted_ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  label_requirements TEXT NOT NULL DEFAULT '',
  regulatory_body TEXT,
  key_regulation TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

-- Public read access (regulatory info is non-sensitive)
CREATE POLICY "Anyone can read compliance rules"
ON public.compliance_rules FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage compliance rules"
ON public.compliance_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Index for fast country lookups
CREATE INDEX idx_compliance_rules_country ON public.compliance_rules(country_code);

-- Trigger for updated_at
CREATE TRIGGER update_compliance_rules_updated_at
BEFORE UPDATE ON public.compliance_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
