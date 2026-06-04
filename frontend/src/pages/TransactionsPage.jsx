import { useState, useEffect } from "react";
import { getTransactions, createTransaction, getProducts, uploadTransactions } from "../services/api";
import Card from "../components/Card";
import Badge from "../components/Badge";
import SectionHeader from "../components/SectionHeader";
import FileUploadButton from "../components/FileUploadButton";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts]         = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [items, setItems]               = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [saving, setSaving]             = useState(false);

  const load = async () => {
    try {
      const [txns, prods] = await Promise.all([getTransactions(), getProducts()]);
      setTransactions(txns);
      setProducts(prods);
      if (prods.length && !selectedItem) setSelectedItem(prods[0].name);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const addItem = () => {
    if (selectedItem && !items.includes(selectedItem)) {
      setItems((prev) => [...prev, selectedItem]);
    }
  };

  const recordSale = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await createTransaction({ items });
      setItems([]);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUploadTransactions = async (file) => {
    const result = await uploadTransactions(file);
    // Reload everything so inventory/dashboard data is fresh on next visit
    await load();
    return result;
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading transactions…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🧾 Sales Transactions" subtitle="Record and review customer purchases" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{ padding: "10px 20px", background: "#378ADD", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + Record Sale
        </button>

        <FileUploadButton
          label="📂 Upload CSV"
          onUpload={handleUploadTransactions}
          color="#1D9E75"
        />
      </div>

      {/* ── CSV format hint ── */}
      <div style={{ fontSize: 11, color: "#aaa", marginTop: -8 }}>
        📋 CSV format: <code style={{ background: "#f5f5f5", padding: "1px 5px", borderRadius: 4 }}>date, product_name, quantity</code>
        &nbsp;— rows with the same date are grouped into one transaction
      </div>

      {/* ── Manual record sale form ── */}
      {showForm && (
        <Card style={{ border: "2px solid #378ADD" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>New Transaction</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            <button type="button" onClick={addItem} style={{ padding: "8px 18px", background: "#378ADD", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {items.map((item) => (
              <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E6F1FB", color: "#185FA5", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {item}
                <button type="button" onClick={() => setItems((prev) => prev.filter((i) => i !== item))} style={{ background: "none", border: "none", cursor: "pointer", color: "#185FA5", fontWeight: 700, padding: 0 }}>×</button>
              </span>
            ))}
            {items.length === 0 && <span style={{ color: "#bbb", fontSize: 12 }}>No items added yet…</span>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={recordSale} disabled={saving || items.length === 0} style={{ padding: "9px 22px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              {saving ? "Saving…" : "Record Sale"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: "9px 16px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      )}

      {/* ── Transaction history ── */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Transaction History</h3>
        {transactions.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13 }}>No transactions yet. Record a sale, upload a CSV, or load demo data from the login screen.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Transaction ID", "Date", "Items Purchased", "Total", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "9px 12px", color: "#999", fontWeight: 600, fontSize: 11, textTransform: "uppercase", borderBottom: "2px solid #eee" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, idx) => (
                  <tr key={t.transaction_id || t.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={{ padding: "11px 12px", fontWeight: 700, color: "#378ADD" }}>{t.transaction_id}</td>
                    <td style={{ padding: "11px 12px", color: "#666" }}>{t.date}</td>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {t.items.map((item) => <Badge key={item} variant="info">{item}</Badge>)}
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px", fontWeight: 700, color: "#1D9E75" }}>₹{t.total}</td>
                    <td style={{ padding: "11px 12px" }}><Badge variant="success">{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
