export default function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>{subtitle}</p>}
    </div>
  );
}
