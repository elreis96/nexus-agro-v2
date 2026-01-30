#!/usr/bin/env python3
"""
Script para aplicar migração de security advisor ao Supabase PostgreSQL
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos")
    sys.exit(1)

# Extrair host do Supabase URL (https://fulklwarlfbttvbjubmw.supabase.co → fulklwarlfbttvbjubmw.supabase.co)
supabase_host = SUPABASE_URL.replace("https://", "").replace("http://", "")

print("🔒 Conectando ao Supabase PostgreSQL...")
print(f"📍 Host: {supabase_host}")

try:
    # Conectar com service role key (admin)
    conn = psycopg2.connect(
        host=supabase_host,
        port=5432,
        database="postgres",
        user="postgres",
        password=SUPABASE_SERVICE_ROLE_KEY,
        sslmode="require"
    )
    
    cur = conn.cursor()
    print("✅ Conectado ao banco de dados")
    
    # Ler a migração
    migration_file = "supabase/migrations/20260129_security_advisor_fixes.sql"
    with open(migration_file, 'r') as f:
        migration_sql = f.read()
    
    print(f"\n📄 Aplicando: {migration_file}")
    print("-" * 60)
    
    # Executar toda a migração
    cur.execute(migration_sql)
    conn.commit()
    
    print("-" * 60)
    print("✅ Migração aplicada com sucesso!")
    print("🔒 Mudanças:")
    print("   • Views com SECURITY INVOKER (não SECURITY DEFINER)")
    print("   • RLS policies reforçadas em todas as tabelas")
    print("   • Políticas públicas para tabelas analíticas")
    
    cur.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"❌ Erro PostgreSQL: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
