import React, { useMemo } from 'react';

interface SyntaxHighlightedEditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
  language?: 'qasm' | 'qiskit';
  placeholder?: string;
  errorMessage?: string;
}

export function highlightQasmCode(code: string): React.ReactNode[] {
  return code.split('\n').map((line, lineIdx) => {
    // Check if line is a comment
    const commentMatch = line.match(/^(\s*)(\/\/.*)$/);
    if (commentMatch) {
      return (
        <span key={lineIdx} className="ql-token-line">
          {commentMatch[1]}
          <span className="text-slate-500 italic">{commentMatch[2]}</span>
        </span>
      );
    }

    // Tokenize line with regex
    const tokens: React.ReactNode[] = [];
    const regex = /(\b(?:OPENQASM|include|qubit|bit|gate|reset|measure|barrier)\b)|(\b(?:h|x|y|z|s|t|sdg|tdg|cx|cz|swap|rx|ry|rz)\b)|(\b(?:q|c)\[\d+\])|("stdgates\.inc"|"[^"]*")|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|pi\b)|(\/\/.*$)|([a-zA-Z_][a-zA-Z0-9_]*)|([^\s\w]+|\s+)/gi;

    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      const [full, kw, gate, reg, str, num, comment, ident, other] = match;
      if (kw) {
        tokens.push(
          <span key={key++} className="text-purple-400 font-semibold">{kw}</span>
        );
      } else if (gate) {
        tokens.push(
          <span key={key++} className="text-cyan-400 font-bold">{gate}</span>
        );
      } else if (reg) {
        tokens.push(
          <span key={key++} className="text-indigo-300 font-medium">{reg}</span>
        );
      } else if (str) {
        tokens.push(
          <span key={key++} className="text-emerald-400">{str}</span>
        );
      } else if (num) {
        tokens.push(
          <span key={key++} className="text-amber-400">{num}</span>
        );
      } else if (comment) {
        tokens.push(
          <span key={key++} className="text-slate-500 italic">{comment}</span>
        );
      } else if (ident) {
        tokens.push(
          <span key={key++} className="text-slate-200">{ident}</span>
        );
      } else {
        tokens.push(<span key={key++} className="text-slate-400">{other}</span>);
      }
    }

    return (
      <span key={lineIdx} className="ql-token-line">
        {tokens.length > 0 ? tokens : ' '}
      </span>
    );
  });
}

export function highlightPythonCode(code: string): React.ReactNode[] {
  return code.split('\n').map((line, lineIdx) => {
    const commentMatch = line.match(/^(\s*)(#.*)$/);
    if (commentMatch) {
      return (
        <span key={lineIdx} className="ql-token-line">
          {commentMatch[1]}
          <span className="text-slate-500 italic">{commentMatch[2]}</span>
        </span>
      );
    }

    const tokens: React.ReactNode[] = [];
    const regex = /(\b(?:import|from|def|return|class|for|in|if|else|while|with|as)\b)|(\b(?:QuantumCircuit|AerSimulator|transpile|execute)\b)|(\b(?:h|x|y|z|s|t|cx|cz|swap|rx|ry|rz|measure)\b)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|(#.*$)|([a-zA-Z_][a-zA-Z0-9_]*)|([^\s\w]+|\s+)/g;

    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = regex.exec(line)) !== null) {
      const [full, kw, cls, method, str, num, comment, ident, other] = match;
      if (kw) {
        tokens.push(<span key={key++} className="text-purple-400 font-semibold">{kw}</span>);
      } else if (cls) {
        tokens.push(<span key={key++} className="text-sky-300 font-bold">{cls}</span>);
      } else if (method) {
        tokens.push(<span key={key++} className="text-cyan-400 font-medium">{method}</span>);
      } else if (str) {
        tokens.push(<span key={key++} className="text-emerald-400">{str}</span>);
      } else if (num) {
        tokens.push(<span key={key++} className="text-amber-400">{num}</span>);
      } else if (comment) {
        tokens.push(<span key={key++} className="text-slate-500 italic">{comment}</span>);
      } else if (ident) {
        tokens.push(<span key={key++} className="text-slate-200">{ident}</span>);
      } else {
        tokens.push(<span key={key++} className="text-slate-400">{other}</span>);
      }
    }

    return (
      <span key={lineIdx} className="ql-token-line">
        {tokens.length > 0 ? tokens : ' '}
      </span>
    );
  });
}

export function SyntaxHighlightedEditor({
  value,
  onChange,
  readOnly = false,
  language = 'qasm',
  placeholder = '',
  errorMessage,
}: SyntaxHighlightedEditorProps) {
  const lines = useMemo(() => value.split('\n'), [value]);

  const highlightedLines = useMemo(() => {
    return language === 'qasm' ? highlightQasmCode(value) : highlightPythonCode(value);
  }, [value, language]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange?.(nextValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="ql-syntax-editor-container relative rounded-lg border border-[#273252] bg-[#070914] overflow-hidden font-mono text-[13px] leading-relaxed">
      <div className="flex">
        {/* Line Numbers Gutter */}
        <div className="ql-editor-gutter select-none py-3 px-2 text-right text-slate-600 bg-[#0a0e1c] border-r border-[#1a233b] w-12 flex-shrink-0">
          {lines.map((_, i) => (
            <div key={i} className="h-6 leading-6 text-xs text-slate-600 font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Content Area */}
        <div className="relative flex-1 py-3 px-3 overflow-x-auto min-h-[160px]">
          {readOnly ? (
            <pre className="m-0 p-0 font-mono whitespace-pre text-slate-300">
              {highlightedLines.map((line, idx) => (
                <div key={idx} className="h-6 leading-6">
                  {line}
                </div>
              ))}
            </pre>
          ) : (
            <div className="relative w-full h-full min-h-[180px]">
              {/* Syntax Highlighting Background Underlay */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none whitespace-pre font-mono text-transparent select-none z-0"
              >
                {highlightedLines.map((line, idx) => (
                  <div key={idx} className="h-6 leading-6">
                    {line}
                  </div>
                ))}
              </div>

              {/* Foreground Editable Transparent Textarea */}
              <textarea
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                spellCheck={false}
                maxLength={20000}
                className="relative w-full h-full min-h-[180px] bg-transparent text-transparent caret-white resize-y font-mono text-[13px] leading-6 focus:outline-none z-10 p-0 m-0 border-none selection:bg-indigo-500/30 selection:text-white"
                style={{
                  caretColor: '#a5b4fc',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
