export default function Badge({ children, variant = "default" }) {
  const styles = {
    default:  { bg: "#F1EFE8", color: "#5F5E5A" },
    success:  { bg: "#E1F5EE", color: "#0F6E56" },
    warning:  { bg: "#FAEEDA", color: "#854F0B" },
    danger:   { bg: "#FCEBEB", color: "#A32D2D" },
    info:     { bg: "#E6F1FB", color: "#185FA5" },
    purple:   { bg: "#EEEDFE", color: "#534AB7" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20,
      letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{children}</span>
  );
}
