-- Deny all direct inserts to user_roles (only system/trigger can insert)
CREATE POLICY "Deny direct role inserts"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- Only admins can update roles
CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));