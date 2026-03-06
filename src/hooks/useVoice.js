import { useState, useRef, useCallback } from "react";

const CMDS = {
  fire:    ["fire", "shot", "send it", "bang"],
  reload:  ["reload", "mag"],
  lock:    ["lock", "acquire", "target"],
  release: ["release", "clear"],
  zero:    ["zero", "reset"],
};

export function useVoice(onCmd) {
  const [on, setOn] = useState(false);
  const [last, setLast] = useState("");
  const ref = useRef(null);

  const toggle = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("SpeechRecognition not available"); return; }
    if (on) { ref.current?.stop(); setOn(false); return; }

    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    ref.current = r;

    r.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      for (const [cmd, trigs] of Object.entries(CMDS)) {
        if (trigs.some((x) => t.includes(x))) {
          setLast(`"${t}" → ${cmd.toUpperCase()}`);
          onCmd(cmd);
          break;
        }
      }
    };
    r.onerror = () => setOn(false);
    r.onend = () => { if (ref.current) try { ref.current.start(); } catch {} };
    r.start();
    setOn(true);
  }, [on, onCmd]);

  return { on, last, toggle };
}
