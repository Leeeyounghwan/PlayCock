import AppCard from '@/components/common/AppCard'
import CourtCard from '@/components/playcock/CourtCard'
import { useEffect, useState } from 'react'
import { fetchSessions } from '../admin/sessionApi'
import {
  cancelWaitingMatch as cancelWaitingMatchRequest,
  createCourt,
  createWaitingMatch as createWaitingMatchRequest,
  deleteCourt as deleteCourtRequest,
  fetchLiveSnapshot,
  fetchQueueBoard,
  finishPlayingMatch,
  startWaitingMatch,
  updateCourt,
  updateLiveParticipant,
} from './liveApi'
import type { LiveCourt, LiveMatch, LiveSnapshot, LiveStatusGroups, StatusGroupName } from './liveTypes'
import { recommendMatch, teamScore, type QueueParticipant } from './matching'

type ModalMode = 'create' | 'waiting' | 'finish' | 'assign' | 'court'
type CourtDraft = LiveCourt & { isNew?: boolean }

const relationLines = [
  { key: '0-1', x1: 25, y1: 25, x2: 25, y2: 75, x: 25, y: 50, count: 2, kind: 'partner' },
  { key: '2-3', x1: 75, y1: 25, x2: 75, y2: 75, x: 75, y: 50, count: 0, kind: 'partner' },
  { key: '0-2', x1: 25, y1: 25, x2: 75, y2: 25, x: 50, y: 25, count: 1, kind: 'opponent' },
  { key: '0-3', x1: 25, y1: 25, x2: 75, y2: 75, x: 50, y: 50, count: 3, kind: 'warning' },
  { key: '1-2', x1: 25, y1: 75, x2: 75, y2: 25, x: 50, y: 50, count: 1, kind: 'opponent' },
  { key: '1-3', x1: 25, y1: 75, x2: 75, y2: 75, x: 50, y: 75, count: 2, kind: 'opponent' },
]
const emptyMatch = [null, null, null, null] satisfies Array<QueueParticipant | null>

const label = (player: QueueParticipant) => `${player.name} ${player.grade}`
const compactMatch = (players: QueueParticipant[]) => `${label(players[0])} · ${label(players[1])} vs ${label(players[2])} · ${label(players[3])}`
const statusClass: Record<string, string> = { 휴식: 'rest', 레슨: 'lesson', 미입장: 'not-arrived', 불참: 'absent' }
const statusGroupNames: StatusGroupName[] = ['휴식', '레슨', '미입장', '불참']
const emptyStatusGroups = (): LiveStatusGroups => ({ 휴식: [], 레슨: [], 미입장: [], 불참: [] })
const createIdleLiveSnapshot = (): LiveSnapshot => ({
  session: {
    id: 0,
    name: '',
    date: '',
    title: 'PlayCock · Live Board',
    status: 'PLANNED',
  },
  queue: [],
  courts: [],
  waitingMatches: [],
  statusGroups: emptyStatusGroups(),
})
const participantOptions = {
  grade: ['A', 'B', 'C', 'D', '초심', '왕초심', '입문'],
  ageBand: ['20대', '30대', '40대', '50대'],
  gender: ['남', '여'],
}
const participantLabels: Record<keyof typeof participantOptions, string> = { grade: '급수', ageBand: '연령대', gender: '성별' }
const statusByTarget = {
  대기열: 'WAITING',
  휴식: 'RESTING',
  레슨: 'LESSON',
  미입장: 'NOT_ARRIVED',
  불참: 'ABSENT',
} as const

const waitStartedAt = (player: QueueParticipant) => player.queuedAt ?? Date.now() - player.waitMinutes * 60_000

const sortByLongestWait = (players: QueueParticipant[]) => [...players].sort((a, b) => {
  const waitDiff = waitStartedAt(a) - waitStartedAt(b)
  return waitDiff || a.id - b.id
})

const unavailableParticipantIds = (courts: LiveCourt[], waitingMatches: LiveMatch[]) => new Set([
  ...courts.flatMap((court) => court.players?.map((player) => player.id) ?? []),
  ...waitingMatches.flatMap((match) => match.players.map((player) => player.id)),
])

