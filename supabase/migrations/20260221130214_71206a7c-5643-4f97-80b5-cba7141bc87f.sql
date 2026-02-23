
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow system inserts (from trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function: when partner submits a quote, notify the exporter
CREATE OR REPLACE FUNCTION public.notify_on_partner_quote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _request RECORD;
BEGIN
  SELECT user_id, project_name, expert_type
  INTO _request
  FROM public.expert_connection_requests
  WHERE id = NEW.request_id;

  IF _request IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (
      _request.user_id,
      CASE _request.expert_type
        WHEN 'customs' THEN '관세사 견적 도착'
        ELSE '포워더 견적 도착'
      END,
      '프로젝트 "' || _request.project_name || '"에 대한 새로운 견적이 도착했습니다.',
      'quote_received',
      jsonb_build_object('request_id', NEW.request_id, 'quote_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_on_partner_quote
AFTER INSERT ON public.partner_quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_partner_quote();
