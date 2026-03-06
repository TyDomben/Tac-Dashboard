import { useState } from "react";
import { Panel } from "../components/Panel";
import { Stat } from "../components/Stat";
import { AMMO_PRESETS, computeShot } from "../lib/ballistics";

const mono = "'Share Tech Mono', monospace";

export function BallisticsTab({ sensors }) {
  const [ammoKey, setAmmoKey] = useState("5.56 NATO");
  const [rounds, setRounds] = useState(30);
  const [range, setRange] = useState(25);
  const [wind, setWind] = useState(0);
  const [log, setLog] = useState([]);
  const ammo = AMMO_PRESETS[ammoKey];

  const shot = computeShot(ammo, range, wind, sensors.el);
  const pct = (rounds / ammo.mag) * 100;
  const low = pct < 25;

  const fire = () => {
    if (rounds <= 0) return;
    const r = rounds - 1;
    setRounds(r);
    setLog((p) => [
      { t: new Date().toLocaleTimeString("en", { hour12: false }), r, range, el: sensors.el.toFixed(1) },
      ...p.slice(0, 9),
    ]);
  };

  return (
    <div>
      <Panel title="ROUND COUNTER">
        <div className="flex gap-3 items-start mb-3">
          <div className="flex-1">
            <div className="text-center mb-3">
              <div className="text-6xl font-bold"
                style={{ fontFamily: mono, color: low ? "#ff4444" : "#00ff88", textShadow: `0 0 30px ${low ? "#ff4444" : "#00ff88"}66` }}>
                {String(rounds).padStart(2, "0")}
              </div>
              <div className="text-xs tracking-widest mt-1" style={{ color: "#00ff8833", fontFamily: mono }}>
                {ammoKey} · {ammo.mag}RD
              </div>
            </div>
            <div className="relative h-2 mb-3"
              style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)" }}>
              <div className="h-full transition-all"
                style={{ width: `${pct}%`, background: low ? "linear-gradient(90deg,#ff333366,#ff4444)" : "linear-gradient(90deg,#00ff8844,#00ff88)" }} />
            </div>
            {low && (
              <div className="text-xs text-center tracking-widest animate-pulse mb-3"
                style={{ color: "#ff4444", fontFamily: mono }}>⚠ LOW AMMO</div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setRounds((p) => Math.max(0, p - 1))} className="flex-1 py-2 text-xl"
                style={{ border: "1px solid #00ff8822", color: "#00ff88", fontFamily: mono }}>−</button>
              <button onClick={fire} className="flex-1 py-2 text-xs tracking-wider"
                style={{ border: "1px solid #00ff8855", color: "#00ff88", background: "rgba(0,255,136,0.07)", fontFamily: mono }}>
                FIRE
              </button>
              <button onClick={() => setRounds(ammo.mag)} className="py-2 px-3 text-xs"
                style={{ border: "1px solid #00ff8822", color: "#00ff88", fontFamily: mono }}>RLD</button>
              <button onClick={() => setRounds((p) => Math.min(ammo.mag, p + 1))} className="flex-1 py-2 text-xl"
                style={{ border: "1px solid #00ff8822", color: "#00ff88", fontFamily: mono }}>+</button>
            </div>
          </div>
          <div className="w-28">
            {Object.keys(AMMO_PRESETS).map((k) => (
              <button key={k} onClick={() => setAmmoKey(k)} className="w-full text-left text-xs py-1 px-2 mb-1"
                style={{
                  fontFamily: mono,
                  background: ammoKey === k ? "rgba(0,255,136,0.1)" : "transparent",
                  border: `1px solid ${ammoKey === k ? "#00ff8844" : "#00ff8815"}`,
                  color: ammoKey === k ? "#00ff88" : "#00ff8844",
                }}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="G1 BALLISTICS · LOCAL COMPUTE">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs mb-1" style={{ color: "#00ff8855", fontFamily: mono }}>RANGE (m)</div>
            <input type="range" min="10" max="800" value={range}
              onChange={(e) => setRange(Number(e.target.value))} className="w-full accent-green-400" />
            <div className="text-center text-sm mt-1" style={{ color: "#00ff88", fontFamily: mono }}>{range}m</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#00ff8855", fontFamily: mono }}>WIND (mph)</div>
            <input type="range" min="-25" max="25" value={wind}
              onChange={(e) => setWind(Number(e.target.value))} className="w-full accent-green-400" />
            <div className="text-center text-sm mt-1"
              style={{ color: wind ? "#ffaa00" : "#00ff88", fontFamily: mono }}>
              {wind > 0 ? "+" : ""}{wind}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat label="DROP"    value={`${(shot.drop * 100).toFixed(1)}cm`}  warn={Math.abs(shot.drop) > 0.05} />
          <Stat label="WINDAGE" value={`${(shot.wind * 100).toFixed(1)}cm`}  warn={Math.abs(shot.wind) > 0.05} />
          <Stat label="TOF"     value={`${shot.tof.toFixed(3)}s`}            warn={false} />
          <Stat label="IMP VEL" value={`${shot.vel.toFixed(0)}m/s`}          warn={shot.vel < 300} />
          <Stat label="GUN EL"  value={`${sensors.el.toFixed(1)}°`}          warn={false} />
          <Stat label="STAB"    value={`${sensors.stab.toFixed(0)}%`}        warn={sensors.stab < 75} />
        </div>
        {log.length > 0 && (
          <div>
            <div className="text-xs mb-1" style={{ color: "#00ff8822", fontFamily: mono }}>SHOT LOG</div>
            {log.map((s, i) => (
              <div key={i} className="flex justify-between text-xs py-0.5"
                style={{ color: "#00ff8844", fontFamily: mono, borderBottom: "1px solid rgba(0,255,136,0.06)" }}>
                <span>{s.t}</span><span>{s.r}rnd</span><span>{s.range}m</span><span>{s.el}°</span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
