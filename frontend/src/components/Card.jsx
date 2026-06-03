export default function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: "1px solid #ECEAE3",
      padding: "20px 22px",
      ...style,
    }}>{children}</div>
  );
}
