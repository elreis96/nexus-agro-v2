-- Fix: RLS enabled but no policy on public.agrodata_nexus (2026-01-29)
-- Análise: Tabela não é usada em nenhuma parte do projeto (AgroData Nexus)
-- Projeto usa apenas: dim_calendario, fact_mercado, fact_clima, profiles, user_roles, audit_logs
-- Esta tabela órfã foi gerada acidentalmente e pode ser descartada

-- Opção 1: Desabilitar RLS (remove o alerta, mantém a tabela)
ALTER TABLE public.agrodata_nexus DISABLE ROW LEVEL SECURITY;

-- Opção 2: Deletar a tabela (recomendado se nunca foi usada)
-- DROP TABLE IF EXISTS public.agrodata_nexus;
