import { useState, useEffect } from "react";
import { getCrossSellRecs, getRestockRecs, getShelfPlacementRecs } from "../services/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
import SectionHeader from "../components/SectionHeader";

export default function RecommendationsPage() {
  const [crossSell, setCrossSell] = useState([]);
  const [restock, setRestock] = useState([]);
  const [placement, setPlacement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [cs, rs, sp] = await Promise.all([
          getCrossSellRecs(),
          getRestockRecs(),
          getShelfPlacementRecs(),
        ]);
        setCrossSell(cs);
        setRestock(rs);
        setPlacement(sp);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading recommendations…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="💡 AI Recommendations" subtitle="Smart suggestions powered by market basket analysis and inventory data" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>🔗 Cross-Selling Opportunities</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>When a customer buys X, suggest Y</p>
        {crossSell.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Run market basket analysis to generate cross-sell rules.</p>
        ) : (
          crossSell.map((rule, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EEEDFE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#534AB7" }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    Customer buys <span style={{ color: "#185FA5" }}>{rule.antecedent}</span> → suggest <span style={{ color: "#0F6E56" }}>{rule.consequent}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#999" }}>Confidence: {rule.confidence} · Lift: {rule.lift}x</div>
                </div>
              </div>
              <Badge variant={rule.strength === "Very High" ? "success" : "info"}>{rule.strength}</Badge>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>📦 Restocking Recommendations</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Based on current stock and sales velocity</p>
        {restock.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>All products are well stocked.</p>
        ) : (
          restock.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 3 }}>
                  Stock: <strong>{r.stock}</strong> · Daily sales: ~{r.avgDailySales} units
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.daysLeft < 1 ? "#E24B4A" : r.daysLeft < 5 ? "#BA7517" : "#1D9E75" }}>
                  {r.daysLeft < 1 ? "⚠️ Out soon!" : `~${r.daysLeft.toFixed(1)} days left`}
                </div>
                <Badge variant={r.priority === "Critical" ? "danger" : r.priority === "Watch" ? "warning" : "success"}>{r.priority}</Badge>
              </div>
            </div>
          ))
        )}
      </Card>

      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>🏪 Shelf Placement Recommendations</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Sales-weighted grouping suggestions</p>
        {placement.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13, margin: 0 }}>Run analysis to generate placement clusters.</p>
        ) : (
          placement.map((rec, i) => (
            <div key={i} style={{ background: "#fafaf8", border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <Badge variant="purple">{rec.priority}</Badge>
                <span style={{ fontSize: 12, color: "#777" }}>~{rec.totalUnitsSold} units sold combined</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {rec.products.map((item) => (
                  <span key={item} style={{ background: "#EEEDFE", color: "#534AB7", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{item}</span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#777" }}>💡 {rec.reason}</p>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
