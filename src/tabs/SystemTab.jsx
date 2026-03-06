import { Panel } from "../components/Panel";

const mono = "'Share Tech Mono', monospace";

export function SystemTab({ sensors, acoustic }) {
  const rows = [
    ["IMU",   sensors.src === "LIVE" ? "LIVE" : "SIM", sensors.src === "LIVE"],
    ["GPS",   sensors.lat ? "LOCK" : "NO LOCK",         !!sensors.lat],
    ["DRONE", acoustic.on ? "ARMED" : "OFFLINE",        acoustic.on],
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
    </div>
  );
}
