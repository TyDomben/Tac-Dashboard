const mono = "'Share Tech Mono', monospace";

export function Stat({ label, value, warn }) {
  return (
    <div className="p-2 text-center"
      style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.25)" }}>
      <div className="text-xs mb-0.5" style={{ color: "#7dbb99", fontFamily: mono }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: warn ? "#ffaa00" : "#ffffff", fontFamily: mono }}>{value}</div>
    </div>
  );
}
