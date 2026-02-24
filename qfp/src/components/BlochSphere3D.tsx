import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export interface BlochSphere3DHandle {
    capture: () => string | null; // returns dataURL PNG
}

interface BlochSphere3DProps {
    state: { x: number; y: number; z: number };
    health: number;
    history: { x: number; y: number; z: number }[];
    className?: string;
}

const SPHERE_R = 2;

// Soft pastel axis palette — easy on the eyes, still distinct
const AXIS_COLORS = {
    z: { hex: 0x7dd3fc, css: '#7dd3fc' }, // sky-300 — soft light blue for Z (|0⟩/|1⟩)
    x: { hex: 0xfda4af, css: '#fda4af' }, // rose-300 — soft pink for X
    y: { hex: 0x86efac, css: '#86efac' }, // green-300 — soft mint for Y
};

function makeLabel(text: string, cssColor: string): HTMLDivElement {
    const div = document.createElement('div');
    div.style.cssText = [
        'font-family: Orbitron, monospace',
        'font-size: 11px',
        'font-weight: 700',
        `color: ${cssColor}`,
        `text-shadow: 0 0 8px ${cssColor}88`,
        'pointer-events: none',
        'user-select: none',
        'white-space: nowrap',
        'opacity: 0.85',
    ].join(';');
    div.textContent = text;
    return div;
}

