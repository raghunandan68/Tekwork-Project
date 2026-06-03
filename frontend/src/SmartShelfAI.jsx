import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ScatterChart, Scatter,
  CartesianGrid, Legend
} from "recharts";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D85A30", "#BA7517", "#D4537E", "#639922", "#E24B4A"];

const mockProducts = [
  { id: 1, name: "Bread", category: "Bakery", price: 40, stock: 97, sold: 500, status: "Active" },
  { id: 2, name: "Milk", category: "Dairy", price: 55, stock: 142, sold: 480, status: "Active" },
  { id: 3, name: "Butter", category: "Dairy", price: 85, stock: 5, sold: 320, status: "Low Stock" },
  { id: 4, name: "Eggs (6pk)", category: "Dairy", price: 75, stock: 88, sold: 410, status: "Active" },
  { id: 5, name: "Chips", category: "Snacks", price: 30, stock: 210, sold: 280, status: "Active" },
  { id: 6, name: "Soft Drink", category: "Beverages", price: 45, stock: 175, sold: 300, status: "Active" },
  { id: 7, name: "Shampoo", category: "Personal Care", price: 150, stock: 60, sold: 100, status: "Active" },
  { id: 8, name: "Jam", category: "Condiments", price: 95, stock: 3, sold: 220, status: "Low Stock" },
  { id: 9, name: "Chocolate", category: "Snacks", price: 60, stock: 130, sold: 260, status: "Active" },
  { id: 10, name: "Conditioner", category: "Personal Care", price: 140, stock: 48, sold: 98, status: "Active" },
  { id: 11, name: "Biscuits", category: "Snacks", price: 25, stock: 190, sold: 310, status: "Active" },
  { id: 12, name: "Cleaning Spray", category: "Cleaning", price: 120, stock: 35, sold: 55, status: "Active" },
];

const mockTransactions = [
  { id: "T1001", date: "2025-06-01", items: ["Bread", "Butter", "Milk"], total: 180 },
  { id: "T1002", date: "2025-06-01", items: ["Chips", "Soft Drink", "Chocolate"], total: 135 },
  { id: "T1003", date: "2025-06-02", items: ["Bread", "Jam", "Butter"], total: 220 },
  { id: "T1004", date: "2025-06-02", items: ["Eggs (6pk)", "Milk", "Bread"], total: 195 },
  { id: "T1005", date: "2025-06-03", items: ["Shampoo", "Conditioner"], total: 290 },
  { id: "T1006", date: "2025-06-03", items: ["Chips", "Soft Drink"], total: 75 },
  { id: "T1007", date: "2025-06-04", items: ["Bread", "Butter", "Jam", "Milk"], total: 275 },
  { id: "T1008", date: "2025-06-04", items: ["Chocolate", "Biscuits", "Soft Drink"], total: 135 },
];

const associationRules = [
  { antecedent: "Bread", consequent: "Butter", support: "45%", confidence: "82%", lift: 1.9, strength: "High" },
  { antecedent: "Bread", consequent: "Jam", support: "38%", confidence: "74%", lift: 1.7, strength: "High" },
  { antecedent: "Chips", consequent: "Soft Drink", support: "52%", confidence: "88%", lift: 2.1, strength: "Very High" },
  { antecedent: "Shampoo", consequent: "Conditioner", support: "41%", confidence: "79%", lift: 1.8, strength: "High" },
  { antecedent: "Milk", consequent: "Eggs (6pk)", support: "33%", confidence: "67%", lift: 1.4, strength: "Medium" },
  { antecedent: "Chocolate", consequent: "Biscuits", support: "28%", confidence: "61%", lift: 1.3, strength: "Medium" },
];

const salesTrend = [
  { month: "Jan", sales: 38400 },
  { month: "Feb", sales: 42100 },
  { month: "Mar", sales: 39800 },
  { month: "Apr", sales: 47200 },
  { month: "May", sales: 51600 },
  { month: "Jun", sales: 54300 },
];

const categoryData = [
  { name: "Bakery", value: 28 },
  { name: "Dairy", value: 32 },
  { name: "Snacks", value: 21 },
  { name: "Beverages", value: 10 },
  { name: "Personal Care", value: 6 },
  { name: "Other", value: 3 },
];

