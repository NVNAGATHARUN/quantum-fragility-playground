import React, { useRef, useEffect } from 'react';

// --- Stern-Gerlach Visuals ---
export const SternGerlachCanvas = ({ step }: { step: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: { x: number; y: number; vx: number; vy: number; life: number; color: string }[] = [];
        let angle = 0;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Magnets
            ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
            ctx.lineWidth = 2;
            ctx.fillStyle = 'rgba(7, 7, 26, 0.8)';

            const magnetYOffset = step === 1 ? Math.sin(Date.now() / 1000) * 10 : 0;
            const rotation = step === 1 ? (Math.PI / 4) * Math.sin(Date.now() / 2000) : 0;

            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotation);

            // North
            ctx.beginPath();
            ctx.moveTo(-40, -60); ctx.lineTo(40, -60); ctx.lineTo(10, -30); ctx.lineTo(-10, -30); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#4f46e5';
            ctx.font = 'bold 10px Inter';
            ctx.fillText('N', -4, -45);

            // South
            ctx.fillStyle = 'rgba(7, 7, 26, 0.8)';
            ctx.beginPath();
            ctx.moveTo(-40, 60); ctx.lineTo(40, 60); ctx.lineTo(10, 30); ctx.lineTo(-10, 30); ctx.closePath();
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#ec4899';
            ctx.fillText('S', -4, 50);
            ctx.restore();

            // Particles
            if (Math.random() > 0.8) {
                particles.push({
                    x: 0,
                    y: canvas.height / 2,
                    vx: 3,
                    vy: 0,
                    life: 1,
                    color: '#22d3ee'
                });
            }

            particles.forEach((p, i) => {
                p.x += p.vx;

                // Split logic
                if (p.x > canvas.width / 2 - 20 && p.x < canvas.width / 2 + 20) {
                    if (step === 0 || step === 3) {
                        p.vy = i % 2 === 0 ? -1.5 : 1.5;
                    } else if (step === 2) { // Noise
                        p.vy = (Math.random() - 0.5) * 4;
                        p.color = '#ef4444';
                    }
                }
                p.y += p.vy;
                p.life -= 0.005;

                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });

            particles = particles.filter(p => p.life > 0 && p.x < canvas.width);
            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [step]);

    return <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />;
};

// --- Bell State Visuals ---
export const BellStateCanvas = ({ step }: { step: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.02;

            const noise = step === 2 ? Math.sin(time * 5) * 20 : 0;
            const opacity = step === 2 ? 0.2 : 1;
            const bridgeColor = step === 1 ? `hsl(${(time * 50) % 360}, 70%, 60%)` : '#22d3ee';

            // Qubits
            ctx.shadowBlur = 20;
            ctx.shadowColor = bridgeColor;
            ctx.fillStyle = bridgeColor;

            // Left Qubit
            ctx.beginPath();
            ctx.arc(150, 100 + noise, 12, 0, Math.PI * 2);
            ctx.fill();

            // Right Qubit
            ctx.beginPath();
            ctx.arc(450, 100 - noise, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Entanglement Field/Bridge
            if (step !== 2) {
                ctx.beginPath();
                ctx.strokeStyle = bridgeColor;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 10]);
                ctx.lineDashOffset = -time * 20;
                ctx.moveTo(165, 100);

                for (let x = 165; x < 435; x += 5) {
                    const y = 100 + Math.sin(x * 0.05 + time) * 10;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                // Decoherence "broken" links
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    ctx.moveTo(165 + Math.random() * 270, 100 + (Math.random() - 0.5) * 100);
                    ctx.lineTo(165 + Math.random() * 270, 100 + (Math.random() - 0.5) * 100);
                    ctx.stroke();
                }
            }

            // Step 4: Correlations
            if (step === 3) {
                ctx.fillStyle = '#22d3ee';
                ctx.font = '10px Share Tech Mono';
                ctx.fillText('MATCH: 100%', 270, 150);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [step]);

    return <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />;
};

// --- Cavity QED Visuals ---
export const CavityQEDCanvas = ({ step }: { step: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.05;

            // Draw Mirrors
            const mirrorDist = step === 1 ? 70 + Math.sin(time * 0.5) * 30 : 100;
            ctx.fillStyle = 'rgba(255,255,255, 0.1)';
            ctx.fillRect(300 - mirrorDist - 5, 50, 5, 100);
            ctx.fillRect(300 + mirrorDist, 50, 5, 100);

            // Draw Atom
            const atomA = Math.sin(time) * 0.5 + 0.5;
            const atomGrad = ctx.createRadialGradient(300, 100, 0, 300, 100, 20);
            atomGrad.addColorStop(0, `rgba(79, 70, 229, ${atomA})`);
            atomGrad.addColorStop(1, 'rgba(79, 70, 229, 0)');
            ctx.fillStyle = atomGrad;
            ctx.beginPath();
            ctx.arc(300, 100, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#4f46e5';
            ctx.stroke();

            // Photon
            const photonX = 300 + Math.cos(time * 2) * mirrorDist;
            ctx.fillStyle = '#eab308';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#eab308';

            if (step === 2) {
                // Leakage
                if (Math.cos(time * 2) > 0.9) {
                    const leakX = photonX + (time % 1) * 200;
                    ctx.beginPath();
                    ctx.arc(leakX, 100, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else {
                ctx.beginPath();
                ctx.arc(photonX, 100, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;

            // Waveform for step 4
            if (step === 3) {
                ctx.beginPath();
                ctx.strokeStyle = '#22d3ee';
                ctx.moveTo(0, 180);
                for (let i = 0; i < 600; i++) {
                    const y = 180 + Math.sin(i * 0.05 - time * 2) * 20 * Math.exp(-i / 400);
                    ctx.lineTo(i, y);
                }
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, [step]);

    return <canvas ref={canvasRef} width={600} height={200} className="w-full h-full" />;
};
