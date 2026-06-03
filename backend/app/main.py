from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, dashboard, products, inventory, transactions, analysis, shelves, recommendations, analytics

app = FastAPI(title="Smart Shelf AI API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(shelves.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Smart Shelf AI API"}
