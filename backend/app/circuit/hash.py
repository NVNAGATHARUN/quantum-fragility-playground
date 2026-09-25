"""Server-Authoritative Circuit Hashing.

Computes a deterministic SHA-256 fingerprint solely from the canonical semantic
quantum content of a CircuitIR.
"""

import json
import hashlib
from .ir import CircuitIR
from .canonical import canonical_semantics


def calculate_circuit_hash(ir: CircuitIR) -> str:
    """Computes deterministic SHA-256 hex digest of canonical circuit semantics.

    Clients cannot supply an authoritative hash; this function is the single source of truth.
    """
    semantics = canonical_semantics(ir)
    canonical_json = json.dumps(
        semantics,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=True,
    )
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
