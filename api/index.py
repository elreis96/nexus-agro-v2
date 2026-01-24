from main import app

# Vercel serverless function handler
# Export app for Vercel to use as the ASGI application
handler = app
