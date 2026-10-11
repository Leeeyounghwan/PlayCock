import type { LiveCourt, LiveParticipant, LiveSnapshot, LiveStatusGroups, ParticipantStatus } from './liveTypes'

type ApiStatusGroups = {
  rest: LiveParticipant[]
  lesson: LiveParticipant[]
  notArrived: LiveParticipant[]
  absent: LiveParticipant[]
}

type ApiQueueBoard = {
  queue: LiveParticipant[]
  statusGroups: ApiStatusGroups
}

type ApiSnapshot = Omit<LiveSnapshot, 'statusGroups'> & {
  statusGroups: ApiStatusGroups
}

type CourtPayload = {
  name: string
  sortOrder: number
  status: LiveCourt['status']
}

const gradeToApi = (grade: string) => {
  const grades: Record<string, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    초심: 'BEGINNER',
    왕초심: 'NEWCOMER',
    입문: 'INTRO',
  }
  return grades[grade] ?? grade
}

const genderToApi = (gender?: string) => {
  const genders: Record<string, string> = {
    남: 'MALE',
    여: 'FEMALE',
  }
  return genders[gender ?? ''] ?? gender ?? 'MALE'
}

const statusGroupsFromApi = (groups: ApiStatusGroups): LiveStatusGroups => ({
  휴식: groups.rest.map(normalizeParticipant),
  레슨: groups.lesson.map(normalizeParticipant),
  미입장: groups.notArrived.map(normalizeParticipant),
  불참: groups.absent.map(normalizeParticipant),
})

const normalizeParticipant = (participant: LiveParticipant): LiveParticipant => {
  const checkedInAt = participant.checkedInAt ? Date.parse(participant.checkedInAt) : undefined

  return {
    ...participant,
    queuedAt: participant.status === 'WAITING'
      ? Number.isFinite(checkedInAt) ? checkedInAt : Date.now() - participant.waitMinutes * 60_000
      : undefined,
  }
}

const normalizeCourt = (court: LiveCourt): LiveCourt => ({
  ...court,
  players: court.players?.map(normalizeParticipant) ?? null,
  startedAt: typeof court.startedAt === 'string' ? Date.parse(court.startedAt) : court.startedAt,
})

export async function fetchLiveSnapshot(sessionId: number): Promise<LiveSnapshot> {
  const response = await fetch(`/api/live/sessions/${sessionId}/snapshot`)
  if (!response.ok) throw new Error('Live snapshot request failed')
  const snapshot = await response.json() as ApiSnapshot

  return {
    ...snapshot,
    queue: snapshot.queue.map(normalizeParticipant),
    courts: snapshot.courts.map(normalizeCourt),
    waitingMatches: snapshot.waitingMatches.map((match) => ({
      ...match,
      players: match.players.map(normalizeParticipant),
    })),
    statusGroups: statusGroupsFromApi(snapshot.statusGroups),
  }
}

export async function fetchQueueBoard(sessionId: number) {
  const response = await fetch(`/api/live/sessions/${sessionId}/queue-board`)
  if (!response.ok) throw new Error('Queue board request failed')
  const board = await response.json() as ApiQueueBoard

  return {
    queue: board.queue.map(normalizeParticipant),
    statusGroups: statusGroupsFromApi(board.statusGroups),
  }
}

export async function updateLiveParticipant(participant: LiveParticipant, status: ParticipantStatus) {
  const response = await fetch(`/api/admin/session-participants/${participant.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status,
      name: participant.name,
      grade: gradeToApi(participant.grade),
      gender: genderToApi(participant.gender),
      ageBand: participant.ageBand,
    }),
  })

  if (!response.ok) throw new Error('Participant update request failed')
}

export async function createCourt(sessionId: number, court: CourtPayload): Promise<LiveCourt> {
  const response = await fetch(`/api/admin/sessions/${sessionId}/courts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(court),
  })

  if (!response.ok) throw new Error('Court create request failed')
  return normalizeCourt(await response.json() as LiveCourt)
}

export async function updateCourt(courtId: number, court: CourtPayload): Promise<LiveCourt> {
  const response = await fetch(`/api/admin/courts/${courtId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(court),
  })

  if (!response.ok) throw new Error('Court update request failed')
  return normalizeCourt(await response.json() as LiveCourt)
}

export async function deleteCourt(courtId: number) {
  const response = await fetch(`/api/admin/courts/${courtId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Court delete request failed')
}

export async function createWaitingMatch(sessionId: number, participantIds: number[]) {
  const response = await fetch(`/api/admin/sessions/${sessionId}/matches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantIds }),
  })

  if (!response.ok) throw new Error('Match create request failed')
}

export async function cancelWaitingMatch(matchId: number) {
  const response = await fetch(`/api/admin/matches/${matchId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Match cancel request failed')
}

export async function startWaitingMatch(matchId: number, courtId: number) {
  const response = await fetch(`/api/admin/matches/${matchId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courtId }),
  })

  if (!response.ok) throw new Error('Match start request failed')
}

export async function finishPlayingMatch(matchId: number) {
  const response = await fetch(`/api/admin/matches/${matchId}/finish`, { method: 'POST' })
  if (!response.ok) throw new Error('Match finish request failed')
}
