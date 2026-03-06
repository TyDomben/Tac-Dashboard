export const AMMO_PRESETS = {
  "5.56 NATO": { bc: 0.304, mv: 975,  mass: 4.0,  caliber: 5.56,  mag: 30 },
  "7.62x39":   { bc: 0.275, mv: 730,  mass: 7.97, caliber: 7.62,  mag: 30 },
  "9mm":       { bc: 0.165, mv: 370,  mass: 7.45, caliber: 9.0,   mag: 17 },
  ".308 Win":  { bc: 0.475, mv: 838,  mass: 9.72, caliber: 7.62,  mag: 20 },
  ".45 ACP":   { bc: 0.195, mv: 260,  mass: 14.9, caliber: 11.43, mag: 13 },
};

// G1 drag model table [mach, Cd]
const G1 = [
  [0.0, 0.2629], [0.05, 0.2558], [0.1, 0.2487], [0.15, 0.2413], [0.2, 0.2336],
  [0.25, 0.2257], [0.3, 0.2174], [0.35, 0.2086], [0.4, 0.1995], [0.45, 0.1903],
  [0.5, 0.1810], [0.55, 0.1717], [0.6, 0.1629], [0.65, 0.1540], [0.7, 0.1450],
  [0.75, 0.1355], [0.8, 0.1262], [0.85, 0.1175], [0.9, 0.1092], [0.95, 0.1016],
  [0.975, 0.0980], [1.0, 0.1030], [1.05, 0.1230], [1.1, 0.1340], [1.2, 0.1440],
  [1.3, 0.1505], [1.5, 0.1580], [2.0, 0.1640], [3.0, 0.1695],
];

function g1Cd(mach) {
  for (let i = 0; i < G1.length - 1; i++) {
    if (mach <= G1[i + 1][0]) {
      const t = (mach - G1[i][0]) / (G1[i + 1][0] - G1[i][0]);
      return G1[i][1] + t * (G1[i + 1][1] - G1[i][1]);
    }
  }
  return 0.1695;
}

export function computeShot(ammo, rangeM, windMph, elevDeg) {
  const { bc, mv, mass, caliber } = ammo;
  const g = 9.81, rho = 1.225, sos = 343, dt = 0.001;
  const A = Math.PI * Math.pow((caliber / 1000) / 2, 2);
  const er = (elevDeg * Math.PI) / 180;
  let vx = mv * Math.cos(er), vy = mv * Math.sin(er), vz = 0;
  const wm = windMph * 0.44704;
  let x = 0, y = 0, z = 0, tof = 0;

  for (let s = 0; s < 60000; s++) {
    const vr = Math.sqrt((vx - wm) ** 2 + vy ** 2 + vz ** 2);
    if (vr < 1) break;
    const drag = 0.5 * rho * (g1Cd(vr / sos) / bc) * A * vr * vr / (mass / 1000);
    vx += -drag * (vx - wm) / vr * dt;
    vy += (-drag * vy / vr - g) * dt;
    vz += -drag * vz / vr * dt;
    x += vx * dt; y += vy * dt; z += vz * dt; tof += dt;
    if (x >= rangeM) return { drop: y, wind: z, tof, vel: Math.sqrt(vx ** 2 + vy ** 2 + vz ** 2) };
    if (y < -50) break;
  }
  return { drop: 0, wind: 0, tof: 0, vel: mv };
}
