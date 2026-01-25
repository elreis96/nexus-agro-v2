from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
async def read_root():
    return {"message": "Hello from Vercel"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/market-data")
async def market_data():
    return {
        "market": {
            "dolar": {"value": 5.12, "currency": "BRL"},
            "jbs": {"value": 20.45, "ticker": "JBSS3"},
            "boi_gordo": {"value": 250.75, "unit": "R$/@"}
        }
    }

@app.get("/api/climate-data")
async def climate_data():
    return {
        "climate": {
            "location": "Cuiabá, MT",
            "temperature": 32.5,
            "humidity": 75,
            "rainfall": 12.4
        }
    }
