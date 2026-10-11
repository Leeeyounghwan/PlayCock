export type AdminSession = {
  id: number
  sessionDate: string
  name: string
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
  inviteCode?: string | null
}

export type AdminMember = {
  id: number
  name: string
  grade: 'A' | 'B' | 'C' | 'D' | 'BEGINNER' | 'NEWCOMER' | 'INTRO'
  gender: 'MALE' | 'FEMALE'
  ageBand?: string | null
  active: boolean
}

export type AdminParticipant = {
  id: number
  memberId: number
  gradeSnapshot: AdminMember['grade']
  status: 'WAITING' | 'MATCH_READY' | 'PLAYING' | 'RESTING' | 'LESSON' | 'NOT_ARRIVED' | 'ABSENT'
  checkedInAt?: string | null
  gameCount: number
}

export type AdminCourt = {
  id: number
  name: string
  sortOrder: number
  status: 'OPEN' | 'PAUSED' | 'IN_USE' | 'CLOSED'
}

export async function fetchSessions(): Promise<AdminSession[]> {
  const response = await fetch('/api/admin/sessions')
  if (!response.ok) throw new Error('Sessions request failed')
  return await response.json() as AdminSession[]
}

export async function createSession(sessionDate: string, name: string): Promise<AdminSession> {
  const response = await fetch('/api/admin/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionDate, name }),
  })
  if (!response.ok) throw new Error('Session create request failed')
  return await response.json() as AdminSession
}

export async function openSession(sessionId: number): Promise<AdminSession> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/open`, { method: 'POST' })
  if (!response.ok) throw new Error('Session open request failed')
  return await response.json() as AdminSession
}

export async function closeSession(sessionId: number): Promise<AdminSession> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/close`, { method: 'POST' })
  if (!response.ok) throw new Error('Session close request failed')
  return await response.json() as AdminSession
}

export async function regenerateInviteCode(sessionId: number): Promise<AdminSession> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/invite-code`, { method: 'POST' })
  if (!response.ok) throw new Error('Session invite code regenerate request failed')
  return await response.json() as AdminSession
}

export async function fetchMembers(): Promise<AdminMember[]> {
  const response = await fetch('/api/admin/members')
  if (!response.ok) throw new Error('Members request failed')
  return await response.json() as AdminMember[]
}

export async function fetchSessionParticipants(sessionId: number): Promise<AdminParticipant[]> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/participants`)
  if (!response.ok) throw new Error('Session participants request failed')
  return await response.json() as AdminParticipant[]
}

export async function importSessionParticipants(sessionId: number, memberIds: number[]): Promise<AdminParticipant[]> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/participants/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memberIds }),
  })
  if (!response.ok) throw new Error('Session participant import request failed')
  return await response.json() as AdminParticipant[]
}

export async function deleteSessionParticipant(participantId: number): Promise<void> {
  const response = await fetch(`/api/admin/session-participants/${participantId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Session participant delete request failed')
}

export async function fetchSessionCourts(sessionId: number): Promise<AdminCourt[]> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/courts`)
  if (!response.ok) throw new Error('Session courts request failed')
  return await response.json() as AdminCourt[]
}
