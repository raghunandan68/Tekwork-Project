import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getAnalysisSummary, getAssociationRules, runAnalysis } from "../services/api";
import KpiCard from "../components/KpiCard";
import Card from "../components/Card";
import Badge from "../components/Badge";
import SectionHeader from "../components/SectionHeader";

export default function AnalysisPage() {
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [runMessage, setRunMessage] = useState("");

  const load = async () => {
    try {
      const [s, r] = await Promise.all([getAnalysisSummary(), getAssociationRules()]);
      setSummary(s);
      setRules(r);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRun = async () => {
    setRunning(true);
    setRunMessage("");
    try {
      const result = await runAnalysis();
      setRunMessage(result.message || "Analysis complete.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading analysis…</div>;

  const chartData = rules.map((r) => ({
    pair: `${r.antecedent}→${r.consequent}`,
    confidence: parseInt(r.confidence, 10) || 0,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader title="🔬 Market Basket Analysis" subtitle="Association rules discovered via Apriori algorithm" />

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          style={{ padding: "10px 20px", background: "#7F77DD", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: running ? "wait" : "pointer" }}
        >
          {running ? "Running analysis…" : "▶ Run Analysis"}
        </button>
        {runMessage && <span style={{ fontSize: 13, color: "#0F6E56" }}>{runMessage}</span>}
      </div>

      {error && <div style={{ background: "#FCEBEB", color: "#A32D2D", padding: 12, borderRadius: 8, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard icon="📜" label="Rules Discovered" value={summary?.rules_count ?? 0} variant="purple" />
        <KpiCard icon="🔗" label="Avg Confidence" value={summary?.avg_confidence ?? "0%"} variant="green" />
        <KpiCard icon="📈" label="Avg Lift" value={summary?.avg_lift ?? "0"} variant="blue" />
        <KpiCard icon="📊" label="Transactions Analyzed" value={summary?.transactions_analyzed ?? 0} variant="amber" />
      </div>

      <Card>
        <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>Association Rules</h3>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#999" }}>Sorted by lift score</p>
        {rules.length === 0 ? (
          <p style={{ color: "#999", fontSize: 13 }}>No rules yet. Add transactions and click Run Analysis.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rules.map((rule, i) => (
              <div key={rule.id || i} style={{ border: "1px solid #eee", borderRadius: 12, padding: "14px 16px", background: "#fafaf8" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: "#E6F1FB", color: "#185FA5", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{rule.antecedent}</span>
                    <span style={{ fontSize: 18, color: "#999" }}>→</span>
                    <span style={{ background: "#E1F5EE", color: "#0F6E56", padding: "4px 12px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>{rule.consequent}</span>
                  </div>
                  <Badge variant={rule.strength === "Very High" ? "success" : rule.strength === "High" ? "info" : "default"}>{rule.strength}</Badge>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {[["Support", rule.support, "#7F77DD"], ["Confidence", rule.confidence, "#1D9E75"], ["Lift", `${rule.lift}x`, "#378ADD"]].map(([label, val, color]) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", textAlign: "center", border: "1px solid #eee" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 10, color: "#999", marginTop: 2, textTransform: "uppercase" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {chartData.length > 0 && (
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}>Top Product Pairs by Confidence</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="pair" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v) => [`${v}%`, "Confidence"]} />
              <Bar dataKey="confidence" fill="#7F77DD" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
