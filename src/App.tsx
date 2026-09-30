/**
 * App.tsx — V3 Canonical Route Table
 *
 * Canonical routes frozen per V3 SRS §4:
 *   Public:        /  /login  /signup
 *   Authenticated: /app/home  /learn  /learn/:module/:lesson
 *                  /labs  /labs/studio  /labs/:slug
 *                  /challenges
 *                  /explore  /explore/algorithms  /explore/algorithms/:slug  /explore/hardware
 *                  /progress  /instructor
 *   Dev:           /design-system
 *
 * Legacy redirects (backward compat for deep-linked URLs from Milestones 1–8):
 *   /gate-builder        → /labs/studio
 *   /lab                 → /labs/studio
 *   /algorithms          → /explore/algorithms
 *   /algorithms/*        → /explore/algorithms/*
 *   /hardware-explorer   → /explore/hardware
 *   /fragility-lab       → /labs/fragility
 *   /conflict-lab        → /labs/conflict
 */

import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./providers/ThemeProvider";
import { RoleProvider } from "./providers/RoleProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { QuantumSessionProvider } from "./providers/QuantumSessionProvider";
import QuantumAssistant from "./components/QuantumAssistant";
import { AuthModal } from "./components/AuthModal";

// ─── Lazy-loaded routes ────────────────────────────────────────────────────────

const Home = lazy(() => import("./routes/Home"));
const JudgeDemo = lazy(() => import("./routes/JudgeDemo"));
const Learn = lazy(() => import("./routes/Learn"));
const LessonRunner = lazy(() => import("./routes/LessonRunner"));
const LabsIndex = lazy(() => import("./routes/LabsIndex"));
const GateBuilder = lazy(() => import("./routes/CircuitStudio")); // /labs/studio
const FragilityLab = lazy(() => import("./routes/FragilityLab")); // /labs/fragility
const CognitiveConflictLab = lazy(
  () => import("./routes/CognitiveConflictLab"),
); // /labs/conflict
const GuidedLabRunner = lazy(() => import("./routes/GuidedLabRunner")); // /labs/guided/:labId
const ExploreIndex = lazy(() => import("./routes/ExploreIndex")); // /explore
const BellStateAlgorithm = lazy(
  () => import("./routes/Algorithms/BellStateAlgorithm"),
);
const DeutschJozsa = lazy(() => import("./routes/Algorithms/DeutschJozsa"));
const Teleportation = lazy(() => import("./routes/Algorithms/Teleportation"));
const QFT = lazy(() => import("./routes/Algorithms/QFT"));
const VisualQKD = lazy(() => import("./routes/Algorithms/VisualQKD"));
const QuantumNetworkLab = lazy(
  () => import("./routes/Algorithms/QuantumNetworkLab"),
);
const QAOA = lazy(() => import("./routes/Algorithms/QAOA"));
const VQE = lazy(() => import("./routes/Algorithms/VQE"));
const HardwareExplorer = lazy(() => import("./routes/HardwareExplorer")); // /explore/hardware
const QuantumHardwarePage = lazy(() => import("./routes/QuantumHardwarePage")); // /quantum-hardware & /quantum-lens/model
const QuantumLensLanding = lazy(() => import("./routes/QuantumLensLanding")); // /quantum-lens
const StudentProgress = lazy(() => import("./routes/StudentProgress")); // /progress
const ProgressOverview = lazy(() => import("./routes/ProgressOverview"));
const DiagnosticAssessment = lazy(() => import("./routes/DiagnosticAssessment"));
const InstructorDashboard = lazy(() => import("./routes/InstructorDashboard")); // /instructor
const DesignSystem = lazy(() => import("./routes/DesignSystem")); // /design-system (dev)
const About = lazy(() => import("./routes/About"));
const QuantumVsClassical = lazy(() => import("./routes/QuantumVsClassical"));
const LearningBySimulation = lazy(
  () => import("./routes/LearningBySimulation"),
);
const ExperimentsIndex = lazy(() => import("./routes/Experiments/Index"));
const SternGerlach = lazy(() => import("./routes/Experiments/SternGerlach"));
const BellState = lazy(() => import("./routes/Experiments/BellState"));
const CavityQed = lazy(() => import("./routes/Experiments/CavityQed"));
const Grover = lazy(() => import("./routes/Experiments/Grover"));
const QiskitVisualizer = lazy(() => import("./routes/QiskitVisualizer"));
const QasmVisualizer = lazy(() => import("./routes/QasmVisualizer"));
const ChallengesIndex = lazy(() => import("./routes/ChallengeLibrary"));
const ChallengeRunner = lazy(() => import("./routes/ChallengeRunner"));
const NotFound = lazy(() => import("./routes/NotFound"));