const shelfZones = [
  {
    zone: "High-Demand Zone",
    color: "#1D9E75",
    bg: "#E1F5EE",
    icon: "🔥",
    desc: "Fast-moving products — place at eye level near entrance",
    products: ["Bread", "Milk", "Eggs (6pk)", "Butter"],
    avgSales: 478,
  },
  {
    zone: "Cross-Sell Zone",
    color: "#378ADD",
    bg: "#E6F1FB",
    icon: "🔗",
    desc: "Frequently bought together — group adjacent on shelves",
    products: ["Chips", "Soft Drink", "Chocolate", "Biscuits"],
    avgSales: 287,
  },
  {
    zone: "Low-Movement Zone",
    color: "#888780",
    bg: "#F1EFE8",
    icon: "📦",
    desc: "Slow movers — place in secondary aisles",
    products: ["Cleaning Spray", "Stationery", "Conditioner", "Shampoo"],
    avgSales: 77,
  },
];

const stockAlerts = mockProducts.filter(p => p.stock < 10);

const restockRecs = [
  { product: "Butter", stock: 5, avgDailySales: 10, daysLeft: 0.5, priority: "Critical" },
  { product: "Jam", stock: 3, avgDailySales: 7, daysLeft: 0.4, priority: "Critical" },
  { product: "Bread", stock: 97, avgDailySales: 20, daysLeft: 4.9, priority: "Watch" },
  { product: "Milk", stock: 142, avgDailySales: 18, daysLeft: 7.9, priority: "Good" },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "inventory", label: "Inventory", icon: "🗃️" },
  { id: "transactions", label: "Transactions", icon: "🧾" },
  { id: "analysis", label: "Market Basket", icon: "🔬" },
  { id: "shelves", label: "Shelf Planner", icon: "🏪" },
  { id: "recommendations", label: "Recommendations", icon: "💡" },
  { id: "analytics", label: "Analytics", icon: "📈" },
];

// ── tiny components ──────────────────────────────────────────────────────────

