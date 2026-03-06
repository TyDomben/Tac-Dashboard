const mono = "'Share Tech Mono', monospace";

export function Panel({ title, children, accent = "#00ff88" }) {
  return (
    <div className="relative p-3 mb-3" style={{ background: "rgba(0,12,5,0.98)", border: `1px solid ${accent}55` }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }} />
      <div className="text-xs font-bold mb-3 tracking-widest flex items-center gap-2"
        style={{ color: accent, fontFamily: mono }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
        {title}
      </div>
      {children}
    </div>
  );
}
