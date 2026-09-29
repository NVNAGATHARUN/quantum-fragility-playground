# Quantum Lens frontend rebuild audit

## Old frontend findings

- Dark navy was forced for every learner and every route, despite a light theme implementation existing in the codebase.
- Two overlapping visual systems were active: legacy glass/gradient/Orbitron primitives and a newer `ql-*` editorial system.
- The primary navigation exposed seven destinations, including Circuit Studio and Challenges, instead of grouping work under Home, Learn, Labs, Explore, and Progress.
- Normal interface text used very small sizes, uppercase labels, wide letter spacing, and monospace typography associated with a developer console.
- Home showed almost every capability at once and rendered eight large module cards, making the starting action less clear.
- Learn was structured as bordered cards rather than an editorial progression.
- Circuit Studio placed its state inspector below the canvas and consumed vertical space before a learner could compare a circuit with its result.
- Fragility presented scientific evidence as a telemetry dashboard with status banners, emoji controls, and an AI diagnostic block.
- QAOA and VQE had a separate neon/gradient identity and were missing the shared algorithm-workspace wrapper.
- Guided-lab surfaces assumed a dark parent canvas and lost heading contrast under a light application shell.
- The old shared `UI.tsx` primitive library created glowing cards, uppercase badges, gradient headings, emoji page icons, and Orbitron controls across many legacy routes.
- Desktop pages used 10–12 px body copy in several high-value areas.
- The CSS audit found 868 hard-coded color, radius, shadow, font, or text-transform decisions across the frontend.

## Implemented changes

- Made light mode the default while retaining a user-controlled dark mode.
- Added a centralized premium token layer for color, spacing, radius, shadow, motion, typography, and status semantics.
- Reduced primary navigation to Home, Learn, Labs, Explore, and Progress; Instructor remains role-gated.
- Added a collapsible 72 px desktop navigation rail and automatic workbench collapse.
- Added an accessible theme toggle and preserved the functioning Ctrl/Cmd+K search.
- Reworked Home into a light editorial composition with a single dominant interactive hero, clearer actions, and compact module rows.
- Reworked Learn into an editorial module sequence with a focused opening module and restrained separators.
- Reorganized Circuit Studio so the circuit canvas and state inspector occupy the first desktop viewport together.
- Added light and graphite Studio treatments, neutral gates, accessible focus, and responsive workbench rules.
- Consolidated legacy cards, page headers, section labels, badges, information states, and experiment guidance.
- Removed emoji and console language from Fragility controls and surfaced the correct reduced-state decoherence boundary.
- Connected QAOA and VQE to the shared scientific algorithm workspace.
- Restored guided-lab contrast through a dedicated focused experiment surface.
- Added useful reduced-motion behavior and retained keyboard-visible focus throughout the application.

## Design system

- Canvas: `#F7F8FA`; surface: `#FFFFFF`; secondary: `#F2F4F7`.
- Primary text: `#101828`; secondary text: `#667085`; border: `#E4E7EC`.
- Primary action: `#3157D5`; hover: `#2848B7`; soft accent: `#EEF2FF`.
- Graphite dark canvas: `#0D1117`; surface: `#131923`; raised: `#181F2B`; border: `#293242`.
- Inter is used for product UI. JetBrains Mono is retained for code, amplitudes, matrices, circuit coordinates, and simulator values.
- Spacing follows 4, 8, 12, 16, 24, 32, 40, and 48 px steps.
- Radii use 8, 12, and 16 px. Shadows are reserved for raised editorial objects.
- Navigation and controls use sentence case. Status is communicated with text and shape as well as color.

## Performance observations

- Routes are code-split, including Circuit Studio, Fragility, Hardware Explorer, QAOA, VQE, and lesson pages.
- BlochSphere3D remains a separate lazy chunk and is not loaded by Home.
- Current production build has three large optional chunks: BlochSphere3D about 555 kB, charting about 333 kB, and Lesson Runner about 294 kB before gzip.
- The initial application chunk is about 298 kB before gzip. Further reduction requires breaking the lesson registry and assistant dependencies into smaller dynamic imports.

## Verification evidence

- Production build completed successfully across 2,852 transformed modules.
- All 14 Circuit Studio regression tests pass, covering QASM diagnostics, complex-state simulation, controlled gates, measurement, reset, undo-safe serialization, and invalid-circuit rejection.
- All three Playwright learner journeys pass, including targeted remediation, the public judge walkthrough, and a server-graded diagnostic.
- Responsive checks pass at 1920, 1440, 1280, 1024, and 390 px for Home, Learn, Circuit Studio, and a lesson route.
- The checked routes have no document-level horizontal overflow and no unlabeled buttons.
- Final desktop, dark-mode, scientific-workspace, and mobile screenshots are stored in `docs/screenshots/frontend-rebuild/`.

## Remaining limitations

- Monaco is not installed; OpenQASM uses the existing safe editor rather than claiming professional Monaco diagnostics.
- The light/dark visual system is cohesive, but several highly specialized 3D and algorithm canvases retain their own internal scientific styling.
- VQE and QAOA intentionally leave analytical result space empty until a simulator response arrives; a future iteration should add a more instructive pre-run placeholder without inventing results.
- Instructor screenshots without an instructor session correctly show the authenticated empty state rather than fabricated learners.
- Learner-impact evidence still requires a real pilot; UI polish does not prove educational effectiveness.
