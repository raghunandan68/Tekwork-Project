export default function KpiCard({ label, value, sub, variant = "default", icon }) {
  const colors = {
    default: { bg: "#F1EFE8", accent: "#5F5E5A" },
    green:   { bg: "#E1F5EE", accent: "#0F6E56" },
    blue:    { bg: "#E6F1FB", accent: "#185FA5" },
    amber:   { bg: "#FAEEDA", accent: "#854F0B" },
    red:     { bg: "#FCEBEB", accent: "#A32D2D" },
    purple:  { bg: "#EEEDFE", accent: "#534AB7" },
  };
  const c = colors[variant] || colors.default;
  return (
    <div style={{
      background: c.bg,
      borderRadius: 14, padding: "18px 20px",
      display: "flex", flexDirection: "column", gap: 6,
      position: "relative", overflow: "hidden",
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 28, fontWeight: 700, color: c.accent, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: c.accent, opacity: 0.75 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: c.accent, opacity: 0.6 }}>{sub}</span>}
    </div>
  );
}
