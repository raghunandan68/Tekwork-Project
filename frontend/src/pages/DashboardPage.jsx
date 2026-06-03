import { useState, useEffect } from "react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { getDashboardSummary, getSalesTrend, getCategoryDistribution, getTransactions, seedDemoData } from "../services/api";
import KpiCard from "../components/KpiCard";
import Card from "../components/Card";
import Badge from "../components/Badge";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D85A30", "#BA7517", "#D4537E", "#639922", "#E24B4A"];

export default function DashboardPage({ userEmail = "" }) {
  const [summary, setSummary] = useState(null);
  const [salesTrend, setSalesTrend] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
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
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading dashboard…</div>;

  const displayName = userEmail ? userEmail.split("@")[0] : "there";

  const handleSeedDemo = async () => {
    setSeeding(true);
    setError("");
    try {
      await seedDemoData();
      await load();
    } catch (err) {
      setError(err.message || "Failed to load demo data.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#111" }}>Welcome back, {displayName} 👋</h1>
        <p style={{ margin: "6px 0 0", color: "#777", fontSize: 14 }}>
          Here's what's happening today — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
      <button
        onClick={handleSeedDemo}
        disabled={seeding}
        style={{
          padding: "8px 16px", background: "#f5f4f0", color: "#555", border: "1px solid #ECEAE3",
          borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: seeding ? "wait" : "pointer"
        }}
      >
        {seeding ? "Loading..." : "Load Demo Data"}
      </button>

      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

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
          {salesTrend.length === 0 ? (
            <p style={{ color: "#999", fontSize: 13 }}>No sales trend data. Load demo data to get started.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Sales"]} />
                <Line type="monotone" dataKey="sales" stroke="#1D9E75" strokeWidth={2.5} dot={{ fill: "#1D9E75", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Sales by Category</h3>
          {categoryData.length === 0 ? (
            <p style={{ color: "#999", fontSize: 13 }}>No category data yet.</p>
          ) : (
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
          )}
        </Card>
      </div>

      {transactions.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>🧾 Recent Transactions</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["ID", "Date", "Items", "Total", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#999", fontWeight: 600, borderBottom: "1px solid #eee", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.transaction_id} style={{ borderBottom: "1px solid #f5f4f0" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#378ADD" }}>{t.transaction_id}</td>
                    <td style={{ padding: "10px 12px", color: "#666" }}>{t.date}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.items.map((item) => <Badge key={item} variant="info">{item}</Badge>)}
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
