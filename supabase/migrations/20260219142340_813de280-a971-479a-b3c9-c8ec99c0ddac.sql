
-- Create sales inquiries table
CREATE TABLE public.sales_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  brand_link TEXT,
  target_countries TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form submission)
CREATE POLICY "Anyone can submit inquiry"
ON public.sales_inquiries
FOR INSERT
WITH CHECK (true);

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.sales_inquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update inquiries
CREATE POLICY "Admins can update inquiries"
ON public.sales_inquiries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete inquiries
CREATE POLICY "Admins can delete inquiries"
ON public.sales_inquiries
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_sales_inquiries_updated_at
BEFORE UPDATE ON public.sales_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
