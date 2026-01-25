# Deploy Backend no Railway

## Requisitos
- Conta no [Railway.app](https://railway.app)
- GitHub conectado

## Passos

1. **Push para GitHub**
   ```bash
   git add .
   git commit -m "prepare: separate frontend and backend"
   git push origin main
   ```

2. **Railway Setup**
   - Abra https://railway.app
   - Click "New Project" → "Deploy from GitHub"
   - Selecione `nexus-agro-v2`
   - Railway auto-detecta `Procfile`

3. **Configurar Variáveis de Ambiente**
   - No painel do Railway, vá em: **Project → Variables**
   - Cole as variáveis de `.env.railway.example`
   - Substitua `ALLOWED_ORIGINS` com sua URL do Vercel

4. **Deploy Automático**
   - Railway faz deploy automaticamente a cada push no GitHub
   - Você vai receber uma URL pública: `https://seu-app.railway.app`

5. **Atualizar Frontend na Vercel**
   - Painel Vercel → Project Settings → Environment Variables
   - Atualize: `VITE_API_URL=https://seu-app.railway.app`
   - Clique "Redeploy"

## URLs Resultantes

**Frontend**: https://nexus-agro.vercel.app
**Backend**: https://seu-app.railway.app (fornecido pelo Railway)

## Testando

```bash
# Backend está rodando?
curl https://seu-app.railway.app/api/health

# Deve retornar:
# {"status": "healthy", "database": "connected", ...}
```

## Troubleshooting

- **Build falha?** Veja os logs no Railway: Project → Logs
- **API não responde?** Verifique ALLOWED_ORIGINS em Railway
- **Auth falha?** Confirme VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Railway

---

**Pronto! Seu projeto agora está separado em:**
- ✅ Frontend robusto na Vercel
- ✅ Backend escalável na Railway
- ✅ Deploy automático via GitHub
