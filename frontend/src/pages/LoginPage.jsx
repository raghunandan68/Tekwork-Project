import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../services/supabaseClient";
import { seedDemoData } from "../services/api";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleToggleMode = (newMode) => {
    setMode(newMode);
    setEmail("");
    setPassword("");
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Copy frontend/.env.example to frontend/.env and add your keys.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { data, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        if (data.session) {
          try {
            await seedDemoData();
            setMessage("Account created and demo data loaded. Welcome!");
          } catch (seedErr) {
            setMessage(
              "Account created. Run database/seed/seed_data.sql in Supabase, then sign in — or use Seed Demo Data after login."
            );
            console.warn("Seed failed:", seedErr);
          }
        } else {
          setMessage("Check your email to confirm your account, then sign in.");
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#F7F6F3",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #ECEAE3",
        padding: "36px 32px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: "#1D9E75", borderRadius: 14,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, marginBottom: 12,
          }}>🏪</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111" }}>SmartShelf AI</h1>
          <div style={{
            display: "inline-block",
            padding: "4px 12px",
            background: mode === "login" ? "#E3F2FD" : "#E8F5E9",
            color: mode === "login" ? "#0D47A1" : "#1B5E20",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            marginTop: 8,
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}>
            {mode === "login" ? "Sign In" : "Sign Up"}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#888" }}>
            {mode === "login" ? "Sign in to your store dashboard" : "Create your store account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: "#E1F5EE", color: "#0F6E56", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px", background: "#1D9E75", color: "#fff", border: "none",
              borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "#666" }}>
          {mode === "login" ? (
            <>No account?{" "}
              <button type="button" onClick={() => handleToggleMode("signup")} style={{ background: "none", border: "none", color: "#1D9E75", fontWeight: 700, cursor: "pointer" }}>
                Sign up
              </button>
            </>
          ) : (
            <>Have an account?{" "}
              <button type="button" onClick={() => handleToggleMode("login")} style={{ background: "none", border: "none", color: "#1D9E75", fontWeight: 700, cursor: "pointer" }}>
                Sign in
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
