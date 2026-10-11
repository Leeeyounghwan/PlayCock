import type { LiveCourt, LiveParticipant, LiveSnapshot, LiveStatusGroups } from './liveTypes'

const waitingParticipants: LiveParticipant[] = [
  { id: 5, memberId: 5, name: '서현', grade: 'B', status: 'WAITING', games: 1, waitMinutes: 18, ageBand: '30대', gender: '여' },
  { id: 6, memberId: 6, name: '지훈', grade: 'C', status: 'WAITING', games: 2, waitMinutes: 14, ageBand: '30대', gender: '남' },
  { id: 7, memberId: 7, name: '은지', grade: '초심', status: 'WAITING', games: 1, waitMinutes: 12, ageBand: '20대', gender: '여' },
  { id: 8, memberId: 8, name: '하늘', grade: '입문', status: 'WAITING', games: 0, waitMinutes: 9, ageBand: '20대', gender: '남' },
  { id: 9, memberId: 9, name: '최지수', grade: 'C', status: 'WAITING', games: 2, waitMinutes: 11, ageBand: '30대', gender: '여', recentlyPlayed: true },
  { id: 10, memberId: 10, name: '정우', grade: '초심', status: 'WAITING', games: 1, waitMinutes: 9, ageBand: '40대', gender: '남' },
]

const playingParticipants: LiveParticipant[] = [
  { id: 1, memberId: 1, name: '김민수', grade: 'B', status: 'PLAYING', games: 1, waitMinutes: 0, ageBand: '30대', gender: '남' },
  { id: 2, memberId: 2, name: '박준호', grade: 'D', status: 'PLAYING', games: 1, waitMinutes: 0, ageBand: '20대', gender: '남' },
  { id: 3, memberId: 3, name: '이영희', grade: 'C', status: 'PLAYING', games: 1, waitMinutes: 0, ageBand: '30대', gender: '여' },
  { id: 4, memberId: 4, name: '정가람', grade: '초심', status: 'PLAYING', games: 1, waitMinutes: 0, ageBand: '20대', gender: '여' },
]

const withQueueTime = (player: LiveParticipant, now: number) => ({
  ...player,
  queuedAt: now - player.waitMinutes * 60_000,
})

export function createInitialLiveSnapshot(now = Date.now()): LiveSnapshot {
  const statusGroups: LiveStatusGroups = {
    휴식: [],
    레슨: [],
    미입장: [],
    불참: [],
  }

  const courts: LiveCourt[] = [
    { id: 1, name: '8코트', status: 'IN_USE', players: playingParticipants, elapsed: '08:32', startedAt: now },
    { id: 2, name: '1코트', status: 'OPEN', players: null },
    { id: 3, name: '3코트', status: 'OPEN', players: null },
    { id: 4, name: '11코트', status: 'OPEN', players: null },
  ]

  return {
    session: {
      id: 1,
      name: '화요모임',
      date: '2026-09-22',
      title: 'PlayCock · 화요모임',
      status: 'OPEN',
      inviteCode: 'PLAY0922',
    },
    queue: waitingParticipants.map((player) => withQueueTime(player, now)),
    courts,
    waitingMatches: [],
    statusGroups,
  }
}
