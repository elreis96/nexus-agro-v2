-- Star Schema base (idempotente)
create table if not exists public.dim_calendario (
  data_pk date primary key,
  ano int not null,
  mes int not null,
  is_business_day boolean not null
);

create table if not exists public.fact_mercado (
  data_fk date primary key references public.dim_calendario(data_pk) on delete cascade,
  valor_dolar numeric(12,6),
  valor_jbs numeric(12,4),
  valor_boi_gordo numeric(12,4)
);

create table if not exists public.fact_clima (
  data_fk date primary key references public.dim_calendario(data_pk) on delete cascade,
  temp_max numeric(6,2),
  chuva_mm numeric(8,2),
  localizacao text
);

-- Índices úteis (idempotentes)
create index if not exists idx_fact_mercado_data on public.fact_mercado(data_fk);
create index if not exists idx_fact_clima_data on public.fact_clima(data_fk);

-- View consolidada para Power BI
create or replace view public.vw_agro_daily as
select
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
from public.dim_calendario c
left join public.fact_mercado m on m.data_fk = c.data_pk
left join public.fact_clima   w on w.data_fk = c.data_pk
order by c.data_pk;

-- Permissões de leitura (ajuste o ROLE conforme necessário)
-- grant select on public.dim_calendario, public.fact_mercado, public.fact_clima, public.vw_agro_daily to pbi_readonly;
-- grant usage on schema public to pbi_readonly;