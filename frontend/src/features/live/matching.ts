import type { LiveParticipant } from './liveTypes'

export type QueueParticipant = LiveParticipant

const gradeScore: Record<string, number> = {
  A: 7,
  B: 6,
  C: 5,
  D: 4,
  초심: 3,
  왕초심: 2,
  입문: 1,
}

export function recommendMatch(queue: QueueParticipant[]) {
  const candidates = [...queue]
    .sort((a, b) => {
      const aScore = a.games * 20 + (a.recentlyPlayed ? 10 : 0) - a.waitMinutes
      const bScore = b.games * 20 + (b.recentlyPlayed ? 10 : 0) - b.waitMinutes
      return aScore - bScore
    })
    .slice(0, 4)
    .sort((a, b) => (gradeScore[b.grade] ?? 0) - (gradeScore[a.grade] ?? 0))

  if (candidates.length < 4) {
    return candidates
  }

  return [candidates[0], candidates[3], candidates[1], candidates[2]]
}

export function teamScore(players: QueueParticipant[]) {
  return players.reduce((sum, player) => sum + (gradeScore[player.grade] ?? 0), 0)
}
