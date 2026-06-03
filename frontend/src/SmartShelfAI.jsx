import { useState, useEffect } from "react";
import { supabase } from "./services/supabaseClient";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import InventoryPage from "./pages/InventoryPage";
import TransactionsPage from "./pages/TransactionsPage";
import AnalysisPage from "./pages/AnalysisPage";
import ShelvesPage from "./pages/ShelvesPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import AnalyticsPage from "./pages/AnalyticsPage";

const COLORS = ["#1D9E75", "#378ADD", "#7F77DD", "#D85A30", "#BA7517", "#D4537E"];

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

export default function SmartShelfAI() {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [session, setSession] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUserEmail(s?.user?.email || "");
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUserEmail(s?.user?.email || "");
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActivePage("dashboard");
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontFamily: "system-ui" }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const pages = {
    dashboard: <DashboardPage userEmail={userEmail} />,
    products: <ProductsPage />,
    inventory: <InventoryPage />,
    transactions: <TransactionsPage />,
    analysis: <AnalysisPage />,
    shelves: <ShelvesPage />,
    recommendations: <RecommendationsPage />,
    analytics: <AnalyticsPage />,
  };

  const displayName = userEmail ? userEmail.split("@")[0] : "Store";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F7F6F3", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <aside style={{
        width: sidebarOpen ? 230 : 60, flexShrink: 0,
        background: "#111110", color: "#fff",
        display: "flex", flexDirection: "column",
        transition: "width 0.25s ease", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "#1D9E75", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏪</div>
          {sidebarOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>SmartShelf</div>
              <div style={{ fontSize: 10, color: "#666", letterSpacing: "0.05em" }}>AI PLATFORM</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePage(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 9, border: "none",
                background: activePage === item.id ? "#1D9E75" : "transparent",
                color: activePage === item.id ? "#fff" : "#888",
                fontWeight: activePage === item.id ? 700 : 400,
                fontSize: 13, cursor: "pointer", textAlign: "left",
                whiteSpace: "nowrap", overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "12px 10px", borderTop: "1px solid #222" }}>
          {sidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "8px 10px", background: "#1a1a18", borderRadius: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", background: COLORS[0],
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                <div style={{ fontSize: 10, color: "#666", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            style={{ width: "100%", padding: "7px 12px", background: "#2a1a1a", border: "none", borderRadius: 7, color: "#e88", cursor: "pointer", fontSize: 12, marginBottom: 6 }}
          >
            {sidebarOpen ? "Sign out" : "↪"}
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ width: "100%", padding: "7px 12px", background: "#222", border: "none", borderRadius: 7, color: "#aaa", cursor: "pointer", fontSize: 13 }}
          >
            {sidebarOpen ? "← Collapse" : "→"}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto", padding: "28px 30px" }}>
        {pages[activePage]}
      </main>
    </div>
  );
}
