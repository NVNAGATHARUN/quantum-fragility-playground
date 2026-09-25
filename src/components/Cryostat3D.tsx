import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface Cryostat3DHandle {
  pulseSignal: (gate: string) => void;
  focusStage: (stageIndex: number) => void;
}

interface Cryostat3DProps {
  activeStage: number;
  onSelectStage: (stageIndex: number) => void;
  isPulsing: boolean;
  pulseProgress: number; // 0 to 1
  pulseGate: string;
}

export const CRYOSTAT_STAGES = [
  {
    name: '300 K — Room Temperature Flange',
    temp: '300 K',
    color: '#ef4444', // Red
    desc: 'Vacuum chamber top plate housing microwave Arbitrary Waveform Generators (AWGs), DC bias sources, and room-temperature low-noise amplifiers.',
    thermalPhotons: '1.2 × 10³ photons/mode',
    attenuation: '0 dB',
    height: 3.5,
  },
  {
    name: '50 K — Thermal Radiation Shield',
    temp: '50 K',
    color: '#f59e0b', // Amber
    desc: 'First stage of the pulse tube cryocooler intercepting thermal blackbody radiation from the outer vacuum can.',
    thermalPhotons: '190 photons/mode',
    attenuation: '-3 dB',
    height: 2.2,
  },
  {
    name: '4 K — Pulse Tube Cold Stage',
    temp: '4.2 K',
    color: '#10b981', // Emerald
    desc: 'Liquid helium equivalent stage. Coaxial cables transition to superconducting NbTi. 20 dB cryogenic attenuator thermalizes incoming microwave noise.',
    thermalPhotons: '14.2 photons/mode',
    attenuation: '-20 dB',
    height: 0.8,
  },
  {
    name: '100 mK — Still Evaporation Stage',
    temp: '100 mK',
    color: '#06b6d4', // Cyan
    desc: 'Distillation chamber for the ³He/⁴He mixture. Further 10 dB attenuator removes residual thermal noise below single-photon energy.',
    thermalPhotons: '0.008 photons/mode',
    attenuation: '-30 dB',
    height: -0.6,
  },
  {
    name: '15 mK — Mixing Chamber & QPU Core',
    temp: '15 mK (0.015 K)',
    color: '#6366f1', // Indigo / Purple
    desc: 'Colder than deep interstellar space (2.7 K). Quantum processor chip housed inside magnetic and infrared shields. Thermal photons suppressed to zero.',
    thermalPhotons: '< 10⁻¹⁰ photons/mode',
    attenuation: '-60 dB Total',
    height: -2.0,
  },
];

