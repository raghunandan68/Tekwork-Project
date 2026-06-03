# Smart Shelf AI — Database Setup

This directory contains the Supabase/PostgreSQL migration and seed files for the Smart Shelf AI project.

## 📁 File Structure

```
database/
├── migrations/
│   └── 001_initial_schema.sql   # Tables, indexes, triggers, RLS policies
├── seed/
│   └── seed_data.sql            # Demo data seed function
└── README.md                    # This file
```

---

## 🚀 Step 1: Run the Migration

1. Open your **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. Copy the entire contents of [`migrations/001_initial_schema.sql`](migrations/001_initial_schema.sql)
4. Paste into the SQL Editor and click **Run**

This creates all tables, indexes, the `updated_at` trigger, and Row Level Security policies.

> **Tip:** If you're using the Supabase CLI, you can also run:
> ```bash
> supabase db push
> ```
> after placing the file in your `supabase/migrations/` directory.

---

## 🌱 Step 2: Seed Demo Data

### Find Your User UUID

1. **Create an account** by signing up through the app (email + password)
2. Go to **Supabase Dashboard** → **Authentication** → **Users**
3. Find your user in the list
4. Copy the **User UID** (a UUID like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Run the Seed Function

1. Open **SQL Editor** in Supabase Dashboard
2. Copy the entire contents of [`seed/seed_data.sql`](seed/seed_data.sql)
3. Paste and **Run** — this creates the `seed_demo_data()` function
4. Then run the following, replacing the UUID with your own:

```sql
SELECT seed_demo_data('your-user-uuid-here');
```

### Re-Seeding

The seed function is **idempotent** — running it again will clear existing demo data for that user and re-insert fresh data:

```sql
-- Re-seed (wipe + re-insert)
SELECT seed_demo_data('your-user-uuid-here');

-- Only clear data (no re-insert)
SELECT clear_demo_data('your-user-uuid-here');
```

---

## 📊 Table Overview

| Table | Description | Multi-Tenant |
|---|---|---|
| `categories` | Product category lookup (shared) | No (public read) |
| `products` | Product catalog with stock/sales | Yes (`user_id`) |
| `transactions` | Sales transactions | Yes (`user_id`) |
| `transaction_items` | Line items per transaction | Via `transactions` |
| `association_rules` | Market basket analysis results | Yes (`user_id`) |
| `shelf_zones` | Shelf placement zones | Yes (`user_id`) |
| `shelf_zone_products` | Products assigned to zones | Via `shelf_zones` |
| `restock_recommendations` | Stock replenishment alerts | Yes (`user_id`) |
| `sales_trends` | Monthly sales aggregation | Yes (`user_id`) |

### Entity Relationships

```
auth.users (Supabase Auth)
  │
  ├── products
  ├── transactions
  │     └── transaction_items ──→ products
  ├── association_rules
  ├── shelf_zones
  │     └── shelf_zone_products
  ├── restock_recommendations
  └── sales_trends
```

---

## 🔒 Row Level Security (RLS)

All tables have RLS **enabled**. Policies ensure:

- **`categories`** — Anyone authenticated can read; authenticated users can insert
- **Tables with `user_id`** — Users can only SELECT, INSERT, UPDATE, DELETE their own rows (`auth.uid() = user_id`)
- **Child tables** (`transaction_items`, `shelf_zone_products`) — Access is validated via the parent table's `user_id`

> **Important:** RLS only applies to requests made through the Supabase client (anon/authenticated roles). The `service_role` key bypasses RLS — never expose it to the client.

---

## 🔑 Indexes

The migration creates indexes on:

- `user_id` on all tenant-scoped tables (fast per-user queries)
- `transaction_id` on `transactions` and `transaction_items`
- `date` on `transactions`
- `product_id` on `transaction_items`
- `category` and `status` on `products`
- `zone_id` on `shelf_zone_products`

---

## ⚙️ Trigger

An `updated_at` trigger automatically sets `products.updated_at` to `NOW()` on every UPDATE, so the application doesn't need to manage timestamps manually.
