/**
 * CryostatScene.tsx
 * Bluefors LDsl Interactive 3D Cryostat Model & Cinematic Quantum Signal Engine
 *
 * Implements:
 * - High-fidelity Bluefors LDsl cryostat geometry with 10 core stages/components
 * - Ultra-detailed Room Temperature Flange based directly on https://ldsl-system.bluefors.com/room-temperature-flange
 *   (Central NW100 vacuum service collar, corrugated flex lines, Pirani gauge, dual-column 16-SMA feedthrough tower,
 *    D-sub DC port, Fischer thermometry connector, rotary valve PT motor unit, 24 hex bolts, 6 support standoffs)
 * - Official Bluefors blue selection highlight material (#005bb5 / #0066cc) with glowing rim
 * - Studio lighting & dark charcoal background (#18191b) with ACES Filmic tone mapping
 * - High-Rendering Signal Tracing with:
 *     * Multi-layered neon cyan microwave control pulse with trailing plasma comet wake & EM shockwave rings
 *     * Attenuator thermal absorption flashes at 50K, 4K, Still, and MXC
 *     * Holographic double-orbital quantum resonance rings & particle sparkle burst at <10 mK QPU chip
 *     * Fragile amber readout photon + explosive +40 dB golden HEMT amplification bloom at 4K stage
 * - Dynamic Cinematic POV Camera Controller (Chase Cam, Stage Macro, Hero Wide, Free Orbit)
 * - Exploded view slider (0–100%) and interactive raycasting
 */

import React, {
  useRef,
  useEffect,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  HARDWARE_COMPONENTS,
  COMPONENT_ALIASES,
} from "../lib/hardware-components";
import { type SignalFlowStep } from "../lib/signal-flow";

/* ─── Prop types ─────────────────────────────────────────── */
export type SignalPovMode = "chase" | "macro" | "hero" | "free";

interface SceneProps {
  selectedId: string | null;
  hiddenIds: Set<string>;
  explodeFactor: number; // 0–1
  showLabels: boolean;
  autoRotate: boolean;
  isolated: boolean;
  activeSignalStep: SignalFlowStep | null;
  signalProgress: number; // 0–1
  signalPovMode?: SignalPovMode;
  onSelectComponent: (id: string) => void;
  onHover: (data: { x: number; y: number; name: string; temp?: string } | null) => void;
  onResetViewRequest?: () => void;
}

/* ─── Mesh metadata stored per Three.js object ───────────── */
interface MeshMeta {
  componentId: string;
  assembledPos: THREE.Vector3;
  assembledRot: THREE.Euler;
  explodedPos: THREE.Vector3;
  explodedRot: THREE.Euler;
}

const META_KEY = "__atlasMeta";

/* ─── Material factory ───────────────────────────────────── */
function makeMat(params: {
  color: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  side?: THREE.Side;
}) {
  return new THREE.MeshStandardMaterial({
    color: params.color,
    roughness: params.roughness ?? 0.4,
    metalness: params.metalness ?? 0.6,
    transparent: params.transparent ?? false,
    opacity: params.opacity ?? 1,
    emissive: params.emissive ? new THREE.Color(params.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: params.emissiveIntensity ?? 0,
    side: params.side ?? THREE.FrontSide,
  });
}

/* ─── Materials (Tuned for Bluefors LDsl visual style) ───── */
const MAT = {
  // Official Bluefors Active Selection Blue
  blueforsSelected: makeMat({
    color: 0x0062cc,
    roughness: 0.18,
    metalness: 0.20,
    emissive: 0x003380,
    emissiveIntensity: 0.45,
  }),
  blueforsSelectedTranslucent: makeMat({
    color: 0x0062cc,
    roughness: 0.10,
    metalness: 0.15,
    transparent: true,
    opacity: 0.38,
    emissive: 0x002060,
    emissiveIntensity: 0.30,
    side: THREE.DoubleSide,
  }),

  // Dark Anodized Cryostat Flange Plates (Precision CNC finish)
  stagePlateBlack: makeMat({ color: 0x141619, roughness: 0.32, metalness: 0.75 }),
  topFlangeBlack: makeMat({ color: 0x101215, roughness: 0.28, metalness: 0.82 }),

  // Gold hardware, breadboard plate & bevels (24K Mirror Gold)
  goldHardware: makeMat({ color: 0xf6c846, roughness: 0.14, metalness: 0.95 }),
  goldBright: makeMat({ color: 0xfcc233, roughness: 0.10, metalness: 0.98 }),
  goldDark: makeMat({ color: 0xdeb032, roughness: 0.20, metalness: 0.92 }),
  goldCircuits: makeMat({ color: 0xffd700, roughness: 0.06, metalness: 0.98 }),
  qpuGold: makeMat({ color: 0xf0b830, roughness: 0.14, metalness: 0.95 }),
  smaGold: makeMat({ color: 0xe5a928, roughness: 0.16, metalness: 0.94 }),
  brassHardware: makeMat({ color: 0xd4a017, roughness: 0.25, metalness: 0.88 }),

  // Polished Stainless Steel & Metals
  polishedSteel: makeMat({ color: 0xe2e8f0, roughness: 0.10, metalness: 0.98 }),
  brushedSteel: makeMat({ color: 0x94a3b8, roughness: 0.28, metalness: 0.92 }),
  silverMirror: makeMat({ color: 0xf1f5f9, roughness: 0.08, metalness: 0.98 }),
  helicalSilver: makeMat({ color: 0xdbeafe, roughness: 0.14, metalness: 0.96 }),
  vacuumHoseSteel: makeMat({ color: 0xa0aec0, roughness: 0.35, metalness: 0.90 }),

  // OFHC Copper & Braids
  copperOFHC: makeMat({ color: 0xc26b38, roughness: 0.22, metalness: 0.92 }),
  copperBraid: makeMat({ color: 0xd97736, roughness: 0.42, metalness: 0.90 }),
  copperTubing: makeMat({ color: 0xb4532a, roughness: 0.26, metalness: 0.88 }),

  // Pulse Tube Components
  pulseTubeWhite: makeMat({ color: 0xf8fafc, roughness: 0.25, metalness: 0.20 }),
  pulseTubeGrey: makeMat({ color: 0x64748b, roughness: 0.35, metalness: 0.55 }),
  pulseTubeRegen: makeMat({ color: 0x334155, roughness: 0.28, metalness: 0.80 }),

  // Radiation Shields & Vacuum Can
  vacCanCutaway: makeMat({ color: 0x0066cc, roughness: 0.10, metalness: 0.15, transparent: true, opacity: 0.36, side: THREE.DoubleSide }),
  vacCanBlueRing: makeMat({ color: 0x0a223c, roughness: 0.22, metalness: 0.75 }),
  shieldGoldInterior: makeMat({ color: 0xf6c846, roughness: 0.14, metalness: 0.95, side: THREE.DoubleSide }),
  shieldMetalExterior: makeMat({ color: 0x64748b, roughness: 0.25, metalness: 0.88, side: THREE.DoubleSide }),
  muMetal: makeMat({ color: 0x334155, roughness: 0.30, metalness: 0.80, transparent: true, opacity: 0.60, side: THREE.DoubleSide }),

  // Microelectronics & Coax
  hemtAluminum: makeMat({ color: 0x94a3b8, roughness: 0.20, metalness: 0.90 }),
  hemtGold: makeMat({ color: 0xf5c342, roughness: 0.14, metalness: 0.95 }),
  sapphire: makeMat({ color: 0x091426, roughness: 0.05, metalness: 0.90 }),
  coaxSilver: makeMat({ color: 0xd8e0e8, roughness: 0.18, metalness: 0.94 }),
  coaxBlue: makeMat({ color: 0x2563eb, roughness: 0.40, metalness: 0.25 }),
  coaxOrange: makeMat({ color: 0xea580c, roughness: 0.40, metalness: 0.25 }),

  // Laser engraved index badge
  laserEngraved: makeMat({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 }),
  fischerBlue: makeMat({ color: 0x0284c7, roughness: 0.3, metalness: 0.6 }),
};

/* ─── Mesh creation helpers ──────────────────────────────── */
function makeCylinder(
  rt: number, rb: number, h: number, segs: number,
  mat: THREE.Material,
  open = false,
  thetaStart = 0,
  thetaLength = Math.PI * 2
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rt, rb, h, segs, 1, open, thetaStart, thetaLength);
  const mesh = new THREE.Mesh(geo, mat);
  (mesh as unknown as Record<string, unknown>).__origMat = mat;
  return mesh;
}

function makeDisc(r: number, h: number, mat: THREE.Material): THREE.Mesh {
  return makeCylinder(r, r, h, 48, mat);
}

function makeTube(curve: THREE.Curve<THREE.Vector3>, segments: number, radius: number, mat: THREE.Material): THREE.Mesh {
  const geo = new THREE.TubeGeometry(curve, segments, radius, 8, false);
  const mesh = new THREE.Mesh(geo, mat);
  (mesh as unknown as Record<string, unknown>).__origMat = mat;
  return mesh;
}

/* ─── Helical Curve for Coiled Heat Exchangers & Capillaries ─── */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  pitch: number;
  turns: number;
  center: THREE.Vector3;

  constructor(radius: number, pitch: number, turns: number, center = new THREE.Vector3()) {
    super();
    this.radius = radius;
    this.pitch = pitch;
    this.turns = turns;
    this.center = center;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const x = Math.cos(angle) * this.radius + this.center.x;
    const y = t * this.pitch * this.turns + this.center.y;
    const z = Math.sin(angle) * this.radius + this.center.z;
    return optionalTarget.set(x, y, z);
  }
}

