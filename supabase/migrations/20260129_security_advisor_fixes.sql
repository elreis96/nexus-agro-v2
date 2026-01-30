-- Security Advisor fixes (2026-01-29)

-- 1) Ensure views run as invoker (avoid SECURITY DEFINER views)
CREATE OR REPLACE VIEW public.vw_agro_daily
WITH (security_invoker=on) AS
SELECT
  c.data_pk as data,
  c.ano,
  c.mes,
  c.is_business_day,
  m.valor_dolar,
  m.valor_jbs,
  m.valor_boi_gordo,
  w.temp_max,
  w.chuva_mm,
  coalesce(w.localizacao, 'Mato Grosso') as localizacao
FROM public.dim_calendario c
LEFT JOIN public.fact_mercado m on m.data_fk = c.data_pk
LEFT JOIN public.fact_clima   w on w.data_fk = c.data_pk
ORDER BY c.data_pk;

CREATE OR REPLACE VIEW public.view_volatilidade_mensal
WITH (security_invoker=on) AS
SELECT 
    ano,
    mes,
    MIN(valor_boi_gordo) as min_boi,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY valor_boi_gordo) as q1_boi,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor_boi_gordo) as mediana_boi,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY valor_boi_gordo) as q3_boi,
    MAX(valor_boi_gordo) as max_boi,
    MIN(valor_dolar) as min_dolar,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY valor_dolar) as q1_dolar,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY valor_dolar) as mediana_dolar,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY valor_dolar) as q3_dolar,
    MAX(valor_dolar) as max_dolar
FROM public.fact_mercado fm
JOIN public.dim_calendario dc ON fm.data_fk = dc.data_pk
WHERE valor_boi_gordo IS NOT NULL AND valor_dolar IS NOT NULL
GROUP BY ano, mes
ORDER BY ano, mes;

CREATE OR REPLACE VIEW public.view_correlacao_dolar_jbs
WITH (security_invoker=on) AS
SELECT 
    fm.data_fk,
    dc.ano,
    dc.mes,
    fm.valor_dolar,
    fm.valor_jbs
FROM public.fact_mercado fm
JOIN public.dim_calendario dc ON fm.data_fk = dc.data_pk
WHERE fm.valor_dolar IS NOT NULL AND fm.valor_jbs IS NOT NULL
ORDER BY fm.data_fk;

CREATE OR REPLACE VIEW public.view_lag_chuva_60d_boi
WITH (security_invoker=on) AS
SELECT 
    fm.data_fk as data_preco,
    dc_preco.ano as ano_preco,
    dc_preco.mes as mes_preco,
    fm.valor_boi_gordo,
    fc.chuva_mm as chuva_mm_lag_60d,
    fc.data_fk as data_chuva_original
FROM public.fact_mercado fm
JOIN public.dim_calendario dc_preco ON fm.data_fk = dc_preco.data_pk
LEFT JOIN public.fact_clima fc ON fc.data_fk = fm.data_fk - INTERVAL '60 days'
WHERE fm.valor_boi_gordo IS NOT NULL
ORDER BY fm.data_fk;

-- 2) Ensure RLS is enabled on public data tables
ALTER TABLE public.dim_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_clima ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3) Public read policies for analytical tables
DROP POLICY IF EXISTS "Public read access to dim_calendario" ON public.dim_calendario;
DROP POLICY IF EXISTS "Public read access to fact_mercado" ON public.fact_mercado;
DROP POLICY IF EXISTS "Public read access to fact_clima" ON public.fact_clima;

CREATE POLICY "Public read access to dim_calendario"
ON public.dim_calendario
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public read access to fact_mercado"
ON public.fact_mercado
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public read access to fact_clima"
ON public.fact_clima
FOR SELECT
TO anon, authenticated
USING (true);

-- 4) Harden audit_logs policies (remove any permissive policy with WITH CHECK (true))
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can update audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.audit_logs;

-- Remove overly permissive "System can insert" policy that allows WITH CHECK (true)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Restrict SELECT to admins only (no public read)
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict INSERT to admins only (enforce with has_role check, not WITH CHECK (true))
CREATE POLICY "Admins can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict UPDATE to admins only
CREATE POLICY "Admins can update audit logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Restrict DELETE to admins only
CREATE POLICY "Admins can delete audit logs"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5) Re-assert policies for profiles and user_roles (fix "RLS enabled, no policy")
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
