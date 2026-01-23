-- Recriar views com security_invoker=on para evitar problemas de segurança
DROP VIEW IF EXISTS public.view_volatilidade_mensal;
DROP VIEW IF EXISTS public.view_correlacao_dolar_jbs;
DROP VIEW IF EXISTS public.view_lag_chuva_60d_boi;

-- View de volatilidade mensal (boxplot data) - COM SECURITY INVOKER
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

-- View de correlação Dólar x JBS - COM SECURITY INVOKER
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

-- View de lag de chuva 60 dias vs boi gordo - COM SECURITY INVOKER
-- Esta view aplica o conceito de que a chuva de hoje impacta o preço do boi 60 dias no futuro
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