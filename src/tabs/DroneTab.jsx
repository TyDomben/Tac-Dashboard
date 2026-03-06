import { Panel } from "../components/Panel";
import { Stat } from "../components/Stat";

const mono = "'Share Tech Mono', monospace";

export function DroneTab({ acoustic }) {
  const { on, threat, level, freq, start, stop } = acoustic;

  return (
    <div>
      <Panel title="ACOUSTIC DRONE DETECTION" accent={threat ? "#ff4444" : "#00ff88"}>
        <button onClick={on ? stop : start} className="w-full py-3 text-xs tracking-widest mb-4"
          style={{
            border: `1px solid ${on ? (threat ? "rgba(255,68,68,0.6)" : "rgba(0,255,136,0.4)") : "rgba(0,255,136,0.25)"}`,
            color: on ? (threat ? "#ff4444" : "#00ff88") : "#7dbb99",
            background: on ? (threat ? "rgba(255,68,68,0.08)" : "rgba(0,255,136,0.06)") : "transparent",
            fontFamily: mono,
          }}>
          {on ? (threat ? "◉ DRONE SIGNATURE DETECTED" : "◉ MONITORING · CLEAR") : "◎ ARM ACOUSTIC SENSOR"}
        </button>

        {on && (
          <>
            <div className="flex gap-0.5 mb-4 items-end" style={{ height: "48px" }}>
              {Array.from({ length: 28 }, (_, i) => {
                const h = Math.max(3, (level / 100) * 48 * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.7 + Date.now() / 250))));
                return (
                  <div key={i} className="flex-1" style={{
                    height: `${h}px`,
                    background: threat
                      ? `rgba(255,68,68,${0.3 + i / 28 * 0.6})`
                      : `rgba(0,255,136,${0.25 + i / 28 * 0.6})`,
                    alignSelf: "flex-end",
                  }} />
                );
              })}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Stat label="PEAK FREQ" value={`${freq}Hz`}            warn={threat} />
              <Stat label="BAND LVL"  value={`${level.toFixed(0)}%`} warn={level > 65} />
              <Stat label="THREAT"    value={threat ? "POSITIVE" : "NEGATIVE"} warn={threat} />
            </div>
            <div className="text-xs" style={{ color: "#5a9970", fontFamily: mono }}>
              WATCHING 80–450Hz · HARMONIC MATCHING · DJI / CONSUMER UAV
            </div>
          </>
        )}

        {!on && (
          <div className="text-xs text-center py-6 space-y-1" style={{ fontFamily: mono }}>
            <div style={{ color: "#5a9970" }}>DETECTS CONSUMER DRONE MOTOR SIGNATURES</div>
            <div style={{ color: "#3d7755" }}>ALSO RUNS ON IPHONE 5S AS DEDICATED SENSOR</div>
          </div>
        )}
      </Panel>
    </div>
  );
}
