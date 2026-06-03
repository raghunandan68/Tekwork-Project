import { useState, useEffect } from "react";
import { getShelfZones, updateZoneProducts } from "../services/api";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";

export default function ShelvesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dragItem, setDragItem] = useState(null);
  const [dragFromZone, setDragFromZone] = useState(null);

  const load = async () => {
    try {
      const data = await getShelfZones();
      setZones(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const persistZone = async (zoneId, products) => {
    try {
      await updateZoneProducts(zoneId, products);
    } catch (err) {
      setError(err.message);
      await load();
    }
  };

  const handleDrop = async (targetZoneIndex) => {
    if (dragItem == null || dragFromZone == null || dragFromZone === targetZoneIndex) {
      setDragItem(null);
      setDragFromZone(null);
      return;
    }

    const next = zones.map((z) => ({ ...z, products: [...z.products] }));
    const from = next[dragFromZone];
    const to = next[targetZoneIndex];
    from.products = from.products.filter((p) => p !== dragItem);
    if (!to.products.includes(dragItem)) to.products.push(dragItem);
    setZones(next);
    setDragItem(null);
    setDragFromZone(null);
    await persistZone(to.id, to.products);
    await persistZone(from.id, from.products);
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading shelf zones…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🏪 Smart Shelf Planner" subtitle="AI-recommended product placement zones based on purchase patterns" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      {zones.length === 0 ? (
        <Card><p style={{ color: "#999", margin: 0 }}>No shelf zones yet. Load demo data from the login screen.</p></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {zones.map((zone, zi) => (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zi)}
              style={{ border: "2px solid #eee", borderRadius: 16, padding: 20, background: zone.bg }}
            >
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
                  <div
                    key={prod}
                    draggable
                    onDragStart={() => { setDragItem(prod); setDragFromZone(zi); }}
                    style={{
                      background: "#fff", borderRadius: 8, padding: "8px 12px",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, fontWeight: 600, color: "#333", cursor: "grab",
                      border: "1px solid #eee",
                    }}
                  >
                    <span style={{ color: zone.color, fontWeight: 800, fontSize: 12 }}>#{pi + 1}</span>
                    {prod}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