/* ─── Assign meta + name to mesh ─────────────────────────── */
function tag(
  obj: THREE.Object3D,
  id: string,
  assembledPos: THREE.Vector3,
  explodedPos: THREE.Vector3,
  name: string,
  assembledRot: THREE.Euler = new THREE.Euler(),
  explodedRot: THREE.Euler = new THREE.Euler()
) {
  obj.name = name;
  (obj as unknown as Record<string, unknown>)[META_KEY] = {
    componentId: id,
    assembledPos: assembledPos.clone(),
    assembledRot: assembledRot.clone(),
    explodedPos: explodedPos.clone(),
    explodedRot: explodedRot.clone(),
  } as MeshMeta;
  obj.position.copy(assembledPos);
  obj.rotation.copy(assembledRot);
}

/* ─── Build the Bluefors LDsl Cryostat ───────────────────── */
function buildCryostat(root: THREE.Group) {
  // ── 1. Structural Support Rods (6 stainless steel standoff trusses) ──
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
    const rx = Math.cos(angle) * 0.60;
    const rz = Math.sin(angle) * 0.60;
    const rod = makeCylinder(0.016, 0.016, 4.6, 12, MAT.brushedSteel);
    const aPos = new THREE.Vector3(rx, 0.60, rz);
    const ePos = new THREE.Vector3(rx * 1.8, 0.60, rz * 1.8);
    tag(rod, "room-temperature-flange", aPos, ePos, `SupportRod_${i}`);
    root.add(rod);

    [1.95, 1.25, 0.50, -0.15, -0.85].forEach((stageY, j) => {
      const collar = makeCylinder(0.028, 0.028, 0.045, 12, MAT.goldHardware);
      const caPos = new THREE.Vector3(rx, stageY, rz);
      const cePos = new THREE.Vector3(rx * 1.8, stageY + (2.0 - stageY) * 0.3, rz * 1.8);
      tag(collar, "room-temperature-flange", caPos, cePos, `RodCollar_${i}_${j}`);
      root.add(collar);
    });
  }

  // ── 2. Vacuum Enclosure & Radiation Shields ──
  const outerCan = makeCylinder(1.08, 1.08, 5.80, 64, MAT.vacCanCutaway, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(outerCan, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 0.55, 0), "OuterVacuumCan");
  root.add(outerCan);

  const topCanRing = makeCylinder(1.10, 1.10, 0.08, 48, MAT.vacCanBlueRing);
  tag(topCanRing, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 3.48, 0), new THREE.Vector3(0, 4.3, 0), "VacCanTopRing");
  root.add(topCanRing);

  const botCanRing = makeCylinder(1.10, 1.10, 0.08, 48, MAT.vacCanBlueRing);
  tag(botCanRing, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, -2.25, 0), new THREE.Vector3(0, -3.20, 0), "VacCanBotRing");
  root.add(botCanRing);

  const botCap = makeDisc(1.08, 0.06, MAT.vacCanBlueRing);
  tag(botCap, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, -2.28, 0), new THREE.Vector3(0, -3.24, 0), "VacCanBotCap");
  root.add(botCap);

  // Radiation shields
  const shield50kOut = makeCylinder(0.94, 0.94, 1.72, 48, MAT.shieldMetalExterior, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(shield50kOut, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 1.10, 0), new THREE.Vector3(0, 1.10, 0), "Shield50KExterior");
  root.add(shield50kOut);

  const shield50kIn = makeCylinder(0.936, 0.936, 1.72, 48, MAT.shieldGoldInterior, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(shield50kIn, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 1.10, 0), new THREE.Vector3(0, 1.10, 0), "Shield50KInterior");
  root.add(shield50kIn);

  const shield4kOut = makeCylinder(0.84, 0.84, 1.50, 48, MAT.shieldMetalExterior, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(shield4kOut, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 0.44, 0), new THREE.Vector3(0, 0.44, 0), "Shield4KExterior");
  root.add(shield4kOut);

  const shield4kIn = makeCylinder(0.836, 0.836, 1.50, 48, MAT.shieldGoldInterior, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(shield4kIn, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, 0.44, 0), new THREE.Vector3(0, 0.44, 0), "Shield4KInterior");
  root.add(shield4kIn);

  const muShield = makeCylinder(0.30, 0.30, 0.46, 32, MAT.muMetal, true, Math.PI * 1.0, Math.PI * 1.0);
  tag(muShield, "vacuum-enclosure-and-radiation-shields", new THREE.Vector3(0, -1.34, 0), new THREE.Vector3(0, -2.00, 0), "MuMetalShield");
  root.add(muShield);

  // ── 3. Room Temperature Flange (~300 K) ───────────────────
  // Based directly on Bluefors LDsl reference (ldsl-system.bluefors.com/room-temperature-flange)
  // Main thick anodized top plate with precision chamfers
  const rtFlange = makeDisc(1.12, 0.085, MAT.topFlangeBlack);
  tag(rtFlange, "room-temperature-flange", new THREE.Vector3(0, 2.65, 0), new THREE.Vector3(0, 3.55, 0), "RoomTempFlange");
  root.add(rtFlange);

  const rtFlangeRim = makeCylinder(1.14, 1.14, 0.06, 48, MAT.polishedSteel);
  tag(rtFlangeRim, "room-temperature-flange", new THREE.Vector3(0, 2.66, 0), new THREE.Vector3(0, 3.56, 0), "RoomTempFlangeRim");
  root.add(rtFlangeRim);

  // Recessed concentric indexing trench
  const rtTrench = makeCylinder(1.00, 1.00, 0.015, 48, MAT.stagePlateBlack);
  tag(rtTrench, "room-temperature-flange", new THREE.Vector3(0, 2.695, 0), new THREE.Vector3(0, 3.595, 0), "RoomTempTrench");
  root.add(rtTrench);

  // 24 perimeter heavy-duty stainless hex cap bolts
  for (let b = 0; b < 24; b++) {
    const bAng = (b / 24) * Math.PI * 2;
    const bx = Math.cos(bAng) * 1.06;
    const bz = Math.sin(bAng) * 1.06;
    const bolt = makeCylinder(0.013, 0.013, 0.024, 8, MAT.polishedSteel);
    tag(bolt, "room-temperature-flange", new THREE.Vector3(bx, 2.705, bz), new THREE.Vector3(bx, 3.605, bz), `FlangeBolt_${b}`);
    root.add(bolt);
  }

  // Laser-etched port alignment indices [1] to [6] around the flange
  for (let p = 0; p < 6; p++) {
    const pAng = (p / 6) * Math.PI * 2 + Math.PI / 6;
    const px = Math.cos(pAng) * 0.90;
    const pz = Math.sin(pAng) * 0.90;
    const badge = makeCylinder(0.032, 0.032, 0.006, 16, MAT.laserEngraved);
    tag(badge, "room-temperature-flange", new THREE.Vector3(px, 2.696, pz), new THREE.Vector3(px, 3.596, pz), `PortIndexBadge_${p + 1}`);
    root.add(badge);
  }

  // --- High-Density Primary RF Feedthrough Tower ---
  const towerPost = makeCylinder(0.048, 0.048, 0.25, 16, MAT.polishedSteel);
  tag(towerPost, "room-temperature-flange", new THREE.Vector3(-0.35, 2.82, -0.42), new THREE.Vector3(-0.70, 3.72, -0.84), "FeedthroughRiser");
  root.add(towerPost);

  const towerBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.54, 0.14), MAT.stagePlateBlack);
  (towerBody as unknown as Record<string, unknown>).__origMat = MAT.stagePlateBlack;
  tag(towerBody, "room-temperature-flange", new THREE.Vector3(-0.35, 3.22, -0.42), new THREE.Vector3(-0.70, 4.12, -0.84), "FeedthroughTower");
  root.add(towerBody);

  const towerFace = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.52, 0.012), MAT.polishedSteel);
  (towerFace as unknown as Record<string, unknown>).__origMat = MAT.polishedSteel;
  tag(towerFace, "room-temperature-flange", new THREE.Vector3(-0.35, 3.22, -0.35), new THREE.Vector3(-0.70, 4.12, -0.77), "FeedthroughFace");
  root.add(towerFace);

  // Dual-column matrix of 16 gold-plated SMA bulkhead connectors with center dielectric pins
  [-0.06, 0.06].forEach((colX, cIdx) => {
    [0.20, 0.14, 0.08, 0.02, -0.04, -0.10, -0.16, -0.22].forEach((rowY, rIdx) => {
      const smaBulkhead = makeCylinder(0.014, 0.014, 0.035, 10, MAT.smaGold);
      smaBulkhead.rotation.x = Math.PI / 2;
      const smaPos = new THREE.Vector3(-0.35 + colX, 3.22 + rowY, -0.34);
      const smaExploded = new THREE.Vector3(-0.70 + colX, 4.12 + rowY, -0.76);
      tag(smaBulkhead, "room-temperature-flange", smaPos, smaExploded, `SMABulkhead_${cIdx}_${rIdx}`);
      root.add(smaBulkhead);

      const smaPin = makeCylinder(0.003, 0.003, 0.040, 8, MAT.goldHardware);
      smaPin.rotation.x = Math.PI / 2;
      tag(smaPin, "room-temperature-flange", smaPos, smaExploded, `SMAPin_${cIdx}_${rIdx}`);
      root.add(smaPin);
    });
  });

  // Secondary RF Feedthrough circular port plate with 8 SMA connectors
  const secRfPort = makeCylinder(0.12, 0.12, 0.04, 24, MAT.polishedSteel);
  tag(secRfPort, "room-temperature-flange", new THREE.Vector3(0.32, 2.72, -0.45), new THREE.Vector3(0.64, 3.62, -0.90), "SecondaryRFPortPlate");
  root.add(secRfPort);

  for (let s = 0; s < 8; s++) {
    const sAng = (s / 8) * Math.PI * 2;
    const sx = Math.cos(sAng) * 0.075;
    const sz = Math.sin(sAng) * 0.075;
    const smaSec = makeCylinder(0.012, 0.012, 0.035, 10, MAT.smaGold);
    tag(smaSec, "room-temperature-flange", new THREE.Vector3(0.32 + sx, 2.74, -0.45 + sz), new THREE.Vector3(0.64 + sx, 3.64, -0.90 + sz), `SecSMA_${s}`);
    root.add(smaSec);
  }

  // --- DC Loom D-Sub 25-pin Feedthrough ---
  const dsubBlock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.09), MAT.stagePlateBlack);
  (dsubBlock as unknown as Record<string, unknown>).__origMat = MAT.stagePlateBlack;
  tag(dsubBlock, "room-temperature-flange", new THREE.Vector3(-0.62, 2.73, -0.15), new THREE.Vector3(-1.15, 3.63, -0.25), "DSubFeedthrough");
  root.add(dsubBlock);

  const dsubFace = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.01), MAT.polishedSteel);
  (dsubFace as unknown as Record<string, unknown>).__origMat = MAT.polishedSteel;
  tag(dsubFace, "room-temperature-flange", new THREE.Vector3(-0.62, 2.73, -0.10), new THREE.Vector3(-1.15, 3.63, -0.20), "DSubFace");
  root.add(dsubFace);

  // --- Thermometry Fischer Hermetic Connector Port ---
  const fischerPort = makeCylinder(0.065, 0.065, 0.06, 20, MAT.fischerBlue);
  tag(fischerPort, "room-temperature-flange", new THREE.Vector3(0.62, 2.73, -0.18), new THREE.Vector3(1.15, 3.63, -0.28), "FischerThermometryPort");
  root.add(fischerPort);

  // --- Central NW100 Pumping & Cryogenic Service Collar ---
  const pumpCollar = makeCylinder(0.22, 0.22, 0.24, 32, MAT.stagePlateBlack);
  tag(pumpCollar, "room-temperature-flange", new THREE.Vector3(-0.55, 2.82, 0.20), new THREE.Vector3(-1.10, 3.72, 0.40), "PumpCollar");
  root.add(pumpCollar);

  const pumpRim = makeCylinder(0.26, 0.26, 0.05, 32, MAT.polishedSteel);
  tag(pumpRim, "room-temperature-flange", new THREE.Vector3(-0.55, 2.94, 0.20), new THREE.Vector3(-1.10, 3.84, 0.40), "PumpCollarRim");
  root.add(pumpRim);

  // Quick-release vacuum ISO-K clamp ring & handwheel
  const isoClamp = makeCylinder(0.275, 0.275, 0.03, 32, MAT.goldHardware);
  tag(isoClamp, "room-temperature-flange", new THREE.Vector3(-0.55, 2.96, 0.20), new THREE.Vector3(-1.10, 3.86, 0.40), "PumpClampRing");
  root.add(isoClamp);

  // Penning / Pirani high-vacuum gauge sensor tube extending sideways
  const gaugeTube = makeCylinder(0.032, 0.032, 0.16, 16, MAT.polishedSteel);
  gaugeTube.rotation.z = Math.PI / 2;
  tag(gaugeTube, "room-temperature-flange", new THREE.Vector3(-0.72, 2.86, 0.20), new THREE.Vector3(-1.27, 3.76, 0.40), "VacuumGaugeTube");
  root.add(gaugeTube);

  const gaugeHead = makeCylinder(0.045, 0.045, 0.08, 16, MAT.topFlangeBlack);
  gaugeHead.rotation.z = Math.PI / 2;
  tag(gaugeHead, "room-temperature-flange", new THREE.Vector3(-0.83, 2.86, 0.20), new THREE.Vector3(-1.38, 3.76, 0.40), "VacuumGaugeSensor");
  root.add(gaugeHead);

  // 12 Outer perimeter SMA testing ports
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 0.68 + (i % 2 === 0 ? 0.08 : 0);
    const fx = Math.cos(angle) * r;
    const fz = Math.sin(angle) * r;
    const sma = makeCylinder(0.026, 0.026, 0.05, 10, MAT.smaGold);
    tag(sma, "room-temperature-flange", new THREE.Vector3(fx, 2.71, fz), new THREE.Vector3(fx, 3.61, fz), `SMA_Top_${i}`);
    root.add(sma);
  }

  // ── 4. Pulse Tube Cryocooler ──────────────────────────────
  const ptOffX = 0.65;
  const ptOffZ = 0.15;

  const ptMotor = makeCylinder(0.21, 0.21, 0.26, 32, MAT.pulseTubeWhite);
  tag(ptMotor, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 2.83, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 3.66, ptOffZ * 1.8), "PTMotorHead");
  root.add(ptMotor);

  const ptMotorCap = makeDisc(0.225, 0.035, MAT.polishedSteel);
  tag(ptMotorCap, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 2.97, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 3.80, ptOffZ * 1.8), "PTMotorCap");
  root.add(ptMotorCap);

  // High-pressure flexible corrugated helium lines curving outward
  const ptHoseSupplyCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ptOffX - 0.06, 3.00, ptOffZ),
    new THREE.Vector3(ptOffX - 0.12, 3.15, ptOffZ - 0.05),
    new THREE.Vector3(ptOffX - 0.22, 3.25, ptOffZ - 0.15),
    new THREE.Vector3(ptOffX - 0.35, 3.30, ptOffZ - 0.25),
  ]);
  const ptHoseSupply = makeTube(ptHoseSupplyCurve, 24, 0.018, MAT.vacuumHoseSteel);
  tag(ptHoseSupply, "pulse-tube-cryocooler", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 0.8, 0.2), "PTHoseSupply");
  root.add(ptHoseSupply);

  const ptHoseReturnCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(ptOffX + 0.06, 3.00, ptOffZ),
    new THREE.Vector3(ptOffX + 0.14, 3.16, ptOffZ - 0.04),
    new THREE.Vector3(ptOffX + 0.25, 3.26, ptOffZ - 0.12),
    new THREE.Vector3(ptOffX + 0.38, 3.32, ptOffZ - 0.22),
  ]);
  const ptHoseReturn = makeTube(ptHoseReturnCurve, 24, 0.018, MAT.vacuumHoseSteel);
  tag(ptHoseReturn, "pulse-tube-cryocooler", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 0.8, 0.2), "PTHoseReturn");
  root.add(ptHoseReturn);

  [-0.07, 0.0, 0.07].forEach((ox, idx) => {
    const ptFitting = makeCylinder(0.022, 0.022, 0.08, 10, MAT.brassHardware);
    tag(ptFitting, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX + ox, 3.00, ptOffZ + (idx === 1 ? 0.05 : -0.03)), new THREE.Vector3(ptOffX * 1.8 + ox, 3.83, ptOffZ * 1.8), `PTFitting_${idx}`);
    root.add(ptFitting);
  });

  const pt1st = makeCylinder(0.12, 0.12, 0.68, 24, MAT.pulseTubeRegen);
  tag(pt1st, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 2.31, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 2.95, ptOffZ * 1.8), "PT1stStage");
  root.add(pt1st);

  const pt1stFlange = makeDisc(0.16, 0.045, MAT.goldHardware);
  tag(pt1stFlange, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 1.97, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 2.60, ptOffZ * 1.8), "PT1stFlange");
  root.add(pt1stFlange);

  for (let b = 0; b < 2; b++) {
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ptOffX, 1.95 + b * 0.02, ptOffZ),
      new THREE.Vector3(ptOffX * 0.75, 1.92, ptOffZ * 0.8),
      new THREE.Vector3(0.50, 1.95 + b * 0.02, 0.08),
    ]);
    const braid = makeTube(bCurve, 20, 0.024, MAT.copperBraid);
    tag(braid, "pulse-tube-cryocooler", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.6, 0.3, 0.1), `PTBraid50K_${b}`);
    root.add(braid);
  }

  const pt2nd = makeCylinder(0.07, 0.07, 0.66, 20, MAT.copperOFHC);
  tag(pt2nd, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 1.59, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 2.10, ptOffZ * 1.8), "PT2ndStage");
  root.add(pt2nd);

  for (let r = 0; r < 8; r++) {
    const rib = makeCylinder(0.078, 0.078, 0.016, 16, MAT.polishedSteel);
    tag(rib, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 1.35 + r * 0.055, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 1.85 + r * 0.055, ptOffZ * 1.8), `PTRib_${r}`);
    root.add(rib);
  }

  const pt2ndFlange = makeDisc(0.13, 0.04, MAT.goldHardware);
  tag(pt2ndFlange, "pulse-tube-cryocooler", new THREE.Vector3(ptOffX, 1.27, ptOffZ), new THREE.Vector3(ptOffX * 1.8, 1.75, ptOffZ * 1.8), "PT2ndFlange");
  root.add(pt2ndFlange);

  for (let b = 0; b < 2; b++) {
    const bCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(ptOffX, 1.26 + b * 0.02, ptOffZ),
      new THREE.Vector3(ptOffX * 0.70, 1.22, ptOffZ * 0.7),
      new THREE.Vector3(0.44, 1.25 + b * 0.02, 0.06),
    ]);
    const braid = makeTube(bCurve, 20, 0.022, MAT.copperBraid);
    tag(braid, "pulse-tube-cryocooler", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.6, 0.3, 0.1), `PTBraid4K_${b}`);
    root.add(braid);
  }

  // ── 5. 50K Flange ─────────────────────────────────────────
  const stage50k = makeCylinder(0.92, 0.92, 0.048, 48, MAT.stagePlateBlack, false, Math.PI * 0.15, Math.PI * 1.70);
  tag(stage50k, "50k-flange", new THREE.Vector3(0, 1.95, 0), new THREE.Vector3(0, 2.75, 0), "Stage50K");
  root.add(stage50k);

  const stage50kRim = makeCylinder(0.935, 0.935, 0.024, 48, MAT.goldHardware, false, Math.PI * 0.15, Math.PI * 1.70);
  tag(stage50kRim, "50k-flange", new THREE.Vector3(0, 1.962, 0), new THREE.Vector3(0, 2.762, 0), "Stage50KRim");
  root.add(stage50kRim);

  [-0.25, 0.25].forEach((ox, idx) => {
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.08), MAT.copperOFHC);
    (block as unknown as Record<string, unknown>).__origMat = MAT.copperOFHC;
    tag(block, "50k-flange", new THREE.Vector3(ox, 1.97, -0.20), new THREE.Vector3(ox, 2.77, -0.20), `50kThermalBlock_${idx}`);
    root.add(block);
  });

  // ── 6. 4K Flange ──────────────────────────────────────────
  const stage4k = makeCylinder(0.82, 0.82, 0.048, 48, MAT.stagePlateBlack, false, Math.PI * 0.18, Math.PI * 1.64);
  tag(stage4k, "4k-flange", new THREE.Vector3(0, 1.25, 0), new THREE.Vector3(0, 1.92, 0), "Stage4K");
  root.add(stage4k);

  const stage4kRim = makeCylinder(0.835, 0.835, 0.024, 48, MAT.goldHardware, false, Math.PI * 0.18, Math.PI * 1.64);
  tag(stage4kRim, "4k-flange", new THREE.Vector3(0, 1.262, 0), new THREE.Vector3(0, 1.932, 0), "Stage4KRim");
  root.add(stage4kRim);

  // HEMT Low-Noise Amplifiers (Cryogenic 4K stage)
  [-0.30, 0.30].forEach((offset, idx) => {
    const hemtChassis = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.08), MAT.hemtAluminum);
    (hemtChassis as unknown as Record<string, unknown>).__origMat = MAT.hemtAluminum;
    tag(hemtChassis, "4k-flange", new THREE.Vector3(offset, 1.22, 0.32), new THREE.Vector3(offset * 2.2, 1.88, 0.72), `HEMTChassis_${idx}`);
    root.add(hemtChassis);

    const hemtLid = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.012, 0.078), MAT.hemtGold);
    (hemtLid as unknown as Record<string, unknown>).__origMat = MAT.hemtGold;
    tag(hemtLid, "4k-flange", new THREE.Vector3(offset, 1.252, 0.32), new THREE.Vector3(offset * 2.2, 1.912, 0.72), `HEMTLid_${idx}`);
    root.add(hemtLid);

    [-0.05, 0.05].forEach((smaX, k) => {
      const sma = makeCylinder(0.014, 0.014, 0.035, 10, MAT.smaGold);
      sma.rotation.x = Math.PI / 2;
      tag(sma, "4k-flange", new THREE.Vector3(offset + smaX, 1.22, 0.36), new THREE.Vector3(offset * 2.2 + smaX, 1.88, 0.76), `HEMTSMA_${idx}_${k}`);
      root.add(sma);
    });
  });

  // ── 7. Still Flange (0.6–0.9 K) ───────────────────────────
  const still = makeCylinder(0.70, 0.70, 0.045, 48, MAT.stagePlateBlack, false, Math.PI * 0.22, Math.PI * 1.56);
  tag(still, "still-flange", new THREE.Vector3(0, 0.50, 0), new THREE.Vector3(0, 0.95, 0), "StillStage");
  root.add(still);

  const stillRim = makeCylinder(0.715, 0.715, 0.022, 48, MAT.goldHardware, false, Math.PI * 0.22, Math.PI * 1.56);
  tag(stillRim, "still-flange", new THREE.Vector3(0, 0.512, 0), new THREE.Vector3(0, 0.962, 0), "StillRim");
  root.add(stillRim);

  const stillVessel = makeCylinder(0.20, 0.20, 0.18, 28, MAT.silverMirror);
  tag(stillVessel, "still-flange", new THREE.Vector3(0, 0.39, 0), new THREE.Vector3(0, 0.84, 0), "StillVessel");
  root.add(stillVessel);

  const stillHeater = makeCylinder(0.208, 0.208, 0.035, 28, MAT.goldHardware);
  tag(stillHeater, "still-flange", new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.80, 0), "StillHeaterCollar");
  root.add(stillHeater);

  for (let c = 0; c < 3; c++) {
    const cAng = (c / 3) * Math.PI * 0.8 + 0.3;
    const cx = Math.cos(cAng) * 0.32;
    const cz = Math.sin(cAng) * 0.32;
    const torus = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 8, 24), MAT.copperTubing);
    (torus as unknown as Record<string, unknown>).__origMat = MAT.copperTubing;
    tag(torus, "still-flange", new THREE.Vector3(cx, 0.65, cz), new THREE.Vector3(cx * 1.5, 1.10, cz * 1.5), `StillCapillaryLoop_${c}`);
    root.add(torus);
  }

  // ── 8. Cold Plate (100–120 mK) ────────────────────────────
  const coldPlate = makeCylinder(0.62, 0.62, 0.045, 48, MAT.stagePlateBlack, false, Math.PI * 0.20, Math.PI * 1.60);
  tag(coldPlate, "cold-plate", new THREE.Vector3(0, -0.15, 0), new THREE.Vector3(0, 0.08, 0), "ColdPlate");
  root.add(coldPlate);

  const coldPlateRim = makeCylinder(0.635, 0.635, 0.022, 48, MAT.goldHardware, false, Math.PI * 0.20, Math.PI * 1.60);
  tag(coldPlateRim, "cold-plate", new THREE.Vector3(0, -0.138, 0), new THREE.Vector3(0, 0.092, 0), "ColdPlateRim");
  root.add(coldPlateRim);

  const jtHelix = new HelixCurve(0.065, 0.045, 6, new THREE.Vector3(0.18, 0.02, 0.08));
  const jtCoil = makeTube(jtHelix, 120, 0.016, MAT.helicalSilver);
  tag(jtCoil, "cold-plate", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.3, 0.2, 0.1), "JouleThomsonCoil");
  root.add(jtCoil);

  [0, 1].forEach((i) => {
    const ang = i * Math.PI * 0.6 + 0.4;
    const hx = Math.cos(ang) * 0.24;
    const hz = Math.sin(ang) * 0.24;
    const hex = makeCylinder(0.055, 0.055, 0.14, 16, MAT.silverMirror);
    tag(hex, "cold-plate", new THREE.Vector3(hx, -0.22, hz), new THREE.Vector3(hx, 0.00, hz), `ColdPlateHEX_${i}`);
    root.add(hex);
  });

  // ── 9. Dilution Unit ──────────────────────────────────────
  const dilHelix = new HelixCurve(0.075, 0.040, 5, new THREE.Vector3(-0.02, 0.15, -0.12));
  const dilCoil = makeTube(dilHelix, 100, 0.014, MAT.polishedSteel);
  tag(dilCoil, "dilution-unit", new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.2, -0.2), "DilutionCondensingCoil");
  root.add(dilCoil);

  const stackBase = makeCylinder(0.16, 0.16, 0.04, 28, MAT.goldBright);
  tag(stackBase, "dilution-unit", new THREE.Vector3(0.15, -0.58, 0.05), new THREE.Vector3(0.30, -0.58, 0.10), "DilutionBaseFlange");
  root.add(stackBase);

  const stackBody = makeCylinder(0.11, 0.11, 0.48, 28, MAT.silverMirror);
  tag(stackBody, "dilution-unit", new THREE.Vector3(0.15, -0.34, 0.05), new THREE.Vector3(0.30, -0.34, 0.10), "DilutionStepStack");
  root.add(stackBody);

  for (let s = 0; s < 4; s++) {
    const stepRib = makeCylinder(0.125, 0.125, 0.022, 28, MAT.polishedSteel);
    tag(stepRib, "dilution-unit", new THREE.Vector3(0.15, -0.48 + s * 0.09, 0.05), new THREE.Vector3(0.30, -0.48 + s * 0.09, 0.10), `DilutionStepRib_${s}`);
    root.add(stepRib);
  }

  const pumpTube = makeCylinder(0.022, 0.022, 2.2, 16, MAT.polishedSteel);
  tag(pumpTube, "dilution-unit", new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 0.65, 0), "DilutionPumpingTube");
  root.add(pumpTube);

  // ── 10. Mixing Chamber Flange (<10 mK) ─────────────────────
  const mcPlate = makeCylinder(0.54, 0.54, 0.048, 48, MAT.stagePlateBlack, false, Math.PI * 0.15, Math.PI * 1.70);
  tag(mcPlate, "mixing-chamber-flange", new THREE.Vector3(0, -0.85, 0), new THREE.Vector3(0, -0.85, 0), "MXCPlate");
  root.add(mcPlate);

  const mcRim = makeCylinder(0.555, 0.555, 0.024, 48, MAT.goldHardware, false, Math.PI * 0.15, Math.PI * 1.70);
  tag(mcRim, "mixing-chamber-flange", new THREE.Vector3(0, -0.838, 0), new THREE.Vector3(0, -0.838, 0), "MXCRim");
  root.add(mcRim);

  const mcBody = makeCylinder(0.18, 0.18, 0.22, 28, MAT.goldBright);
  tag(mcBody, "mixing-chamber-flange", new THREE.Vector3(0, -0.98, 0), new THREE.Vector3(0, -0.98, 0), "MXCBody");
  root.add(mcBody);

  const circ = makeCylinder(0.048, 0.048, 0.038, 6, MAT.goldHardware);
  const circAPos = new THREE.Vector3(0.18, -0.88, 0.18);
  tag(circ, "mixing-chamber-flange", circAPos, circAPos.clone().multiplyScalar(2.0), "Circulator");
  root.add(circ);

  // ── 11. Experimental Space ─────────────────────────────────
  const expBreadboard = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.74, 0.018), MAT.goldBright);
  (expBreadboard as unknown as Record<string, unknown>).__origMat = MAT.goldBright;
  tag(expBreadboard, "experimental-space", new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(0, -1.95, 0), "ExpBreadboardPlate");
  root.add(expBreadboard);

  for (let col = -2; col <= 2; col++) {
    for (let row = -4; row <= 4; row++) {
      const hole = makeCylinder(0.009, 0.009, 0.022, 10, MAT.topFlangeBlack);
      hole.rotation.x = Math.PI / 2;
      const hPos = new THREE.Vector3(col * 0.08, -1.35 + row * 0.075, 0.002);
      tag(hole, "experimental-space", hPos, new THREE.Vector3(col * 0.08, -1.95 + row * 0.075, 0.002), `Hole_${col}_${row}`);
      root.add(hole);
    }
  }

  [-0.15, 0.15].forEach((cx, idx) => {
    const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.04), MAT.goldHardware);
    (clamp as unknown as Record<string, unknown>).__origMat = MAT.goldHardware;
    tag(clamp, "experimental-space", new THREE.Vector3(cx, -0.92, 0), new THREE.Vector3(cx, -1.52, 0), `BreadboardClamp_${idx}`);
    root.add(clamp);
  });

  const qpuBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.085, 0.16), MAT.qpuGold);
  (qpuBox as unknown as Record<string, unknown>).__origMat = MAT.qpuGold;
  tag(qpuBox, "experimental-space", new THREE.Vector3(0, -1.34, 0.09), new THREE.Vector3(0, -1.94, 0.18), "QPUCavity");
  root.add(qpuBox);

  const chipDie = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.008, 0.10), MAT.sapphire);
  (chipDie as unknown as Record<string, unknown>).__origMat = MAT.sapphire;
  tag(chipDie, "experimental-space", new THREE.Vector3(0, -1.30, 0.09), new THREE.Vector3(0, -1.90, 0.18), "QubitChipDie");
  root.add(chipDie);

  const busLine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.002, 0.006), MAT.goldCircuits);
  (busLine as unknown as Record<string, unknown>).__origMat = MAT.goldCircuits;
  tag(busLine, "experimental-space", new THREE.Vector3(0, -1.295, 0.09), new THREE.Vector3(0, -1.895, 0.18), "ResonatorBusLine");
  root.add(busLine);

  [-0.035, 0.035].forEach((qx, qi) => {
    [-0.025, 0.025].forEach((qz, qj) => {
      const qPad = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.002, 0.006), MAT.goldCircuits);
      (qPad as unknown as Record<string, unknown>).__origMat = MAT.goldCircuits;
      tag(qPad, "experimental-space", new THREE.Vector3(qx, -1.295, 0.09 + qz), new THREE.Vector3(qx, -1.895, 0.18 + qz), `QPad_${qi}_${qj}`);
      root.add(qPad);
    });
  });

  // ── 12. Microwave Coaxial Wiring Looms ──
  const numCables = 10;
  for (let c = 0; c < numCables; c++) {
    const baseAngle = (c / numCables) * Math.PI * 2;
    const isReadout = c % 4 === 0;
    const isOrange  = c % 3 === 0;
    const mat = isReadout ? MAT.coaxBlue : isOrange ? MAT.coaxOrange : MAT.coaxSilver;
    const compTag = "room-temperature-flange";

    const r1 = 0.52 + Math.sin(c * 1.3) * 0.06;
    const r2 = 0.46 + Math.cos(c * 1.3) * 0.05;
    const r3 = 0.38;
    const r4 = 0.28;
    const r5 = 0.18;

    const pts = [
      new THREE.Vector3(Math.cos(baseAngle) * r1, 2.62, Math.sin(baseAngle) * r1),
      new THREE.Vector3(Math.cos(baseAngle + 0.06) * (r1 + 0.09), 2.28, Math.sin(baseAngle + 0.06) * (r1 + 0.09)),
      new THREE.Vector3(Math.cos(baseAngle) * r2, 1.95, Math.sin(baseAngle) * r2),
      new THREE.Vector3(Math.cos(baseAngle - 0.06) * (r2 + 0.07), 1.58, Math.sin(baseAngle - 0.06) * (r2 + 0.07)),
      new THREE.Vector3(Math.cos(baseAngle) * r3, 1.25, Math.sin(baseAngle) * r3),
      new THREE.Vector3(Math.cos(baseAngle + 0.04) * (r3 + 0.05), 0.82, Math.sin(baseAngle + 0.04) * (r3 + 0.05)),
      new THREE.Vector3(Math.cos(baseAngle) * r4, 0.50, Math.sin(baseAngle) * r4),
      new THREE.Vector3(Math.cos(baseAngle) * r4, -0.15, Math.sin(baseAngle) * r4),
      new THREE.Vector3(Math.cos(baseAngle) * r5, -0.85, Math.sin(baseAngle) * r5),
      new THREE.Vector3(Math.cos(baseAngle) * 0.14, -1.28, Math.sin(baseAngle) * 0.14),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const cable = makeTube(curve, 64, 0.010, mat);
    const ePos = new THREE.Vector3(Math.cos(baseAngle) * 0.65, 0, Math.sin(baseAngle) * 0.65);
    tag(cable, compTag, new THREE.Vector3(0, 0, 0), ePos, `CoaxLoom_${c}`);
    root.add(cable);

    [1.95, 1.25, 0.50, -0.15, -0.85].forEach((plateY, pIdx) => {
      const ring = makeCylinder(0.018, 0.018, 0.015, 10, MAT.goldHardware);
      const ringPos = new THREE.Vector3(
        Math.cos(baseAngle) * (r1 - pIdx * 0.068),
        plateY,
        Math.sin(baseAngle) * (r1 - pIdx * 0.068)
      );
      tag(ring, compTag, ringPos, ringPos.clone().add(ePos), `CoaxBulkhead_${c}_${pIdx}`);
      root.add(ring);
    });
  }
}

