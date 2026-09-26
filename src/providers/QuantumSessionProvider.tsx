import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CircuitIR } from '../types/quantum'

export interface ResolvedMisconceptionItem {
  id: string
  title: string
  resolvedDate: string
  status: 'Mastered' | 'In Progress'
  evidence: string
  tvd: number
}

export interface StudentLabRecord {
  labId: string
  misconceptionId: string
  title: string
  timestamp: number
  prediction: Record<string, number>
  actual: Record<string, number>
  tvd: number
  resolved: boolean
  evidence: string
}

interface QuantumSessionContextType {
  simulatedCircuitsCount: number
  recordCircuitRun: (circuit?: CircuitIR) => void
  labRecords: StudentLabRecord[]
  resolvedMisconceptions: ResolvedMisconceptionItem[]
  recordLabCompletion: (record: Omit<StudentLabRecord, 'timestamp'>) => void
  cognitiveDeltaTrend: Array<{ lab: string; tvd: number; accuracy: number }>
  meanTVD: number
}

const QuantumSessionContext = createContext<QuantumSessionContextType | null>(null)

const STORAGE_KEY = 'quantum_lens_student_session_v3'

export const QuantumSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulatedCircuitsCount, setSimulatedCircuitsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return typeof parsed.simulatedCircuitsCount === 'number' ? parsed.simulatedCircuitsCount : 0
      }
    } catch {}
    return 0
  })

  const [labRecords, setLabRecords] = useState<StudentLabRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.labRecords)) {
          return parsed.labRecords
        }
      }
    } catch {}
    // Honest initial state: zero pre-completed labs until learner actually executes them
    return []
  })


  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          simulatedCircuitsCount,
          labRecords,
        })
      )
    } catch (e) {
      console.warn('Failed to save session state to localStorage', e)
    }
  }, [simulatedCircuitsCount, labRecords])

  const recordCircuitRun = useCallback((_circuit?: CircuitIR) => {
    setSimulatedCircuitsCount(c => c + 1)
  }, [])

  const recordLabCompletion = useCallback((record: Omit<StudentLabRecord, 'timestamp'>) => {
    setLabRecords(prev => {
      // Replace existing record for this misconception or add new
      const filtered = prev.filter(r => r.misconceptionId !== record.misconceptionId)
      return [
        ...filtered,
        {
          ...record,
          timestamp: Date.now(),
        },
      ]
    })
    setSimulatedCircuitsCount(c => c + 2)
  }, [])

  // Derive resolved misconceptions
  const resolvedMisconceptions: ResolvedMisconceptionItem[] = labRecords
    .filter(r => r.resolved)
    .map(r => ({
      id: r.misconceptionId,
      title: r.title,
      resolvedDate: new Date(r.timestamp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      status: 'Mastered',
      evidence: r.evidence,
      tvd: r.tvd,
    }))

  // Derive TVD convergence curve strictly from student's actual records
  const cognitiveDeltaTrend = labRecords.map((rec) => ({
    lab: `${rec.misconceptionId} (${rec.title.split(' ')[1] || 'Lab'})`,
    tvd: rec.tvd,
    accuracy: Math.round((1 - rec.tvd) * 100),
  }))

  // Derived mean TVD: 0 if no records
  const tvds = labRecords.map(r => r.tvd)
  const meanTVD =
    tvds.length > 0
      ? Math.round((tvds.reduce((a, b) => a + b, 0) / tvds.length) * 1000) / 1000
      : 0.0

  return (
    <QuantumSessionContext.Provider
      value={{
        simulatedCircuitsCount,
        recordCircuitRun,
        labRecords,
        resolvedMisconceptions,
        recordLabCompletion,
        cognitiveDeltaTrend,
        meanTVD,
      }}
    >
      {children}
    </QuantumSessionContext.Provider>
  )
}

export function useQuantumSession() {
  const ctx = useContext(QuantumSessionContext)
  if (!ctx) {
    throw new Error('useQuantumSession must be used within QuantumSessionProvider')
  }
  return ctx
}
