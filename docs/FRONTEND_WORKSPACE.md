# Frontend workspace

The learner workspace uses semantic CSS variables in `src/workspace.css`. New components use the `ql-` class namespace because the legacy laboratory utilities use a custom pixel-oriented Tailwind spacing scale. Do not globally replace that scale without migrating the legacy laboratories.

Main surfaces: `Home`, `Learn`, `LabsIndex`, `ExploreIndex`, `CircuitStudio`, `ProgressOverview`, and `ChallengeLibrary`. `ResourceLibrary` and `workspaceCatalog` share catalog presentation and routing data. The original detailed progress view remains at `/progress/details`.

## Run and verify

```sh
npm ci
npm run dev
npm run build
npm run test:studio
```

If the Windows sandbox prevents esbuild from enumerating parent directories, use:

```sh
npm run build:local
npm run preview:local
```

`preview:local` builds a production bundle and serves it at `http://127.0.0.1:5173`. Stop another server on that port first. It reads `VITE_API_BASE_URL` and `VITE_FASTAPI_URL`; absent configuration, API calls are proxied to `http://127.0.0.1:8000`. The script intentionally does not offer a dev-server mode because dependency prebundling is also affected by the Windows sandbox restriction.

## Circuit preview contract

`src/lib/studio.ts` is a bounded ideal unitary simulator: one to five qubits, at most sixteen steps, and twelve supported gates. Its basis order is `|q(n-1)…q0⟩`. Statevector probabilities and reduced-qubit Bloch coordinates update locally. Qiskit shots are requested separately and show the returned backend identity. Editing a circuit marks earlier counts stale.

The strict local QASM parser supports only the displayed unitary gate set and one `qubit[n] q` register. It never evaluates Python or JavaScript. It rejects measurement, reset, custom gate declarations, conditionals, unsupported expressions, overlapping gates, oversized registers, and excessive depth. Use the existing advanced QASM visualizer for other backend-supported operations.

The test suite transpiles the pure preview module in memory with the project's TypeScript dependency, so it runs on Node 18+ without additional test-framework dependencies.

## Persistence and service states

- Circuit drafts are explicitly saved to browser local storage, not an account.
- Lesson progress uses existing authenticated backend records. The hook clears stale records when authentication changes.
- Local circuit run counts are labeled as browser-local activity.
- Tutor replies, challenge definitions/grading, authentication, and sampled Qiskit execution require their existing services. Empty/error states do not substitute invented results.
- Account registration in the redesigned UI creates learner accounts. Existing instructor accounts can still sign in; backend instructor provisioning remains a separate task.

## Accessibility and maintenance

Keep visible focus styles, descriptive controls, keyboard gate placement, dialog focus containment, Escape handling, and reduced-motion behavior. The mobile navigation is inert when closed. Filter state is exposed with `aria-pressed`; result/status updates use live regions.

The new SVG artwork is decorative. The studio's scientific charts provide textual accessible labels or tables. Decorative homepage sphere art is not used as evidence of a simulated state.
