# Dev Notes

Misc notes to myself while building this. Not meant to be public-facing documentation.

---

## Bloch sphere math

The state vector is represented as two complex amplitudes α and β where |α|² + |β|² = 1.
Mapping to Bloch sphere coordinates:
- θ (polar) = 2 * arccos(|α|)
- φ (azimuthal) = arg(β) - arg(α)

Noise channels shrink the vector toward the center (mixed state = fully decohered).

For amplitude damping (T1):
  ρ00' = ρ00 + (1-e^{-t/T1}) * ρ11
  ρ11' = e^{-t/T1} * ρ11
  ρ01' = e^{-t/(2T1)} * ρ01

For pure dephasing (T2 > T1 case):
  Off-diagonal terms decay as e^{-t/T_φ} where 1/T_φ = 1/T2 - 1/(2T1)

ref: https://qiskit.org/documentation/apidoc/aer_noise.html

---

## Gate builder headaches

Was using a nested array for the circuit grid and ran into reference sharing bugs when I duplicated rows.
Fixed by making sure every new row is a fresh array. Classic JS gotcha.

The CNOT rendering was also wrong at first — control qubit was rendering on the wrong side.
Had to draw it manually instead of using the gate box approach.

---

## BB84 implementation notes

Each round:
1. Alice picks random bit + basis (Z or X)
2. Bob picks random measurement basis
3. If bases match, bit is kept for the key
4. Eve (if enabled) intercepts with random basis — this disturbs ~25% of qubits

QBER should be ~0% without Eve, ~25% with Eve. Currently seeing ~24-26% which is correct.

---

## Deployment

Frontend on Vercel, backend on Render (free tier).
Render spins down after 15 min of inactivity so first request after sleep is slow.
Not ideal but good enough for a hackathon demo.

Set these on Render:
- GEMINI_API_KEY
- ALLOWED_ORIGIN (the vercel app URL)

---

## TODO / future

- [ ] Add more noise models (thermal relaxation, readout error)
- [ ] Let users export circuits as QASM
- [ ] Better mobile support for gate builder
- [ ] Maybe add Grover's algorithm visualization
