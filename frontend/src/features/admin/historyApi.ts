export type HistorySessionSummary = {
  id: number
  sessionDate: string
  name: string
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
  matchCount: number
  participantCount: number
  absentCount: number
  notArrivedCount: number
}

export type HistorySessionStats = {
  totalParticipants: number
  playedParticipants: number
  totalMatches: number
  absentCount: number
  notArrivedCount: number
  noGameCount: number
}

export type HistoryPlayer = {
  id: number
  name: string
  grade: string
  games: number
}

export type HistoryMatch = {
  id: number
  courtName: string | null
  startedAt: string | null
  finishedAt: string | null
  durationSeconds: number
  teamA: HistoryPlayer[]
  teamB: HistoryPlayer[]
}

export type HistoryMemberSummary = {
  participantId: number
  memberId: number
  name: string
  grade: string
  status: 'WAITING' | 'MATCH_READY' | 'PLAYING' | 'RESTING' | 'LESSON' | 'NOT_ARRIVED' | 'ABSENT'
  attendanceLabel: string
  games: number
  checkedInAt: string | null
  lastMatchEndedAt: string | null
}

export type HistoryCourtSummary = {
  courtName: string
  matchCount: number
  totalDurationSeconds: number
  matches: HistoryMatch[]
}

export type HistoryDetail = {
  session: HistorySessionSummary
  summary: HistorySessionStats
  matches: HistoryMatch[]
  members: HistoryMemberSummary[]
  courtHistories: HistoryCourtSummary[]
}

export async function fetchHistorySessions(): Promise<HistorySessionSummary[]> {
  const response = await fetch('/api/admin/history/sessions')
  if (!response.ok) throw new Error('History sessions request failed')
  return await response.json() as HistorySessionSummary[]
}

export async function fetchHistoryDetail(sessionId: number): Promise<HistoryDetail> {
  const response = await fetch(`/api/admin/history/sessions/${sessionId}`)
  if (!response.ok) throw new Error('History detail request failed')
  return await response.json() as HistoryDetail
}
