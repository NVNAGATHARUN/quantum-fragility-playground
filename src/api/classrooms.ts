/**
 * Classroom Management & Telemetry API Client for Quantum Lens AI.
 * Strictly communicates with /api/v1/classrooms endpoints.
 */

export interface ClassroomItem {
  id: string;
  name: string;
  code: string;
  instructor_id: string;
  created_at: string;
  student_count: number;
}

export interface EnrolledStudent {
  student_id: string;
  full_name: string;
  email: string;
  enrolled_at: string;
  overall_mastery: number;
  circuits_count: number;
  verified_attempts: number;
  passed_attempts: number;
  average_verified_score: number;
  latest_verified_at?: string | null;
}

export interface ClassroomAssignment {
  id: string; title: string; activity_type: 'lesson' | 'guided' | 'challenge'; activity_id: string;
  route: string; due_at?: string | null; created_at: string; completed_count: number; student_count: number;
  current_user_completed?: boolean;
}

export interface MisconceptionPrevalenceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  conflict_lab_id: string;
  recommended_route: string;
  detected_count: number;
  resolved_count: number;
  prevalence_rate: number;
}

export interface StudentMisconceptionStatus {
  misconception_id: string;
  status: 'detected' | 'targeted' | 'resolved' | 'unencountered';
  detected_at?: string | null;
  resolved_at?: string | null;
  evidence?: string | null;
}

export interface StudentMatrixRow {
  student_id: string;
  full_name: string;
  email: string;
  overall_mastery: number;
  circuits_count: number;
  misconceptions: Record<string, StudentMisconceptionStatus>;
}

export interface ClassroomMisconceptionsResponse {
  classroom_id: string;
  classroom_name: string;
  classroom_code: string;
  total_students: number;
  active_misconceptions_count: number;
  resolved_misconceptions_count: number;
  misconceptions: MisconceptionPrevalenceItem[];
  student_matrix: StudentMatrixRow[];
}

export async function fetchClassrooms(token: string): Promise<ClassroomItem[]> {
  const res = await fetch('/api/v1/classrooms', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load classrooms');
  }
  return res.json();
}

export async function fetchClassroomRoster(token: string, classId: string): Promise<EnrolledStudent[]> {
  const res = await fetch(`/api/v1/classrooms/${classId}/roster`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load roster');
  }
  return res.json();
}

export async function fetchClassroomMisconceptions(
  token: string,
  classId: string
): Promise<ClassroomMisconceptionsResponse> {
  const res = await fetch(`/api/v1/classrooms/${classId}/misconceptions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to load cohort misconceptions');
  }
  return res.json();
}

export async function createClassroom(token: string, name: string): Promise<ClassroomItem> {
  const res = await fetch('/api/v1/classrooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create classroom' }));
    throw new Error(err.detail || 'Failed to create classroom');
  }
  return res.json();
}

export async function enrollInClassroom(
  token: string,
  code: string
): Promise<{ success: boolean; message: string; classroom_id: string; classroom_name: string; code: string }> {
  const res = await fetch('/api/v1/classrooms/enroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Enrollment failed' }));
    throw new Error(err.detail || 'Enrollment failed');
  }
  return res.json();
}

export async function fetchAssignments(token: string, classId: string): Promise<ClassroomAssignment[]> {
  const res = await fetch(`/api/v1/classrooms/${classId}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Failed to load assignments');
  return res.json();
}

export async function createAssignment(token: string, classId: string, body: Omit<ClassroomAssignment, 'id'|'created_at'|'completed_count'|'student_count'|'current_user_completed'>): Promise<ClassroomAssignment> {
  const res = await fetch(`/api/v1/classrooms/${classId}/assignments`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(body) });
  if (!res.ok) throw new Error('Failed to create assignment');
  return res.json();
}
