export type HistorySessionSummary = {
  id: number
  sessionDate: string
  name: string
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
  matchCount: number
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
  games: number
  lastMatchEndedAt: string | null
}

export type HistoryDetail = {
  session: HistorySessionSummary
  matches: HistoryMatch[]
  members: HistoryMemberSummary[]
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
