import { useRef, useState } from "react";

/**
 * A reusable file upload button.
 *
 * Props:
 *   label       — button text (e.g. "📂 Upload CSV")
 *   onUpload    — async fn(file) => { imported, skipped, errors }
 *   accept      — file types (default ".csv,.xlsx")
 *   color       — button background color
 *   textColor   — button text color
 */
export default function FileUploadButton({
  label = "📂 Upload CSV",
  onUpload,
  accept = ".csv,.xlsx",
  color = "#7F77DD",
  textColor = "#fff",
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { imported, skipped, errors }
  const [error, setError] = useState("");

  const handleClick = () => {
    setResult(null);
    setError("");
    inputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-uploaded

    setUploading(true);
    setResult(null);
    setError("");
    try {
      const res = await onUpload(file);
      setResult(res);
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Visible button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading}
        style={{
          padding: "10px 18px",
          background: uploading ? "#ccc" : color,
          color: textColor,
          border: "none",
          borderRadius: 10,
          fontWeight: 700,
          fontSize: 13,
          cursor: uploading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          transition: "opacity 0.2s",
        }}
      >
        {uploading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.7s linear infinite",
              }}
            />
            Uploading…
          </>
        ) : (
          label
        )}
      </button>

      {/* Result toast */}
      {result && (
        <div
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 8,
            background: result.skipped > 0 ? "#FFF8E1" : "#E8F5E9",
            color: result.skipped > 0 ? "#7A5700" : "#1B5E20",
            border: `1px solid ${result.skipped > 0 ? "#FFE082" : "#A5D6A7"}`,
            maxWidth: 340,
          }}
        >
          <strong>
            ✅ {result.imported} imported
            {result.skipped > 0 ? ` · ⚠️ ${result.skipped} skipped` : ""}
          </strong>
          {result.errors?.length > 0 && (
            <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
              {result.errors.slice(0, 5).map((e, i) => (
                <li key={i} style={{ fontSize: 11, color: "#A32D2D" }}>
                  {e}
                </li>
              ))}
              {result.errors.length > 5 && (
                <li style={{ fontSize: 11, color: "#999" }}>
                  …and {result.errors.length - 5} more
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div
          style={{
            fontSize: 12,
            padding: "8px 12px",
            borderRadius: 8,
            background: "#FCEBEB",
            color: "#A32D2D",
            border: "1px solid #F5C6C6",
            maxWidth: 340,
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Spinner keyframe — injected once */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