// ─── Loading fallback ──────────────────────────────────────────────────────────

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
      <span className="font-mono text-xs text-slate-600 tracking-wider">
        Loading workspace…
      </span>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const location = useLocation();

  return (
    <ThemeProvider>
      <RoleProvider>
        <AuthProvider>
          <QuantumSessionProvider>
            <AppShell>
              <div key={location.pathname} className="w-full h-full flex-1 flex flex-col min-h-0">
                <ErrorBoundary>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      {/* ── PUBLIC / HOME ───────────────────────────────────── */}
                      <Route path="/" element={<Home />} />
                      <Route path="/judge" element={<JudgeDemo />} />
                      <Route
                        path="/app/home"
                        element={<Navigate to="/" replace />}
                      />
                      <Route
                        path="/learner-home"
                        element={<Navigate to="/" replace />}
                      />
                      <Route
                        path="/landing"
                        element={<Navigate to="/" replace />}
                      />
                      <Route path="/about" element={<About />} />

                      {/* ── AUTHENTICATED CORE ─────────────────────────────────── */}
                      <Route path="/learn" element={<Learn />} />
                      <Route
                        path="/learn/:moduleId/:lessonId"
                        element={<LessonRunner />}
                      />
                      <Route
                        path="/learn/:module/:lesson"
                        element={<LessonRunner />}
                      />

                      {/* ── LABS & WORKBENCHES ────────────────────────────────── */}
                      <Route path="/labs" element={<LabsIndex />} />
                      <Route
                        path="/labs/fragility"
                        element={<FragilityLab />}
                      />
                      <Route path="/fragility-lab" element={<FragilityLab />} />
                      <Route path="/labs/studio" element={<GateBuilder />} />
                      <Route
                        path="/labs/studio/:circuitId"
                        element={<GateBuilder />}
                      />
                      <Route path="/gate-builder" element={<GateBuilder />} />
                      <Route path="/lab" element={<GateBuilder />} />
                      <Route
                        path="/labs/conflict"
                        element={<CognitiveConflictLab />}
                      />
                      <Route
                        path="/conflict-lab"
                        element={<CognitiveConflictLab />}
                      />
                      <Route
                        path="/labs/guided/:labId"
                        element={<GuidedLabRunner />}
                      />
                      <Route
                        path="/labs/virtual/:labId"
                        element={<GuidedLabRunner />}
                      />
                      <Route path="/challenges" element={<ChallengesIndex />} />
                      <Route
                        path="/challenges/:challengeId"
                        element={<ChallengeRunner />}
                      />
                      <Route
                        path="/labs/challenges"
                        element={<ChallengesIndex />}
                      />
                      <Route
                        path="/labs/challenges/:challengeId"
                        element={<ChallengeRunner />}
                      />

                      {/* ── EXPERIMENTS ───────────────────────────────────────── */}
                      <Route
                        path="/experiments"
                        element={<ExperimentsIndex />}
                      />
                      <Route
                        path="/experiments/stern-gerlach"
                        element={<SternGerlach />}
                      />
                      <Route
                        path="/experiments/bell-state"
                        element={<BellState />}
                      />
                      <Route
                        path="/experiments/cavity-qed"
                        element={<CavityQed />}
                      />
                      <Route path="/experiments/grover" element={<Grover />} />
                      <Route
                        path="/explore/experiments"
                        element={<ExperimentsIndex />}
                      />
                      <Route
                        path="/explore/experiments/stern-gerlach"
                        element={<SternGerlach />}
                      />
                      <Route
                        path="/explore/experiments/bell-state"
                        element={<BellState />}
                      />
                      <Route
                        path="/explore/experiments/cavity-qed"
                        element={<CavityQed />}
                      />
                      <Route
                        path="/explore/experiments/grover"
                        element={<Grover />}
                      />

                      {/* ── EXPLORE & ALGORITHMS ─────────────────────────────── */}
                      <Route path="/explore" element={<ExploreIndex />} />
                      <Route
                        path="/explore/algorithms"
                        element={<ExploreIndex />}
                      />
                      <Route
                        path="/explore/algorithms/bell-state"
                        element={<BellStateAlgorithm />}
                      />
                      <Route
                        path="/explore/algorithms/deutsch-jozsa"
                        element={<DeutschJozsa />}
                      />
                      <Route
                        path="/explore/algorithms/grover"
                        element={<Grover />}
                      />
                      <Route
                        path="/explore/algorithms/teleportation"
                        element={<Teleportation />}
                      />
                      <Route path="/explore/algorithms/qft" element={<QFT />} />
                      <Route
                        path="/explore/algorithms/qaoa"
                        element={<QAOA />}
                      />
                      <Route path="/explore/algorithms/vqe" element={<VQE />} />
                      <Route
                        path="/explore/algorithms/qkd"
                        element={<VisualQKD />}
                      />
                      <Route
                        path="/explore/algorithms/network"
                        element={<QuantumNetworkLab />}
                      />
                      <Route
                        path="/explore/hardware"
                        element={<HardwareExplorer />}
                      />
                      <Route
                        path="/quantum-hardware"
                        element={<QuantumHardwarePage />}
                      />
                      {/* QuantumLens: direct 3D interactive model */}
                      <Route
                        path="/quantum-lens"
                        element={<QuantumHardwarePage />}
                      />
                      <Route
                        path="/quantum-lens/model"
                        element={<QuantumHardwarePage />}
                      />
                      <Route
                        path="/quantum-lens/intro"
                        element={<QuantumLensLanding />}
                      />

                      {/* ── PROGRESS / INSTRUCTOR ───────────────────────────── */}
                      <Route path="/progress" element={<ProgressOverview />} />
                      <Route path="/diagnostic" element={<DiagnosticAssessment />} />
                      <Route
                        path="/progress/details"
                        element={<StudentProgress />}
                      />
                      <Route
                        path="/instructor"
                        element={<InstructorDashboard />}
                      />
                      <Route
                        path="/instructor/*"
                        element={<InstructorDashboard />}
                      />

                      {/* ── DEV ONLY ────────────────────────────────────────── */}
                      <Route path="/design-system" element={<DesignSystem />} />

                      {/* ── LEGACY REDIRECTS (backward compat) ─────────────── */}
                      <Route
                        path="/hardware-explorer"
                        element={<Navigate to="/explore/hardware" replace />}
                      />
                      <Route
                        path="/algorithms"
                        element={<Navigate to="/explore/algorithms" replace />}
                      />
                      <Route
                        path="/algorithms/bell-state"
                        element={
                          <Navigate
                            to="/explore/algorithms/bell-state"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/algorithms/deutsch-jozsa"
                        element={
                          <Navigate
                            to="/explore/algorithms/deutsch-jozsa"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/algorithms/grover"
                        element={
                          <Navigate to="/explore/algorithms/grover" replace />
                        }
                      />
                      <Route
                        path="/algorithms/teleportation"
                        element={
                          <Navigate
                            to="/explore/algorithms/teleportation"
                            replace
                          />
                        }
                      />
                      <Route
                        path="/algorithms/qft"
                        element={
                          <Navigate to="/explore/algorithms/qft" replace />
                        }
                      />
                      <Route
                        path="/algorithms/qaoa"
                        element={
                          <Navigate to="/explore/algorithms/qaoa" replace />
                        }
                      />
                      <Route
                        path="/algorithms/vqe"
                        element={
                          <Navigate to="/explore/algorithms/vqe" replace />
                        }
                      />
                      <Route
                        path="/algorithms/qkd"
                        element={
                          <Navigate to="/explore/algorithms/qkd" replace />
                        }
                      />
                      <Route
                        path="/algorithms/qkd-bb84"
                        element={
                          <Navigate to="/explore/algorithms/qkd" replace />
                        }
                      />
                      <Route
                        path="/algorithms/network"
                        element={
                          <Navigate to="/explore/algorithms/network" replace />
                        }
                      />

                      {/* Other retained legacy routes */}
                      <Route
                        path="/quantum-vs-classical"
                        element={<QuantumVsClassical />}
                      />
                      <Route
                        path="/learning-by-simulation"
                        element={<LearningBySimulation />}
                      />
                      <Route
                        path="/qiskit-visualizer"
                        element={<QiskitVisualizer />}
                      />
                      <Route
                        path="/qasm-visualizer"
                        element={<QasmVisualizer />}
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
              </div>

              {/* Global floating AI mentor */}
              <QuantumAssistant />

              {/* Authentication Modal */}
              <AuthModal />
            </AppShell>
          </QuantumSessionProvider>
        </AuthProvider>
      </RoleProvider>
    </ThemeProvider>
  );
}
