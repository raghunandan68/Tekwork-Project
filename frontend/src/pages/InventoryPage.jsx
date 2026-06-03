import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { getInventorySummary, getStockLevels, addStock } from "../services/api";
import KpiCard from "../components/KpiCard";
import Card from "../components/Card";
import Badge from "../components/Badge";
import SectionHeader from "../components/SectionHeader";

export default function InventoryPage() {
  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, levels] = await Promise.all([getInventorySummary(), getStockLevels()]);
      setSummary(s);
      setProducts(levels);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAddStock = async (id, qty) => {
    try {
      await addStock(id, qty);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading inventory…</div>;

  const chartData = products.slice(0, 10);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🗃️ Inventory Management" subtitle="Monitor stock levels and update inventory" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard icon="📦" label="Total Products" value={summary?.total_products ?? 0} variant="blue" />
        <KpiCard icon="⚠️" label="Low Stock" value={summary?.low_stock_count ?? 0} variant="red" sub="Below threshold" />
        <KpiCard icon="✅" label="Well Stocked" value={summary?.well_stocked_count ?? 0} variant="green" />
        <KpiCard icon="📊" label="Total Stock Units" value={summary?.total_stock_units ?? 0} variant="purple" />
      </div>

      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Stock Levels Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
            <Tooltip />
            <Bar dataKey="stock" radius={[6, 6, 0, 0]}>
              {chartData.map((p, i) => (
                <Cell key={i} fill={p.stock < 10 ? "#E24B4A" : p.stock < 30 ? "#EF9F27" : "#1D9E75"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
        {products.map((p) => {
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
                <div style={{ width: `${pct}%`, height: "100%", borderRadius: 20, background: barColor }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#777", marginBottom: 12 }}>
                <span>Current: <strong>{p.stock}</strong></span>
                <span>Sold: <strong>{p.sold}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => handleAddStock(p.id, qty)}
                    style={{ flex: 1, padding: "6px 0", background: "#E1F5EE", color: "#0F6E56", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
                  >
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