/* ─── Explosion factor → staged per group ────────────────── */
function stageExplosion(factor: number): Record<string, number> {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const remap = (v: number, lo: number, hi: number) => clamp((v - lo) / (hi - lo), 0, 1);
  return {
    "vacuum-enclosure-and-radiation-shields": remap(factor, 0, 0.25),
    "outer-vacuum-can": remap(factor, 0, 0.25),
    "radiation-shields": remap(factor, 0.15, 0.45),
    "room-temperature-flange": remap(factor, 0.2, 0.5),
    "room-temp-flange": remap(factor, 0.2, 0.5),
    "pulse-tube-cryocooler": remap(factor, 0.2, 0.55),
    "pulse-tube": remap(factor, 0.2, 0.55),
    "50k-flange": remap(factor, 0.3, 0.6),
    "stage-50k": remap(factor, 0.3, 0.6),
    "4k-flange": remap(factor, 0.35, 0.65),
    "stage-4k": remap(factor, 0.35, 0.65),
    "still-flange": remap(factor, 0.4, 0.68),
    "still-stage": remap(factor, 0.4, 0.68),
    "cold-plate": remap(factor, 0.45, 0.72),
    "dilution-unit": remap(factor, 0.48, 0.76),
    "mixing-chamber-flange": remap(factor, 0.5, 0.78),
    "mixing-chamber": remap(factor, 0.5, 0.78),
    "experimental-space": remap(factor, 0.75, 1.0),
    "qpu-package": remap(factor, 0.75, 1.0),
  };
}

