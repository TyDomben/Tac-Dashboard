export function Reticle({ stab, locked }) {
  const spread = locked ? 6 : Math.max(6, 20 - stab * 0.12);
  const color = locked ? "#ff4444" : "#00ff88";

  return (
    <svg width="200" height="200" viewBox="0 0 200 200"
      className="absolute inset-0 m-auto pointer-events-none">
      <defs>
        <filter id="g">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="100" cy="100" r="60" fill="none" stroke={`${color}18`} strokeWidth="0.5" />
      <circle cx="100" cy="100" r="36" fill="none" stroke={`${color}12`} strokeWidth="0.5" />
      {[0, 90, 180, 270].map((a) => {
        const rad = (a * Math.PI) / 180;
        return (
          <line key={a}
            x1={100 + Math.cos(rad) * (42 + spread)} y1={100 + Math.sin(rad) * (42 + spread)}
            x2={100 + Math.cos(rad) * 70} y2={100 + Math.sin(rad) * 70}
            stroke={color} strokeWidth="1.5" filter="url(#g)" />
        );
      })}
      <circle cx="100" cy="100" r={spread * 0.7} fill="none" stroke={`${color}44`} strokeWidth="1" />
      <circle cx="100" cy="100" r="2.5" fill={color} filter="url(#g)" />
      {locked && [45, 135, 225, 315].map((a) => {
        const rad = (a * Math.PI) / 180, d = 22;
        return (
          <g key={a} transform={`translate(${100 + Math.cos(rad) * d},${100 + Math.sin(rad) * d})`}>
            <line x1="-4" y1="0" x2="4" y2="0" stroke={color} strokeWidth="1" filter="url(#g)" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke={color} strokeWidth="1" filter="url(#g)" />
          </g>
        );
      })}
    </svg>
  );
}
