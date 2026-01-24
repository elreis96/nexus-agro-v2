from mangum import Mangum
from main import app

# Vercel serverless function handler
# Mangum adapts ASGI (FastAPI) to serverless
handler = Mangum(app, lifespan="off")
