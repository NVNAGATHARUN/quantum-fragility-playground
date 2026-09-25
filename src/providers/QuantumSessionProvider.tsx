import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  fetchSessionAnalytics,
  simulateCircuit,
  type AnalyticsSession,
  type CompetencyDomain,
  type LabResult,
} from '../api/quantum'
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
  competencyData: CompetencyDomain[]
  cognitiveDeltaTrend: Array<{ lab: string; tvd: number; accuracy: number }>
  cohortAnalytics: AnalyticsSession | null
  overallMastery: number
  meanTVD: number
  isLoading: boolean
  kernelStatus: 'live' | 'analytical'
  refreshSession: () => Promise<void>
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


  const [cohortAnalytics, setCohortAnalytics] = useState<AnalyticsSession | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [kernelStatus, setKernelStatus] = useState<'live' | 'analytical'>('analytical')

  // Load backend analytics session
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchSessionAnalytics()
      setCohortAnalytics(data)
      setKernelStatus(data.kernelVersion.includes('Qiskit Aer') ? 'live' : 'analytical')
    } catch (err) {
      console.error('Failed to load session analytics', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

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

  // Grounded Overall Mastery: 0 if no records, otherwise derived from TVD accuracy and cleared labs
  const overallMastery =
    labRecords.length === 0
      ? 0.0
      : Math.round(((labRecords.filter(r => r.resolved).length / 8) * 60 + (1 - meanTVD) * 40) * 10) / 10

  // 6-Domain Competency Radar: Derived strictly from learner activity
  const domainDefs = [
    { domain: 'Superposition', reqMisc: 'M01', label: 'Phase Interference & Measurement' },
    { domain: 'Interference', reqMisc: 'M01', label: 'Constructive vs Destructive Interference' },
    { domain: 'Entanglement', reqMisc: 'M02', label: 'Bell States & Quantum Correlation' },
    { domain: 'Decoherence (T₁,T₂)', reqMisc: 'M03', label: 'Kraus Amplitude & Phase Damping' },
    { domain: 'Hardware Awareness', reqMisc: 'M04', label: 'Measurement & Apparatus Back-Action' },
    { domain: 'Algorithms', reqMisc: 'M05', label: 'Entangling Gates & Multi-Qubit Unitaries' },
  ]

  const competencyData = domainDefs.map(({ domain, reqMisc, label }) => {
    const record = labRecords.find(r => r.misconceptionId === reqMisc)
    if (!record) {
      return {
        domain,
        score: 0,
        fullMark: 100,
        derivation: `Pending laboratory exploration: ${label}`,
      }
    }
    const score = record.resolved
      ? Math.round((1 - record.tvd) * 100)
      : Math.round((1 - record.tvd) * 50)
    return {
      domain,
      score,
      fullMark: 100,
      derivation: record.evidence || `Evaluated via ${record.title} (${(1 - record.tvd).toFixed(2)} accuracy)`,
    }
  })


  return (
    <QuantumSessionContext.Provider
      value={{
        simulatedCircuitsCount,
        recordCircuitRun,
        labRecords,
        resolvedMisconceptions,
        recordLabCompletion,
        competencyData,
        cognitiveDeltaTrend,
        cohortAnalytics,

        overallMastery,
        meanTVD,
        isLoading,
        kernelStatus,
        refreshSession,
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
