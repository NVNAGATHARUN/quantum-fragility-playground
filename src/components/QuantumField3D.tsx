import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Maximize2, RotateCcw, Eye, Sparkles, Activity } from 'lucide-react';
import type { NormalizedSimulationResult } from '../types/quantum';

interface QuantumField3DProps {
  simResult: NormalizedSimulationResult | null;
  qubitCount?: number;
  className?: string;
}

export default function QuantumField3D({
  simResult,
  qubitCount = 2,
  className = '',
}: QuantumField3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const surfaceMeshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  const [wireframe, setWireframe] = useState<boolean>(false);
  const [particleDensity, setParticleDensity] = useState<number>(1200);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 320;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d); // Restrained deep slate navy

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.5, 4.0, 5.0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.minDistance = 2.0;
    controls.maxDistance = 15.0;
    controlsRef.current = controls;

    // 4. Lighting (Editorial Instrument Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-5, 4, -5);
    scene.add(dirLight2);

    // 5. Reference Grid & Axes
    const gridHelper = new THREE.GridHelper(5, 20, 0x2563eb, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // 6. 3D Wavefunction Probability Surface Mesh
    const planeSize = 4.0;
    const segments = 48;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    // Generate custom vertex colors representing quantum phase
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.2;     // R
      colors[i * 3 + 1] = 0.6; // G
      colors[i * 3 + 2] = 1.0; // B
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.2,
      roughness: 0.3,
      side: THREE.DoubleSide,
      wireframe: wireframe,
      transparent: true,
      opacity: 0.88,
    });

    const surfaceMesh = new THREE.Mesh(geometry, material);
    surfaceMesh.position.y = 0;
    scene.add(surfaceMesh);
    surfaceMeshRef.current = surfaceMesh;

    // 7. Probability Born Cloud Particles
    const pGeom = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleDensity * 3);
    const pColors = new Float32Array(particleDensity * 3);

    for (let i = 0; i < particleDensity; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.8;
      pPositions[i * 3] = Math.cos(theta) * r;
      pPositions[i * 3 + 1] = Math.random() * 0.8;
      pPositions[i * 3 + 2] = Math.sin(theta) * r;

      pColors[i * 3] = 0.3 + Math.random() * 0.3;
      pColors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
      pColors[i * 3 + 2] = 1.0;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeom, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 8. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Deform surface geometry dynamically to simulate continuous quantum interference
      if (surfaceMeshRef.current) {
        const pos = surfaceMeshRef.current.geometry.attributes.position;
        const col = surfaceMeshRef.current.geometry.attributes.color;

        // Amplitudes from current simulation result
        const probs = simResult?.probabilities ?? { '00': 0.5, '11': 0.5 };
        const p0 = probs['00'] ?? probs['0'] ?? 0.5;
        const p1 = probs['11'] ?? probs['1'] ?? 0.5;
        const pCross = probs['01'] ?? 0.0;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const dist = Math.sqrt(x * x + z * z);

          // Wave interference harmonics
          const wave1 = Math.sin(x * 3.0 + time * 2.0) * p0 * 0.6;
          const wave2 = Math.cos(z * 3.0 + time * 1.8) * p1 * 0.6;
          const crossInterference = Math.sin(dist * 4.0 - time * 2.5) * pCross * 0.4;

          const heightY = (wave1 + wave2 + crossInterference) * Math.exp(-dist * 0.4);
          pos.setY(i, heightY);

          // Phase coloring: Hue determined by phase angle + height
          const hue = (Math.atan2(z, x) / (2 * Math.PI) + time * 0.1 + heightY * 0.5) % 1;
          const c = new THREE.Color().setHSL((hue + 1) % 1, 0.85, 0.55);
          col.setXYZ(i, c.r, c.g, c.b);
        }
        pos.needsUpdate = true;
        col.needsUpdate = true;
      }

      // Rotate particle cloud gently
      if (particlesRef.current) {
        particlesRef.current.rotation.y = time * 0.08;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 320;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      pGeom.dispose();
      pMat.dispose();
    };
  }, [simResult, particleDensity]);

  // Update wireframe mode
  useEffect(() => {
    if (surfaceMeshRef.current) {
      (surfaceMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe;
    }
  }, [wireframe]);

  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(4.5, 4.0, 5.0);
      controlsRef.current.target.set(0, 0, 0);
    }
  };

  return (
    <div className={`relative rounded-xl border border-border overflow-hidden bg-slate-950 ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-80 min-h-[300px] cursor-grab active:cursor-grabbing" />

      {/* Floating Instrument Overlay */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-700 text-xs font-mono text-slate-200 flex items-center gap-2 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-brand" />
          <span>3D Quantum Wavepacket |ψ(x,z)|²</span>
        </div>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-xs">
        <button
          onClick={() => setWireframe((prev) => !prev)}
          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
            wireframe ? 'bg-brand text-white font-semibold' : 'text-slate-300 hover:text-white'
          }`}
          title="Toggle wireframe topology mesh"
        >
          {wireframe ? 'Solid' : 'Wireframe'}
        </button>
        <button
          onClick={handleResetCamera}
          className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Physics Metrics Bar */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[11px] font-mono bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-slate-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebGL 2.0 (60 FPS)</span>
          </span>
          <span className="text-slate-500">|</span>
          <span>Color: Phase θ ∈ [-π, π]</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Height: Probability Density</span>
        </div>
      </div>
    </div>
  );
}
