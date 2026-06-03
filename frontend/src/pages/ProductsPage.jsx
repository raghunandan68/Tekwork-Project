import { useState, useEffect, useCallback } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import Badge from "../components/Badge";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Bakery", price: "", stock: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stock) return;
    try {
      if (editId) {
        await updateProduct(editId, {
          name: form.name,
          category: form.category,
          price: Number(form.price),
          stock: Number(form.stock),
        });
      } else {
        await createProduct({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          stock: Number(form.stock),
        });
      }
      setForm({ name: "", category: "Bakery", price: "", stock: "" });
      setShowModal(false);
      setEditId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock) });
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

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading products…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="📦 Product Management" subtitle="Add, edit, and manage your product catalog" />
      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍  Search products or categories…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", fontSize: 13, outline: "none" }}
        />
        <button
          type="button"
          onClick={() => { setEditId(null); setForm({ name: "", category: "Bakery", price: "", stock: "" }); setShowModal(true); }}
          style={{ padding: "10px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          + Add Product
        </button>
      </div>

      {showModal && (
        <Card style={{ border: "2px solid #1D9E75" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>{editId ? "✏️ Edit Product" : "➕ New Product"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
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
            <div>
              <label style={{ fontSize: 11, color: "#888", fontWeight: 600, display: "block", marginBottom: 4 }}>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 13 }}
              >
                {["Bakery", "Dairy", "Snacks", "Beverages", "Personal Care", "Cleaning", "Condiments"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={handleSave} style={{ padding: "9px 20px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
              {editId ? "Update Product" : "Save Product"}
            </button>
            <button type="button" onClick={() => { setShowModal(false); setEditId(null); }} style={{ padding: "9px 20px", background: "#f5f4f0", color: "#555", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          </div>
        </Card>
      )}

      {products.length === 0 ? (
        <Card><p style={{ color: "#999", margin: 0 }}>No products yet. Add one or load demo data from login.</p></Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {products.map((p) => (
            <Card key={p.id}>
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
