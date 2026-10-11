export type ParticipantStatus = 'WAITING' | 'MATCH_READY' | 'PLAYING' | 'RESTING' | 'LESSON' | 'NOT_ARRIVED' | 'ABSENT'

export type LiveSession = {
  id: number
  name: string
  date: string
  title: string
  status: 'PLANNED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
  inviteCode?: string
}

export type LiveParticipant = {
  id: number
  memberId: number
  name: string
  grade: string
  status: ParticipantStatus
  games: number
  waitMinutes: number
  ageBand?: string
  gender?: string
  queuedAt?: number
  recentlyPlayed?: boolean
  checkedInAt?: string
  lastMatchEndedAt?: string
}

export type LiveMatch = {
  id: number
  players: LiveParticipant[]
  courtName?: string
  status?: 'READY' | 'PLAYING' | 'FINISHED' | 'CANCELLED'
}

export type LiveCourt = {
  id: number
  name: string
  status: 'OPEN' | 'PAUSED' | 'IN_USE' | 'CLOSED'
  matchId?: number | null
  players: LiveParticipant[] | null
  elapsed?: string
  startedAt?: number
}

export type StatusGroupName = '휴식' | '레슨' | '미입장' | '불참'

export type LiveStatusGroups = Record<StatusGroupName, LiveParticipant[]>

export type LiveSnapshot = {
  session: LiveSession
  queue: LiveParticipant[]
  courts: LiveCourt[]
  waitingMatches: LiveMatch[]
  statusGroups: LiveStatusGroups
}
