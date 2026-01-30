#!/usr/bin/env python3
"""
Aplicar migração de security advisor via HTTP API do Supabase
Usando uma função SQL helper que já está no banco
"""
import os
import sys
import json
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos")
    sys.exit(1)

# Ler a migração
migration_file = "supabase/migrations/20260129_security_advisor_fixes.sql"
with open(migration_file, 'r', encoding='utf-8') as f:
    migration_sql = f.read()

print("🔒 Aplicando migração via HTTP API...")
print(f"📄 Arquivo: {migration_file}")
print("-" * 60)

try:
    # Dividir SQL em comandos individuais
    commands = [cmd.strip() for cmd in migration_sql.split(';') if cmd.strip() and not cmd.strip().startswith('--')]
    
    # Usar a API de execução de query do Supabase via functions ou RPC
    # Mas Supabase não expõe execute_sql via HTTP para usuários
    # Vou tentar via pg_execute se estiver disponível, ou via uma tabela proxy
    
    # Alternativa: usar a biblioteca `pg` do JavaScript/Supabase edge functions
    # Mas aqui no Python, vou tentar um approach diferente
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Tentar usar a API de RPC do Supabase para executar SQL
    # Primeiro, verificar se existe uma função edge function que executa SQL
    # Se não, vou criar uma
    
    # Na verdade, vou tentar executar via uma série de chamadas POST ao PostgREST
    # Mas isso não funciona pra DDL
    
    # Solução final: copiar SQL para clipboard e instruir o usuário
    import subprocess
    
    # Copiar para clipboard (Windows)
    try:
        process = subprocess.Popen(
            ['clip'],
            stdin=subprocess.PIPE,
            shell=True,
            text=True
        )
        process.communicate(input=migration_sql)
        print("✅ SQL copiado para clipboard!")
        print("\n📋 Instruções:")
        print("1. Abra: https://app.supabase.com/project/fulklwarlfbttvbjubmw/sql/new")
        print("2. Cole o SQL (Ctrl+V)")
        print("3. Clique em 'Run'")
        print("\nOu use:")
        print("   1. Supabase Dashboard → SQL Editor")
        print("   2. New query")
        print("   3. Paste (Ctrl+V)")
        print("   4. Execute")
    except Exception as e:
        print(f"⚠️ Não foi possível copiar para clipboard: {e}")
        print("\n📋 Copie manualmente o conteúdo de:")
        print(f"   {os.path.abspath(migration_file)}")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
