import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// @ts-ignore
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';

export interface BlochSphere3DHandle {
    capture: () => string | null;
}

interface BlochSphere3DProps {
    state?: { x: number; y: number; z: number };
    vector?: { x: number; y: number; z: number };
    health?: number;
    history?: { x: number; y: number; z: number }[];
    noiseParams?: {
        depolarizing?: number;
        phaseFlip?: number;
        bitFlip?: number;
        amplitudeDamping?: number;
        speed?: number;
    };
    isAnimating?: boolean;
    className?: string;
}

const SPHERE_R = 2;

function makeLabel(text: string, isDark: boolean): HTMLDivElement {
    const div = document.createElement('div');
    const color = isDark ? '#e2e8f0' : '#1e293b';
    div.style.cssText = [
        'font-family: Inter, system-ui, -apple-system, sans-serif',
        'font-size: 11px',
        'font-weight: 600',
        `color: ${color}`,
        'pointer-events: none',
        'user-select: none',
        'white-space: nowrap',
        'opacity: 0.9',
    ].join(';');
    div.textContent = text;
    return div;
}

const BlochSphere3D = forwardRef<BlochSphere3DHandle, BlochSphere3DProps>(
    ({ state, vector, health = 100, history = [], className = '' }, ref) => {
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
        const lastInteractionTime = useRef(Date.now());
        const healthRef = useRef(health);

        useEffect(() => {
            healthRef.current = health;
        }, [health]);

        useImperativeHandle(ref, () => ({
            capture: () => {
                if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
                rendererRef.current.render(sceneRef.current, cameraRef.current);
                return rendererRef.current.domElement.toDataURL('image/png');
            },
        }));

        useEffect(() => {
            if (!containerRef.current) return;
            const container = containerRef.current;
            const scene = new THREE.Scene();
            sceneRef.current = scene;

            const isDark = document.documentElement.classList.contains('dark');

            const width = container.clientWidth || 360;
            const height = container.clientHeight || 360;

            const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
            camera.position.set(3.4, 2.2, 4.6);
            cameraRef.current = camera;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.0;
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
            controls.dampingFactor = 0.05;
            controls.minDistance = 3;
            controls.maxDistance = 10;
            controls.addEventListener('start', () => { lastInteractionTime.current = Date.now(); });
            controls.addEventListener('change', () => { lastInteractionTime.current = Date.now(); });
            controlsRef.current = controls;

            // ── Clean Scientific Lighting ───────────────────────────────────────
            const ambient = new THREE.AmbientLight(0xffffff, isDark ? 0.8 : 0.95);
            scene.add(ambient);
            const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 0.6 : 0.8);
            keyLight.position.set(4, 6, 4);
            scene.add(keyLight);

            // ── Restrained Sphere Shell ─────────────────────────────────────────
            const sphereGeo = new THREE.SphereGeometry(SPHERE_R, 48, 48);
            const solidMat = new THREE.MeshPhongMaterial({
                color: isDark ? 0x1e293b : 0xf1f5f9,
                transparent: true,
                opacity: isDark ? 0.22 : 0.16,
                side: THREE.FrontSide,
                shininess: 30,
                specular: isDark ? new THREE.Color(0x334155) : new THREE.Color(0xffffff),
                depthWrite: false,
            });
            sphereMatRef.current = solidMat;
            scene.add(new THREE.Mesh(sphereGeo, solidMat));

            // Subtle sphere wireframe grid
            const wireMat = new THREE.MeshBasicMaterial({
                color: isDark ? 0x334155 : 0xcbd5e1,
                transparent: true,
                opacity: isDark ? 0.25 : 0.22,
                wireframe: true,
                depthWrite: false,
            });
            scene.add(new THREE.Mesh(sphereGeo, wireMat));

            // ── Equator + Meridian Rings ────────────────────────────────────────
            const ringColor = isDark ? 0x64748b : 0x94a3b8;
            const ringMat = new THREE.MeshBasicMaterial({
                color: ringColor,
                transparent: true,
                opacity: isDark ? 0.45 : 0.40,
                side: THREE.DoubleSide
            });
            [[Math.PI / 2, 0, 0], [0, 0, 0], [0, Math.PI / 2, 0]].forEach(([rx, ry, rz]) => {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(SPHERE_R, 0.006, 12, 96), ringMat);
                ring.rotation.set(rx, ry, rz);
                scene.add(ring);
            });

            // ── Precise Axes ────────────────────────────────────────────────────
            const axisHex = isDark ? 0x475569 : 0x94a3b8;
            const axDefs = [
                { dir: new THREE.Vector3(0, 1, 0), posL: '|0⟩', negL: '|1⟩' },
                { dir: new THREE.Vector3(1, 0, 0), posL: '+X', negL: '−X' },
                { dir: new THREE.Vector3(0, 0, 1), posL: '+Y', negL: '−Y' },
            ];
            const L = SPHERE_R * 1.2;
            axDefs.forEach(({ dir, posL, negL }) => {
                const cyl = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.008, 0.008, L * 2, 8),
                    new THREE.MeshBasicMaterial({ color: axisHex, transparent: true, opacity: 0.5 })
                );
                if (dir.x) cyl.rotation.z = Math.PI / 2;
                if (dir.z) cyl.rotation.x = Math.PI / 2;
                scene.add(cyl);

                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(0.045, 0.14, 10),
                    new THREE.MeshBasicMaterial({ color: axisHex, transparent: true, opacity: 0.7 })
                );
                cone.position.copy(dir.clone().multiplyScalar(L));
                if (dir.x) cone.rotation.z = -Math.PI / 2;
                if (dir.z) cone.rotation.x = Math.PI / 2;
                scene.add(cone);

                const addLabel = (pos: THREE.Vector3, text: string) => {
                    const obj = new CSS2DObject(makeLabel(text, isDark));
                    obj.position.copy(pos);
                    scene.add(obj);
                };
                addLabel(dir.clone().multiplyScalar(L + 0.32), posL);
                addLabel(dir.clone().multiplyScalar(-(L + 0.32)), negL);
            });

            // ── Restrained State Vector (Cobalt Primary) ─────────────────────────
            const vectorColor = isDark ? 0x60a5fa : 0x2563eb;
            const arrow = new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 0),
                SPHERE_R,
                vectorColor,
                0.28,
                0.12
            );
            scene.add(arrow);
            arrowRef.current = arrow;

            // ── Clean History Trail ─────────────────────────────────────────────
            const trail = new THREE.Line(
                new THREE.BufferGeometry(),
                new THREE.LineBasicMaterial({
                    color: isDark ? 0x93c5fd : 0x3b82f6,
                    transparent: true,
                    opacity: 0.6,
                    linewidth: 1.5
                })
            );
            scene.add(trail);
            trailRef.current = trail;

            // ── Animation Loop ──────────────────────────────────────────────────
            const animate = () => {
                rafIdRef.current = requestAnimationFrame(animate);
                controls.update();

                // Gentle slow idle drift only when untouched for 3s
                if (Date.now() - lastInteractionTime.current > 3000) {
                    scene.rotation.y += 0.002;
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

        // ── Update State Vector and Trajectory on Prop Change ───────────────────
        useEffect(() => {
            const arrow = arrowRef.current;
            const trail = trailRef.current;
            if (!arrow || !trail) return;

            const isDark = document.documentElement.classList.contains('dark');
            const activeVector = state || vector || { x: 0, y: 0, z: 1 };
            const bx = activeVector.x ?? 0;
            const by = activeVector.z ?? 1;
            const bz = activeVector.y ?? 0;
            const len = Math.sqrt(bx * bx + by * by + bz * bz);

            // Physical mixed state length contraction under decoherence
            const isExplicitState = Boolean(state || vector);
            const safeHealth = typeof health === 'number' && !isNaN(health) ? health : 100;
            const hFactor = safeHealth / 100;
            const contraction = isExplicitState ? Math.min(1.0, len) : Math.min(1.0, len) * hFactor;
            const visualLen = Math.max(0.08, contraction) * SPHERE_R;
            const dir = len > 0.001 ? new THREE.Vector3(bx, by, bz).normalize() : new THREE.Vector3(0, 1, 0);

            arrow.setDirection(dir);
            arrow.setLength(visualLen, Math.min(0.28, visualLen * 0.22), 0.12);

            const vectorColor = isDark ? new THREE.Color(0x60a5fa) : new THREE.Color(0x2563eb);
            (arrow.line.material as THREE.LineBasicMaterial).color.copy(vectorColor);
            (arrow.cone.material as THREE.MeshBasicMaterial).color.copy(vectorColor);

            if (Array.isArray(history) && history.length > 1) {
                const validPoints = history.filter(p => p && typeof p.x === 'number' && !isNaN(p.x));
                if (validPoints.length > 1) {
                    const pts = validPoints.map(p => new THREE.Vector3(p.x, p.z ?? 0, p.y ?? 0).multiplyScalar(SPHERE_R));
                    const positions = new Float32Array(pts.length * 3);
                    pts.forEach((p, i) => {
                        positions[i * 3] = p.x;
                        positions[i * 3 + 1] = p.y;
                        positions[i * 3 + 2] = p.z;
                    });
                    trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                    trail.geometry.attributes.position.needsUpdate = true;
                    trail.visible = true;
                } else {
                    trail.visible = false;
                }
            } else {
                trail.visible = false;
            }
        }, [state, vector, health, history]);

        const handleDoubleClick = () => {
            if (cameraRef.current && controlsRef.current && sceneRef.current) {
                cameraRef.current.position.set(3.4, 2.2, 4.6);
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
                title="Double-click to reset view"
            />
        );
    }
);

BlochSphere3D.displayName = 'BlochSphere3D';
export default BlochSphere3D;
