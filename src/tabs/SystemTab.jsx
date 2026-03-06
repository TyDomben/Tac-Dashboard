import { useState } from "react";
import { Panel } from "../components/Panel";

const mono = "'Share Tech Mono', monospace";

export function SystemTab({ sensors, voice, acoustic }) {
  const [aiQ, setAiQ] = useState("");
  const [aiR, setAiR] = useState("");
  const [loading, setLoading] = useState(false);
  const [uplink, setUplink] = useState(false);

  const query = async () => {
    if (!aiQ.trim() || !uplink) return;
    setLoading(true);
    setAiR("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "Tactical AI on iPhone field computer. 2-3 sentences max, terse. Prefix [TACTICAL-AI].",
          messages: [{ role: "user", content: aiQ }],
        }),
      });
      const d = await res.json();
      setAiR(d.content?.[0]?.text || "SIGNAL LOST");
    } catch {
      setAiR("[TACTICAL-AI] UPLINK FAILED");
    }
    setLoading(false);
  };

  const rows = [
    ["IMU",   sensors.src === "LIVE" ? "LIVE" : "SIM", sensors.src === "LIVE"],
    ["GPS",   sensors.lat ? "LOCK" : "NO LOCK",         !!sensors.lat],
    ["DRONE", acoustic.on ? "ARMED" : "OFFLINE",        acoustic.on],
    ["VOICE", voice.on ? "LISTENING" : "OFFLINE",       voice.on],
  ];

  return (
    <div>
      <Panel title="SENSOR STATUS">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-4" style={{ fontFamily: mono }}>
          {rows.map(([l, v, ok]) => (
            <div key={l} className="flex justify-between">
              <span style={{ color: "#00ff8855" }}>{l}</span>
              <span style={{ color: ok ? "#00ff88" : "#ff444466" }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs" style={{ fontFamily: mono, color: "#00ff8855" }}>
          <div>AZ   <span style={{ color: "#00ff88" }}>{sensors.az.toFixed(1)}°</span></div>
          <div>EL   <span style={{ color: "#00ff88" }}>{sensors.el.toFixed(1)}°</span></div>
          <div>STAB <span style={{ color: sensors.stab > 80 ? "#00ff88" : "#ffaa00" }}>{sensors.stab.toFixed(0)}%</span></div>
          <div>ROLL <span style={{ color: "#00ff88" }}>{(sensors.roll || 0).toFixed(1)}°</span></div>
        </div>
      </Panel>

      <Panel title="VOICE COMMANDS">
        <button onClick={voice.toggle} className="w-full py-2 text-xs tracking-widest mb-3"
          style={{
            border: `1px solid ${voice.on ? "#00ff8855" : "#00ff8818"}`,
            color: voice.on ? "#00ff88" : "#00ff8844",
            background: voice.on ? "rgba(0,255,136,0.07)" : "transparent",
            fontFamily: mono,
          }}>
          {voice.on ? "◉ VOICE ARMED · LISTENING" : "◎ ARM VOICE COMMANDS"}
        </button>
        {voice.last && (
          <div className="text-xs mb-2" style={{ color: "#7fffcc", fontFamily: mono }}>LAST: {voice.last}</div>
        )}
        <div className="text-xs space-y-0.5" style={{ color: "#00ff8822", fontFamily: mono }}>
          <div>"FIRE" / "SEND IT" → decrement</div>
          <div>"RELOAD" → reset mag</div>
          <div>"LOCK" / "TARGET" → acquire</div>
          <div>"RELEASE" / "CLEAR" → release</div>
        </div>
      </Panel>

      <Panel title="TACTICAL AI" accent={uplink ? "#00ff88" : "#ff444433"}>
        <div className="flex gap-2 mb-3">
          <button onClick={() => setUplink((p) => !p)} className="px-4 py-1.5 text-xs tracking-widest"
            style={{
              border: `1px solid ${uplink ? "#00ff8844" : "#ff444433"}`,
              color: uplink ? "#00ff88" : "#ff4444",
              background: uplink ? "rgba(0,255,136,0.07)" : "rgba(255,68,68,0.07)",
              fontFamily: mono,
            }}>
            {uplink ? "◉ UPLINK ON" : "◎ UPLINK OFF"}
          </button>
        </div>
        <div className="flex gap-2 mb-3">
          <input value={aiQ} onChange={(e) => setAiQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && query()}
            placeholder={uplink ? "tactical query..." : "enable uplink first"}
            disabled={!uplink}
            className="flex-1 px-3 py-2 text-xs outline-none"
            style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)", color: "#00ff88", fontFamily: mono }} />
          <button onClick={query} disabled={!uplink || loading}
            className="px-4 py-2 text-xs tracking-widest disabled:opacity-30"
            style={{ border: "1px solid #00ff8822", color: "#00ff88", fontFamily: mono }}>
            {loading ? "..." : "TX"}
          </button>
        </div>
        {aiR && (
          <div className="p-3 text-xs leading-relaxed whitespace-pre-wrap"
            style={{ background: "rgba(0,255,136,0.03)", border: "1px solid rgba(0,255,136,0.1)", color: "#7fffcc", fontFamily: mono }}>
            {aiR}
          </div>
        )}
      </Panel>
    </div>
  );
}
