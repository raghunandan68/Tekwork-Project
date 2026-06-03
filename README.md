# 🏪 Smart Shelf AI

**AI-powered retail shelf management platform** — Market basket analysis, smart shelf planning, inventory management, and real-time analytics for small retail stores.

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## 📁 Project Structure

```
smart-shelf-ai/
├── frontend/          # React app (Create React App)
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page-level components
│   │   ├── services/      # API & auth service layer
│   │   └── App.jsx        # Main app with auth routing
│   └── package.json
│
├── backend/           # FastAPI REST API
│   ├── app/
│   │   ├── models/        # Pydantic schemas
│   │   ├── routers/       # API route handlers
│   │   ├── services/      # Business logic
│   │   ├── main.py        # App entry point
│   │   ├── auth.py        # JWT authentication
│   │   └── database.py    # Supabase client
│   └── requirements.txt
│
├── database/          # Supabase PostgreSQL
│   ├── migrations/        # Schema SQL
│   └── seed/              # Seed data SQL
│
└── README.md
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 **Dashboard** | KPI cards, sales trends, category distribution, stock alerts |
| 📦 **Product Management** | CRUD operations with search and filtering |
| 🗃️ **Inventory Management** | Stock level monitoring with visual indicators |
| 🧾 **Transactions** | Record sales, transaction history |
| 🔬 **Market Basket Analysis** | Real-time Apriori algorithm for association rules |
| 🏪 **Shelf Planner** | AI-recommended product placement zones |
| 💡 **Recommendations** | Cross-sell, restock, and shelf placement suggestions |
| 📈 **Analytics** | Revenue trends, heatmaps, inventory reports |
| 🔐 **Authentication** | Supabase Auth with email/password login |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Supabase** account ([supabase.com](https://supabase.com))

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `database/migrations/001_initial_schema.sql`
3. Create a user account via the app (or Supabase Auth dashboard)
4. Run seed data: `SELECT seed_demo_data('your-user-uuid');`

See [database/README.md](database/README.md) for details.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your Supabase credentials

# Run the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Edit .env with your Supabase URL and anon key

# Run the dev server
npm start
```

App available at: **http://localhost:3000**

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `SUPABASE_JWT_SECRET` | JWT secret from Supabase settings |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API URL (default: `http://localhost:8000/api`) |
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## 📡 API Endpoints

| Group | Endpoints | Auth |
|-------|-----------|------|
| Auth | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` | Public (signup/login) |
| Dashboard | `GET /api/dashboard/summary`, `/sales-trend`, `/category-distribution` | 🔒 |
| Products | `GET/POST /api/products`, `PUT/DELETE /api/products/{id}` | 🔒 |
| Inventory | `GET /api/inventory/summary`, `/stock-levels`, `POST /{id}/add-stock` | 🔒 |
| Transactions | `GET/POST /api/transactions` | 🔒 |
| Analysis | `GET /api/analysis/summary`, `/rules`, `POST /analysis/run` | 🔒 |
| Shelves | `GET /api/shelves/zones`, `PUT /zones/{id}/products` | 🔒 |
| Recommendations | `GET /api/recommendations/cross-sell`, `/restock`, `/shelf-placement` | 🔒 |
| Analytics | `GET /api/analytics/revenue-trend`, `/top-products`, `/category-sales`, `/lift-heatmap`, `/inventory-report` | 🔒 |

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Recharts, Supabase JS Client
- **Backend**: FastAPI, Pydantic, python-jose (JWT), Supabase Python Client
- **Database**: PostgreSQL (Supabase) with Row Level Security
- **Auth**: Supabase Auth (email/password)

---

## 📄 License

MIT License
