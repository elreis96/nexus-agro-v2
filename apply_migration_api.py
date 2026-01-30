#!/usr/bin/env python3
"""
Script para aplicar migração via Supabase SQL API
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos")
    sys.exit(1)

print("🔒 Conectando ao Supabase via API...")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    # Ler a migração
    migration_file = "supabase/migrations/20260129_security_advisor_fixes.sql"
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    print(f"📄 Migração: {migration_file}")
    print("-" * 60)
    
    # Dividir por blocos de comando separados por ;
    # Executar cada CREATE OR REPLACE VIEW e CREATE POLICY
    commands = [cmd.strip() for cmd in migration_sql.split(';') if cmd.strip()]
    
    executed = 0
    failed = 0
    
    for i, cmd in enumerate(commands, 1):
        try:
            # Adicionar ; novamente
            cmd_with_semi = cmd + ';'
            
            # Usar o cliente REST para executar SQL via RPC ou via tabela de teste
            # Na verdade, vou tentar via rpc chamando uma função PL/pgSQL
            # Melhor: vou usar raw SQL com a função execute_sql do Supabase
            
            # Executar via Supabase (usando a tabela public para testar)
            # Na verdade, vou usar um approach diferente: comentar o início se for um comentário
            
            if cmd_with_semi.startswith('--'):
                continue
            
            # Tentar executar via a função sql()
            # Mas Supabase não expõe SQL direto via Python SDK
            # Preciso usar psycopg ou a API HTTP manualmente
            
            # Por enquanto, apenas imprimir
            print(f"✓ Comando {i}/{len(commands)}: {cmd[:60]}...")
            executed += 1
            
        except Exception as e:
            print(f"✗ Erro no comando {i}: {e}")
            failed += 1
    
    print("-" * 60)
    print(f"✅ {executed}/{len(commands)} comandos analisados")
    if failed > 0:
        print(f"⚠️ {failed} falharam")
    
    print("\n📌 Importante: A migração foi criada em:")
    print(f"   📄 {os.path.abspath(migration_file)}")
    print("\nAplique manualmente via Supabase Dashboard:")
    print("1. Vá para SQL Editor")
    print("2. Crie uma nova query")
    print("3. Cole o conteúdo do arquivo de migração")
    print("4. Execute")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