const syncQueueBoard = (
  nextQueue: QueueParticipant[],
  currentQueue: QueueParticipant[],
  courts: LiveCourt[],
  waitingMatches: LiveMatch[],
) => {
  const currentById = new Map(currentQueue.map((player) => [player.id, player]))
  const unavailableIds = unavailableParticipantIds(courts, waitingMatches)

  return sortByLongestWait(nextQueue
    .filter((player) => !unavailableIds.has(player.id))
    .map((player) => {
      const currentPlayer = currentById.get(player.id)
      if (!currentPlayer?.queuedAt) return player

      return {
        ...player,
        waitMinutes: currentPlayer.waitMinutes,
        queuedAt: currentPlayer.queuedAt,
      }
    }))
}
const elapsedSeconds = (elapsed?: string) => {
  const [minutes = '0', seconds = '0'] = elapsed?.split(':') ?? []
  return Number(minutes) * 60 + Number(seconds)
}
const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}
const canAssignCourt = (court: LiveCourt) => court.status === 'OPEN' && !court.players
const courtDraftKey = (court: CourtDraft) => court.isNew ? `new-${court.id}` : `court-${court.id}`

export default function AdminShellPage() {
  const [now, setNow] = useState(() => Date.now())
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot>(() => createIdleLiveSnapshot())
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [queue, setQueue] = useState<QueueParticipant[]>(() => sortByLongestWait(liveSnapshot.queue))
  const [courts, setCourts] = useState<LiveCourt[]>(() => liveSnapshot.courts)
  const [waitingMatches, setWaitingMatches] = useState<LiveMatch[]>(() => liveSnapshot.waitingMatches)
  const [statusGroups, setStatusGroups] = useState<LiveStatusGroups>(() => liveSnapshot.statusGroups)
  const [participant, setParticipant] = useState<QueueParticipant | null>(null)
  const [participantDraft, setParticipantDraft] = useState<QueueParticipant | null>(null)
  const [participantTarget, setParticipantTarget] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [matchOpen, setMatchOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('create')
  const [activeMatchId, setActiveMatchId] = useState<number | null>(null)
  const [activeCourt, setActiveCourt] = useState<string | null>(null)
  const [selectedCourtName, setSelectedCourtName] = useState(liveSnapshot.courts[0]?.name ?? '')
  const [courtManageOpen, setCourtManageOpen] = useState(false)
  const [courtDrafts, setCourtDrafts] = useState<CourtDraft[]>([])
  const [matchPlayers, setMatchPlayers] = useState<Array<QueueParticipant | null>>(emptyMatch)
  const [message, setMessage] = useState('진행중인 세션을 찾는 중입니다.')
  const sessionId = activeSessionId ?? 0
  const hasOpenSession = activeSessionId !== null

  const filledPlayers = matchPlayers.filter((player): player is QueueParticipant => Boolean(player))
  const balanceDiff = Math.abs(teamScore(matchPlayers.slice(0, 2).filter((player): player is QueueParticipant => Boolean(player))) - teamScore(matchPlayers.slice(2, 4).filter((player): player is QueueParticipant => Boolean(player))))
  const balanceLabel = filledPlayers.length < 4 ? '부적합' : balanceDiff === 0 ? '최적' : balanceDiff <= 2 ? '적합' : '부적합'
  const balanceClass = balanceLabel === '최적' ? 'good' : balanceLabel === '적합' ? 'ok' : 'bad'
  const duplicateRelations = relationLines.filter((line) => {
    const [a, b] = line.key.split('-').map(Number)
    return matchPlayers[a] && matchPlayers[b] && line.count > 0
  })
  const waitSeconds = (player: QueueParticipant) => Math.max(0, player.queuedAt ? Math.floor((now - player.queuedAt) / 1000) : player.waitMinutes * 60)
  const waitMinutes = (player: QueueParticipant) => Math.floor(waitSeconds(player) / 60)
  const waitLabel = (player: QueueParticipant) => {
    const seconds = waitSeconds(player)
    return formatSeconds(seconds)
  }
  const courtElapsed = (court: LiveCourt) => court.players && court.elapsed ? formatSeconds(elapsedSeconds(court.elapsed) + Math.floor((now - (court.startedAt ?? now)) / 1000)) : undefined
  const courtTeams = (court: LiveCourt) => {
    if (court.players) {
      return {
        teamA: [label(court.players[0]), label(court.players[1])],
        teamB: [label(court.players[2]), label(court.players[3])],
      }
    }

    return court.status === 'PAUSED'
      ? { teamA: ['일시중지'], teamB: ['매치 배정 제외'] }
      : { teamA: ['비어있음'], teamB: ['대기 매치를 배정하세요'] }
  }
  const applyLiveSnapshot = (snapshot: LiveSnapshot, nextMessage?: string) => {
    setLiveSnapshot(snapshot)
    setQueue(sortByLongestWait(snapshot.queue))
    setCourts(snapshot.courts)
    setWaitingMatches(snapshot.waitingMatches)
    setStatusGroups(snapshot.statusGroups)
    setSelectedCourtName((currentCourtName) => {
      if (snapshot.courts.some((court) => court.name === currentCourtName && canAssignCourt(court))) return currentCourtName
      return snapshot.courts.find(canAssignCourt)?.name ?? snapshot.courts[0]?.name ?? ''
    })
    if (nextMessage) setMessage(nextMessage)
  }
  const applyNoOpenSession = () => {
    const snapshot = createIdleLiveSnapshot()
    setLiveSnapshot(snapshot)
    setQueue([])
    setCourts([])
    setWaitingMatches([])
    setStatusGroups(emptyStatusGroups())
    setSelectedCourtName('')
    setMessage('진행중인 세션이 없습니다. 세션 관리에서 세션을 열어주세요.')
  }
  const ensureOpenSession = () => {
    if (hasOpenSession) return true
    setMessage('진행중인 세션이 없습니다. 세션 관리에서 세션을 열어주세요.')
    return false
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let ignore = false

    fetchSessions()
      .then((sessions) => {
        if (ignore) return
        const openSession = sessions.find((session) => session.status === 'OPEN')
        if (!openSession) {
          setActiveSessionId(null)
          applyNoOpenSession()
          return
        }
        setActiveSessionId(openSession.id)
      })
      .catch(() => {
        if (!ignore) setMessage('진행중인 세션을 찾지 못했습니다. 서버 상태를 확인해주세요.')
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!hasOpenSession) return
    let ignore = false

    fetchLiveSnapshot(sessionId)
      .then((snapshot) => {
        if (ignore) return
        applyLiveSnapshot(snapshot, '서버 데이터로 Live Board를 불러왔습니다.')
      })
      .catch(() => {
        if (!ignore) setMessage('서버 연결 전이라 샘플 데이터로 표시 중입니다.')
      })

    return () => {
      ignore = true
    }
  }, [hasOpenSession, sessionId])

  const refreshQueueBoard = () => {
    if (!ensureOpenSession()) return
    fetchQueueBoard(sessionId)
      .then((board) => {
        setQueue((currentQueue) => syncQueueBoard(board.queue, currentQueue, courts, waitingMatches))
        setStatusGroups(board.statusGroups)
        setMessage('대기열과 상태 영역을 새로고침했습니다.')
      })
      .catch(() => setQueue((items) => sortByLongestWait(items)))
  }

  const openCreateMatch = (courtName = courts[0]?.name ?? '') => {
    if (!ensureOpenSession()) return
    setModalMode('create')
    setActiveMatchId(null)
    setActiveCourt(null)
    setParticipant(null)
    setSelectedCourtName(courtName)
    setMatchPlayers(emptyMatch)
    setMatchOpen(true)
  }

  const randomMatch = () => {
    const recommended = recommendMatch(queue)
    setMatchPlayers(recommended)
    setSelected(recommended.map(label).join(' / '))
  }

  const addMatchPlayer = (player: QueueParticipant) => {
    if (matchPlayers.some((selectedPlayer) => selectedPlayer?.name === player.name)) return
    const emptyIndex = matchPlayers.findIndex((selectedPlayer) => !selectedPlayer)
    if (emptyIndex === -1) return setSelected('4명이 모두 선택되었습니다.')
    setMatchPlayers((players) => players.map((selectedPlayer, index) => (index === emptyIndex ? player : selectedPlayer)))
  }

  const removeMatchPlayer = (index: number) => {
    setMatchPlayers((players) => players.map((player, playerIndex) => (playerIndex === index ? null : player)))
  }

  const createWaitingMatch = () => {
    if (!ensureOpenSession()) return
    if (filledPlayers.length < 4) return setSelected('4명을 모두 선택해야 대기 매치를 생성할 수 있습니다.')
    createWaitingMatchRequest(sessionId, filledPlayers.map((player) => player.id))
      .then(() => fetchLiveSnapshot(sessionId))
      .then((snapshot) => {
        applyLiveSnapshot(snapshot, '대기 매치를 생성했습니다.')
        setMatchOpen(false)
      })
      .catch(() => setMessage('대기 매치를 생성하지 못했습니다. 참가자 상태를 확인해주세요.'))
  }

  const openWaitingMatch = (match: LiveMatch) => {
    setModalMode('waiting')
    setActiveMatchId(match.id)
    setActiveCourt(null)
    setSelectedCourtName(match.courtName ?? courts.find(canAssignCourt)?.name ?? '')
    setMatchPlayers(match.players)
    setMatchOpen(true)
  }

  const openCourtMatches = (courtName: string) => {
    const court = courts.find((item) => item.name === courtName)
    if (court && !canAssignCourt(court)) return setSelected('일시중지 코트에는 매치를 배정할 수 없습니다.')
    setModalMode('assign')
    setActiveCourt(courtName)
    setActiveMatchId(null)
    setMatchPlayers(emptyMatch)
    setMatchOpen(true)
  }

  const openCourtSelect = () => {
    const emptyCourt = courts.find(canAssignCourt)
    if (!emptyCourt) return setSelected('배정 가능한 코트가 없습니다.')
    setSelectedCourtName(emptyCourt.name)
    setModalMode('court')
  }

  const startMatch = (match = waitingMatches.find((item) => item.id === activeMatchId), courtNameOverride?: string) => {
    if (!match) return
    const courtName = courtNameOverride ?? activeCourt ?? courts.find(canAssignCourt)?.name
    if (!courtName) return setSelected('배정 가능한 코트가 없습니다.')
    const targetCourt = courts.find((court) => court.name === courtName)
    if (!targetCourt || !canAssignCourt(targetCourt)) return setSelected('일시중지 또는 사용 중인 코트에는 배정할 수 없습니다.')
    startWaitingMatch(match.id, targetCourt.id)
      .then(() => fetchLiveSnapshot(sessionId))
      .then((snapshot) => {
        applyLiveSnapshot(snapshot, `${courtName} 경기를 시작했습니다.`)
        setMatchOpen(false)
      })
      .catch(() => setMessage('경기를 시작하지 못했습니다. 코트와 매치 상태를 확인해주세요.'))
  }

  const cancelWaitingMatch = () => {
    const match = waitingMatches.find((item) => item.id === activeMatchId)
    if (!match) return
    cancelWaitingMatchRequest(match.id)
      .then(() => fetchLiveSnapshot(sessionId))
      .then((snapshot) => {
        applyLiveSnapshot(snapshot, '대기 매치를 취소했습니다.')
        setMatchOpen(false)
      })
      .catch(() => setMessage('대기 매치를 취소하지 못했습니다. 서버 상태를 확인해주세요.'))
  }

  const openCourtManagement = () => {
    if (!ensureOpenSession()) return
    setCourtDrafts(courts.map((court) => ({ ...court })))
    setCourtManageOpen(true)
  }

  const renameCourtDraft = (courtId: number, name: string) => {
    setCourtDrafts((items) => items.map((court) => (court.id === courtId ? { ...court, name } : court)))
  }

  const toggleCourtDraftPause = (courtId: number) => {
    setCourtDrafts((items) => items.map((court) => {
      if (court.id !== courtId) return court
      if (court.players) {
        setSelected('진행 중인 코트는 일시중지할 수 없습니다.')
        return court
      }
      return { ...court, status: court.status === 'PAUSED' ? 'OPEN' : 'PAUSED' }
    }))
  }

  const addCourtDraft = () => {
    setCourtDrafts((items) => [...items, { id: -Date.now(), name: `${items.length + 1}코트`, status: 'OPEN', players: null, isNew: true }])
  }

  const deleteCourtDraft = (courtId: number) => {
    const target = courtDrafts.find((court) => court.id === courtId)
    if (target?.players) return setSelected('진행 중인 코트는 삭제할 수 없습니다.')
    if (courtDrafts.length <= 1) return setSelected('코트는 최소 1개가 필요합니다.')
    setCourtDrafts((items) => items.filter((court) => court.id !== courtId))
  }

  const saveCourtDrafts = () => {
    if (!ensureOpenSession()) return
    const names = courtDrafts.map((court) => court.name.trim())
    if (names.some((name) => !name)) return setSelected('코트 이름을 입력해주세요.')
    if (new Set(names).size !== names.length) return setSelected('코트 이름은 중복될 수 없습니다.')

    const draftIds = new Set(courtDrafts.filter((court) => !court.isNew).map((court) => court.id))
    const deletedCourts = courts.filter((court) => !draftIds.has(court.id))
    if (deletedCourts.some((court) => court.players)) return setSelected('진행 중인 코트는 삭제할 수 없습니다.')
    if (courtDrafts.some((court) => court.players && court.status !== 'IN_USE')) return setSelected('진행 중인 코트는 일시중지할 수 없습니다.')

    const orderedDrafts = courtDrafts.map((court, index) => ({ ...court, name: court.name.trim(), sortOrder: index + 1 }))
    const saveRequests = [
      ...orderedDrafts.filter((court) => !court.players).map((court) => {
        const payload = { name: court.name, sortOrder: court.sortOrder, status: court.status }
        return court.isNew ? createCourt(sessionId, payload) : updateCourt(court.id, payload)
      }),
      ...deletedCourts.map((court) => deleteCourtRequest(court.id)),
    ]

    Promise.all(saveRequests)
      .then(() => fetchLiveSnapshot(sessionId))
      .then((snapshot) => {
        applyLiveSnapshot(snapshot, '코트 설정을 저장했습니다.')
        setCourtManageOpen(false)
      })
      .catch(() => setMessage('코트 설정을 저장하지 못했습니다. 서버 상태를 확인해주세요.'))
  }

  const openFinishCourt = (court: LiveCourt) => {
    if (court.status === 'PAUSED') return setSelected('일시중지 코트에는 매치를 배정할 수 없습니다.')
    if (!court.players) return openCourtMatches(court.name)
    setModalMode('finish')
    setActiveCourt(court.name)
    setActiveMatchId(court.matchId ?? null)
    setMatchPlayers(court.players)
    setMatchOpen(true)
  }

  const finishCourt = () => {
    if (!activeMatchId) return setMessage('종료할 경기 정보를 찾지 못했습니다.')
    finishPlayingMatch(activeMatchId)
      .then(() => fetchLiveSnapshot(sessionId))
      .then((snapshot) => {
        setNow(Date.now())
        applyLiveSnapshot(snapshot, `${activeCourt} 경기를 종료했습니다.`)
        setMatchOpen(false)
      })
      .catch(() => setMessage('경기를 종료하지 못했습니다. 서버 상태를 확인해주세요.'))
  }

  const openParticipant = (player: QueueParticipant) => {
    setParticipant(player)
    setParticipantDraft(player)
    setParticipantTarget(null)
  }

  const closeParticipant = () => {
    setParticipant(null)
    setParticipantDraft(null)
    setParticipantTarget(null)
  }

  const updateParticipantDraft = (field: keyof QueueParticipant, value: string) => {
    setParticipantDraft((draft) => draft ? { ...draft, [field]: value } : draft)
  }

  const applyParticipant = () => {
    if (!participant || !participantDraft) return
    const targetStatus = participantTarget ? statusByTarget[participantTarget as keyof typeof statusByTarget] : participant.status

    updateLiveParticipant(participantDraft, targetStatus)
      .then(() => fetchQueueBoard(sessionId))
      .then((board) => {
        setQueue((currentQueue) => syncQueueBoard(board.queue, currentQueue, courts, waitingMatches))
        setStatusGroups(board.statusGroups)
        setMessage('참가자 정보를 저장했습니다.')
      })
      .catch(() => setMessage('참가자 정보를 저장하지 못했습니다. 서버 상태를 확인해주세요.'))
    closeParticipant()
  }

  return (
    <>
      <div className="pc-page-title">
        <div>
          <h1>{liveSnapshot.session.title}</h1>
          <p>{message}</p>
        </div>
        <div className="pc-actions">
          <button type="button" className="pc-secondary-button" onClick={refreshQueueBoard} disabled={!hasOpenSession}>새로고침</button>
        </div>
      </div>

      <div className="pc-live-stack">
        <AppCard className="pc-courts-card">
          <div className="pc-section-title-row">
            <h2>진행 중 코트</h2>
            <button type="button" className="pc-secondary-button" onClick={openCourtManagement} disabled={!hasOpenSession}>코트 관리</button>
          </div>
          <div className="pc-court-grid">
            {courts.map((court) => {
              const teams = courtTeams(court)
              return <CourtCard key={court.id} courtName={court.name} teamA={teams.teamA} teamB={teams.teamB} elapsed={courtElapsed(court)} onClick={() => openFinishCourt(court)} />
            })}
          </div>
        </AppCard>

        <AppCard title="대기 매치">
          {waitingMatches.length === 0 && <button type="button" className="pc-empty-note pc-empty-action" onClick={() => openCreateMatch()}>대기 매치가 없습니다. 클릭해서 생성하세요.</button>}
          {waitingMatches.map((match, index) => (
            <button type="button" className="pc-list-button pc-waiting-match-card" key={match.id} onClick={() => openWaitingMatch(match)}>
              <strong>매치 {index + 1}</strong>
              <span>{compactMatch(match.players)}</span>
              <b>대기중 · 상세</b>
            </button>
          ))}
        </AppCard>

        <AppCard className="pc-queue-card">
          <div className="pc-section-title-row">
            <h2>대기열 · {queue.length}명</h2>
            <button type="button" className="pc-primary-button" onClick={() => openCreateMatch()} disabled={!hasOpenSession}>매치 생성</button>
          </div>
          <div className="pc-participant-grid">
            {queue.map((player) => (
              <button type="button" className="pc-participant-card" key={player.name} onClick={() => openParticipant(player)}>
                <strong>{player.name} {player.grade}</strong>
                <small>{player.games}경기 <span className="pc-time-pill">{waitLabel(player)}</span></small>
              </button>
            ))}
          </div>
        </AppCard>

        <div className="pc-status-grid">
          {Object.entries(statusGroups).map(([name, players]) => (
            <AppCard title={name} className={`pc-status-card ${statusClass[name]}`} key={name}>
              <div className="pc-chip-row">
                {players.map((player) => <button type="button" className="pc-chip" key={player.name} onClick={() => openParticipant(player)}>{label(player)}</button>)}
              </div>
            </AppCard>
          ))}
        </div>
      </div>

      {selected && <div className="pc-toast"><strong>{selected}</strong><button type="button" onClick={() => setSelected(null)}>닫기</button></div>}

      {matchOpen && (
        <div className="pc-modal-backdrop" role="presentation" onClick={() => setMatchOpen(false)}>
          <section className={`pc-modal ${modalMode === 'create' ? 'create' : 'compact'} ${modalMode === 'court' ? 'pc-court-modal' : ''} ${modalMode === 'assign' ? 'pc-assign-modal' : ''}`} role="dialog" aria-modal="true" aria-label="매치" onClick={(event) => event.stopPropagation()}>
            <div className="pc-modal-head">
              <div className="pc-modal-title-row">
                <h2>{modalMode === 'create' ? '새 매치 생성' : modalMode === 'waiting' ? '대기 매치' : modalMode === 'assign' ? `${activeCourt} 배정` : modalMode === 'court' ? '코트 지정' : '경기 종료'}</h2>
                {!['assign', 'court'].includes(modalMode) && <span className={`pc-balance-pill ${balanceClass}`}>밸런스 : {balanceLabel}</span>}
              </div>
              <button type="button" className="pc-close-button" onClick={() => setMatchOpen(false)}>×</button>
            </div>

            {modalMode === 'assign' ? (
              <div className="pc-assign-list">
                {waitingMatches.length === 0 && <div className="pc-empty-note">대기중인 매치가 없습니다.</div>}
                {waitingMatches.map((match) => (
                  <button type="button" className="pc-list-button pc-assign-match-card" key={match.id} onClick={() => startMatch(match)}>
                    <strong>{compactMatch(match.players)}</strong>
                    <span className="pc-assign-match-action">경기시작</span>
                  </button>
                ))}
              </div>
            ) : modalMode === 'court' ? (
              <div className="pc-court-select">
                <p>코트를 지정해주세요.</p>
                <label className="pc-field">비어있는 코트
                  <select value={selectedCourtName} onChange={(event) => setSelectedCourtName(event.target.value)}>
                    {courts.filter(canAssignCourt).map((court) => <option key={court.name} value={court.name}>{court.name}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <>
                <div className="pc-relation-board">
                  <svg className="pc-relation-lines no-scrollbar" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    {duplicateRelations.map((line) => <line key={line.key} className={`pc-relation-line ${line.kind}`} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />)}
                  </svg>
                  {duplicateRelations.map((line) => <button type="button" className={`pc-relation-badge ${line.kind}`} key={line.key} style={{ left: `${line.x}%`, top: `${line.y}%` }}>{line.count}</button>)}
                  <div className="pc-match-layout">
                    {matchPlayers.map((player, index) => (
                      <button type="button" className={`pc-player-card p${index} ${player ? '' : 'empty'}`} key={index} onClick={() => modalMode === 'create' && player && removeMatchPlayer(index)}>
                        <strong>{player ? label(player) : '빈 슬롯'}</strong>
                        <small>{index < 2 ? 'TEAM 1' : 'TEAM 2'} · {player ? `${player.games}경기 · 클릭해서 제거` : '아래 대기 참가자를 클릭해 추가'}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pc-relation-legend"><span>파트너 관계</span><span>상대 관계</span><span>3회 이상 주의</span></div>
                <div className="pc-modal-section-head"><h3>중복경기 관계</h3><span>숫자는 오늘 같은 경기에 함께 들어간 횟수입니다.</span></div>
                <div className="pc-relation-summary no-scrollbar">
                  {duplicateRelations.length === 0 && <div className="pc-empty-note">인원을 추가하면 중복 경기 관계가 표시됩니다.</div>}
                  {duplicateRelations.map((line) => {
                    const [a, b] = line.key.split('-').map(Number)
                    return <button type="button" key={line.key}>{matchPlayers[a]?.name} - {matchPlayers[b]?.name}<strong>{line.count}회</strong></button>
                  })}
                </div>
              </>
            )}

            {modalMode === 'create' && (
              <>
                <div className="pc-modal-section-head"><h3>대기 참가자</h3><span>클릭하면 매치에 추가합니다.</span></div>
                <div className="pc-waiting-panel">
                  <div className="pc-waiting-grid">
                    {queue.map((player) => (
                      <button type="button" className="pc-waiting-card" key={player.name} onClick={() => addMatchPlayer(player)} disabled={matchPlayers.some((selectedPlayer) => selectedPlayer?.name === player.name)}>
                        <strong>{label(player)}</strong><small>{player.games}경기 · 대기 {waitLabel(player)}</small>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pc-actions pc-modal-actions">
              {!['waiting', 'assign', 'court'].includes(modalMode) && <button type="button" className="pc-secondary-button" onClick={() => setMatchOpen(false)}>취소</button>}
              {modalMode === 'create' && <button type="button" className="pc-secondary-button" onClick={randomMatch}>랜덤 생성</button>}
              {modalMode === 'create' && <button type="button" className="pc-primary-button" onClick={createWaitingMatch}>대기 매치 생성</button>}
              {modalMode === 'waiting' && <button type="button" className="pc-primary-button" onClick={cancelWaitingMatch}>매치 취소</button>}
              {modalMode === 'waiting' && <button type="button" className="pc-primary-button" onClick={openCourtSelect}>경기시작</button>}
              {modalMode === 'court' && <button type="button" className="pc-secondary-button" onClick={() => setModalMode('waiting')}>취소</button>}
              {modalMode === 'court' && <button type="button" className="pc-primary-button" onClick={() => startMatch(undefined, selectedCourtName)}>경기시작</button>}
              {modalMode === 'finish' && <button type="button" className="pc-primary-button" onClick={finishCourt}>경기 종료</button>}
            </div>
          </section>
        </div>
      )}

      {participant && participantDraft && !matchOpen && !courtManageOpen && (
        <div className="pc-modal-backdrop" role="presentation" onClick={closeParticipant}>
          <section className="pc-person-modal" role="dialog" aria-modal="true" aria-label="참가자 정보" onClick={(event) => event.stopPropagation()}>
            <div className="pc-modal-head"><h2>참가자 정보</h2><button type="button" className="pc-close-button" onClick={closeParticipant}>×</button></div>
            <label className="pc-field">이름<input value={participantDraft.name} onChange={(event) => updateParticipantDraft('name', event.target.value)} /></label>
            {(Object.keys(participantOptions) as Array<keyof typeof participantOptions>).map((field) => (
              <div className="pc-field" key={field}>
                <span>{participantLabels[field]}</span>
                <div className="pc-option-grid">
                  {participantOptions[field].map((value) => (
                    <button type="button" className={participantDraft[field] === value ? 'selected' : ''} key={value} onClick={() => updateParticipantDraft(field, value)}>{value}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="pc-actions">
              <button type="button" className={`pc-secondary-button ${participantTarget === '대기열' ? 'selected' : ''}`} onClick={() => setParticipantTarget('대기열')}>대기열</button>
              {['휴식', '레슨', '미입장', '불참'].map((target) => <button type="button" className={`pc-secondary-button pc-state-button ${statusClass[target]} ${participantTarget === target ? 'selected' : ''}`} key={target} onClick={() => setParticipantTarget(target)}>{target}</button>)}
            </div>
            <div className="pc-person-actions">
              <button type="button" className="pc-primary-button" onClick={applyParticipant}>적용</button>
            </div>
          </section>
        </div>
      )}

      {courtManageOpen && !matchOpen && (
        <div className="pc-modal-backdrop" role="presentation" onClick={() => setCourtManageOpen(false)}>
          <section className="pc-court-manage-modal" role="dialog" aria-modal="true" aria-label="코트 관리" onClick={(event) => event.stopPropagation()}>
            <div className="pc-modal-head"><h2>코트 관리</h2><button type="button" className="pc-close-button" onClick={() => setCourtManageOpen(false)}>×</button></div>
            <div className="pc-court-manage-list">
              {courtDrafts.map((court) => (
                <div className="pc-court-manage-row" key={courtDraftKey(court)}>
                  <input value={court.name} onChange={(event) => renameCourtDraft(court.id, event.target.value)} disabled={Boolean(court.players)} />
                  <button type="button" className={`pc-court-status-button ${court.status === 'PAUSED' ? 'paused' : 'open'}`} onClick={() => toggleCourtDraftPause(court.id)} disabled={Boolean(court.players)}>
                    {court.status === 'PAUSED' ? '일시중지' : court.players ? '진행중' : '운영중'}
                  </button>
                  <button type="button" className="pc-icon-danger-button" onClick={() => deleteCourtDraft(court.id)} disabled={Boolean(court.players)}>삭제</button>
                </div>
              ))}
            </div>
            <div className="pc-actions pc-modal-actions">
              <button type="button" className="pc-secondary-button" onClick={addCourtDraft}>코트 추가</button>
              <button type="button" className="pc-primary-button" onClick={saveCourtDrafts}>저장</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
