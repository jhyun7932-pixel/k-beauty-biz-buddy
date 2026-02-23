
-- Create rulepack_pending_updates table
CREATE TABLE public.rulepack_pending_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  country_code text NOT NULL,
  ingredient text NOT NULL,
  change_description text NOT NULL,
  source text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  evidence_links jsonb DEFAULT '[]'::jsonb,
  regulation_before text,
  regulation_after text,
  detected_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rulepack_pending_updates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage pending updates
CREATE POLICY "Admins can manage rulepack pending updates"
ON public.rulepack_pending_updates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_rulepack_pending_updates_updated_at
BEFORE UPDATE ON public.rulepack_pending_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