/* ─── 3D Splines for Signal Flow Tracing ─────────────────── */
function getDownlinkCurve(explodeFactor: number): THREE.CatmullRomCurve3 {
  const ef = stageExplosion(explodeFactor);
  const f300 = ef["room-temperature-flange"] ?? 0;
  const f50 = ef["50k-flange"] ?? 0;
  const f4 = ef["4k-flange"] ?? 0;
  const fstill = ef["still-flange"] ?? 0;
  const fcp = ef["cold-plate"] ?? 0;
  const fmxc = ef["mixing-chamber-flange"] ?? 0;
  const fexp = ef["experimental-space"] ?? 0;

  const pts = [
    new THREE.Vector3(-0.35, 2.65 + f300 * 0.75, -0.22),
    new THREE.Vector3(-0.38, 2.30 + f50 * 0.70, -0.24),
    new THREE.Vector3(-0.35, 1.95 + f50 * 0.70, -0.22),
    new THREE.Vector3(-0.35, 1.25 + f4 * 0.60, -0.22),
    new THREE.Vector3(-0.32, 0.50 + fstill * 0.40, -0.21),
    new THREE.Vector3(-0.28, -0.15 + fcp * 0.20, -0.20),
    new THREE.Vector3(-0.22, -0.85 + fmxc * 0.0, -0.16),
    new THREE.Vector3(-0.06, -1.30 + fexp * -0.5, 0.06),
    new THREE.Vector3(0.0, -1.34 + fexp * -0.5, 0.09),
  ];
  return new THREE.CatmullRomCurve3(pts);
}