function Badge({ children, variant = "default" }) {
  const styles = {
    default:  { bg: "#F1EFE8", color: "#5F5E5A" },
    success:  { bg: "#E1F5EE", color: "#0F6E56" },
    warning:  { bg: "#FAEEDA", color: "#854F0B" },
    danger:   { bg: "#FCEBEB", color: "#A32D2D" },
    info:     { bg: "#E6F1FB", color: "#185FA5" },
    purple:   { bg: "#EEEDFE", color: "#534AB7" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}

function KpiCard({ label, value, sub, variant = "default", icon }) {
  const colors = {
    default: { bg: "#F1EFE8", accent: "#5F5E5A" },
    green:   { bg: "#E1F5EE", accent: "#0F6E56" },
    blue:    { bg: "#E6F1FB", accent: "#185FA5" },
    amber:   { bg: "#FAEEDA", accent: "#854F0B" },
    red:     { bg: "#FCEBEB", accent: "#A32D2D" },
    purple:  { bg: "#EEEDFE", accent: "#534AB7" },
  };
  const c = colors[variant] || colors.default;
  return (
    <div style={{
      background: c.bg,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: c.accent, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: c.accent, opacity: 0.75 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: c.accent, opacity: 0.6 }}>{sub}</span>}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #ECEAE3",
      padding: "20px 22px",
      ...style,
    }}>{children}</div>
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111" }}>Welcome back, Rajesh's Store 👋</h1>
        <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>Here's what's happening today — Tuesday, June 03, 2025</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <KpiCard icon="🛍️" label="Total Products" value="12" sub="2 low stock" variant="purple" />
        <KpiCard icon="💰" label="Revenue Today" value="₹3,840" sub="↑ 12% vs yesterday" variant="green" />
        <KpiCard icon="📋" label="Transactions" value="8" sub="Today" variant="blue" />
        <KpiCard icon="⚠️" label="Stock Alerts" value="2" sub="Need restock" variant="red" />
        <KpiCard icon="🔬" label="Rules Found" value="6" sub="Association rules" variant="amber" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Sales trend */}
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, "Sales"]} />
              <Line type="monotone" dataKey="sales" stroke="#1D9E75" strokeWidth={2.5} dot={{ fill: "#1D9E75", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category pie */}
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Sales by Category</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {categoryData.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#555" }}>{c.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, marginLeft: "auto" }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top products + Stock alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>🏆 Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={mockProducts.sort((a,b)=>b.sold-a.sold).slice(0,6)} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#555" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip />
              <Bar dataKey="sold" fill="#378ADD" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>🚨 Stock Alerts</h3>
          {stockAlerts.map(p => (
            <div key={p.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: "1px solid #f5f4f0"
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#999" }}>{p.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#E24B4A" }}>{p.stock} left</div>
                <Badge variant="danger">Low Stock</Badge>
              </div>
            </div>
          ))}
          {stockAlerts.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>All products well-stocked ✅</p>}
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>🧾 Recent Transactions</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["ID", "Date", "Items", "Total", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontWeight: 600, borderBottom: "1px solid #eee", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockTransactions.slice(0,5).map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid #f5f4f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#378ADD" }}>{t.id}</td>
                  <td style={{ padding: "10px 12px", color: "#666" }}>{t.date}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {t.items.map(item => <Badge key={item} variant="info">{item}</Badge>)}
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1D9E75" }}>₹{t.total}</td>
                  <td style={{ padding: "10px 12px" }}><Badge variant="success">Completed</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ProductsPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState(mockProducts);
  const [form, setForm] = useState({ name: "", category: "Bakery", price: "", stock: "" });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.name || !form.price || !form.stock) return;
    setProducts(prev => [...prev, {
      id: prev.length + 1, ...form,
      price: Number(form.price), stock: Number(form.stock),
      sold: 0, status: "Active"
    }]);
    setForm({ name: "", category: "Bakery", price: "", stock: "" });
    setShowModal(false);
  };

  const handleDelete = (id) => setProducts(prev => prev.filter(p => p.id !== id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="📦 Product Management" subtitle="Add, edit, and manage your product catalog" />

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search products or categories…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
        />
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: "10px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >+ Add Product</button>
      </div>

      {showModal && (
        <Card style={{ border: "2px solid #1D9E75" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>➕ New Product</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Product Name", "name", "text"], ["Price (₹)", "price", "number"], ["Stock Qty", "stock", "number"]].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}>
                {["Bakery","Dairy","Snacks","Beverages","Personal Care","Cleaning","Condiments"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button onClick={handleAdd} style={{ padding: "9px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save Product</button>
            <button onClick={() => setShowModal(false)} style={{ padding: "9px 20px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {filtered.map(p => (
          <Card key={p.id} style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{p.category}</div>
              </div>
              <Badge variant={p.status === "Low Stock" ? "danger" : "success"}>{p.status}</Badge>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[["Price", `₹${p.price}`, "#1D9E75"], ["Stock", p.stock, p.stock < 10 ? "#E24B4A" : "#378ADD"], ["Sold", p.sold, "#7F77DD"]].map(([l, v, c]) => (
                <div key={l} style={{ background: "#f8f7f5", borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#999", marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ flex: 1, padding: "6px 0", background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✏️ Edit</button>
              <button onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: "6px 0", background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function InventoryPage() {
  const [products, setProducts] = useState(mockProducts);

  const addStock = (id, qty) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: p.stock + qty } : p));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🗃️ Inventory Management" subtitle="Monitor stock levels and update inventory" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard icon="📦" label="Total Products" value={products.length} variant="blue" />
        <KpiCard icon="⚠️" label="Low Stock" value={products.filter(p=>p.stock<10).length} variant="red" sub="Below threshold" />
        <KpiCard icon="✅" label="Well Stocked" value={products.filter(p=>p.stock>=50).length} variant="green" />
        <KpiCard icon="📊" label="Total Stock Units" value={products.reduce((a,p)=>a+p.stock,0)} variant="purple" />
      </div>

      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Stock Levels Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={products.slice(0,10)} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
              {products.slice(0,10).map((p, i) => (
                <Cell key={i} fill={p.stock < 10 ? "#E24B4A" : p.stock < 30 ? "#EF9F27" : "#1D9E75"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
          {[["#E24B4A", "Critical (<10)"], ["#EF9F27", "Low (<30)"], ["#1D9E75", "Good"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#666" }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c }} />{l}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {products.map(p => {
          const pct = Math.min((p.stock / 200) * 100, 100);
          const barColor = p.stock < 10 ? "#E24B4A" : p.stock < 30 ? "#EF9F27" : "#1D9E75";
          return (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{p.category}</div>
                </div>
                <Badge variant={p.stock < 10 ? "danger" : p.stock < 30 ? "warning" : "success"}>
                  {p.stock < 10 ? "Critical" : p.stock < 30 ? "Low" : "Good"}
                </Badge>
              </div>
              <div style={{ background: "#f5f4f0", borderRadius: 20, height: 8, marginBottom: 10 }}>
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 20, background: barColor, transition: "width 0.4s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#777", marginBottom: 12 }}>
                <span>Current: <strong>{p.stock}</strong></span>
                <span>Sold: <strong>{p.sold}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[10, 25, 50].map(qty => (
                  <button key={qty} onClick={() => addStock(p.id, qty)}
                    style={{ flex: 1, padding: "6px 0", background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    +{qty}
                  </button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TransactionsPage() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("Bread");

  const addItem = () => {
    if (!items.includes(selectedItem)) setItems(prev => [...prev, selectedItem]);
  };

  const recordSale = () => {
    if (items.length === 0) return;
    const newT = {
      id: `T${1000 + transactions.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      items,
      total: items.length * 55,
    };
    setTransactions(prev => [newT, ...prev]);
    setItems([]);
    setShowForm(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🧾 Sales Transactions" subtitle="Record and review customer purchases" />

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: "10px 20px", background: "#378ADD", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Record Sale
        </button>
        <button style={{ padding: "10px 20px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          📤 Upload CSV
        </button>
      </div>

      {showForm && (
        <Card style={{ border: "2px solid #378ADD" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>New Transaction</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}>
              {mockProducts.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
            <button onClick={addItem} style={{ padding: "8px 18px", background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {items.map(item => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E6F1FB", color: "#185FA5", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {item}
                <button onClick={() => setItems(prev => prev.filter(i => i !== item))} style={{ background: "none", border: "none", cursor: "pointer", color: "#185FA5", fontWeight: 700, padding: 0, fontSize: 14 }}>×</button>
              </span>
            ))}
            {items.length === 0 && <span style={{ color: "#bbb", fontSize: 12 }}>No items added yet…</span>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={recordSale} style={{ padding: "9px 22px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Record Sale</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 16px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      )}

      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Transaction History</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Transaction ID", "Date", "Items Purchased", "Total", "Status"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: "#999", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #eee" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, idx) => (
                <tr key={t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafaf8" }}>
                  <td style={{ padding: "11px 12px", fontWeight: 700, color: "#378ADD" }}>{t.id}</td>
                  <td style={{ padding: "11px 12px", color: "#666" }}>{t.date}</td>
                  <td style={{ padding: "11px 12px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {t.items.map(item => <Badge key={item} variant="info">{item}</Badge>)}
                    </div>
                  </td>
                  <td style={{ padding: "11px 12px", fontWeight: 700, color: "#1D9E75" }}>₹{t.total}</td>
                  <td style={{ padding: "11px 12px" }}><Badge variant="success">Completed</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AnalysisPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🔬 Market Basket Analysis" subtitle="Association rules discovered via Apriori & FP-Growth algorithms" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard icon="📜" label="Rules Discovered" value="6" variant="purple" />
        <KpiCard icon="🔗" label="Avg Confidence" value="75%" variant="green" />
        <KpiCard icon="📈" label="Avg Lift" value="1.7" variant="blue" />
        <KpiCard icon="📊" label="Transactions Analyzed" value="8" variant="amber" />
      </div>

      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Association Rules</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Rules mined from transaction history — sorted by lift score</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {associationRules.map((rule, i) => (
            <div key={i} style={{ border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", background: "#fafaf8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{rule.antecedent}</span>
                  <span style={{ fontSize: 18, color: "#999" }}>→</span>
                  <span style={{ background: "#E1F5EE", color: "#0F6E56", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{rule.consequent}</span>
                </div>
                <Badge variant={rule.strength === "Very High" ? "success" : rule.strength === "High" ? "info" : "default"}>{rule.strength}</Badge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["Support", rule.support, "#7F77DD"], ["Confidence", rule.confidence, "#1D9E75"], ["Lift", rule.lift, "#378ADD"]].map(([label, val, color]) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", textAlign: "center", border: "1px solid #eee" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#999", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Frequent Pairs Bar Chart */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Top Product Pairs by Confidence</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={associationRules.map(r => ({ pair: `${r.antecedent}→${r.consequent}`, confidence: parseInt(r.confidence) }))} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="pair" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
            <Tooltip formatter={v => [`${v}%`, "Confidence"]} />
            <Bar dataKey="confidence" fill="#7F77DD" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ShelvesPage() {
  const [dragOver, setDragOver] = useState(null);
  const [zoneProducts, setZoneProducts] = useState(shelfZones.map(z => ({ ...z })));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🏪 Smart Shelf Planner" subtitle="AI-recommended product placement zones based on purchase patterns" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
        {zoneProducts.map((zone, i) => (
          <div key={zone.zone}
            onDragOver={e => { e.preventDefault(); setDragOver(i); }}
            onDrop={() => setDragOver(null)}
            onDragLeave={() => setDragOver(null)}
            style={{
              border: `2px solid ${dragOver === i ? zone.color : "#eee"}`,
              borderRadius: 16, padding: 20, background: zone.bg,
              transition: "border-color 0.2s",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 22 }}>{zone.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: zone.color, background: "#fff", padding: "3px 10px", borderRadius: 20 }}>
                Avg {zone.avgSales} sold/mo
              </span>
            </div>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: zone.color }}>{zone.zone}</h3>
            <p style={{ margin: "0 0 14px", fontSize: 12, color: "#666" }}>{zone.desc}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {zone.products.map((prod, pi) => (
                <div key={prod} draggable style={{
                  background: "#fff", borderRadius: 8, padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 600, color: "#333",
                  cursor: "grab", border: "1px solid #eee",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}>
                  <span style={{ color: zone.color, fontWeight: 800, fontSize: 12 }}>#{pi + 1}</span>
                  {prod}
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "#bbb" }}>↕ drag</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card>
        <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>🗺️ Shelf Layout Visual</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Suggested physical layout — products grouped by affinity score</p>
        <div style={{ background: "#f8f7f5", borderRadius: 12, padding: 20, fontFamily: "monospace" }}>
          {/* Shelf display mockup */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Aisle A — Entrance", items: ["Bread 🍞", "Milk 🥛", "Eggs 🥚"], color: "#E1F5EE", border: "#1D9E75" },
              { label: "Aisle B — Center", items: ["Chips 🥔", "Soft Drink 🥤", "Chocolate 🍫"], color: "#E6F1FB", border: "#378ADD" },
              { label: "Aisle C — Back", items: ["Cleaning Spray", "Stationery", "Shampoo"], color: "#F1EFE8", border: "#888" },
            ].map(aisle => (
              <div key={aisle.label} style={{ border: `2px dashed ${aisle.border}`, borderRadius: 10, padding: 12, background: aisle.color }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: aisle.border, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>{aisle.label}</div>
                {aisle.items.map(item => (
                  <div key={item} style={{ background: "#fff", borderRadius: 6, padding: "7px 10px", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#333", border: `1px solid ${aisle.border}30` }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function RecommendationsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="💡 AI Recommendations" subtitle="Smart suggestions powered by market basket analysis and inventory data" />

      {/* Cross-sell recs */}
      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>🔗 Cross-Selling Opportunities</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>When a customer buys X, suggest Y at the counter or nearby shelf</p>
        {associationRules.slice(0, 4).map((rule, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#534AB7" }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Customer buys <span style={{ color: "#185FA5" }}>{rule.antecedent}</span> → suggest <span style={{ color: "#0F6E56" }}>{rule.consequent}</span></div>
                <div style={{ fontSize: 11, color: "#999" }}>Confidence: {rule.confidence} · Lift: {rule.lift}x · {rule.strength} association</div>
              </div>
            </div>
            <Badge variant={rule.strength === "Very High" ? "success" : "info"}>{rule.strength}</Badge>
          </div>
        ))}
      </Card>

      {/* Restock recs */}
      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>📦 Restocking Recommendations</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Based on current stock and average daily sales velocity</p>
        {restockRecs.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                Stock: <strong>{r.stock}</strong> · Daily sales: ~{r.avgDailySales} units
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: r.daysLeft < 1 ? "#E24B4A" : r.daysLeft < 5 ? "#BA7517" : "#1D9E75" }}>
                {r.daysLeft < 1 ? "⚠️ Out in hours!" : `~${r.daysLeft.toFixed(1)} days left`}
              </div>
              <Badge variant={r.priority === "Critical" ? "danger" : r.priority === "Watch" ? "warning" : "success"}>{r.priority}</Badge>
            </div>
          </div>
        ))}
      </Card>

      {/* Shelf placement recs */}
      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>🏪 Shelf Placement Recommendations</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Sales-weighted grouping suggestions for your shelves</p>
        {[
          { pair: ["Bread", "Butter", "Jam"], reason: "High lift (1.9), 82% confidence — frequently bought together", priority: "Premium Shelf", units: 500 },
          { pair: ["Chips", "Soft Drink", "Chocolate"], reason: "Highest lift (2.1), 88% confidence — snack combo cluster", priority: "Cross-Sell Endcap", units: 280 },
          { pair: ["Shampoo", "Conditioner"], reason: "79% confidence — personal care pairing", priority: "Adjacent Shelf", units: 100 },
        ].map((rec, i) => (
          <div key={i} style={{ background: "#fafaf8", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Badge variant="purple">{rec.priority}</Badge>
              <span style={{ fontSize: 12, color: "#777" }}>~{rec.units} units sold combined</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {rec.pair.map(item => (
                <span key={item} style={{ background: "#EEEDFE", color: "#534AB7", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{item}</span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#777" }}>💡 {rec.reason}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AnalyticsDashPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="📈 Analytics Dashboard" subtitle="Deep-dive into your store's performance and trends" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v/1000}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="sales" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 4, fill: "#1D9E75" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Top 6 Products by Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[...mockProducts].sort((a,b)=>b.sold-a.sold).slice(0,6)} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="sold" fill="#378ADD" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Category Sales Distribution</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width={170} height={170}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {categoryData.map((c, i) => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Association Lift Heatmap</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {associationRules.map((r, i) => {
              const intensity = Math.min(r.lift / 2.5, 1);
              const g = Math.round(158 * intensity);
              return (
                <div key={i} style={{
                  background: `rgb(29, ${g + 50}, ${g})`,
                  borderRadius: 8, padding: "10px 8px", textAlign: "center"
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#fff", opacity: 0.9 }}>
                    {r.antecedent}→{r.consequent}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 4 }}>{r.lift}x</div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 11, color: "#999" }}>Darker green = stronger product association (higher lift)</p>
        </Card>
      </div>

      {/* Inventory status table */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Inventory Performance Report</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                {["Product", "Category", "Stock", "Units Sold", "Revenue", "Stock Status", "Days Left"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: "#999", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((p, idx) => {
                const dailySales = Math.round(p.sold / 30);
                const daysLeft = dailySales > 0 ? (p.stock / dailySales).toFixed(1) : "∞";
                return (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafaf8", borderBottom: "1px solid #f5f4f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "10px 12px", color: "#777" }}>{p.category}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: p.stock < 10 ? "#E24B4A" : "#333" }}>{p.stock}</td>
                    <td style={{ padding: "10px 12px", color: "#333" }}>{p.sold}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1D9E75" }}>₹{(p.price * p.sold).toLocaleString()}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <Badge variant={p.stock < 10 ? "danger" : p.stock < 30 ? "warning" : "success"}>
                        {p.stock < 10 ? "Critical" : p.stock < 30 ? "Low" : "Good"}
                      </Badge>
                    </td>
                    <td style={{ padding: "10px 12px", color: Number(daysLeft) < 2 ? "#E24B4A" : "#333", fontWeight: Number(daysLeft) < 2 ? 700 : 400 }}>{daysLeft} days</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── App Shell ────────────────────────────────────────────────────────────────

export default function SmartShelfAI() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pages = {
    dashboard: <DashboardPage />,
    products: <ProductsPage />,
    inventory: <InventoryPage />,
    transactions: <TransactionsPage />,
    analysis: <AnalysisPage />,
    shelves: <ShelvesPage />,
    recommendations: <RecommendationsPage />,
    analytics: <AnalyticsDashPage />,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F6F3", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 230 : 60, flexShrink: 0,
        background: "#111110", color: "#fff",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#1D9E75", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏪</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: "0.01em" }}>SmartShelf</div>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.05em" }}>AI PLATFORM</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActivePage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, border: "none",
                background: activePage === item.id ? "#1D9E75" : "transparent",
                color: activePage === item.id ? "#fff" : "#888",
                fontWeight: activePage === item.id ? 700 : 400,
                fontSize: 13, cursor: "pointer", textAlign: "left",
                transition: "background 0.15s, color 0.15s",
                whiteSpace: "nowrap", overflow: "hidden",
              }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        {/* Toggle & Shop info */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #222" }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 10px", background: "#1a1a18", borderRadius: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>R</div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Rajesh's Store</div>
                <div style={{ fontSize: 10, color: "#666" }}>Shop ID: #1042</div>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ width: "100%", padding: "7px 12px", background: "#222", border: "none", borderRadius: 7, color: "#aaa", cursor: "pointer", fontSize: 13 }}>
            {sidebarOpen ? "← Collapse" : "→"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", padding: "28px 30px", maxWidth: "calc(100vw - 230px)" }}>
        {pages[activePage]}
      </main>
    </div>
  );
}
