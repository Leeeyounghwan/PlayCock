export type MonthlySummary = {
  sessionCount: number
  participantCount: number
  playedParticipantCount: number
  matchCount: number
  absentCount: number
  notArrivedCount: number
  noGameCount: number
}

export type MemberMonthlyStat = {
  memberId: number
  name: string
  grade: string
  sessionCount: number
  gameCount: number
  absentCount: number
  notArrivedCount: number
  noGameCount: number
  lastSessionDate: string | null
}

export type SessionMonthlyStat = {
  sessionId: number
  sessionDate: string
  name: string
  participantCount: number
  playedParticipantCount: number
  matchCount: number
  absentCount: number
  notArrivedCount: number
  noGameCount: number
}

export type PairMonthlyStat = {
  label: string
  count: number
}

export type MonthlyAnalytics = {
  month: string
  summary: MonthlySummary
  memberStats: MemberMonthlyStat[]
  sessionStats: SessionMonthlyStat[]
  partnerPairs: PairMonthlyStat[]
}

export async function fetchMonthlyAnalytics(month: string): Promise<MonthlyAnalytics> {
  const response = await fetch(`/api/admin/analytics/monthly?month=${encodeURIComponent(month)}`)
  if (!response.ok) throw new Error('Monthly analytics request failed')
  return await response.json() as MonthlyAnalytics
}
