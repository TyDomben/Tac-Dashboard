import { useState, useEffect, useRef, useCallback } from "react";
import { Panel } from "../components/Panel";
import { Reticle } from "../components/Reticle";

const mono = "'Share Tech Mono', monospace";
const DIRS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];

export function VisionTab({ sensors }) {
  const [locked, setLocked] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState(null);
  const [scan, setScan] = useState(0);
  const [diagLog, setDiagLog] = useState([]);
  const [showDiag, setShowDiag] = useState(false);
  const vidRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setScan((p) => (p + 2.5) % 100), 16);
    return () => clearInterval(id);
  }, []);

  const log = useCallback((msg, level = "info") => {
    const ts = new Date().toISOString().slice(11, 23);
    const prefix = level === "err" ? "✖" : level === "ok" ? "✔" : level === "warn" ? "⚠" : "·";
    const color = level === "err" ? "#ff4444" : level === "ok" ? "#00ff88" : level === "warn" ? "#ffcc00" : "#88bb99";
    const entry = { ts, msg, color, prefix };
    setDiagLog((p) => [...p, entry]);
    // Also log to browser console
    const fn = level === "err" ? console.error : level === "warn" ? console.warn : console.log;
    fn(`[CAM ${ts}] ${prefix} ${msg}`);
  }, []);

  const startCam = async () => {
    setDiagLog([]);
    setShowDiag(true);

    // ── Environment checks ────────────────────────────────────────────────
    log(`UA: ${navigator.userAgent.slice(0, 80)}`);
    log(`Protocol: ${location.protocol} | Host: ${location.host}`);
    log(`Secure context: ${window.isSecureContext}`);
    log(`navigator.mediaDevices: ${!!navigator.mediaDevices}`);

    if (!navigator.mediaDevices) {
      log("navigator.mediaDevices is UNDEFINED — camera API not available on this context", "err");
      log("This happens on http:// (non-secure). Camera requires https:// or localhost.", "warn");
      setCamErr("NO API");
      return;
    }

    log(`getUserMedia: ${typeof navigator.mediaDevices.getUserMedia}`);

    if (typeof navigator.mediaDevices.getUserMedia !== "function") {
      log("getUserMedia is not a function", "err");
      setCamErr("NO API");
      return;
    }

    // ── Permissions API check (if available) ─────────────────────────────
    if (navigator.permissions) {
      try {
        const perm = await navigator.permissions.query({ name: "camera" });
        log(`Permissions API camera state: ${perm.state}`, perm.state === "denied" ? "err" : perm.state === "granted" ? "ok" : "warn");
      } catch (pe) {
        log(`Permissions API query failed: ${pe.name}: ${pe.message}`, "warn");
      }
    } else {
      log("Permissions API not available", "warn");
    }

    // ── Enumerate devices ─────────────────────────────────────────────────
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devices.filter((d) => d.kind === "videoinput");
      log(`enumerateDevices: ${devices.length} total, ${videoDevs.length} video`, videoDevs.length > 0 ? "ok" : "warn");
      videoDevs.forEach((d, i) => {
        log(`  video[${i}]: label="${d.label || "(no label — not yet permitted)"}" id=${d.deviceId.slice(0, 12)}…`);
      });
      if (videoDevs.length === 0) {
        log("No video input devices found", "warn");
      }
    } catch (ee) {
      log(`enumerateDevices failed: ${ee.name}: ${ee.message}`, "err");
    }

    // ── Attempt 1: rear camera ────────────────────────────────────────────
    let stream = null;
    const constraints1 = { video: { facingMode: { ideal: "environment" } }, audio: false };
    log(`Attempt 1 constraints: ${JSON.stringify(constraints1)}`);
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints1);
      log("Attempt 1 SUCCESS", "ok");
    } catch (e1) {
      log(`Attempt 1 FAILED: ${e1.name}: ${e1.message}`, "err");
      if (e1.name === "NotAllowedError" || e1.name === "PermissionDeniedError") {
        log("User denied camera permission or permission was previously denied", "warn");
        log("On Chrome desktop: check camera icon in address bar", "warn");
        log("On iOS: Settings → Safari → Camera", "warn");
        setCamErr("DENIED");
        return;
      }

      // ── Attempt 2: any camera ─────────────────────────────────────────
      const constraints2 = { video: true, audio: false };
      log(`Attempt 2 constraints: ${JSON.stringify(constraints2)}`);
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints2);
        log("Attempt 2 SUCCESS", "ok");
      } catch (e2) {
        log(`Attempt 2 FAILED: ${e2.name}: ${e2.message}`, "err");

        // ── Attempt 3: minimal constraints ───────────────────────────────
        const constraints3 = { video: {} };
        log(`Attempt 3 constraints: ${JSON.stringify(constraints3)}`);
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints3);
          log("Attempt 3 SUCCESS", "ok");
        } catch (e3) {
          log(`Attempt 3 FAILED: ${e3.name}: ${e3.message}`, "err");
          log(`Final error name: ${e3.name}`, "err");
          log(`Final error constraint: ${e3.constraint || "n/a"}`, "err");
          setCamErr(e1.name === "NotAllowedError" ? "DENIED" : "ERROR");
          return;
        }
      }
    }

    // ── Stream acquired — inspect tracks ─────────────────────────────────
    log(`Stream id: ${stream.id}`, "ok");
    const videoTracks = stream.getVideoTracks();
    log(`Video tracks: ${videoTracks.length}`, videoTracks.length > 0 ? "ok" : "err");
    videoTracks.forEach((t, i) => {
      log(`  track[${i}] label="${t.label}" enabled=${t.enabled} readyState=${t.readyState}`);
      try {
        const settings = t.getSettings();
        log(`  track[${i}] settings: ${JSON.stringify(settings)}`);
      } catch (se) {
        log(`  track[${i}] getSettings() failed: ${se.message}`, "warn");
      }
    });

    // ── Attach to video element ───────────────────────────────────────────
    log(`vidRef.current: ${!!vidRef.current}`);
    if (!vidRef.current) {
      log("vidRef.current is null — video element not mounted yet, setting camOn first", "warn");
      // Set camOn to mount the video element, then attach on next render
      setCamOn(true);
      // Use a small delay for the element to mount
      setTimeout(() => {
        if (vidRef.current) {
          log("vidRef.current now available after delay");
          vidRef.current.srcObject = stream;
          log(`srcObject assigned: ${!!vidRef.current.srcObject}`, "ok");
          vidRef.current.play()
            .then(() => log("play() resolved", "ok"))
            .catch((pe) => log(`play() rejected: ${pe.name}: ${pe.message}`, "err"));
        } else {
          log("vidRef.current still null after delay", "err");
        }
      }, 100);
      return;
    }

    vidRef.current.srcObject = stream;
    log(`srcObject assigned: ${!!vidRef.current.srcObject}`, "ok");
    log(`video.readyState before play: ${vidRef.current.readyState}`);
    log(`video.autoplay: ${vidRef.current.autoplay}`);
    log(`video.playsInline: ${vidRef.current.playsInline}`);
    log(`video.muted: ${vidRef.current.muted}`);

    try {
      await vidRef.current.play();
      log("play() resolved — video is playing", "ok");
    } catch (pe) {
      log(`play() rejected: ${pe.name}: ${pe.message}`, "err");
      if (pe.name === "NotAllowedError") {
        log("Autoplay policy blocked play(). Tap the video to start.", "warn");
      }
    }

    setCamOn(true);
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

        {/* Camera diagnostic log */}
        {diagLog.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowDiag((p) => !p)}
              className="w-full py-1 text-xs tracking-widest"
              style={{ border: "1px solid rgba(255,204,0,0.4)", color: "#ffcc00", background: "rgba(255,204,0,0.06)", fontFamily: mono }}
            >
              {showDiag ? "▲ HIDE CAMERA DIAG" : "▼ SHOW CAMERA DIAG"} ({diagLog.length} entries)
            </button>
            {showDiag && (
              <div
                style={{
                  background: "#000d05",
                  border: "1px solid rgba(255,204,0,0.3)",
                  maxHeight: "260px",
                  overflowY: "auto",
                  padding: "6px 8px",
                }}
              >
                {diagLog.map((e, i) => (
                  <div key={i} style={{ fontFamily: mono, fontSize: "9px", color: e.color, lineHeight: "1.6", wordBreak: "break-all" }}>
                    <span style={{ color: "#3d5545", marginRight: "6px" }}>{e.ts}</span>
                    <span style={{ marginRight: "4px" }}>{e.prefix}</span>
                    {e.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
