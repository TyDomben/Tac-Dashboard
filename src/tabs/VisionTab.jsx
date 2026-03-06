import { useState, useEffect, useRef } from "react";
import { Panel } from "../components/Panel";
import { Reticle } from "../components/Reticle";

const mono = "'Share Tech Mono', monospace";
const DIRS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

export function VisionTab({ sensors }) {
  const [locked, setLocked] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState(null);
  const [scan, setScan] = useState(0);
  const vidRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setScan((p) => (p + 2.5) % 100), 16);
    return () => clearInterval(id);
  }, []);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      if (vidRef.current) {
        vidRef.current.srcObject = s;
        vidRef.current.play();
        setCamOn(true);
      }
    } catch {
      setCamErr("DENIED");
    }
  };

  return (
    <div>
      <Panel title="AR OVERLAY · TACTICAL VISION">
        <div className="relative overflow-hidden"
          style={{ height: "300px", background: "#000a03", border: "1px solid #00ff8818" }}>
          {camOn
            ? <video ref={vidRef} className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: "saturate(0.2) brightness(1.1) contrast(1.4)" }} playsInline muted />
            : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                style={{ background: "radial-gradient(ellipse at center,#001a0a,#000a03)" }}>
                <div className="text-xs tracking-widest"
                  style={{ color: "#00ff8833", fontFamily: mono }}>
                  {camErr ? "CAMERA " + camErr : "NO FEED"}
                </div>
                {!camErr && (
                  <button onClick={startCam} className="px-4 py-2 text-xs tracking-widest"
                    style={{ border: "1px solid #00ff8833", color: "#00ff88", fontFamily: mono }}>
                    ENABLE CAMERA
                  </button>
                )}
              </div>
          }
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 75% 75% at center,transparent 35%,rgba(0,8,3,0.85) 100%)" }} />
          <div className="absolute left-0 right-0 pointer-events-none"
            style={{ top: `${scan * 3}px`, height: "2px", background: "linear-gradient(90deg,transparent,rgba(0,255,136,0.25),transparent)" }} />
          <Reticle stab={sensors.stab} locked={locked} />
          <div className="absolute top-3 left-3 space-y-0.5" style={{ fontFamily: mono, fontSize: "11px", color: "#00ff88" }}>
            <div>AZ <span style={{ color: "#7fffcc" }}>{sensors.az.toFixed(1)}° {DIRS[Math.round(sensors.az / 22.5) % 16]}</span></div>
            <div>EL <span style={{ color: Math.abs(sensors.el) > 20 ? "#ffaa00" : "#7fffcc" }}>{sensors.el.toFixed(1)}°</span></div>
            <div>ROLL <span style={{ color: Math.abs(sensors.roll || 0) > 15 ? "#ffaa00" : "#7fffcc" }}>{(sensors.roll || 0).toFixed(1)}°</span></div>
            <div>STB <span style={{ color: sensors.stab > 80 ? "#00ff88" : "#ffaa00" }}>{sensors.stab.toFixed(0)}%</span></div>
          </div>
          <div className="absolute top-3 right-3 text-right space-y-0.5" style={{ fontFamily: mono, fontSize: "11px" }}>
            <div style={{ color: locked ? "#ff4444" : "#00ff8855" }}>{locked ? "◉ LOCKED" : "◎ SCAN"}</div>
            <div style={{ color: "#00ff8833" }}>{sensors.src}</div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between"
            style={{ fontFamily: mono, fontSize: "10px", color: "#00ff8844" }}>
            <span>{sensors.lat ? `${sensors.lat.toFixed(5)}N` : "NO GPS"}</span>
            <span>{sensors.lon ? `${sensors.lon.toFixed(5)}W` : "---"}</span>
          </div>
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,0.01) 2px,rgba(0,255,136,0.01) 4px)" }} />
        </div>
        <button onClick={() => setLocked((p) => !p)} className="w-full mt-3 py-2 text-xs tracking-widest"
          style={{
            border: `1px solid ${locked ? "#ff444866" : "#00ff8833"}`,
            color: locked ? "#ff4444" : "#00ff88",
            background: locked ? "rgba(255,68,68,0.07)" : "transparent",
            fontFamily: mono,
          }}>
          {locked ? "⬡ RELEASE TARGET" : "⬢ ACQUIRE TARGET"}
        </button>
      </Panel>
    </div>
  );
}
