import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, PageHeader, Badge } from '../components/UI';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  BookOpen,
  Download,
  Search,
  Filter,
  Layers,
  Target,
  BarChart3,
  Atom,
  HelpCircle,
  FileSpreadsheet,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useRole } from '../providers/RoleProvider';
import {
  fetchClassrooms,
  fetchClassroomRoster,
  fetchClassroomMisconceptions,
  createClassroom,
  fetchAssignments,
  createAssignment,
  ClassroomItem,
  EnrolledStudent,
  ClassroomMisconceptionsResponse,
  MisconceptionPrevalenceItem,
  StudentMatrixRow,
  StudentMisconceptionStatus,
  ClassroomAssignment,
} from '../api/classrooms';

type ActiveTab = 'heatmap' | 'roster' | 'catalog';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, openAuthModal } = useAuth();
  const { role, setRole } = useRole();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [roster, setRoster] = useState<EnrolledStudent[]>([]);
  const [misconceptionsData, setMisconceptionsData] = useState<ClassroomMisconceptionsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('heatmap');
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [assignmentChoice, setAssignmentChoice] = useState('bell-phase');
  const [assignmentDueDate, setAssignmentDueDate] = useState(() => {
    const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
  const [assignmentError, setAssignmentError] = useState('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCreatingCohort, setIsCreatingCohort] = useState<boolean>(false);
  const [newCohortName, setNewCohortName] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'flagged' | 'clear'>('all');

  // Cell inspection drawer/modal
  const [inspectedCell, setInspectedCell] = useState<{
    student: StudentMatrixRow;
    misconception: MisconceptionPrevalenceItem;
    status: StudentMisconceptionStatus;
  } | null>(null);

  // Load classrooms list
  const loadClassroomsList = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchClassrooms(token);
      setClassrooms(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load classrooms', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedClassId]);

  // Load details for selected cohort (roster + misconceptions heatmap)
  const loadCohortData = useCallback(
    async (classId: string) => {
      if (!token) return;
      try {
        const [rosterData, miscData, assignmentData] = await Promise.all([
          fetchClassroomRoster(token, classId),
          fetchClassroomMisconceptions(token, classId),
          fetchAssignments(token, classId),
        ]);
        setRoster(rosterData);
        setMisconceptionsData(miscData);
        setAssignments(assignmentData);
      } catch (e) {
        console.error('Failed to load cohort telemetry', e);
      }
    },
    [token]
  );

  useEffect(() => {
    loadClassroomsList();
  }, [loadClassroomsList]);

  useEffect(() => {
    if (selectedClassId) {
      loadCohortData(selectedClassId);
    } else {
      setRoster([]);
      setMisconceptionsData(null);
      setAssignments([]);
    }
  }, [selectedClassId, loadCohortData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadClassroomsList();
    if (selectedClassId) {
      await loadCohortData(selectedClassId);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCreateAssignment = async () => {
    if (!token || !selectedClassId) return;
    const choices = {
      'phase-lesson': { title:'Global vs relative phase', activity_type:'lesson' as const, activity_id:'m04-superposition-interference/global-vs-relative-phase', route:'/learn/m04-superposition-interference/global-vs-relative-phase' },
      'bell-lab': { title:'Complete the Bell guided lab', activity_type:'guided' as const, activity_id:'bell-state:2', route:'/labs/guided/bell-state' },
      'bell-phase': { title:"Verify the Bell pair's hidden phase", activity_type:'challenge' as const, activity_id:'bell-phase-verification', route:'/challenges/bell-phase-verification' },
    };
    try {
      setAssignmentError('');
      const due_at = assignmentDueDate
        ? new Date(`${assignmentDueDate}T23:59:00`).toISOString()
        : null;
      const created = await createAssignment(token, selectedClassId, {
        ...choices[assignmentChoice as keyof typeof choices],
        due_at,
      });
      setAssignments(items => [created, ...items]);
    } catch (error) { setAssignmentError(error instanceof Error ? error.message : 'Could not create assignment'); }
  };

  const handleCreateCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName.trim() || !token) return;
    setCreateError(null);

    try {
      const created = await createClassroom(token, newCohortName.trim());
      setClassrooms((prev) => [created, ...prev]);
      setSelectedClassId(created.id);
      setNewCohortName('');
      setIsCreatingCohort(false);
    } catch (err: any) {
      setCreateError(err.message || 'Error creating cohort');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // CSV Export for current cohort
  const handleExportCSV = () => {
    if (!selectedClass || roster.length === 0) return;

    const headers = [
      'Student ID',
      'Full Name',
      'Email',
      'Enrolled Date',
      'Circuits Tested',
      'Overall Mastery (%)',
      'Active Misconceptions',
    ];

    const rows = roster.map((student) => {
      const studentMisc = misconceptionsData?.student_matrix.find(
        (m) => m.student_id === student.student_id
      );
      const activeMiscCount = studentMisc
        ? Object.values(studentMisc.misconceptions).filter(
            (s) => s.status === 'detected' || s.status === 'targeted'
          ).length
        : 0;

      return [
        student.student_id,
        `"${student.full_name}"`,
        student.email,
        new Date(student.enrolled_at).toISOString().split('T')[0],
        student.circuits_count,
        (student.overall_mastery * 100).toFixed(1),
        activeMiscCount,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedClass.name.replace(/\s+/g, '_')}_Roster_Telemetry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedClass = classrooms.find((c) => c.id === selectedClassId);
  const totalEnrolledAcrossAll = classrooms.reduce((acc, c) => acc + c.student_count, 0);

  // Filtered student matrix
  const filteredStudentMatrix = useMemo(() => {
    if (!misconceptionsData) return [];
    return misconceptionsData.student_matrix.filter((row) => {
      const matchesSearch =
        row.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.email.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const activeCount = Object.values(row.misconceptions).filter(
        (s) => s.status === 'detected' || s.status === 'targeted'
      ).length;

      if (statusFilter === 'flagged') return activeCount > 0;
      if (statusFilter === 'clear') return activeCount === 0;
      return true;
    });
  }, [misconceptionsData, searchQuery, statusFilter]);

  // Unauthenticated or not instructor
  if (!isAuthenticated || user?.role !== 'instructor') {
    return (
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-12 px-4">
        <PageHeader
          title="Institutional Quantum Learning Workspace"
          subtitle="Cohort administration, authentic enrollment codes, and empirical student diagnostics."
          icon="🏛️"
        />

        <Card className="p-8 text-center flex flex-col items-center justify-center gap-4 bg-surface border-border">
          <GraduationCap className="w-16 h-16 text-indigo-500 mb-2" />
          <h2 className="text-xl font-bold font-serif text-text-primary">
            Instructor Authentication Required
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            This dashboard displays genuine enrolled students, class access codes, and live laboratory telemetry. Please sign in or register with an Instructor account to view or create cohorts.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => openAuthModal('signup')}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-sm hover:bg-primary/95 transition-all"
            >
              Register as Instructor
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 border border-border text-text-primary text-sm font-semibold rounded-lg hover:bg-surface-secondary transition-all"
            >
              Sign In
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 px-4">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <PageHeader
            title="Institutional Quantum Learning Workspace"
            subtitle="Real cohort management, 6-character access codes, and empirical student telemetry."
            icon="🏛️"
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold">
              PS 26140 • Instructor Analytics
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              Database Persistence: Active
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-bold">
              Qiskit Aer Telemetry: Connected
            </span>
            <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
              Zero synthetic student datasets — strictly real enrolled learners
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end">
          <button
            onClick={handleExportCSV}
            disabled={!selectedClass || roster.length === 0}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-surface-secondary flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Export cohort roster and mastery metrics as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-surface-secondary flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Telemetry'}</span>
          </button>

          <button
            onClick={() => setIsCreatingCohort(true)}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/90 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Cohort</span>
          </button>
        </div>
      </div>

      {/* Create Cohort Modal */}
      {isCreatingCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface rounded-xl shadow-2xl border border-border p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base text-text-primary">Create New Cohort</h3>
              </div>
              <button
                onClick={() => setIsCreatingCohort(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCohort} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Cohort / Course Name
                </label>
                <input
                  type="text"
                  required
                  value={newCohortName}
                  onChange={(e) => setNewCohortName(e.target.value)}
                  placeholder="e.g. Quantum Computing II - Fall 2026"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="text-[11px] text-muted-foreground bg-slate-500/5 p-3 rounded-lg border border-border/50">
                A unique 6-character alphanumeric join code will automatically be assigned. Share this code with your students for instant enrollment into this cohort.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreatingCohort(false)}
                  className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 shadow-xs"
                >
                  Generate Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Metric Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col justify-between bg-surface border-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-medium">
            <span>Managed Cohorts</span>
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-text-primary">{classrooms.length}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Active institutional classrooms</div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between bg-surface border-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-medium">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-text-primary">
              {selectedClass ? selectedClass.student_count : totalEnrolledAcrossAll}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {selectedClass ? `Enrolled in ${selectedClass.name}` : 'Across all cohorts'}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between bg-surface border-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-medium">
            <span>Active Misconceptions</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-text-primary">
              {misconceptionsData?.active_misconceptions_count ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Requiring cognitive remediation</div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col justify-between bg-surface border-border">
          <div className="flex justify-between items-center text-text-muted text-xs font-medium">
            <span>Resolved Misconceptions</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-mono font-bold text-text-primary">
              {misconceptionsData?.resolved_misconceptions_count ?? 0}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Verified through conflict labs</div>
          </div>
        </Card>
      </div>

      {/* Main Workspace Layout */}
      {classrooms.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center gap-3 bg-surface border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-1" />
          <h3 className="text-lg font-bold text-text-primary">No Classroom Cohorts Created Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md">
            Create your first cohort to generate an authentic 6-character join code. Share the code with your students to populate your live roster and misconception heatmaps.
          </p>
          <button
            onClick={() => setIsCreatingCohort(true)}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Cohort</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Cohort Selector Sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Select Cohort
              </span>
              <span className="text-xs text-muted-foreground font-mono">{classrooms.length} active</span>
            </div>

            <div className="space-y-2">
              {classrooms.map((c) => {
                const isSelected = selectedClassId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20'
                        : 'bg-surface border-border hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-sm text-text-primary line-clamp-1">{c.name}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1 font-mono">
                        <Users className="w-3 h-3" /> {c.student_count}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(c.code);
                        }}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-primary hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Click to copy join code"
                      >
                        <span>{c.code}</span>
                        {copiedCode === c.code ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cohort Workspace Detail */}
          <div className="space-y-6">
            {selectedClass && (
              <Card className="p-6 bg-surface border-border space-y-6">
                {/* Cohort Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold font-serif text-text-primary">
                        {selectedClass.name}
                      </h3>
                      <Badge color="primary">Active Cohort</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span>Created {new Date(selectedClass.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{roster.length} Registered Learners</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-500/5 border border-border px-3.5 py-2 rounded-xl">
                    <span className="text-xs text-muted-foreground font-medium">Join Code:</span>
                    <span className="text-base font-mono font-bold text-primary tracking-widest">
                      {selectedClass.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(selectedClass.code)}
                      className="p-1 rounded text-muted-foreground hover:text-text-primary transition-colors"
                      title="Copy join code"
                    >
                      {copiedCode === selectedClass.code ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Workspace Navigation Tabs */}
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <button
                    onClick={() => setActiveTab('heatmap')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'heatmap'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Misconception Heatmap (8×Cohort)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('roster')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'roster'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Student Roster & Diagnostics ({roster.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('catalog')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'catalog'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <Atom className="w-3.5 h-3.5" />
                    <span>Catalog & Remediation Labs</span>
                  </button>
                </div>

                {/* TAB 1: COHORT MISCONCEPTION HEATMAP */}
                {activeTab === 'heatmap' && (
                  <div className="space-y-6">
                    {/* Prevalence Overview Bar Cards */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Cohort Misconception Prevalence Rates
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {misconceptionsData?.misconceptions.filter((m) => m.detected_count > 0).length || 0} active in this cohort
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {misconceptionsData?.misconceptions.map((m) => {
                          const hasActive = m.detected_count > 0;
                          return (
                            <div
                              key={m.id}
                              className={`p-3 rounded-xl border transition-all ${
                                hasActive
                                  ? 'bg-rose-500/5 border-rose-500/30'
                                  : 'bg-slate-500/5 border-border/60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-xs text-text-primary">{m.id}</span>
                                <span
                                  className={`text-[11px] font-mono font-bold ${
                                    hasActive ? 'text-rose-500' : 'text-muted-foreground'
                                  }`}
                                >
                                  {(m.prevalence_rate * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-xs font-medium text-text-primary truncate mt-1">
                                {m.title}
                              </div>
                              {/* Progress bar */}
                              <div className="w-full bg-border h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    hasActive ? 'bg-rose-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.max(m.prevalence_rate * 100, 4)}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                                <span>{m.detected_count} detected</span>
                                <span>{m.resolved_count} resolved</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive 8xCohort Matrix */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                            Student-Misconception Matrix
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            (Click any cell to inspect evidence and dispatch remediation)
                          </span>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search student..."
                              className="pl-8 pr-3 py-1 text-xs border border-border rounded-lg bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-48"
                            />
                          </div>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="px-2 py-1 text-xs border border-border rounded-lg bg-surface text-text-primary focus:outline-none"
                          >
                            <option value="all">All Students</option>
                            <option value="flagged">Active Misconceptions Only</option>
                            <option value="clear">Clear Only</option>
                          </select>
                        </div>
                      </div>

                      {roster.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-border rounded-xl bg-slate-500/5 flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 text-muted-foreground/40 mb-1" />
                          <div className="text-sm font-semibold text-text-primary">
                            No Students Enrolled Yet
                          </div>
                          <div className="text-xs text-muted-foreground max-w-sm">
                            Share join code <span className="font-mono font-bold text-primary">{selectedClass.code}</span> with learners. Once they participate in laboratory challenges, their cognitive misconceptions will plot across this heatmap.
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-border rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-500/5 border-b border-border text-muted-foreground font-semibold">
                              <tr>
                                <th className="py-3 px-4 min-w-[160px]">Student</th>
                                {misconceptionsData?.misconceptions.map((m) => (
                                  <th key={m.id} className="py-3 px-2 text-center min-w-[75px]" title={m.title}>
                                    <div className="font-mono font-bold text-text-primary">{m.id}</div>
                                    <div className="text-[10px] text-muted-foreground font-normal capitalize truncate max-w-[70px]">
                                      {m.category}
                                    </div>
                                  </th>
                                ))}
                                <th className="py-3 px-3 text-right">Mastery</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {filteredStudentMatrix.map((row) => (
                                <tr key={row.student_id} className="hover:bg-slate-500/5 transition-colors">
                                  <td className="py-3 px-4">
                                    <div className="font-medium text-text-primary">{row.full_name}</div>
                                    <div className="text-[11px] font-mono text-muted-foreground truncate max-w-[160px]">
                                      {row.email}
                                    </div>
                                  </td>

                                  {misconceptionsData?.misconceptions.map((meta) => {
                                    const statusObj = row.misconceptions[meta.id] || { status: 'unencountered' };
                                    const st = statusObj.status;

                                    return (
                                      <td
                                        key={meta.id}
                                        onClick={() =>
                                          setInspectedCell({
                                            student: row,
                                            misconception: meta,
                                            status: statusObj,
                                          })
                                        }
                                        className="py-3 px-2 text-center cursor-pointer group"
                                      >
                                        {st === 'detected' && (
                                          <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-500 font-mono font-bold text-[10px] shadow-xs group-hover:scale-105 transition-transform">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>Active</span>
                                          </span>
                                        )}
                                        {st === 'targeted' && (
                                          <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono font-bold text-[10px] group-hover:scale-105 transition-transform">
                                            <Target className="w-3 h-3" />
                                            <span>In Lab</span>
                                          </span>
                                        )}
                                        {st === 'resolved' && (
                                          <span className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-mono font-bold text-[10px] group-hover:scale-105 transition-transform">
                                            <CheckCircle2 className="w-3 h-3" />
                                            <span>Resolved</span>
                                          </span>
                                        )}
                                        {st === 'unencountered' && (
                                          <span className="text-muted-foreground/30 font-mono">—</span>
                                        )}
                                      </td>
                                    );
                                  })}

                                  <td className="py-3 px-3 text-right">
                                    <span className="font-mono font-bold text-primary">
                                      {(row.overall_mastery * 100).toFixed(0)}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: STUDENT ROSTER & DIAGNOSTICS */}
                {activeTab === 'roster' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-text-primary">Assign verified learning activity</div>
                          <div className="text-[11px] text-muted-foreground">Completion is calculated from server-graded evidence, not a learner checkbox.</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <label className="sr-only" htmlFor="assignment-activity">Learning activity</label>
                          <select id="assignment-activity" value={assignmentChoice} onChange={e => setAssignmentChoice(e.target.value)} className="rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                            <option value="phase-lesson">Phase lesson</option>
                            <option value="bell-lab">Bell guided lab</option>
                            <option value="bell-phase">Bell phase challenge</option>
                          </select>
                          <label className="sr-only" htmlFor="assignment-due-date">Due date</label>
                          <input
                            id="assignment-due-date"
                            type="date"
                            value={assignmentDueDate}
                            min={new Date().toISOString().slice(0, 10)}
                            onChange={e => setAssignmentDueDate(e.target.value)}
                            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs"
                          />
                          <button onClick={handleCreateAssignment} className="btn btn-primary text-xs"><Plus className="w-4 h-4" /> Assign</button>
                        </div>
                      </div>
                      {assignmentError && <p className="text-xs text-red-400">{assignmentError}</p>}
                      {assignments.length > 0 && <div className="grid md:grid-cols-2 gap-2">
                        {assignments.slice(0, 4).map(item => <div key={item.id} className="rounded-lg border border-border bg-surface/70 p-3 flex items-center justify-between gap-3">
                          <div><div className="text-xs font-semibold text-text-primary">{item.title}</div><div className="text-[10px] text-muted-foreground uppercase">{item.activity_type}{item.due_at ? ` · due ${new Date(item.due_at).toLocaleDateString()}` : ''}</div></div>
                          <Badge color={item.completed_count === item.student_count && item.student_count > 0 ? 'green' : 'cyan'}>{item.completed_count}/{item.student_count}</Badge>
                        </div>)}
                      </div>}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                        Verified Learner Roster
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {roster.length} registered students
                      </span>
                    </div>

                    {roster.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-border rounded-xl bg-slate-500/5 flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-muted-foreground/40 mb-1" />
                        <div className="text-sm font-semibold text-text-primary">
                          No Students Enrolled in this Cohort
                        </div>
                        <div className="text-xs text-muted-foreground max-w-sm">
                          Invite students by sharing code <span className="font-mono font-bold text-primary">{selectedClass.code}</span>.
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-500/5 border-b border-border text-muted-foreground font-semibold">
                            <tr>
                              <th className="py-3 px-4">Student Name</th>
                              <th className="py-3 px-4">Email</th>
                              <th className="py-3 px-4">Enrolled Date</th>
                              <th className="py-3 px-4 text-center">Verified evidence</th>
                              <th className="py-3 px-4 text-right">Verified score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {roster.map((s) => (
                              <tr key={s.student_id} className="hover:bg-slate-500/5 transition-colors">
                                <td className="py-3 px-4 font-medium text-text-primary">{s.full_name}</td>
                                <td className="py-3 px-4 font-mono text-muted-foreground">{s.email}</td>
                                <td className="py-3 px-4 text-muted-foreground">
                                  {new Date(s.enrolled_at).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4 text-center font-mono font-medium">
                                  {s.passed_attempts}/{s.verified_attempts} passed
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-20 bg-border h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${s.average_verified_score}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-bold text-primary">
                                      {s.average_verified_score.toFixed(0)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CANONICAL MISCONCEPTION CATALOG & LABS */}
                {activeTab === 'catalog' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                          8 Core Quantum Misconceptions Taxonomy
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Curated counter-intuitive benchmarks and cognitive conflict remediation protocols.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {misconceptionsData?.misconceptions.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 rounded-xl border border-border bg-surface-secondary/40 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                {m.id}
                              </span>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                {m.category}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-text-primary mt-2">{m.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {m.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-border/60">
                            <span className="text-[11px] font-mono text-muted-foreground">
                              Lab: {m.conflict_lab_id}
                            </span>
                            <button
                              onClick={() => navigate(m.recommended_route)}
                              className="px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                              <span>Launch Lab</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Misconception Cell Inspection Modal / Drawer */}
      <AnimatePresence>
        {inspectedCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border p-6 space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {inspectedCell.misconception.id}
                    </span>
                    <h3 className="font-bold text-base text-text-primary">
                      {inspectedCell.misconception.title}
                    </h3>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Student: <span className="font-semibold text-text-primary">{inspectedCell.student.full_name}</span> ({inspectedCell.student.email})
                  </div>
                </div>

                <button
                  onClick={() => setInspectedCell(null)}
                  className="text-text-muted hover:text-text-primary p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Current Status:</span>
                {inspectedCell.status.status === 'detected' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 font-mono font-bold text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Active Misconception
                  </span>
                )}
                {inspectedCell.status.status === 'targeted' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 font-mono font-bold text-xs flex items-center gap-1">
                    <Target className="w-3 h-3" /> Under Active Remediation
                  </span>
                )}
                {inspectedCell.status.status === 'resolved' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-mono font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Successfully Resolved
                  </span>
                )}
                {inspectedCell.status.status === 'unencountered' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-border text-muted-foreground font-mono text-xs">
                    Unencountered / Not Triggered
                  </span>
                )}
              </div>

              {/* Scientific Truth vs Flawed Concept */}
              <div className="space-y-3 bg-slate-500/5 p-4 rounded-xl border border-border/60 text-xs">
                <div>
                  <span className="font-bold text-text-primary">Flawed Mental Model:</span>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    {inspectedCell.misconception.description}
                  </p>
                </div>

                {inspectedCell.status.evidence && (
                  <div className="pt-2 border-t border-border/40">
                    <span className="font-bold text-text-primary">Recorded Empirical Evidence:</span>
                    <p className="text-muted-foreground font-mono mt-0.5 text-[11px]">
                      {inspectedCell.status.evidence}
                    </p>
                  </div>
                )}
              </div>

              {/* Remediation Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setInspectedCell(null)}
                  className="px-3.5 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectedCell(null);
                    navigate(inspectedCell.misconception.recommended_route);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 flex items-center gap-1.5 shadow-xs"
                >
                  <span>Launch Remediation Lab</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
