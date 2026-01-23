-- Tabela mestre de datas (dim_calendario)
CREATE TABLE public.dim_calendario (
    data_pk DATE PRIMARY KEY,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    is_business_day BOOLEAN NOT NULL DEFAULT true
);

-- Tabela de fatos de mercado
CREATE TABLE public.fact_mercado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_fk DATE REFERENCES public.dim_calendario(data_pk) NOT NULL,
    valor_dolar DECIMAL(10, 4),
    valor_jbs DECIMAL(10, 4),
    valor_boi_gordo DECIMAL(10, 4)
);

-- Tabela de fatos de clima
CREATE TABLE public.fact_clima (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_fk DATE REFERENCES public.dim_calendario(data_pk) NOT NULL,
    chuva_mm DECIMAL(10, 2),
    temp_max DECIMAL(5, 2),
    localizacao TEXT
);

-- View de volatilidade mensal (boxplot data)
CREATE OR REPLACE VIEW public.view_volatilidade_mensal AS
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

-- View de correlação Dólar x JBS
CREATE OR REPLACE VIEW public.view_correlacao_dolar_jbs AS
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

-- View de lag de chuva 60 dias vs boi gordo
-- Esta view aplica o conceito de que a chuva de hoje impacta o preço do boi 60 dias no futuro
-- Ou seja, para cada preço do boi em data_preco, mostramos a chuva que ocorreu 60 dias antes
CREATE OR REPLACE VIEW public.view_lag_chuva_60d_boi AS
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

-- Enable RLS on tables
ALTER TABLE public.dim_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_mercado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fact_clima ENABLE ROW LEVEL SECURITY;

-- Políticas públicas de leitura (dashboard executivo - dados públicos do fundo)
CREATE POLICY "Public read access to dim_calendario" ON public.dim_calendario FOR SELECT USING (true);
CREATE POLICY "Public read access to fact_mercado" ON public.fact_mercado FOR SELECT USING (true);
CREATE POLICY "Public read access to fact_clima" ON public.fact_clima FOR SELECT USING (true);

-- Criar índices para performance
CREATE INDEX idx_fact_mercado_data ON public.fact_mercado(data_fk);
CREATE INDEX idx_fact_clima_data ON public.fact_clima(data_fk);
CREATE INDEX idx_dim_calendario_ano_mes ON public.dim_calendario(ano, mes);