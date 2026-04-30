-- Schedule check-quotas to run daily at 11:00 UTC (08:00 BRT / America/Sao_Paulo)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-quotas-daily') THEN
    PERFORM cron.unschedule('check-quotas-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'check-quotas-daily',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://visjfamkksaorceuwnwe.supabase.co/functions/v1/check-quotas',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpc2pmYW1ra3Nhb3JjZXV3bndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1ODY2NzEsImV4cCI6MjA5MTE2MjY3MX0.VdRDzVgEYcaTD27igzSpwwpfx_mj1xhKBnIH8fVE2Uk"}'::jsonb,
    body := concat('{"time":"', now(), '"}')::jsonb
  );
  $$
);