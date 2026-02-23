
-- Allow admins to read all profiles for customer management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all companies
CREATE POLICY "Admins can view all companies"
ON public.companies
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all products
CREATE POLICY "Admins can view all products"
ON public.products
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all deals
CREATE POLICY "Admins can view all deals"
ON public.deals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all documents
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
