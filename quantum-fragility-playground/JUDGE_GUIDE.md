# Judge Guide: Quantum Fragility Playground

This document provides a technical walkthrough of the **Quantum Fragility Playground** project for the HackXAmrita 2.0 Hackathon.

## ⚛ Project Vision
Real-world quantum computers are hindered by **decoherence** — the process where quantum information is lost due to interaction with the environment (noise). This project is an interactive virtual laboratory designed to help students visualize and experiment with these complex physical phenomena.

---

## 🛠 Tech Stack

### Frontend
- **React 18 & TypeScript:** Core UI framework for a type-safe, responsive experience.
- **Three.js:** Handles the **3D Bloch Sphere** visualization, allowing users to see the state vector collapse in 3D space.
- **Tailwind CSS & Framer Motion:** Used for the "Glassmorphism" sci-fi aesthetic and smooth interactive transitions.
- **React Router v6:** Manages the multi-lab navigation system.
- **Recharts:** Powers the real-time decoherence and fidelity graphs.

### Backend
- **Node.js & Express:** Lightweight server handling simulation requests and AI orchestration.
- **TypeScript:** Ensuring type consistency between frontend and backend.
- **Google Gemini 2.0 Flash:** Powers **ARIA**, the intelligent quantum tutor that can answer physics questions and guide users through the labs.

---

## 📁 Project Structure & Key Files

### 🖥 Backend (`/server`)
- **`index.ts`**: The API entry point. Manages Express routes, CORS for the frontend, and the Gemini AI chat integration.
- **`quantumSim.ts`**: The "Physics Engine". Contains pure TypeScript functions that simulate:
  - **Bell State & GHZ State** measurements.
  - **Deutsch Algorithm**: A deterministic implementation showing quantum speedup.
  - **BB84 Protocol**: Simulates the quantum key distribution process, including "Eve" (eavesdropper) interference.
  - **Stern-Gerlach**: Mathematically simulates spin quantization and measurement probabilities.

### 🌐 Frontend (`/src`)
- **`hooks/useTimeEvolution.ts`**: The core simulation hook. It calculates the **Density Matrix** evolution of a qubit under noise (Bit Flip, Phase Flip, Amplitude Damping, Depolarizing) using physically accurate math.
- **`components/BlochSphere.tsx`**: A custom Three.js component that renders the state vector, trail history, and decoherence sphere.
- **`routes/GateBuilder.tsx`**: A drag-and-drop circuit simulator. Uses `@dnd-kit` for the UI and an inline state-vector engine to update probabilities as gates are placed.
- **`api/experiments.ts`**: A robust client-side wrapper for all backend simulation calls.

---

## 🔬 Core Mechanics (For Technical Judges)

### 1. The Decoherence Engine
Unlike simple animations, the **Fragility Lab** uses a density matrix approach to simulate noise.
- **T1 (Relaxation)**: Modeled using Amplitude Damping.
- **T2 (Dephasing)**: Modeled using Phase Flip.
- **Depolarizing Noise**: Simulates a completely random environment.
The fidelity is calculated in real-time as $F = \sqrt{\langle \psi | \rho | \psi \rangle}$, giving users a quantifiable measure of "Quantum Health".

### 2. Quantum vs. Classical
This module runs a side-by-side simulation. A classical bit (0/1) is treated as a robust state, while a qubit's superposition is subjected to the same noise. It visually proves why quantum error correction is the "holy grail" of modern computing.

### 3. ARIA: AI Quantum Tutor
Using Gemini, we've implemented a system-prompt-driven assistant that "knows" the entire website. If a student is confused by the Stern-Gerlach experiment, ARIA can explain the physics and then tell them exactly how to use the sliders on that specific page.

### 🔬 Advanced Virtual Labs
The project includes several specialized labs, each targeting a specific quantum concept:
- **Fragility Lab**: Multi-channel noise control on a single qubit.
- **Quantum vs. Classical**: Real-time comparison of bit-flip vs. decoherence.
- **Stern-Gerlach**: Spin quantization simulation with adjustable magnetic field angles.
- **Bell & GHZ State**: Interactive entanglement generators that calculate correlation and CHSH inequality violation.
- **Cavity QED**: Simulates light-matter interaction inside a optical cavity (Jaynes-Cummings model).
- **Deutsch Algorithm**: Demonstration of quantum parallelism and oracle functions.
- **BB84 Protocol**: A full simulation of the first quantum cryptography protocol with an eavesdropper toggle.

---

## 🚀 Why This Matters
Edu-Tech often stops at theory. The **Quantum Fragility Playground** bridges the gap by letting students "touch" the noise. By visualizing the fragility of quantum states, we prepare the next generation of engineers for the challenges of real-world NISQ-era (Noisy Intermediate-Scale Quantum) computers.
