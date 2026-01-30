from supabase import create_client
import os

# 🔐 NUNCA hardcode credenciais! Use variáveis de ambiente
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError(
        "❌ ERRO: Configure as variáveis de ambiente:\n"
        "  - SUPABASE_URL\n"
        "  - SUPABASE_SERVICE_ROLE_KEY\n"
        "Crie um arquivo .env ou configure no sistema."
    )

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("=" * 60)
print("CHECKING PROFILES")
print("=" * 60)
profiles = client.table('profiles').select('*').execute()
print(f"Total profiles: {len(profiles.data)}")
for p in profiles.data:
    print(f"  - {p.get('email', 'NO EMAIL')} (user_id: {p['user_id']})")

print("\n" + "=" * 60)
print("CHECKING USER ROLES")
print("=" * 60)
roles = client.table('user_roles').select('*').execute()
print(f"Total roles: {len(roles.data)}")
for r in roles.data:
    print(f"  - user_id: {r['user_id']} → role: {r['role']}")

print("\n" + "=" * 60)
print("SETTING FIRST USER AS ADMIN")
print("=" * 60)
if profiles.data:
    first_user_id = profiles.data[0]['user_id']
    first_email = profiles.data[0].get('email', 'NO EMAIL')
    print(f"Promoting {first_email} to admin...")
    
    result = client.table('user_roles').upsert({
        'user_id': first_user_id,
        'role': 'admin'
    }).execute()
    
    print(f"✅ Done! {first_email} is now admin")
else:
    print("❌ No profiles found")
