import React, { useState, useEffect, useCallback } from 'react';
import {
  Code, Copy, Download, RefreshCw, CheckCircle2, AlertTriangle,
  Layers, ArrowLeftRight, Check, FileCode, Cpu
} from 'lucide-react';
import type { CircuitIR } from '../types/quantum';
import {
  validateCircuit,
  parseQASM,
  exportCircuit,
  type ExportFormat,
  type Diagnostic,
  type ValidationResult,
} from '../api/circuit';

interface CircuitCodeDockProps {
  circuit: CircuitIR;
  onCircuitUpdate: (newCircuit: CircuitIR) => void;
  onQubitsUpdate?: (qubits: number) => void;
}

export default function CircuitCodeDock({
  circuit,
  onCircuitUpdate,
  onQubitsUpdate,
}: CircuitCodeDockProps) {
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('openqasm3');
  const [editorText, setEditorText] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedCode, setExportedCode] = useState<string>('');
  const [copyToast, setCopyToast] = useState<boolean>(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  // Generate canonical OpenQASM 3 string locally as baseline
  const generateLocalQasm = useCallback((ir: CircuitIR): string => {
    const sorted = [...ir.operations].sort((a, b) => (a.step ?? 0) - (b.step ?? 0));
    let q = `OPENQASM 3.0;\ninclude "stdgates.inc";\n\n`;
    q += `qubit[${ir.qubits}] q;\n`;
    if (ir.classicalBits > 0) {
      q += `bit[${ir.classicalBits}] c;\n\n`;
    }
    for (const op of sorted) {
      const t0 = op.targets[0];
      const t1 = op.targets[1];
      const c0 = op.controls?.[0] ?? 0;
      switch (op.gate) {
        case 'H':       q += `h q[${t0}];\n`; break;
        case 'X':       q += `x q[${t0}];\n`; break;
        case 'Y':       q += `y q[${t0}];\n`; break;
        case 'Z':       q += `z q[${t0}];\n`; break;
        case 'S':       q += `s q[${t0}];\n`; break;
        case 'T':       q += `t q[${t0}];\n`; break;
        case 'RX':      q += `rx(${op.params?.theta ?? 0}) q[${t0}];\n`; break;
        case 'RY':      q += `ry(${op.params?.theta ?? 0}) q[${t0}];\n`; break;
        case 'RZ':      q += `rz(${op.params?.theta ?? 0}) q[${t0}];\n`; break;
        case 'CX':      q += `cx q[${op.controls?.length ? c0 : t0}], q[${op.controls?.length ? t0 : t1 ?? t0 + 1}];\n`; break;
        case 'CZ':      q += `cz q[${op.controls?.length ? c0 : t0}], q[${op.controls?.length ? t0 : t1 ?? t0 + 1}];\n`; break;
        case 'SWAP':    q += `swap q[${t0}], q[${t1 ?? t0 + 1}];\n`; break;
        case 'MEASURE': {
          const cBit = t0 < ir.classicalBits ? t0 : 0;
          q += `c[${cBit}] = measure q[${t0}];\n`;
          break;
        }
        case 'RESET':   q += `reset q[${t0}];\n`; break;
        default: break;
      }
    }
    return q;
  }, []);

  // Synchronize editor text when circuit changes from canvas (if user hasn't typed dirty edits)
  useEffect(() => {
    if (!isDirty && activeFormat === 'openqasm3') {
      const qasm = generateLocalQasm(circuit);
      setEditorText(qasm);
    }
  }, [circuit, isDirty, activeFormat, generateLocalQasm]);

  // Run backend validation whenever circuit updates
  useEffect(() => {
    let isCancelled = false;
    validateCircuit(circuit)
      .then((res) => {
        if (!isCancelled) {
          setValidation(res);
          setDiagnostics(res.diagnostics);
        }
      })
      .catch(() => {
        // Fallback gracefully if backend is offline
      });
    return () => {
      isCancelled = true;
    };
  }, [circuit]);

  // Fetch exported code when switching frameworks
  useEffect(() => {
    if (activeFormat === 'openqasm3') return;

    let isCancelled = false;
    setIsExporting(true);
    exportCircuit(circuit, activeFormat)
      .then((res) => {
        if (!isCancelled) {
          setExportedCode(res.code);
          setIsExporting(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setExportedCode(`# Export failed: ${err.message}`);
          setIsExporting(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [circuit, activeFormat]);

  // Bidirectional Sync: OpenQASM 3 -> Canvas CircuitIR
  const handleSyncToCanvas = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: '' });

    try {
      const parseRes = await parseQASM(editorText);
      const parsedCircuit = parseRes.circuit;

      // Validate parsed circuit with semantic validator
      const valRes = await validateCircuit(parsedCircuit);
      setValidation(valRes);

      if (!valRes.valid) {
        const errorDiags = valRes.diagnostics.filter((d) => d.severity === 'error');
        setDiagnostics(valRes.diagnostics);
        setSyncStatus({
          type: 'error',
          message: errorDiags[0]?.message || 'Circuit validation failed',
        });
        setIsSyncing(false);
        return;
      }

      // Successful sync: update parent canvas state
      onCircuitUpdate(parsedCircuit);
      if (onQubitsUpdate && parsedCircuit.qubits) {
        onQubitsUpdate(parsedCircuit.qubits);
      }
      setIsDirty(false);
      setDiagnostics(valRes.diagnostics);
      setSyncStatus({
        type: 'success',
        message: `Synced ${parsedCircuit.operations.length} gates across ${parsedCircuit.qubits} qubits to canvas`,
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: err.message || 'Failed to parse OpenQASM 3 code',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const currentDisplayCode = activeFormat === 'openqasm3' ? editorText : exportedCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayCode);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeFormat === 'openqasm3' ? 'qasm' : 'py';
    const filename = `quantum_circuit_${Date.now()}.${ext}`;
    const blob = new Blob([currentDisplayCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Format Selection & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Framework Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary rounded-lg border border-border">
          <button
            onClick={() => setActiveFormat('openqasm3')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFormat === 'openqasm3'
                ? 'bg-surface text-brand font-semibold shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>OpenQASM 3 (Bidirectional)</span>
          </button>
          <button
            onClick={() => setActiveFormat('qiskit')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFormat === 'qiskit'
                ? 'bg-surface text-brand font-semibold shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Qiskit Aer</span>
          </button>
          <button
            onClick={() => setActiveFormat('cirq')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFormat === 'cirq'
                ? 'bg-surface text-brand font-semibold shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Cirq</span>
          </button>
          <button
            onClick={() => setActiveFormat('pennylane')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFormat === 'pennylane'
                ? 'bg-surface text-brand font-semibold shadow-sm border border-border/60'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>PennyLane</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeFormat === 'openqasm3' && isDirty && (
            <button
              onClick={handleSyncToCanvas}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-md bg-brand text-white text-xs font-medium hover:bg-brand/90 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Parse OpenQASM 3 and synchronize graphical canvas"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync QASM → Canvas</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-md bg-surface-secondary border border-border hover:border-brand/40 text-text-primary text-xs font-medium transition-colors flex items-center gap-1"
          >
            {copyToast ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
            <span>{copyToast ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 rounded-md bg-surface-secondary border border-border hover:border-brand/40 text-text-primary text-xs font-medium transition-colors flex items-center gap-1"
            title="Download target code file"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus.type !== 'idle' && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
            syncStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
          }`}
        >
          {syncStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* Code Editor / Viewer */}
      <div className="relative rounded-lg border border-border overflow-hidden bg-slate-950 font-mono text-xs text-slate-100">
        <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeFormat === 'openqasm3'
                ? isDirty
                  ? 'OpenQASM 3 (Modified • Click Sync to update canvas)'
                  : 'OpenQASM 3 (Canvas Synced)'
                : `${activeFormat.toUpperCase()} Exported Script`}
            </span>
          </div>
          {validation?.metrics && (
            <div className="flex items-center gap-3 text-[10px]">
              <span>Depth: {validation.metrics.depth}</span>
              <span>Gates: {validation.metrics.gateCount}</span>
              <span>2Q Gates: {validation.metrics.multiQubitGates}</span>
            </div>
          )}
        </div>

        {activeFormat === 'openqasm3' ? (
          <textarea
            value={editorText}
            onChange={(e) => {
              setEditorText(e.target.value);
              setIsDirty(true);
            }}
            rows={12}
            className="w-full p-4 bg-transparent text-slate-100 font-mono text-xs focus:outline-none resize-y leading-relaxed"
            placeholder="// Paste or write OpenQASM 3 code here..."
            spellCheck={false}
          />
        ) : (
          <div className="p-4 max-h-80 overflow-y-auto overflow-x-auto leading-relaxed whitespace-pre font-mono text-xs text-slate-200">
            {isExporting ? (
              <div className="flex items-center gap-2 text-slate-400 py-4">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Exporting code for {activeFormat}...</span>
              </div>
            ) : (
              exportedCode
            )}
          </div>
        )}
      </div>

      {/* Structured Diagnostics Callout */}
      {diagnostics.length > 0 && (
        <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-text-primary text-[11px]">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Semantic IR Diagnostics ({diagnostics.length})</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {diagnostics.map((diag, i) => (
              <div
                key={i}
                className={`p-2 rounded border text-[11px] font-mono ${
                  diag.severity === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">[{diag.code}] {diag.message}</span>
                  {diag.line && <span className="text-[10px] opacity-75">Line {diag.line}</span>}
                </div>
                {diag.suggestion && (
                  <div className="text-[10px] mt-1 text-text-muted">
                    Suggestion: {diag.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