const Cryostat3D = forwardRef<Cryostat3DHandle, Cryostat3DProps>(
  ({ activeStage, onSelectStage, isPulsing, pulseProgress, pulseGate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const pulseMeshRef = useRef<THREE.Mesh | null>(null);
    const stagePlatesRef = useRef<THREE.Mesh[]>([]);

    useImperativeHandle(ref, () => ({
      pulseSignal: (gate: string) => {},
      focusStage: (stageIndex: number) => {
        if (cameraRef.current && controlsRef.current) {
          const targetY = CRYOSTAT_STAGES[stageIndex].height;
          controlsRef.current.target.set(0, targetY, 0);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // 1. Scene & Camera
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.set(7, 2, 7);
      cameraRef.current = camera;

      // 2. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 3. Orbit Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 3;
      controls.maxDistance = 14;
      controls.target.set(0, 0.8, 0);
      controlsRef.current = controls;

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0x60a5fa, 2.5);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      const goldLight = new THREE.PointLight(0xf59e0b, 2.0, 15);
      goldLight.position.set(-4, -1, -4);
      scene.add(goldLight);

      const cryoGlow = new THREE.PointLight(0x22d3ee, 3.0, 10);
      cryoGlow.position.set(0, -2.2, 0);
      scene.add(cryoGlow);

      // 5. Build Cryostat Geometry
      const plates: THREE.Mesh[] = [];

      // Gold-plated copper material
      const goldPlateMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.9,
        roughness: 0.2,
      });

      // Supporting Structural Rods (Stainless Steel & Titanium)
      const rodGeo = new THREE.CylinderGeometry(0.04, 0.04, 6.0, 16);
      const rodMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.8,
        roughness: 0.3,
      });

      const rodPositions = [
        [1.2, 0.8, 0],
        [-1.2, 0.8, 0],
        [0, 0.8, 1.2],
        [0, 0.8, -1.2],
      ];

      rodPositions.forEach(([rx, ry, rz]) => {
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.position.set(rx, ry, rz);
        scene.add(rod);
      });

      // Microwave Coaxial Cable Guide (Twisted Spiral along the side)
      const curvePoints: THREE.Vector3[] = [];
      for (let t = 0; t <= 1; t += 0.02) {
        const y = 3.5 - t * 5.7;
        const angle = t * Math.PI * 4;
        const r = 0.85 + Math.sin(t * Math.PI) * 0.1;
        curvePoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }
      const cableCurve = new THREE.CatmullRomCurve3(curvePoints);
      const cableGeo = new THREE.TubeGeometry(cableCurve, 80, 0.035, 12, false);
      const cableMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.2,
      });
      const cableMesh = new THREE.Mesh(cableGeo, cableMat);
      scene.add(cableMesh);

      // Create the 5 Thermal Plates
      CRYOSTAT_STAGES.forEach((stage, idx) => {
        const radius = 1.6 - idx * 0.18;
        const plateGeo = new THREE.CylinderGeometry(radius, radius, 0.12, 32);
        const plate = new THREE.Mesh(plateGeo, goldPlateMat.clone());
        plate.position.set(0, stage.height, 0);
        plate.userData = { stageIndex: idx };
        scene.add(plate);
        plates.push(plate);

        // Ring LED glowing accent under each plate
        const ringGeo = new THREE.TorusGeometry(radius * 0.98, 0.02, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color: stage.color });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, stage.height - 0.06, 0);
        scene.add(ring);
      });
      stagePlatesRef.current = plates;

      // Transmon QPU Sample Canister at the Mixing Chamber (15 mK)
      const canGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 32);
      const canMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.95,
        roughness: 0.1,
      });
      const sampleCan = new THREE.Mesh(canGeo, canMat);
      sampleCan.position.set(0, -2.45, 0);
      scene.add(sampleCan);

      // Silicon Quantum Chip inside
      const chipGeo = new THREE.BoxGeometry(0.35, 0.02, 0.35);
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.8,
      });
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(0, -2.02, 0);
      scene.add(chip);

      // Microwave Signal Pulse Particle (travels along the cable)
      const pulseGeo = new THREE.SphereGeometry(0.12, 24, 24);
      const pulseMat = new THREE.MeshStandardMaterial({
        color: 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 2.5,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.visible = false;
      scene.add(pulseMesh);
      pulseMeshRef.current = pulseMesh;

      // Pulse Glow Light
      const pulseLight = new THREE.PointLight(0x22d3ee, 3.0, 3);
      pulseMesh.add(pulseLight);

      // Raycaster for stage plate clicks
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handlePointerDown = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(plates);
        if (intersects.length > 0) {
          const hitIndex = intersects[0].object.userData.stageIndex;
          if (hitIndex !== undefined) {
            onSelectStage(hitIndex);
          }
        }
      };

      renderer.domElement.addEventListener('pointerdown', handlePointerDown);

      // 6. Animation Loop
      let animId: number;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();

        // Slowly rotate scene when idle
        scene.rotation.y += 0.0015;

        // Animate pulse along cable if pulsing
        if (pulseMeshRef.current && cableCurve) {
          if (isPulsing) {
            pulseMeshRef.current.visible = true;
            const pt = cableCurve.getPoint(Math.max(0, Math.min(1, pulseProgress)));
            pulseMeshRef.current.position.copy(pt);
          } else {
            pulseMeshRef.current.visible = false;
          }
        }

        renderer.render(scene, camera);
      };
      animate();

      // Handle Resize
      const handleResize = () => {
        if (!containerRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        renderer.dispose();
      };
    }, []);

    // Update highlights on stage selection
    useEffect(() => {
      stagePlatesRef.current.forEach((plate, idx) => {
        const mat = plate.material as THREE.MeshStandardMaterial;
        if (idx === activeStage) {
          mat.emissive = new THREE.Color(CRYOSTAT_STAGES[idx].color);
          mat.emissiveIntensity = 0.45;
        } else {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      });
    }, [activeStage]);

    return (
      <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a0f1d] to-[#040711] border border-brand-border">
        <div ref={containerRef} className="w-full h-full" />
        <div className="absolute top-16 left-16 z-10 flex flex-col gap-4 pointer-events-none">
          <div className="text-[10px] font-orbitron font-bold uppercase tracking-wider text-text-muted">
            3D Cryogenic Dilution Refrigerator
          </div>
          <div className="text-xs font-mono text-brand-primary">
            Thermal Gradient: 300 K → 0.015 K (15 mK)
          </div>
        </div>
      </div>
    );
  }
);

export default Cryostat3D;
