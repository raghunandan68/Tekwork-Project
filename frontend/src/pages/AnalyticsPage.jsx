import { useState, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  getRevenueTrend, getTopProducts, getCategorySales,
  getLiftHeatmap, getInventoryReport,
} from "../services/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
import SectionHeader from "../components/SectionHeader";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D85A30", "#BA7517", "#D4537E", "#639922", "#E24B4A"];

export default function AnalyticsPage() {
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [rev, top, cat, lift, inv] = await Promise.all([
          getRevenueTrend(),
          getTopProducts(),
          getCategorySales(),
          getLiftHeatmap(),
          getInventoryReport(),
        ]);
        setRevenueTrend(rev);
        setTopProducts(top);
        setCategoryData(cat);
        setHeatmap(lift);
        setReport(inv);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading analytics…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="📈 Analytics Dashboard" subtitle="Deep-dive into your store's performance and trends" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f4f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="sales" stroke="#1D9E75" strokeWidth={2.5} dot={{ r: 4, fill: "#1D9E75" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Top Products by Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} barSize={28}>
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
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 12, color: "#555", flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Association Lift Heatmap</h3>
          {heatmap.length === 0 ? (
            <p style={{ color: "#999", fontSize: 13 }}>No association rules yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {heatmap.map((r, i) => {
                const intensity = Math.min(r.lift / 2.5, 1);
                const g = Math.round(158 * intensity);
                return (
                  <div key={i} style={{ background: `rgb(29, ${g + 50}, ${g})`, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{r.antecedent}→{r.consequent}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 4 }}>{r.lift}x</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Inventory Performance Report</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                {["Product", "Category", "Stock", "Units Sold", "Revenue", "Stock Status", "Days Left"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: "#999", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.map((p, idx) => (
                <tr key={p.name} style={{ background: idx % 2 === 0 ? "#fff" : "#fafaf8", borderBottom: "1px solid #f5f4f0" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: "10px 12px", color: "#777" }}>{p.category}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: p.stock < 10 ? "#E24B4A" : "#333" }}>{p.stock}</td>
                  <td style={{ padding: "10px 12px" }}>{p.sold}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "#1D9E75" }}>₹{p.revenue.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <Badge variant={p.stockStatus === "Critical" ? "danger" : p.stockStatus === "Low" ? "warning" : "success"}>{p.stockStatus}</Badge>
                  </td>
                  <td style={{ padding: "10px 12px", color: p.daysLeft < 2 ? "#E24B4A" : "#333", fontWeight: p.daysLeft < 2 ? 700 : 400 }}>{p.daysLeft} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
