import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { getDashboardSummary, getSalesTrend, getCategoryDistribution } from "../services/api";
import { getTransactions } from "../services/api";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D85A30", "#BA7517", "#D4537E", "#639922", "#E24B4A"];

function Badge({ children, variant = "default" }) {
  const styles = {
    default: { bg: "#F1EFE8", color: "#5F5E5A" },
    success: { bg: "#E1F5EE", color: "#0F6E56" },
    warning: { bg: "#FAEEDA", color: "#854F0B" },
    danger: { bg: "#FCEBEB", color: "#A32D2D" },
    info: { bg: "#E6F1FB", color: "#185FA5" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>{children}</span>
  );
}

function KpiCard({ label, value, sub, variant = "default", icon }) {
  const colors = {
    default: { bg: "#F1EFE8", accent: "#5F5E5A" },
    green: { bg: "#E1F5EE", accent: "#0F6E56" },
    blue: { bg: "#E6F1FB", accent: "#185FA5" },
    amber: { bg: "#FAEEDA", accent: "#854F0B" },
    red: { bg: "#FCEBEB", accent: "#A32D2D" },
    purple: { bg: "#EEEDFE", accent: "#534AB7" },
  };
  const c = colors[variant] || colors.default;
  return (
    <div style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: c.accent, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: c.accent, opacity: 0.75 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: c.accent, opacity: 0.6 }}>{sub}</span>}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ECEAE3", padding: "20px 22px", ...style }}>{children}</div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, st, cd, txns] = await Promise.all([
          getDashboardSummary(),
          getSalesTrend(),
          getCategoryDistribution(),
          getTransactions(),
        ]);
        setSummary(s);
        setSalesTrend(st);
        setCategoryData(cd);
        setTransactions(txns.slice(0, 5));
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading dashboard…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111" }}>Welcome back 👋</h1>
        <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>Here's what's happening today — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
        <KpiCard icon="🛍️" label="Total Products" value={summary?.total_products || 0} sub={`${summary?.stock_alerts || 0} low stock`} variant="purple" />
        <KpiCard icon="💰" label="Revenue Today" value={`₹${(summary?.today_revenue || 0).toLocaleString()}`} variant="green" />
        <KpiCard icon="📋" label="Transactions" value={summary?.txn_count_today || 0} sub="Today" variant="blue" />
        <KpiCard icon="⚠️" label="Stock Alerts" value={summary?.stock_alerts || 0} sub="Need restock" variant="red" />
        <KpiCard icon="🔬" label="Rules Found" value={summary?.rules_count || 0} sub="Association rules" variant="amber" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, "Sales"]} />
              <Line type="monotone" dataKey="sales" stroke="#1D9E75" strokeWidth={2.5} dot={{ fill: "#1D9E75", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

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

      {transactions.length > 0 && (
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
                {transactions.map(t => (
                  <tr key={t.transaction_id} style={{ borderBottom: "1px solid #f5f4f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#378ADD" }}>{t.transaction_id}</td>
                    <td style={{ padding: "10px 12px", color: "#666" }}>{t.date}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.items.map(item => <Badge key={item} variant="info">{item}</Badge>)}
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#1D9E75" }}>₹{t.total}</td>
                    <td style={{ padding: "10px 12px" }}><Badge variant="success">{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
