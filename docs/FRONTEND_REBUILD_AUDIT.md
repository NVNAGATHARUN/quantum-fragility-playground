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
- Rebuilt Home around one confident first impression, a restrained scientific state visual, and clear routes into learning, experimentation, and SIH evidence.
- Turned the Home visual into a working qubit control with live measurement probabilities, then limited the opening curriculum to three foundation modules so the page reads as a journey rather than a catalogue.
- Reframed Learn as an invitation into a guided journey, with one primary starting action and calmer curriculum disclosure.
- Rebuilt Progress around personal momentum, a visual journey portrait, a single next step, and a narrative record of discoveries instead of an administrative dashboard.
- Rebuilt the Labs entrance around Circuit Studio as the primary product, with guided experiments and algorithm walkthroughs presented as secondary learning paths.
- Removed the duplicate floating tutor launcher; Aria remains available from the persistent, responsive top bar without obscuring learning content.
- Replaced the flat white application background with a warm laboratory-paper canvas and a restrained 24 px reference grid shared by every primary route.
- Replaced the mixed Inter, Orbitron, Syne, and Space Grotesk stack with IBM Plex Sans for interface text, IBM Plex Serif for editorial headings, and JetBrains Mono only for scientific values and code.
- Rewrote the main Home, Learn, Labs, and Progress headlines in direct, task-focused language and aligned their typography, navy workspace treatment, border radius, and elevation.
- Added a pre-paint theme initializer so the light default no longer flashes through the old dark canvas during startup.
- Replaced system-first language on these learner surfaces with plain, supportive language while keeping evidence provenance available where it matters.
- Rebuilt the Virtual Experiments catalogue with readable editorial cards, Lucide icons, direct entry points, and one shared information hierarchy.
- Consolidated Stern–Gerlach, Bell-state, Cavity QED, and all algorithm laboratories into a controlled navy scientific workspace instead of separate neon dashboards.
- Reworked the Simulation Guides into the same card, typography, and action system; every progress-step control now has an accessible name.
- Replaced the experiment toolbar's emoji controls with named fullscreen, focus-display, sound, and guided-tour controls.
- Added meaningful browser titles and top-bar labels for public, experiment, assessment, instructor, and visualizer routes.
- Normalized the Cognitive Conflict laboratory heading and selector while retaining its hypothesis-driven learning flow.

## Design system

- Canvas: `#F1EFE8`; surface: `#FCFBF7`; secondary: `#EAE7DE`.
- Primary text: `#1B2430`; secondary text: `#626B72`; border: `#D8D4CA`.
- Primary action: `#3152A3`; hover: `#263F80`; soft accent: `#E4E9F5`.
- Graphite dark canvas: `#0D1117`; surface: `#131923`; raised: `#181F2B`; border: `#293242`.
- IBM Plex Sans is used for product UI, IBM Plex Serif gives major headings an editorial voice, and JetBrains Mono is retained for code, amplitudes, matrices, circuit coordinates, and simulator values.
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
- The human-centred Home, Learn, Labs, and Progress refinement was additionally rendered and verified at desktop and 390 px widths.
- Home, Learn, Labs, and Progress now resolve to the same canvas and typography tokens at runtime; the first render was checked to prevent a dark-to-light theme flash.
- The Home qubit control was interaction-tested: changing its angle updates both displayed measurement probabilities.
- The checked routes have no document-level horizontal overflow and no unlabeled buttons.
- A route-wide audit rendered all 36 reachable routes at 1280×900: all 36 use the warm canvas, with zero page overflow, zero error boundaries, and zero unlabeled buttons.
- The same 36 routes were audited at 390×844. Three breakpoints were found in the judge actions, cognitive-lab selector, and Cavity QED metrics; focused reruns confirm all three now fit at 390 px with no page overflow.
- Final desktop, dark-mode, scientific-workspace, and mobile screenshots are stored in `docs/screenshots/frontend-rebuild/`.

## Remaining limitations

- Monaco is not installed; OpenQASM uses the existing safe editor rather than claiming professional Monaco diagnostics.
- Specialized 3D and algorithm canvases retain domain-specific diagrams and data colors, while their surrounding layout, type, controls, cards, and navigation now follow the shared system.
- VQE and QAOA intentionally leave analytical result space empty until a simulator response arrives; a future iteration should add a more instructive pre-run placeholder without inventing results.
- Instructor screenshots without an instructor session correctly show the authenticated empty state rather than fabricated learners.
- Learner-impact evidence still requires a real pilot; UI polish does not prove educational effectiveness.