function getUplinkCurve(explodeFactor: number): THREE.CatmullRomCurve3 {
  const ef = stageExplosion(explodeFactor);
  const f300 = ef["room-temperature-flange"] ?? 0;
  const f50 = ef["50k-flange"] ?? 0;
  const f4 = ef["4k-flange"] ?? 0;
  const fstill = ef["still-flange"] ?? 0;
  const fcp = ef["cold-plate"] ?? 0;
  const fmxc = ef["mixing-chamber-flange"] ?? 0;
  const fexp = ef["experimental-space"] ?? 0;

  const pts = [
    new THREE.Vector3(0.0, -1.34 + fexp * -0.5, 0.09),
    new THREE.Vector3(0.08, -1.30 + fexp * -0.5, 0.08),
    new THREE.Vector3(0.18, -0.88 + fmxc * 0.0, 0.18),
    new THREE.Vector3(0.24, -0.15 + fcp * 0.20, 0.20),
    new THREE.Vector3(0.28, 0.50 + fstill * 0.40, 0.24),
    new THREE.Vector3(0.30, 1.22 + f4 * 0.60, 0.32),
    new THREE.Vector3(0.32, 1.95 + f50 * 0.70, 0.24),
    new THREE.Vector3(0.35, 2.65 + f300 * 0.75, 0.22),
  ];
  return new THREE.CatmullRomCurve3(pts);
}

