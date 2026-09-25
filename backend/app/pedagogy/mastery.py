"""Mastery Model v2 — Bayesian Knowledge Tracing (BKT) per-concept per-learner.

Phase 10 of the SRS Build Contract:
  - Evidence-based Bayesian update rule (no synthetic data, no fake priors)
  - Learner skill vector initialised as an empty dict (zero fake history)
  - Mastery only advances on actual verified simulation attempts (Qiskit Aer)
  - Misconception flags from the Misconception Engine can decay mastery on key concepts
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# ── Concept map ──────────────────────────────────────────────────────────────
# Maps concept keys (matching evaluatePrediction conceptKey) to a friendly name.
CONCEPT_MAP: Dict[str, str] = {
    "superposition":   "Quantum Superposition",
    "entanglement":    "Quantum Entanglement",
    "coherence":       "Quantum Coherence & Decoherence",
    "measurement":     "Quantum Measurement (Born Rule)",
    "interference":    "Amplitude Interference",
    "no-signaling":    "No-Signaling Theorem",
    "bell":            "Bell States & Entanglement",
    "general":         "General Circuit Literacy",
    "challenge":       "Verification Challenge",
}

# ── BKT Constants (per SRS §10.3) ────────────────────────────────────────────
P_L0       = 0.10  # Prior prob of knowing concept before any evidence
P_T        = 0.20  # Prob of learning on a correct attempt (transition)
P_G        = 0.25  # Prob of guessing correctly without knowledge
P_S        = 0.10  # Prob of slipping (wrong despite knowledge)
MASTERY_THR = 0.80  # Threshold to declare mastery


@dataclass
class ConceptMastery:
    """Single-concept Bayesian Knowledge Tracking state."""
    conceptKey:  str
    conceptName: str
    pKnow:       float = P_L0      # Current posterior P(knows)
    attempts:    int   = 0
    correct:     int   = 0
    mastered:    bool  = False
    misconceptionFlags: List[str] = field(default_factory=list)

    def update(self, is_correct: bool, misconception_flags: List[str] = []) -> None:
        """BKT posterior update given one observation."""
        self.attempts += 1
        if is_correct:
            self.correct += 1

        # P(correct | know) * P(know) + P(correct | not-know) * P(not-know)
        if is_correct:
            p_obs_given_know = 1.0 - P_S
            p_obs_given_not_know = P_G
        else:
            p_obs_given_know = P_S
            p_obs_given_not_know = 1.0 - P_G

        p_know_prior = self.pKnow
        p_not_know = 1.0 - p_know_prior

        # Bayes update
        numerator = p_obs_given_know * p_know_prior
        denominator = numerator + p_obs_given_not_know * p_not_know
        p_know_posterior = numerator / denominator if denominator > 0 else p_know_prior

        # Learning transition
        self.pKnow = p_know_posterior + (1.0 - p_know_posterior) * P_T
        self.pKnow = min(0.99, max(0.01, self.pKnow))

        # Misconception penalty: each active flag reduces mastery signal
        for flag in misconception_flags:
            if flag not in self.misconceptionFlags:
                self.misconceptionFlags.append(flag)
            # Penalise by dragging pKnow toward 0.5 × flag weight
            self.pKnow = max(0.15, self.pKnow - 0.10)

        self.mastered = self.pKnow >= MASTERY_THR

    def to_dict(self) -> dict:
        return {
            "conceptKey":          self.conceptKey,
            "conceptName":         self.conceptName,
            "pKnow":               round(self.pKnow, 4),
            "attempts":            self.attempts,
            "correct":             self.correct,
            "mastered":            self.mastered,
            "misconceptionFlags":  self.misconceptionFlags,
        }


class MasteryModelV2:
    """In-memory, per-session Bayesian mastery tracker (Phase 10).

    Usage::

        model = MasteryModelV2()
        model.record_attempt("superposition", is_correct=True)
        print(model.snapshot())
    """

    def __init__(self) -> None:
        self._concepts: Dict[str, ConceptMastery] = {}

    def _get_or_create(self, concept_key: str) -> ConceptMastery:
        if concept_key not in self._concepts:
            self._concepts[concept_key] = ConceptMastery(
                conceptKey=concept_key,
                conceptName=CONCEPT_MAP.get(concept_key, concept_key),
            )
        return self._concepts[concept_key]

    def record_attempt(
        self,
        concept_key: str,
        is_correct: bool,
        misconception_flags: List[str] = [],
        cognitive_delta_tvd: Optional[float] = None,
    ) -> ConceptMastery:
        """Record one verified simulation attempt and update BKT state."""
        # Allow cognitive_delta_tvd to override is_correct if very high
        if cognitive_delta_tvd is not None and cognitive_delta_tvd > 0.45:
            is_correct = False

        node = self._get_or_create(concept_key)
        node.update(is_correct, misconception_flags)
        return node

    def snapshot(self) -> List[dict]:
        """Return current mastery state for all concepts (sorted by pKnow desc)."""
        return sorted(
            [c.to_dict() for c in self._concepts.values()],
            key=lambda x: x["pKnow"],
            reverse=True,
        )

    def mastered_concepts(self) -> List[str]:
        return [k for k, v in self._concepts.items() if v.mastered]

    def weakest_concept(self) -> Optional[str]:
        if not self._concepts:
            return None
        return min(self._concepts, key=lambda k: self._concepts[k].pKnow)


# ── Module-level in-process session store (single-user dev mode) ─────────────
# In production this would be replaced with a per-learner DB-backed store.
_SESSION_MODEL = MasteryModelV2()


def get_session_model() -> MasteryModelV2:
    return _SESSION_MODEL


def reset_session_model() -> None:
    global _SESSION_MODEL
    _SESSION_MODEL = MasteryModelV2()
