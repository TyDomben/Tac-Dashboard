import { useState, useRef, useCallback } from "react";

export function useAcoustic() {
  const [state, setState] = useState({ on: false, threat: false, level: 0, freq: 0 });
  const r = useRef({ ctx: null, analyser: null, iv: null, stream: null });

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
      });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      r.current = { ctx, analyser: an, stream, iv: null };

      const binHz = ctx.sampleRate / an.fftSize;
      r.current.iv = setInterval(() => {
        const d = new Float32Array(an.frequencyBinCount);
        an.getFloatFrequencyData(d);
        const lo = Math.floor(80 / binHz), hi = Math.ceil(450 / binHz);
        let pk = -Infinity, pkBin = lo;
        for (let i = lo; i < hi && i < d.length; i++) if (d[i] > pk) { pk = d[i]; pkBin = i; }
        let harm = 0;
        for (let h = 2; h <= 4; h++) {
          const hb = Math.round(pkBin * h);
          if (hb < d.length && d[hb] > -60) harm++;
        }
        const freq = Math.round(pkBin * binHz);
        const threat = pk > -45 && harm >= 1 && freq > 80 && freq < 450;
        const level = Math.min(100, Math.max(0, (pk + 80) * 1.5));
        setState({ on: true, threat, level, freq });
      }, 100);

      setState((p) => ({ ...p, on: true }));
    } catch {
      setState((p) => ({ ...p, on: false }));
    }
  }, []);

  const stop = useCallback(() => {
    clearInterval(r.current.iv);
    r.current.ctx?.close();
    r.current.stream?.getTracks().forEach((t) => t.stop());
    setState({ on: false, threat: false, level: 0, freq: 0 });
  }, []);

  return { ...state, start, stop };
}
