import { useState, useEffect, useRef } from "react";

export function useSensors(live) {
  const [s, setS] = useState({ az: 0, el: 0, roll: 0, stab: 95, lat: null, lon: null, src: "SIM" });
  const buf = useRef([]);

  useEffect(() => {
    if (!live) return;
    let geo = null;
    if (navigator.geolocation)
      geo = navigator.geolocation.watchPosition(
        (p) => setS((v) => ({ ...v, lat: p.coords.latitude, lon: p.coords.longitude })),
        () => {},
        { enableHighAccuracy: true }
      );

    const orient = (e) => {
      const az = e.webkitCompassHeading != null
        ? e.webkitCompassHeading
        : e.alpha != null ? (360 - e.alpha) % 360 : null;
      const el = e.beta != null ? Math.max(-90, Math.min(90, e.beta - 90)) : 0;
      const roll = e.gamma || 0;
      if (az != null) setS((v) => ({ ...v, az, el, roll, src: "LIVE" }));
    };

    const motion = (e) => {
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const m = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      buf.current.push(m);
      if (buf.current.length > 20) buf.current.shift();
      const mean = buf.current.reduce((a, b) => a + b, 0) / buf.current.length;
      const v = buf.current.reduce((a, b) => a + (b - mean) ** 2, 0) / buf.current.length;
      setS((prev) => ({ ...prev, stab: Math.max(40, Math.min(100, 100 - v * 120)) }));
    };

    window.addEventListener("deviceorientation", orient, true);
    window.addEventListener("devicemotion", motion, true);
    return () => {
      window.removeEventListener("deviceorientation", orient, true);
      window.removeEventListener("devicemotion", motion, true);
      if (geo) navigator.geolocation.clearWatch(geo);
    };
  }, [live]);

  // Sim fallback
  useEffect(() => {
    if (live) return;
    const id = setInterval(() => setS((p) => ({
      ...p,
      az: (p.az + (Math.random() - 0.5) * 0.4 + 360) % 360,
      el: Math.max(-45, Math.min(45, p.el + (Math.random() - 0.5) * 0.3)),
      stab: Math.max(60, Math.min(100, p.stab + (Math.random() - 0.5) * 2)),
      src: "SIM",
    })), 150);
    return () => clearInterval(id);
  }, [live]);

  return s;
}
