const mono = "'Share Tech Mono', monospace";

export function Stat({ label, value, warn }) {
  return (
    <div className="p-2 text-center"
      style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)" }}>
      <div className="text-xs mb-0.5" style={{ color: "#00ff8844", fontFamily: mono }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: warn ? "#ffaa00" : "#00ff88", fontFamily: mono }}>{value}</div>
    </div>
  );
}
