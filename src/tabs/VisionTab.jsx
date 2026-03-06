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
    // Get stream first — play() called AFTER, outside the getUserMedia try/catch
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
    } catch (e1) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      } catch {
        setCamErr(e1.name === "NotAllowedError" ? "DENIED" : "ERROR");
        return;
      }
    }
    if (vidRef.current) {
      vidRef.current.srcObject = stream;
      vidRef.current.play().catch(() => {});
      setCamOn(true);
    }
  };

  const dir = DIRS[Math.round(sensors.az / 22.5) % 16];

  return (
    <div>
      <Panel title="AR OVERLAY · TACTICAL VISION">
        {/* Video / overlay — tap anywhere to toggle lock */}
        <div
          className="relative overflow-hidden"
          style={{
            height: "260px",
            background: "#000a03",
            border: "1px solid rgba(0,255,136,0.35)",
            cursor: "crosshair",
          }}
          onClick={() => setLocked((p) => !p)}
        >
          {camOn ? (
            <video
              ref={vidRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "saturate(0.2) brightness(1.1) contrast(1.4)" }}
            />
          ) : (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "radial-gradient(ellipse at center,#001a0a,#000a03)" }}
            >
              <div className="text-sm tracking-widest" style={{ color: "#b8ffd0", fontFamily: mono }}>
                {camErr ? "CAMERA " + camErr : "NO FEED"}
              </div>
              {!camErr && (
                <button
                  onClick={(e) => { e.stopPropagation(); startCam(); }}
                  className="px-5 py-2 text-xs tracking-widest"
                  style={{
                    border: "1px solid rgba(0,255,136,0.5)",
                    color: "#00ff88",
                    background: "rgba(0,255,136,0.1)",
                    fontFamily: mono,
                  }}
                >
                  ENABLE CAMERA
                </button>
              )}
            </div>
          )}

          {/* Scan line */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${scan * 2.6}px`,
              height: "2px",
              background: "linear-gradient(90deg,transparent,rgba(0,255,136,0.45),transparent)",
            }}
          />

          {/* Reticle centred in box */}
          <Reticle stab={sensors.stab} locked={locked} />

          {/* Lock status — top right */}
          <div
            className="absolute top-2 right-2 text-right pointer-events-none"
            style={{ fontFamily: mono, fontSize: "11px" }}
          >
            <div style={{ color: locked ? "#ff4444" : "#00ff88", fontWeight: "bold" }}>
              {locked ? "◉ LOCKED" : "◎ SCAN"}
            </div>
            <div style={{ color: "#5a9970", fontSize: "10px" }}>{sensors.src}</div>
          </div>

          {/* Tap hint — bottom centre */}
          <div
            className="absolute bottom-2 left-0 right-0 text-center pointer-events-none"
            style={{ fontFamily: mono, fontSize: "10px", color: "rgba(0,255,136,0.5)" }}
          >
            TAP TO {locked ? "RELEASE" : "LOCK"}
          </div>

          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px)",
            }}
          />
        </div>

        {/* Sensor readout row — outside video box, no overlap possible */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[
            ["AZ",   `${sensors.az.toFixed(1)}° ${dir}`,         false],
            ["EL",   `${sensors.el.toFixed(1)}°`,                Math.abs(sensors.el) > 20],
            ["ROLL", `${(sensors.roll || 0).toFixed(1)}°`,       Math.abs(sensors.roll || 0) > 15],
            ["STB",  `${sensors.stab.toFixed(0)}%`,              sensors.stab < 70],
          ].map(([lbl, val, warn]) => (
            <div
              key={lbl}
              className="text-center py-2"
              style={{ background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.28)" }}
            >
              <div style={{ color: "#7dbb99", fontFamily: mono, fontSize: "9px" }}>{lbl}</div>
              <div style={{ color: warn ? "#ffcc00" : "#ffffff", fontFamily: mono, fontSize: "11px", fontWeight: "bold" }}>
                {val}
              </div>
            </div>
          ))}
        </div>

        {/* GPS row */}
        <div
          className="mt-1 px-2 py-1.5 flex justify-between"
          style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.2)" }}
        >
          <span style={{ color: "#7dbb99", fontFamily: mono, fontSize: "10px" }}>GPS</span>
          <span style={{ color: sensors.lat ? "#ffffff" : "#ff4444", fontFamily: mono, fontSize: "10px" }}>
            {sensors.lat
              ? `${sensors.lat.toFixed(5)}N  ${sensors.lon.toFixed(5)}W`
              : "NO LOCK"}
          </span>
        </div>

        {/* Acquire / release button */}
        <button
          onClick={() => setLocked((p) => !p)}
          className="w-full mt-2 py-2.5 text-xs tracking-widest font-bold"
          style={{
            border: `1px solid ${locked ? "rgba(255,68,68,0.6)" : "rgba(0,255,136,0.5)"}`,
            color: locked ? "#ff4444" : "#00ff88",
            background: locked ? "rgba(255,68,68,0.08)" : "rgba(0,255,136,0.07)",
            fontFamily: mono,
          }}
        >
          {locked ? "⬡ RELEASE TARGET" : "⬢ ACQUIRE TARGET"}
        </button>
      </Panel>
    </div>
  );
}