/* ─── Main Component ─────────────────────────────────────── */
export default function CryostatScene({
  selectedId,
  hiddenIds,
  explodeFactor,
  autoRotate,
  isolated,
  activeSignalStep,
  signalProgress,
  signalPovMode = "chase",
  onSelectComponent,
  onHover,
}: SceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rootRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number | null>(null);

  // Signal flow elements
  const dlPulseRef = useRef<THREE.Mesh | null>(null);
  const dlCoronaRef = useRef<THREE.Mesh | null>(null);
  const dlTrailsRef = useRef<THREE.Mesh[]>([]);
  const dlShockwavesRef = useRef<THREE.Mesh[]>([]);
  const dlLightRef = useRef<THREE.PointLight | null>(null);

  const ulPulseRef = useRef<THREE.Mesh | null>(null);
  const ulCoronaRef = useRef<THREE.Mesh | null>(null);
  const ulTrailsRef = useRef<THREE.Mesh[]>([]);
  const ulLightRef = useRef<THREE.PointLight | null>(null);

  const qpuRingRef = useRef<THREE.Mesh | null>(null);
  const qpuOuterRingRef = useRef<THREE.Mesh | null>(null);
  const qpuSparklesRef = useRef<THREE.Mesh[]>([]);
  const qpuLightRef = useRef<THREE.PointLight | null>(null);

  const activeSignalStepRef = useRef<SignalFlowStep | null>(null);
  const signalProgressRef = useRef<number>(0);
  const signalPovModeRef = useRef<SignalPovMode>("chase");
  const explodeFactorRef = useRef<number>(0);

  useEffect(() => {
    activeSignalStepRef.current = activeSignalStep;
  }, [activeSignalStep]);

  useEffect(() => {
    signalProgressRef.current = signalProgress;
  }, [signalProgress]);

  useEffect(() => {
    signalPovModeRef.current = signalPovMode;
  }, [signalPovMode]);

  useEffect(() => {
    explodeFactorRef.current = explodeFactor;
  }, [explodeFactor]);

  // Default starting position: front-right, slightly elevated, full height visible
  const HOME_POS = new THREE.Vector3(1.6, 0.55, 5.8);
  const HOME_LOOKAT = new THREE.Vector3(0, 0.30, 0);

  // Reference elevated view for Room Temperature Flange (ldsl-system.bluefors.com/room-temperature-flange)
  const RT_FLANGE_POS = new THREE.Vector3(1.1, 3.8, 2.0);
  const RT_FLANGE_LOOKAT = new THREE.Vector3(0, 2.75, 0);

  const camTargetPos = useRef(HOME_POS.clone());
  const camTargetLookAt = useRef(HOME_LOOKAT.clone());
  const camLerping = useRef(true);
  const prevSignalActiveRef = useRef(false);

  /* ── Mount / Three.js Lifecycle ─────────────────────────── */
  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const width = mountEl.clientWidth || window.innerWidth;
    const height = mountEl.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18191b);
    sceneRef.current = scene;

    // Camera (50 deg FOV for realistic perspective depth)
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.05, 50);
    camera.position.copy(HOME_POS);
    cameraRef.current = camera;

    // Renderer (High PBR quality with tone mapping & WebGL context safety)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
      } catch (err) {
        console.warn("WebGL not supported or context lost:", err);
        return;
      }
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    rendererRef.current = renderer;
    mountEl.appendChild(renderer.domElement);

    // Environment map for authentic specular metallic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-Point & High-Tech Accent Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffe8cc, 1.4);
    fillLight.position.set(-6, 2, -4);
    scene.add(fillLight);

    // High-tech electric cyan rim light (signature Bluefors LDsl styling)
    const rimLight1 = new THREE.DirectionalLight(0x00c2ff, 1.8);
    rimLight1.position.set(-4, -1, 5);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight2.position.set(1, -3, -3);
    scene.add(rimLight2);

    // Warm core point light at mixing chamber
    const coreLight = new THREE.PointLight(0xf59e0b, 2.2, 7.0);
    coreLight.position.set(0, -0.6, 0);
    scene.add(coreLight);

    // Overhead top accent for Room Temperature Flange
    const topLight = new THREE.PointLight(0xe0f2fe, 1.8, 6.0);
    topLight.position.set(0, 4.5, 0);
    scene.add(topLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 0.8;
    controls.maxDistance = 16;
    controls.maxPolarAngle = Math.PI * 0.90;
    controls.target.copy(HOME_LOOKAT);
    controlsRef.current = controls;

    // Build Cryostat Model
    const root = new THREE.Group();
    buildCryostat(root);
    scene.add(root);
    rootRef.current = root;

    // ── Signal Flow Mesh Group ──
    const signalGroup = new THREE.Group();
    scene.add(signalGroup);

    // --- Downlink: Glowing Neon Cyan Microwave Pulse ---
    const dlMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff });
    const dlPulse = new THREE.Mesh(new THREE.SphereGeometry(0.042, 24, 24), dlMat);
    dlPulse.visible = false;
    signalGroup.add(dlPulse);
    dlPulseRef.current = dlPulse;

    // Corona aura
    const dlCoronaMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const dlCorona = new THREE.Mesh(new THREE.SphereGeometry(0.072, 24, 24), dlCoronaMat);
    dlCorona.visible = false;
    signalGroup.add(dlCorona);
    dlCoronaRef.current = dlCorona;

    // 6-stage trailing plasma comet particles
    const dlTrails: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: Math.max(0.08, 0.65 - i * 0.10),
        blending: THREE.AdditiveBlending,
      });
      const trail = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.008, 0.034 - i * 0.005), 14, 14), trailMat);
      trail.visible = false;
      signalGroup.add(trail);
      dlTrails.push(trail);
    }
    dlTrailsRef.current = dlTrails;

    // Concentric EM shockwave rings
    const dlShockwaves: THREE.Mesh[] = [];
    for (let s = 0; s < 2; s++) {
      const waveMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.08, 24), waveMat);
      ring.visible = false;
      signalGroup.add(ring);
      dlShockwaves.push(ring);
    }
    dlShockwavesRef.current = dlShockwaves;

    // Real-time dynamic cyan point light that lights up the hardware as it travels
    const dlLight = new THREE.PointLight(0x00e5ff, 3.2, 1.8);
    dlLight.visible = false;
    signalGroup.add(dlLight);
    dlLightRef.current = dlLight;

    // --- Uplink: Amplified Warm Amber / Golden Readout Signal ---
    const ulMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const ulPulse = new THREE.Mesh(new THREE.SphereGeometry(0.032, 24, 24), ulMat);
    ulPulse.visible = false;
    signalGroup.add(ulPulse);
    ulPulseRef.current = ulPulse;

    const ulCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.50,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const ulCorona = new THREE.Mesh(new THREE.SphereGeometry(0.062, 24, 24), ulCoronaMat);
    ulCorona.visible = false;
    signalGroup.add(ulCorona);
    ulCoronaRef.current = ulCorona;

    const ulTrails: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: Math.max(0.08, 0.65 - i * 0.10),
        blending: THREE.AdditiveBlending,
      });
      const trail = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.007, 0.028 - i * 0.004), 14, 14), trailMat);
      trail.visible = false;
      signalGroup.add(trail);
      ulTrails.push(trail);
    }
    ulTrailsRef.current = ulTrails;

    const ulLight = new THREE.PointLight(0xf59e0b, 2.6, 1.6);
    ulLight.visible = false;
    signalGroup.add(ulLight);
    ulLightRef.current = ulLight;

    // --- QPU Quantum State Interaction Rings & Sparkle Bursts ---
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const qpuRing = new THREE.Mesh(new THREE.RingGeometry(0.025, 0.09, 32), ringMat);
    qpuRing.rotation.x = Math.PI / 2;
    qpuRing.position.set(0, -1.34, 0.09);
    qpuRing.visible = false;
    signalGroup.add(qpuRing);
    qpuRingRef.current = qpuRing;

    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const qpuOuterRing = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.15, 32), outerRingMat);
    qpuOuterRing.rotation.x = Math.PI / 2;
    qpuOuterRing.position.set(0, -1.34, 0.09);
    qpuOuterRing.visible = false;
    signalGroup.add(qpuOuterRing);
    qpuOuterRingRef.current = qpuOuterRing;

    // Sparkle excitation particles
    const sparkles: THREE.Mesh[] = [];
    for (let k = 0; k < 12; k++) {
      const spMat = new THREE.MeshBasicMaterial({ color: k % 2 === 0 ? 0x00f5ff : 0xa855f7 });
      const sp = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), spMat);
      sp.visible = false;
      signalGroup.add(sp);
      sparkles.push(sp);
    }
    qpuSparklesRef.current = sparkles;

    const qpuLight = new THREE.PointLight(0xa855f7, 3.6, 2.0);
    qpuLight.position.set(0, -1.30, 0.12);
    qpuLight.visible = false;
    signalGroup.add(qpuLight);
    qpuLightRef.current = qpuLight;

    // Window Resize
    const onResize = () => {
      if (!mountEl || !renderer || !camera) return;
      camera.aspect = mountEl.clientWidth / mountEl.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountEl.clientWidth, mountEl.clientHeight);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mountEl);

    // Raycasting for interactive hover and click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedMeta = (event: MouseEvent): { meta: MeshMeta; obj: THREE.Object3D } | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(root.children, true);
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== root) {
          const meta = (cur as unknown as Record<string, unknown>)[META_KEY] as MeshMeta | undefined;
          if (meta && cur.visible) return { meta, obj: cur };
          cur = cur.parent;
        }
      }
      return null;
    };

    const onPointerMove = (e: MouseEvent) => {
      const found = getIntersectedMeta(e);
      if (found) {
        renderer.domElement.style.cursor = "pointer";
        const canonicalId = COMPONENT_ALIASES[found.meta.componentId] ?? found.meta.componentId;
        const comp = HARDWARE_COMPONENTS.find((c) => c.id === canonicalId);
        onHover({
          x: e.clientX + 14,
          y: e.clientY - 10,
          name: comp ? comp.name : found.obj.name,
          temp: comp?.temperature,
        });
      } else {
        renderer.domElement.style.cursor = "default";
        onHover(null);
      }
    };

    const onPointerOut = () => {
      renderer.domElement.style.cursor = "default";
      onHover(null);
    };

    const onPointerClick = (e: MouseEvent) => {
      const found = getIntersectedMeta(e);
      if (found) {
        const canonicalId = COMPONENT_ALIASES[found.meta.componentId] ?? found.meta.componentId;
        onSelectComponent(canonicalId);
      }
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerout", onPointerOut);
    renderer.domElement.addEventListener("click", onPointerClick);

    // ── Animation Loop ──
    let frame = 0;
    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      frame++;

      if (controls && controls.autoRotate !== autoRotate) {
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 0.65;
      }

      const step = activeSignalStepRef.current;
      const isTraceActive = step !== null;
      const povMode = signalPovModeRef.current;

      // Handle signal start/stop transitions
      if (isTraceActive !== prevSignalActiveRef.current) {
        prevSignalActiveRef.current = isTraceActive;
        if (!isTraceActive) {
          // Restore home POV when signal trace stops
          camTargetPos.current.copy(HOME_POS);
          camTargetLookAt.current.copy(HOME_LOOKAT);
          camLerping.current = true;
        }
      }

      // Continuous explosion update
      const curExplode = explodeFactorRef.current;
      const stageDeltas = stageExplosion(curExplode);

      root.traverse((obj) => {
        const meta = (obj as unknown as Record<string, unknown>)[META_KEY] as MeshMeta | undefined;
        if (!meta) return;
        const groupFactor = stageDeltas[meta.componentId] ?? curExplode;
        obj.position.lerpVectors(meta.assembledPos, meta.explodedPos, groupFactor);
      });

      // ── High-Rendering Signal Tracing & Dynamic POV Processing ──
      const progress = signalProgressRef.current;
      const dlCurve = getDownlinkCurve(curExplode);
      const ulCurve = getUplinkCurve(curExplode);

      if (step) {
        let currentPulsePos = new THREE.Vector3(0, 0, 0);

        if (step.phase === "downlink") {
          const stepRanges: Record<string, [number, number]> = {
            "step-1-awg": [0.0, 0.25],
            "step-2-pre-cool": [0.25, 0.50],
            "step-3-attenuation": [0.50, 0.78],
            "step-4-qpu-arrival": [0.78, 1.0],
          };
          const [tStart, tEnd] = stepRanges[step.id] ?? [0, 1];
          const tGlobal = THREE.MathUtils.lerp(tStart, tEnd, progress);
          const p = dlCurve.getPointAt(Math.min(0.999, Math.max(0.001, tGlobal)));
          currentPulsePos.copy(p);

          // Pulse core & corona
          if (dlPulseRef.current) {
            dlPulseRef.current.visible = true;
            dlPulseRef.current.position.copy(p);
            const breathe = 1.0 + Math.sin(frame * 0.25) * 0.15;
            dlPulseRef.current.scale.setScalar(breathe);
          }
          if (dlCoronaRef.current) {
            dlCoronaRef.current.visible = true;
            dlCoronaRef.current.position.copy(p);
            const coronaScale = 1.1 + Math.sin(frame * 0.18) * 0.20;
            dlCoronaRef.current.scale.setScalar(coronaScale);
          }
          if (dlLightRef.current) {
            dlLightRef.current.visible = true;
            dlLightRef.current.position.copy(p);
          }

          // Trailing plasma comet wake
          dlTrailsRef.current.forEach((tr, idx) => {
            const lagT = Math.max(0.001, tGlobal - (idx + 1) * 0.016);
            tr.visible = true;
            tr.position.copy(dlCurve.getPointAt(lagT));
          });

          // Electromagnetic wave rings
          dlShockwavesRef.current.forEach((ring, idx) => {
            const ringPhase = ((frame + idx * 20) % 40) / 40;
            const ringT = Math.max(0.001, tGlobal - ringPhase * 0.05);
            ring.visible = true;
            ring.position.copy(dlCurve.getPointAt(ringT));
            const rScale = 0.8 + ringPhase * 2.2;
            ring.scale.set(rScale, rScale, rScale);
            (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - ringPhase * 0.7);
          });

          // Hide interaction & uplink elements
          if (ulPulseRef.current) ulPulseRef.current.visible = false;
          if (ulCoronaRef.current) ulCoronaRef.current.visible = false;
          if (ulLightRef.current) ulLightRef.current.visible = false;
          ulTrailsRef.current.forEach((tr) => (tr.visible = false));
          if (qpuRingRef.current) qpuRingRef.current.visible = false;
          if (qpuOuterRingRef.current) qpuOuterRingRef.current.visible = false;
          if (qpuLightRef.current) qpuLightRef.current.visible = false;
          qpuSparklesRef.current.forEach((sp) => (sp.visible = false));

          // 🎬 Cinematic Chase POV during Downlink
          if (povMode === "chase") {
            camTargetLookAt.current.lerp(p, 0.08);
            if (tGlobal < 0.22) {
              // High-angle entrance looking into Room Temp Flange
              camTargetPos.current.set(p.x + 1.8, p.y + 0.65, p.z + 2.2);
            } else if (tGlobal < 0.75) {
              // Mid-height gliding chase angle through 50K & 4K plates
              camTargetPos.current.set(p.x + 1.45, p.y + 0.35, p.z + 1.85);
            } else {
              // Smooth swoop down into close hero angle at QPU
              camTargetPos.current.set(p.x + 0.90, p.y + 0.18, p.z + 1.30);
            }
            camLerping.current = true;
          }

        } else if (step.phase === "interaction") {
          currentPulsePos.set(0, -1.34, 0.09);

          // Climax: Holographic quantum state transition at <10 mK QPU chip
          if (qpuRingRef.current) {
            qpuRingRef.current.visible = true;
            const s1 = 1.0 + Math.sin(frame * 0.16) * 0.35;
            qpuRingRef.current.scale.set(s1, s1, s1);
            qpuRingRef.current.rotation.z += 0.03;
          }
          if (qpuOuterRingRef.current) {
            qpuOuterRingRef.current.visible = true;
            const s2 = 1.0 + Math.cos(frame * 0.14) * 0.40;
            qpuOuterRingRef.current.scale.set(s2, s2, s2);
            qpuOuterRingRef.current.rotation.z -= 0.025;
          }
          if (qpuLightRef.current) {
            qpuLightRef.current.visible = true;
            qpuLightRef.current.intensity = 3.2 + Math.sin(frame * 0.2) * 1.0;
          }

          // Sparkling excitation particles
          qpuSparklesRef.current.forEach((sp, k) => {
            sp.visible = true;
            const angle = (k / 12) * Math.PI * 2 + frame * 0.04;
            const rad = 0.08 + Math.sin(frame * 0.15 + k) * 0.05;
            sp.position.set(Math.cos(angle) * rad, -1.34 + Math.sin(frame * 0.2 + k) * 0.02, 0.09 + Math.sin(angle) * rad);
          });

          if (dlPulseRef.current) dlPulseRef.current.visible = false;
          if (dlCoronaRef.current) dlCoronaRef.current.visible = false;
          if (dlLightRef.current) dlLightRef.current.visible = false;
          dlTrailsRef.current.forEach((tr) => (tr.visible = false));
          dlShockwavesRef.current.forEach((rw) => (rw.visible = false));
          if (ulPulseRef.current) ulPulseRef.current.visible = false;
          if (ulCoronaRef.current) ulCoronaRef.current.visible = false;
          if (ulLightRef.current) ulLightRef.current.visible = false;
          ulTrailsRef.current.forEach((tr) => (tr.visible = false));

          // 🎬 Intimate Macro Hero Angle facing the QPU chip
          if (povMode === "chase") {
            camTargetLookAt.current.set(0, -1.34, 0.09);
            camTargetPos.current.set(0.78, -1.26, 1.15);
            camLerping.current = true;
          }

        } else if (step.phase === "uplink") {
          const stepRanges: Record<string, [number, number]> = {
            "step-6-isolation": [0.0, 0.35],
            "step-7-hemt": [0.35, 0.70],
            "step-8-digitisation": [0.70, 1.0],
          };
          const [tStart, tEnd] = stepRanges[step.id] ?? [0, 1];
          const tGlobal = THREE.MathUtils.lerp(tStart, tEnd, progress);
          const p = ulCurve.getPointAt(Math.min(0.999, Math.max(0.001, tGlobal)));
          currentPulsePos.copy(p);

          // HEMT Amplification event (at 4K stage tGlobal > 0.45)
          const isAmplified = tGlobal >= 0.40;
          const ampFactor = isAmplified ? 1.6 : 0.85;

          if (ulPulseRef.current) {
            ulPulseRef.current.visible = true;
            ulPulseRef.current.position.copy(p);
            ulPulseRef.current.scale.setScalar(ampFactor);
          }
          if (ulCoronaRef.current) {
            ulCoronaRef.current.visible = true;
            ulCoronaRef.current.position.copy(p);
            ulCoronaRef.current.scale.setScalar(ampFactor * (1.1 + Math.sin(frame * 0.2) * 0.25));
          }
          if (ulLightRef.current) {
            ulLightRef.current.visible = true;
            ulLightRef.current.position.copy(p);
            ulLightRef.current.intensity = isAmplified ? 3.8 : 1.4;
          }

          ulTrailsRef.current.forEach((tr, idx) => {
            const lagT = Math.max(0.001, tGlobal - (idx + 1) * 0.016);
            tr.visible = true;
            tr.position.copy(ulCurve.getPointAt(lagT));
            tr.scale.setScalar(ampFactor * 0.9);
          });

          if (dlPulseRef.current) dlPulseRef.current.visible = false;
          if (dlCoronaRef.current) dlCoronaRef.current.visible = false;
          if (dlLightRef.current) dlLightRef.current.visible = false;
          dlTrailsRef.current.forEach((tr) => (tr.visible = false));
          dlShockwavesRef.current.forEach((rw) => (rw.visible = false));
          if (qpuRingRef.current) qpuRingRef.current.visible = false;
          if (qpuOuterRingRef.current) qpuOuterRingRef.current.visible = false;
          if (qpuLightRef.current) qpuLightRef.current.visible = false;
          qpuSparklesRef.current.forEach((sp) => (sp.visible = false));

          // 🎬 Ascending Chase POV tracking the golden amplified readout beam
          if (povMode === "chase") {
            camTargetLookAt.current.lerp(p, 0.075);
            camTargetPos.current.set(p.x + 1.35, p.y + 0.38, p.z + 1.75);
            camLerping.current = true;
          }
        }

        // Alternative POV modes
        if (povMode === "hero") {
          camTargetLookAt.current.set(0, 0.50, 0);
          camTargetPos.current.set(2.8, -0.2, 4.4);
          camLerping.current = true;
        } else if (povMode === "macro") {
          const comp = HARDWARE_COMPONENTS.find((c) => c.id === step.componentId);
          if (comp) {
            const [tx, ty, tz] = comp.cameraTarget.position;
            const d = comp.cameraTarget.distance;
            camTargetLookAt.current.set(tx, ty, tz);
            camTargetPos.current.set(tx + d * 0.55, ty + d * 0.28, tz + d * 0.82);
            camLerping.current = true;
          }
        }
      } else {
        // No active signal trace: hide all signal visuals
        if (dlPulseRef.current) dlPulseRef.current.visible = false;
        if (dlCoronaRef.current) dlCoronaRef.current.visible = false;
        if (dlLightRef.current) dlLightRef.current.visible = false;
        dlTrailsRef.current.forEach((tr) => (tr.visible = false));
        dlShockwavesRef.current.forEach((rw) => (rw.visible = false));
        if (ulPulseRef.current) ulPulseRef.current.visible = false;
        if (ulCoronaRef.current) ulCoronaRef.current.visible = false;
        if (ulLightRef.current) ulLightRef.current.visible = false;
        ulTrailsRef.current.forEach((tr) => (tr.visible = false));
        if (qpuRingRef.current) qpuRingRef.current.visible = false;
        if (qpuOuterRingRef.current) qpuOuterRingRef.current.visible = false;
        if (qpuLightRef.current) qpuLightRef.current.visible = false;
        qpuSparklesRef.current.forEach((sp) => (sp.visible = false));
      }

      controls.update();

      // Smooth camera interpolation
      if (camLerping.current && povMode !== "free") {
        camera.position.lerp(camTargetPos.current, 0.055);
        controls.target.lerp(camTargetLookAt.current, 0.055);
        if (
          camera.position.distanceTo(camTargetPos.current) < 0.012 &&
          controls.target.distanceTo(camTargetLookAt.current) < 0.012
        ) {
          camLerping.current = false;
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerout", onPointerOut);
      renderer.domElement.removeEventListener("click", onPointerClick);
      renderer.dispose();
      renderer.forceContextLoss();
      if (mountEl.contains(renderer.domElement)) {
        mountEl.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Update: Selected Component Blue Highlight (Bluefors style) ── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const canonicalSelected = selectedId
      ? COMPONENT_ALIASES[selectedId] ?? selectedId
      : null;

    root.traverse((obj) => {
      const meta = (obj as unknown as Record<string, unknown>)[META_KEY] as MeshMeta | undefined;
      const origMat = (obj as unknown as Record<string, unknown>).__origMat as THREE.Material | undefined;
      if (!meta) return;

      const canonicalMetaId = COMPONENT_ALIASES[meta.componentId] ?? meta.componentId;
      const isSelected = canonicalSelected !== null && canonicalMetaId === canonicalSelected;
      const mesh = obj as THREE.Mesh;

      if (isSelected) {
        if (canonicalMetaId === "vacuum-enclosure-and-radiation-shields") {
          if (mesh.name === "OuterVacuumCan") {
            mesh.material = MAT.blueforsSelectedTranslucent;
          } else if (origMat) {
            mesh.material = origMat;
          }
        } else {
          mesh.material = MAT.blueforsSelected;
        }
      } else if (origMat) {
        mesh.material = origMat;
      }
    });
  }, [selectedId]);

  /* ── Update: visibility + isolation ──────────────────────── */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const canonicalSelected = selectedId
      ? COMPONENT_ALIASES[selectedId] ?? selectedId
      : null;

    root.traverse((obj) => {
      const meta = (obj as unknown as Record<string, unknown>)[META_KEY] as MeshMeta | undefined;
      if (!meta) return;

      const canonicalMetaId = COMPONENT_ALIASES[meta.componentId] ?? meta.componentId;
      const isHidden = hiddenIds.has(canonicalMetaId);
      const isIsolated = isolated && canonicalSelected !== null && canonicalMetaId !== canonicalSelected;

      obj.visible = !isHidden && !isIsolated;
    });
  }, [hiddenIds, isolated, selectedId]);

  /* ── Camera Focus on Selection ───────────────────────────── */
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    // Deselect → return home
    if (!selectedId) {
      camTargetLookAt.current.copy(HOME_LOOKAT);
      camTargetPos.current.copy(HOME_POS);
      camLerping.current = true;
      return;
    }

    const canonical = COMPONENT_ALIASES[selectedId] ?? selectedId;

    // Direct match for https://ldsl-system.bluefors.com/room-temperature-flange
    if (canonical === "room-temperature-flange") {
      camTargetLookAt.current.copy(RT_FLANGE_LOOKAT);
      camTargetPos.current.copy(RT_FLANGE_POS);
      camLerping.current = true;
      return;
    }

    // Vacuum can selection → show full outer shell from home angle
    if (canonical === "vacuum-enclosure-and-radiation-shields") {
      camTargetLookAt.current.set(0, 0.55, 0);
      camTargetPos.current.set(2.2, 1.0, 5.5);
      camLerping.current = true;
      return;
    }

    const comp = HARDWARE_COMPONENTS.find((c) => c.id === canonical);
    if (!comp) return;

    const [tx, ty, tz] = comp.cameraTarget.position;
    const d = comp.cameraTarget.distance;

    // Position camera with front-right angle to view cutaway interior
    camTargetLookAt.current.set(tx, ty, tz);
    camTargetPos.current.set(tx + d * 0.55, ty + d * 0.28, tz + d * 0.82);
    camLerping.current = true;
  }, [selectedId]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none"
    />
  );
}
