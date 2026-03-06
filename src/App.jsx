import { useState, useCallback, useEffect } from "react";
import { useSensors } from "./hooks/useSensors";
import { useAcoustic } from "./hooks/useAcoustic";
import { VisionTab } from "./tabs/VisionTab";
import { BallisticsTab } from "./tabs/BallisticsTab";
import { DroneTab } from "./tabs/DroneTab";
import { SystemTab } from "./tabs/SystemTab";

const mono = "'Share Tech Mono', monospace";

async function requestMotion() {
  if (
    typeof DeviceMotionEvent !== "undefined" &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    try {
      const a = await DeviceMotionEvent.requestPermission();
      const b = await DeviceOrientationEvent.requestPermission();
      return a === "granted" && b === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

const SENSOR_ROWS = [
  ["IMU / COMPASS", "DeviceOrientation"],
  ["STABILITY",     "DeviceMotion"],
  ["GPS",           "Geolocation"],
  ["CAMERA",        "getUserMedia"],
  ["ACOUSTIC",      "Web Audio"],
];

const TABS = [
  { id: "vision",     l: "◈ VISION" },
  { id: "ballistics", l: "◈ BALLISTICS" },
  { id: "drone",      l: "◈ DRONE" },
  { id: "system",     l: "◈ SYS" },
];

function InitScreen({ onInit, onSkip }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "#000a03" }}>
      <div className="w-full max-w-xs text-center">
        <div className="text-2xl tracking-widest mb-1" style={{ color: "#00ff88", fontFamily: mono }}>SBC TACTICAL</div>
        <div className="text-xs tracking-widest mb-8" style={{ color: "#00ff8833", fontFamily: mono }}>IPHONE NATIVE · v2.2.0</div>
        <div className="mb-6 text-xs space-y-1.5 text-left" style={{ fontFamily: mono }}>
          {SENSOR_ROWS.map(([l, a]) => (
            <div key={l} className="flex justify-between">
              <span style={{ color: "#00ff88" }}>{l}</span>
              <span style={{ color: "#88bb99" }}>{a}</span>
            </div>
          ))}
        </div>
        <button onClick={onInit} className="w-full py-4 text-sm tracking-widest mb-3"
          style={{ border: "1px solid #00ff8855", color: "#00ff88", background: "rgba(0,255,136,0.07)", fontFamily: mono }}>
          ⬢ INITIALIZE SENSORS
        </button>
        <button onClick={onSkip} className="w-full py-2 text-xs tracking-widest"
          style={{ color: "#00ff8833", background: "transparent", border: "none", fontFamily: mono }}>
          SKIP → SIM MODE
        </button>
        <div className="mt-4 text-xs" style={{ color: "#00ff8822", fontFamily: mono }}>
          iOS 13+ requires tap to grant motion
        </div>
      </div>
    </div>
  );
}

function BootScreen({ lines }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#000a03" }}>
      <div className="w-full max-w-sm">
        {lines.map((l, i) => (
          <div key={i} className="text-xs mb-1"
            style={{ fontFamily: mono, color: i === lines.length - 1 ? "#00ff88" : "#00ff8844" }}>
            <span style={{ color: "#00ff8820" }}>[{String(i).padStart(2, "0")}]</span> {l}
          </div>
        ))}
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#00ff88", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("init"); // init | boot | app
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState("vision");
  const [bootLines, setBootLines] = useState([]);

  const sensors = useSensors(live);
  const acoustic = useAcoustic();

  const boot = useCallback((isLive) => {
    setLive(isLive);
    setPhase("boot");
    const lines = [
      "IPHONE NATIVE BUILD v2.2.0",
      "DeviceOrientation: READY",
      "DeviceMotion: READY",
      "Geolocation: READY",
      "Web Audio API: READY",
      "G1 BALLISTICS ENGINE: LOADED",
      "ACOUSTIC FFT PIPELINE: LOADED",
      `IMU SOURCE: ${isLive ? "LIVE HARDWARE" : "SIMULATION"}`,
      "ALL SYSTEMS NOMINAL",
    ];
    let i = 0;
    const id = setInterval(() => {
      setBootLines((p) => [...p, lines[i]]);
      i++;
      if (i >= lines.length) { clearInterval(id); setTimeout(() => setPhase("app"), 500); }
    }, 170);
  }, []);

  const handleInit = async () => { const ok = await requestMotion(); boot(ok); };

  if (phase === "init") return <InitScreen onInit={handleInit} onSkip={() => boot(false)} />;
  if (phase === "boot") return <BootScreen lines={bootLines} />;

  return (
    <div className="min-h-screen" style={{ background: "#000a03" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 px-3 py-2 flex items-center justify-between"
        style={{ background: "rgba(0,5,2,.98)", borderBottom: "1px solid rgba(0,255,136,.12)", backdropFilter: "blur(8px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#00ff88", boxShadow: "0 0 5px #00ff88" }} />
          <span className="text-xs tracking-widest" style={{ color: "#00ff88", fontFamily: mono }}>TACTICAL HUB</span>
          <span className="text-xs" style={{ color: "#5a9970", fontFamily: mono }}>{live ? "LIVE" : "SIM"}</span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "#88bb99", fontFamily: mono }}>
          {acoustic.threat && <span className="animate-pulse" style={{ color: "#ff4444" }}>⚠ UAV</span>}
          <span>{sensors.az.toFixed(0)}°</span>
          <span>{new Date().toLocaleTimeString("en", { hour12: false })}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex px-3 pt-2 gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex-shrink-0 px-3 py-2 text-xs tracking-widest"
            style={{
              fontFamily: mono,
              border: `1px solid ${tab === t.id ? "#00ff8844" : "#00ff8815"}`,
              color: tab === t.id ? "#00ff88" : "#00ff8833",
              background: tab === t.id ? "rgba(0,255,136,.07)" : "transparent",
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3 max-w-2xl mx-auto">
        {tab === "vision"     && <VisionTab sensors={sensors} />}
        {tab === "ballistics" && <BallisticsTab sensors={sensors} />}
        {tab === "drone"      && <DroneTab acoustic={acoustic} />}
        {tab === "system"     && <SystemTab sensors={sensors} acoustic={acoustic} />}
      </div>
    </div>
  );
}
