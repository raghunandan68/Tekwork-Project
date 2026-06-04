import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  uploadProducts, getCategories, addCategory,
} from "../services/api";
import Badge from "../components/Badge";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import FileUploadButton from "../components/FileUploadButton";

// ── Seasonality config ────────────────────────────────────────────────────────
const SEASONALITY_OPTIONS = [
  { label: "🌍 Year-Round",   value: "Year-Round",   color: "#1D9E75", bg: "#E8F5EF" },
  { label: "☀️ Summer",       value: "Summer",        color: "#D85A30", bg: "#FDF0EB" },
  { label: "❄️ Winter",       value: "Winter",        color: "#378ADD", bg: "#E6F1FB" },
  { label: "🌧️ Monsoon",      value: "Monsoon",       color: "#7F77DD", bg: "#F0EFFD" },
  { label: "🎉 Festive",      value: "Festive",       color: "#BA7517", bg: "#FDF3E0" },
  { label: "📅 Weekend Peak", value: "Weekend Peak",  color: "#D4537E", bg: "#FDEEF4" },
];

const DEFAULT_CATEGORIES = [
  "Bakery", "Dairy", "Snacks", "Beverages",
  "Personal Care", "Cleaning", "Condiments",
];

function SeasonalityBadge({ value }) {
  const opt = SEASONALITY_OPTIONS.find((o) => o.value === value) || SEASONALITY_OPTIONS[0];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      color: opt.color,
      background: opt.bg,
      border: `1px solid ${opt.color}33`,
    }}>
      {opt.label}
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts]       = useState([]);
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editId, setEditId]           = useState(null);
  const [form, setForm]               = useState({
    name: "", category: "Bakery", price: "", stock: "", seasonality: "Year-Round",
  });
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  // Category combo state
  const [categories, setCategories]   = useState(DEFAULT_CATEGORIES);
  const [enteringCat, setEnteringCat] = useState(false);
  const [newCatValue, setNewCatValue] = useState("");
  const newCatRef                     = useRef(null);

  // ── Load categories from DB ─────────────────────────────────────────────────
  const loadCategories = useCallback(async () => {
    try {
      const cats = await getCategories();
      if (cats && cats.length > 0) {
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...cats]));
        setCategories(merged.sort());
      }
    } catch {
      /* fall back to defaults silently */
    }
  }, []);

  // ── Load products ───────────────────────────────────────────────────────────
  const loadProducts = useCallback(async () => {
    try {
      const data = await getProducts(search);
      setProducts(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  // ── Reset modal form ────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ name: "", category: categories[0] || "Bakery", price: "", stock: "", seasonality: "Year-Round" });
    setEnteringCat(false);
    setNewCatValue("");
    setEditId(null);
  };

  // ── Save product ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) return;
    try {
      const payload = {
        name:        form.name,
        category:    form.category,
        price:       Number(form.price),
        stock:       Number(form.stock),
        seasonality: form.seasonality,
      };
      if (editId) {
        await updateProduct(editId, payload);
      } else {
        await createProduct(payload);
      }
      resetForm();
      setShowModal(false);
      await loadProducts();
      await loadCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      name:        p.name,
      category:    p.category,
      price:       String(p.price),
      stock:       String(p.stock),
      seasonality: p.seasonality || "Year-Round",
    });
    setEnteringCat(false);
    setNewCatValue("");
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Custom category logic ───────────────────────────────────────────────────
  const handleCategorySelectChange = (val) => {
    if (val === "__new__") {
      setEnteringCat(true);
      setNewCatValue("");
      setTimeout(() => newCatRef.current?.focus(), 50);
    } else {
      setForm((f) => ({ ...f, category: val }));
    }
  };

  const handleNewCatConfirm = async () => {
    const trimmed = newCatValue.trim();
    if (!trimmed) return;
    // Save to DB in background (fire-and-forget for UX speed)
    addCategory(trimmed).catch(() => {});
    setCategories((prev) => Array.from(new Set([...prev, trimmed])).sort());
    setForm((f) => ({ ...f, category: trimmed }));
    setEnteringCat(false);
    setNewCatValue("");
  };

  const handleNewCatKeyDown = (e) => {
    if (e.key === "Enter") handleNewCatConfirm();
    if (e.key === "Escape") { setEnteringCat(false); setNewCatValue(""); }
  };

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleUploadProducts = async (file) => {
    const result = await uploadProducts(file);
    await loadProducts();
    await loadCategories();
    return result;
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading products…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="📦 Product Management" subtitle="Add, edit, and manage your product catalog" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search products or categories…"
          style={{ flex: 1, minWidth: 180, padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
        />
        <button
          type="button"
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{ padding: "10px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          + Add Product
        </button>
        <FileUploadButton
          label="📂 Upload CSV"
          onUpload={handleUploadProducts}
          color="#7F77DD"
        />
      </div>

      {/* ── CSV format hint ── */}
      <div style={{ fontSize: 11, color: "#aaa", marginTop: -8 }}>
        📋 CSV format: <code style={{ background: "#f5f5f5", padding: "1px 5px", borderRadius: 4 }}>name, category, price, stock, seasonality</code>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <Card style={{ border: "2px solid #1D9E75" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>{editId ? "✏️ Edit Product" : "➕ New Product"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

            {/* Name, Price, Stock */}
            {[["Product Name", "name", "text"], ["Price (₹)", "price", "number"], ["Stock Qty", "stock", "number"]].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }}
                />
              </div>
            ))}

            {/* Category combo */}
            <div>
              <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              {enteringCat ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    ref={newCatRef}
                    type="text"
                    value={newCatValue}
                    onChange={(e) => setNewCatValue(e.target.value)}
                    onKeyDown={handleNewCatKeyDown}
                    placeholder="Type new category…"
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #7F77DD", fontSize: 13, outline: "none" }}
                  />
                  <button
                    type="button"
                    onClick={handleNewCatConfirm}
                    style={{ padding: "8px 12px", background: "#7F77DD", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                  >✓</button>
                  <button
                    type="button"
                    onClick={() => { setEnteringCat(false); setNewCatValue(""); }}
                    style={{ padding: "8px 10px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                  >✕</button>
                </div>
              ) : (
                <select
                  value={form.category}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">➕ Enter new category…</option>
                </select>
              )}
            </div>

            {/* Seasonality */}
            <div>
              <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>Seasonality / Trend</label>
              <select
                value={form.seasonality}
                onChange={(e) => setForm((f) => ({ ...f, seasonality: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
              >
                {SEASONALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={handleSave} style={{ padding: "9px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              {editId ? "Update Product" : "Save Product"}
            </button>
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} style={{ padding: "9px 20px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      )}

      {/* ── Product Grid ── */}
      {products.length === 0 ? (
        <Card><p style={{ color: "#999", margin: 0 }}>No products yet. Add one, upload a CSV, or load demo data from login.</p></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
          {products.map((p) => (
            <Card key={p.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{p.category}</div>
                </div>
                <Badge variant={p.status === "Low Stock" ? "danger" : "success"}>{p.status}</Badge>
              </div>

              {/* Seasonality badge */}
              <div style={{ marginBottom: 10 }}>
                <SeasonalityBadge value={p.seasonality || "Year-Round"} />
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
                <button type="button" onClick={() => handleEdit(p)} style={{ flex: 1, padding: "6px 0", background: "#E6F1FB", color: "#185FA5", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✏️ Edit</button>
                <button type="button" onClick={() => handleDelete(p.id)} style={{ flex: 1, padding: "6px 0", background: "#FCEBEB", color: "#A32D2D", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>🗑️ Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