const BlochSphere3D = forwardRef<BlochSphere3DHandle, BlochSphere3DProps>(
    ({ state, health, history, className = '' }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
        const labelRendererRef = useRef<CSS2DRenderer | null>(null);
        const sceneRef = useRef<THREE.Scene | null>(null);
        const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
        const controlsRef = useRef<OrbitControls | null>(null);
        const rafIdRef = useRef<number | null>(null);
        const arrowRef = useRef<THREE.ArrowHelper | null>(null);
        const trailRef = useRef<THREE.Line | null>(null);
        const sphereMatRef = useRef<THREE.MeshPhongMaterial | null>(null);
        const glowLightRef = useRef<THREE.PointLight | null>(null);
        const lastInteractionTime = useRef(Date.now());
        const healthRef = useRef(health);

        // Sync health ref for the persistent animation loop
        useEffect(() => {
            healthRef.current = health;
        }, [health]);

        // Expose canvas capture to parent
        useImperativeHandle(ref, () => ({
            capture: () => {
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
                // Force a render then grab the pixels
                rendererRef.current.render(sceneRef.current, cameraRef.current);
                return rendererRef.current.domElement.toDataURL('image/png');
            },
        }));

        useEffect(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            const width = container.clientWidth || 400;
            const height = container.clientHeight || 400;

            const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
            camera.position.set(3.5, 2.5, 5);
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            container.appendChild(renderer.domElement);
            rendererRef.current = renderer;

            const labelRenderer = new CSS2DRenderer();
            labelRenderer.setSize(width, height);
            labelRenderer.domElement.style.position = 'absolute';
            labelRenderer.domElement.style.top = '0';
            labelRenderer.domElement.style.pointerEvents = 'none';
            container.appendChild(labelRenderer.domElement);
            labelRendererRef.current = labelRenderer;

            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.06;
            controls.minDistance = 3;
            controls.maxDistance = 12;
            controls.addEventListener('start', () => { lastInteractionTime.current = Date.now(); });
            controls.addEventListener('change', () => { lastInteractionTime.current = Date.now(); });
            controlsRef.current = controls;

            // ── Lighting ────────────────────────────────────────────────────────
            scene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const key = new THREE.DirectionalLight(0x7dd3fc, 1.2);
            key.position.set(5, 8, 5);
            scene.add(key);
            const fill = new THREE.DirectionalLight(0x6366f1, 0.6);
            fill.position.set(-5, -3, -5);
            scene.add(fill);

            const glowLight = new THREE.PointLight(0x22d3ee, 2.5, 4);
            scene.add(glowLight);
            glowLightRef.current = glowLight;

            // ── Sphere shells ───────────────────────────────────────────────────
            const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 64, 64);
            const solidMat = new THREE.MeshPhongMaterial({
                color: 0x0d1b3e,
                transparent: true,
                opacity: 0.18,
                side: THREE.FrontSide,
                shininess: 60,
                specular: new THREE.Color(0x7dd3fc),
                depthWrite: false,  // axes visible through sphere shell
            });
            sphereMatRef.current = solidMat;
            scene.add(new THREE.Mesh(sphereGeo, solidMat));
            const wireMat = new THREE.MeshBasicMaterial({
                color: 0x6366f1, transparent: true, opacity: 0.12, wireframe: true, depthWrite: false,
            });
            scene.add(new THREE.Mesh(sphereGeo, wireMat));

            // ── Equator + meridian rings ────────────────────────────────────────
            const ringColor = 0x7dd3fc;
            const ringMat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
            [[Math.PI / 2, 0, 0], [0, 0, 0], [0, Math.PI / 2, 0]].forEach(([rx, ry, rz]) => {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(SPHERE_R, 0.007, 16, 128), ringMat);
                ring.rotation.set(rx, ry, rz);
                scene.add(ring);
            });

            // ── Axes ────────────────────────────────────────────────────────────
            const axDefs = [
                { dir: new THREE.Vector3(0, 1, 0), col: AXIS_COLORS.z, posL: '|0⟩', negL: '|1⟩' },
                { dir: new THREE.Vector3(1, 0, 0), col: AXIS_COLORS.x, posL: '+X', negL: '−X' },
                { dir: new THREE.Vector3(0, 0, 1), col: AXIS_COLORS.y, posL: '+Y', negL: '−Y' },
            ];
            const L = SPHERE_R * 1.22;
            axDefs.forEach(({ dir, col, posL, negL }) => {
                // Cylinder
                const cyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.010, 0.010, L * 2, 8),
                    new THREE.MeshBasicMaterial({ color: col.hex, transparent: true, opacity: 0.45 })
                );
                if (dir.x) cyl.rotation.z = Math.PI / 2;
                if (dir.z) cyl.rotation.x = Math.PI / 2;
                scene.add(cyl);

                // Tip cone
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(0.055, 0.18, 12),
                    new THREE.MeshBasicMaterial({ color: col.hex, transparent: true, opacity: 0.7 })
                );
                cone.position.copy(dir.clone().multiplyScalar(L));
                if (dir.x) cone.rotation.z = -Math.PI / 2;
                if (dir.z) cone.rotation.x = Math.PI / 2;
                scene.add(cone);

                // CSS2D labels
                const addLabel = (pos: THREE.Vector3, text: string) => {
                    const obj = new CSS2DObject(makeLabel(text, col.css));
                    obj.position.copy(pos);
                    scene.add(obj);
                };
                addLabel(dir.clone().multiplyScalar(L + 0.38), posL);
                addLabel(dir.clone().multiplyScalar(-(L + 0.38)), negL);
            });

            // ── Bloch vector ArrowHelper ────────────────────────────────────────
            const arrow = new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 0),
                SPHERE_R, 0x22d3ee, 0.32, 0.14
            );
            scene.add(arrow);
            arrowRef.current = arrow;

            // ── Trail ───────────────────────────────────────────────────────────
            const trail = new THREE.Line(
                new THREE.BufferGeometry(),
                new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 })
            );
            scene.add(trail);
            trailRef.current = trail;

            // ── Subtle floor grid ───────────────────────────────────────────────
            const grid = new THREE.GridHelper(4, 8, 0x6366f1, 0x6366f1);
            (grid.material as THREE.Material).transparent = true;
            (grid.material as THREE.Material).opacity = 0.07;
            scene.add(grid);

            // ─── Decoherence Storm Particles ──────────────────────────────────────
            const particleCount = 2000;
            const particleGeo = new THREE.BufferGeometry();
            const posArray = new Float32Array(particleCount * 3);
            const velArray = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                // Randomly distributed around sphere surface
                const r = SPHERE_R * (1 + Math.random() * 0.5);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                posArray[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                posArray[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                posArray[i * 3 + 2] = r * Math.cos(phi);

                velArray[i * 3] = (Math.random() - 0.5) * 0.01;
                velArray[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
                velArray[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
            }

            particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const particleMat = new THREE.PointsMaterial({
                color: 0x22d3ee,
                size: 0.015,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            });
            const particles = new THREE.Points(particleGeo, particleMat);
            scene.add(particles);

            // ── Animation loop ──────────────────────────────────────────────────
            const animate = () => {
                rafIdRef.current = requestAnimationFrame(animate);
                controls.update();

                const h01 = (healthRef.current ?? 100) / 100;
                const noiseLevel = 1 - h01;

                // Animate particles based on noise
                particleMat.opacity = noiseLevel * 0.4;
                const positions = particleGeo.attributes.position.array as Float32Array;

                for (let i = 0; i < particleCount; i++) {
                    const idx = i * 3;
                    // Swirl effect increases with noise
                    const swirl = noiseLevel * 0.02;
                    const x = positions[idx];
                    const z = positions[idx + 2];

                    positions[idx] += -z * swirl + velArray[idx];
                    positions[idx + 2] += x * swirl + velArray[idx + 2];
                    positions[idx + 1] += velArray[idx + 1] * (1 + noiseLevel * 5);

                    // Keep particles in range
                    const dist = Math.sqrt(positions[idx] ** 2 + positions[idx + 1] ** 2 + positions[idx + 2] ** 2);
                    if (dist > SPHERE_R * 2.5 || dist < SPHERE_R * 0.8) {
                        const theta = Math.random() * Math.PI * 2;
                        const phi = Math.acos(2 * Math.random() - 1);
                        const r = SPHERE_R * (0.9 + Math.random() * 0.4);
                        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
                        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
                        positions[idx + 2] = r * Math.cos(phi);
                    }
                }
                particleGeo.attributes.position.needsUpdate = true;

                if (Date.now() - lastInteractionTime.current > 3000) {
                    scene.rotation.y += 0.004;
                }
                if (glowLightRef.current) {
                    glowLightRef.current.intensity = 2 + Math.sin(Date.now() * 0.004) * 1;
                }
                renderer.render(scene, camera);
                labelRenderer.render(scene, camera);
            };
            animate();

            const onResize = () => {
                const w = container.clientWidth;
                const h = container.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
                labelRenderer.setSize(w, h);
            };
            window.addEventListener('resize', onResize);

            return () => {
                if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
                window.removeEventListener('resize', onResize);
                container.innerHTML = '';
                renderer.dispose();
            };
        }, []);

        // ── Update on state/health/history change ───────────────────────────────
        useEffect(() => {
            const arrow = arrowRef.current;
            const trail = trailRef.current;
            if (!arrow || !trail) return;

            const bx = state.x, by = state.z, bz = state.y;
            const len = Math.sqrt(bx * bx + by * by + bz * bz);
            const visualLen = Math.max(0.05, len) * SPHERE_R;
            const dir = len > 0.001 ? new THREE.Vector3(bx, by, bz).normalize() : new THREE.Vector3(0, 1, 0);

            arrow.setDirection(dir);
            arrow.setLength(visualLen, Math.min(0.32, visualLen * 0.22), 0.14);

            const h01 = health / 100;
            const arrowColor = new THREE.Color().setHSL(h01 * 0.33, 0.9, 0.58);
            (arrow.line.material as THREE.LineBasicMaterial).color.copy(arrowColor);
            (arrow.cone.material as THREE.MeshBasicMaterial).color.copy(arrowColor);

            if (glowLightRef.current) {
                glowLightRef.current.position.copy(dir.clone().multiplyScalar(visualLen));
                glowLightRef.current.color.copy(arrowColor);
            }
            if (sphereMatRef.current) {
                sphereMatRef.current.opacity = 0.08 + h01 * 0.18;
            }

            if (history.length > 1) {
                const pts = history.map(p => new THREE.Vector3(p.x, p.z, p.y).multiplyScalar(SPHERE_R));
                const positions = new Float32Array(pts.length * 3);
                const colors = new Float32Array(pts.length * 3);
                pts.forEach((p, i) => {
                    positions[i * 3] = p.x; positions[i * 3 + 1] = p.y; positions[i * 3 + 2] = p.z;
                    const alpha = i / pts.length;
                    const c = new THREE.Color(0x22d3ee).lerp(new THREE.Color(0x6366f1), 1 - alpha);
                    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
                });
                trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                trail.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
                trail.geometry.attributes.position.needsUpdate = true;
                trail.geometry.attributes.color.needsUpdate = true;
                trail.visible = true;
                (trail.material as THREE.LineBasicMaterial).opacity = 0.25 + h01 * 0.55;
            } else {
                trail.visible = false;
            }
        }, [state, health, history]);

        const handleDoubleClick = () => {
            if (cameraRef.current && controlsRef.current && sceneRef.current) {
                cameraRef.current.position.set(3.5, 2.5, 5);
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
                sceneRef.current.rotation.set(0, 0, 0);
            }
        };

        return (
            <div
                className={`relative w-full h-full ${className}`}
                ref={containerRef}
                onDoubleClick={handleDoubleClick}
                title="Double-click to reset camera"
            />
        );
    }
);

BlochSphere3D.displayName = 'BlochSphere3D';
export default BlochSphere3D;
