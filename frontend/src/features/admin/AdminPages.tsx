import AppCard from '@/components/common/AppCard'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { fetchHistoryDetail, fetchHistorySessions, type HistoryDetail, type HistoryMatch, type HistorySessionSummary } from './historyApi'
import { closeSession, createSession, deleteSessionParticipant, fetchMembers, fetchSessionCourts, fetchSessionParticipants, fetchSessions, importSessionParticipants, openSession, regenerateInviteCode, type AdminCourt, type AdminMember, type AdminParticipant, type AdminSession } from './sessionApi'

const financeRows = ['09.20 체육관 대관료 -₩180,000', '09.18 지각 벌금 +₩5,000', '09.15 9월 회비 +₩400,000']
const fineRows = ['박준호 C · 미납 ₩10,000', '이서연 D · 미납 ₩5,000', '정우 C · 미납 ₩5,000']

function AdminPage({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <div className="pc-page-title">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </>
  )
}

const gradeLabel: Record<string, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  BEGINNER: '초심',
  NEWCOMER: '왕초심',
  INTRO: '입문',
}

const sessionStatusLabel: Record<string, string> = {
  PLANNED: '예정',
  OPEN: '진행중',
  CLOSED: '종료',
  CANCELLED: '취소',
}

const participantStatusLabel: Record<AdminParticipant['status'], string> = {
  WAITING: '대기',
  MATCH_READY: '매치 준비',
  PLAYING: '경기중',
  RESTING: '휴식',
  LESSON: '레슨',
  NOT_ARRIVED: '미입장',
  ABSENT: '불참',
}

const todayInput = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
const formatMonthLabel = (month: string) => `${month.slice(0, 4)}년 ${month.slice(5, 7)}월`
const isManageableSession = (session: AdminSession) => session.status !== 'CLOSED' && session.status !== 'CANCELLED'

export function SessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [members, setMembers] = useState<AdminMember[]>([])
  const [participants, setParticipants] = useState<AdminParticipant[]>([])
  const [courts, setCourts] = useState<AdminCourt[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([])
  const [newSessionDate, setNewSessionDate] = useState(todayInput())
  const [newSessionName, setNewSessionName] = useState('')
  const [message, setMessage] = useState('세션 정보를 불러오는 중입니다.')

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  const participantMemberIds = useMemo(() => new Set(participants.map((participant) => participant.memberId)), [participants])
  const activeMembers = members.filter((member) => member.active)
  const availableMembers = activeMembers.filter((member) => !participantMemberIds.has(member.id))
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const waitingCount = participants.filter((participant) => participant.status === 'WAITING').length
  const selectedMonth = (selectedSession?.sessionDate ?? newSessionDate).slice(0, 7)
  const monthSessions = sessions.filter((session) => isManageableSession(session) && session.sessionDate.startsWith(selectedMonth))

  const loadSessions = (nextSelectedId?: number) => fetchSessions()
    .then((items) => {
      setSessions(items)
      const manageableItems = items.filter(isManageableSession)
      const hasNextSession = nextSelectedId ? manageableItems.some((session) => session.id === nextSelectedId) : false
      const hasSelectedSession = selectedSessionId ? manageableItems.some((session) => session.id === selectedSessionId) : false
      const nextSessionId = hasNextSession ? nextSelectedId! : hasSelectedSession ? selectedSessionId : manageableItems[0]?.id ?? null
      setSelectedSessionId(nextSessionId)
      setMessage(manageableItems.length ? '관리할 세션을 불러왔습니다.' : '진행 전 또는 진행중인 세션이 없습니다.')
      return nextSessionId
    })

  const loadSessionDetail = (sessionId: number) => Promise.all([
    fetchSessionParticipants(sessionId),
    fetchSessionCourts(sessionId),
  ]).then(([nextParticipants, nextCourts]) => {
    setParticipants(nextParticipants)
    setCourts(nextCourts)
  })

  useEffect(() => {
    let ignore = false

    Promise.all([fetchMembers(), fetchSessions()])
      .then(([nextMembers, nextSessions]) => {
        if (ignore) return
        setMembers(nextMembers)
        setSessions(nextSessions)
        const firstSessionId = nextSessions.find(isManageableSession)?.id ?? null
        setSelectedSessionId(firstSessionId)
        setMessage(firstSessionId ? '관리할 세션을 불러왔습니다.' : '진행 전 또는 진행중인 세션이 없습니다.')
      })
      .catch(() => setMessage('세션 정보를 불러오지 못했습니다. 서버 상태를 확인해주세요.'))

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSessionId) {
      setParticipants([])
      setCourts([])
      return
    }

    let ignore = false
    loadSessionDetail(selectedSessionId)
      .then(() => {
        if (!ignore) setSelectedMemberIds([])
      })
      .catch(() => {
        if (!ignore) setMessage('선택한 세션 상세를 불러오지 못했습니다.')
      })

    return () => {
      ignore = true
    }
  }, [selectedSessionId])

  const submitSession = () => {
    const name = newSessionName.trim()
    if (!name) return setMessage('세션 이름을 입력해주세요.')

    createSession(newSessionDate, name)
      .then((session) => {
        setNewSessionName('')
        setNewSessionDate(todayInput())
        setMessage('새 운동 일정을 생성했습니다.')
        return loadSessions(session.id)
      })
      .catch(() => setMessage('운동 일정을 생성하지 못했습니다. 입력값을 확인해주세요.'))
  }

  const changeSessionStatus = (status: 'OPEN' | 'CLOSED') => {
    if (!selectedSessionId) return
    const request = status === 'OPEN' ? openSession : closeSession
    request(selectedSessionId)
      .then((session) => loadSessions(session.id))
      .then(() => setMessage(status === 'OPEN' ? '세션을 진행중으로 변경했습니다.' : '세션을 종료했습니다.'))
      .catch(() => setMessage('세션 상태를 변경하지 못했습니다.'))
  }

  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((ids) => ids.includes(memberId) ? ids.filter((id) => id !== memberId) : [...ids, memberId])
  }

  const importSelectedMembers = () => {
    if (!selectedSessionId) return
    if (selectedMemberIds.length === 0) return setMessage('추가할 회원을 선택해주세요.')

    importSessionParticipants(selectedSessionId, selectedMemberIds)
      .then(() => loadSessionDetail(selectedSessionId))
      .then(() => {
        setSelectedMemberIds([])
        setMessage(`${selectedMemberIds.length}명을 세션 참가자로 추가했습니다.`)
      })
      .catch(() => setMessage('참가자를 추가하지 못했습니다. 중복 여부를 확인해주세요.'))
  }

  const importAllMembers = () => {
    if (!selectedSessionId) return
    const ids = availableMembers.map((member) => member.id)
    if (ids.length === 0) return setMessage('추가 가능한 회원이 없습니다.')

    importSessionParticipants(selectedSessionId, ids)
      .then(() => loadSessionDetail(selectedSessionId))
      .then(() => setMessage(`${ids.length}명을 세션 참가자로 추가했습니다.`))
      .catch(() => setMessage('전체 회원을 추가하지 못했습니다.'))
  }

  const copyInviteCode = () => {
    if (!selectedSession?.inviteCode) return setMessage('초대코드가 없습니다.')
    navigator.clipboard?.writeText(selectedSession.inviteCode)
      .then(() => setMessage('초대코드를 복사했습니다.'))
      .catch(() => setMessage(`초대코드: ${selectedSession.inviteCode}`))
  }

  const createInviteCode = () => {
    if (!selectedSessionId) return setMessage('세션을 선택해주세요.')

    regenerateInviteCode(selectedSessionId)
      .then((session) => loadSessions(session.id))
      .then(() => setMessage('새 초대코드를 생성하고 DB에 저장했습니다.'))
      .catch(() => setMessage('초대코드를 생성하지 못했습니다.'))
  }

  const removeParticipant = (participantId: number) => {
    if (!selectedSessionId) return

    deleteSessionParticipant(participantId)
      .then(() => loadSessionDetail(selectedSessionId))
      .then(() => setMessage('등록 참가자를 삭제했습니다.'))
      .catch(() => setMessage('경기 배정 또는 경기 이력이 있는 참가자는 삭제할 수 없습니다. 불참 처리를 사용해주세요.'))
  }

  return (
    <AdminPage
      title="세션 관리"
      subtitle={message}
    >
      <div className="pc-session-create-card">
        <AppCard title="신규 운동 일정 생성">
          <div className="pc-session-form">
            <label className="pc-field">운동일<input type="date" value={newSessionDate} onChange={(event) => setNewSessionDate(event.target.value)} /></label>
            <label className="pc-field">세션 이름<input placeholder="예: 금요모임" value={newSessionName} onChange={(event) => setNewSessionName(event.target.value)} /></label>
            <button type="button" className="pc-primary-button" onClick={submitSession}>일정 생성</button>
          </div>
        </AppCard>
      </div>

      <AppCard title={`세션 목록 · ${formatMonthLabel(selectedMonth)}`}>
        <div className="pc-session-list pc-session-month-list">
          {monthSessions.length === 0 && <div className="pc-empty-note">해당 월에 관리할 세션이 없습니다.</div>}
          {monthSessions.map((session) => (
            <button type="button" className={`pc-session-list-button ${session.id === selectedSessionId ? 'selected' : ''}`} key={session.id} onClick={() => setSelectedSessionId(session.id)}>
              <span>{session.sessionDate.replaceAll('-', '.')}</span>
              <strong>{session.name}</strong>
              <b>{sessionStatusLabel[session.status] ?? session.status}</b>
            </button>
          ))}
        </div>
      </AppCard>

      <div className="pc-session-two-column pc-section-gap">
        <AppCard title="참가자 사전 등록">
          {!selectedSession && <div className="pc-empty-note">세션을 선택해주세요.</div>}
          {selectedSession && (
            <div className="pc-session-card-body">
              <div className="pc-session-toolbar">
                <div>
                  <strong>추가 가능한 회원</strong>
                  <span>미등록 회원 {availableMembers.length}명 · 선택 {selectedMemberIds.length}명</span>
                </div>
                <div className="pc-actions">
                  <button type="button" className="pc-secondary-button" onClick={importSelectedMembers}>선택 추가</button>
                  <button type="button" className="pc-secondary-button" onClick={importAllMembers}>전체 추가</button>
                </div>
              </div>
              <div className="pc-member-import-grid">
                {availableMembers.length === 0 && (
                  <div className="pc-session-empty-state">
                    <strong>추가 가능한 회원이 없습니다.</strong>
                    <span>이미 모든 활성 회원이 이 세션에 등록되어 있습니다.</span>
                  </div>
                )}
                {availableMembers.map((member) => (
                  <button type="button" className={selectedMemberIds.includes(member.id) ? 'selected' : ''} key={member.id} onClick={() => toggleMember(member.id)}>
                    <strong>{member.name} {gradeLabel[member.grade]}</strong>
                    <small>{member.ageBand ?? '-'} · {member.gender === 'MALE' ? '남' : '여'}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </AppCard>

        <AppCard title="세션 준비 현황">
          {!selectedSession && <div className="pc-empty-note">세션을 선택해주세요.</div>}
          {selectedSession && (
            <div className="pc-session-card-body">
              <div className="pc-session-ready-grid">
                <div className="pc-session-ready-stack">
                  <div className="pc-session-ready-tile"><span>참가자</span><strong>{participants.length}명</strong><small>대기 {waitingCount}명</small></div>
                  <div className="pc-session-ready-tile"><span>코트</span><strong>{courts.length}개</strong><small>{courts.filter((court) => court.status === 'OPEN').length}개 운영중</small></div>
                </div>
                <div className="pc-session-invite-panel">
                  <span>초대코드</span>
                  <b>{selectedSession.inviteCode ?? '-'}</b>
                  <div className="pc-inline-actions">
                    <button type="button" onClick={copyInviteCode}>복사</button>
                    <button type="button" onClick={createInviteCode}>초대코드 생성</button>
                  </div>
                </div>
              </div>
              <div className="pc-session-bottom-actions">
                {selectedSession.status !== 'OPEN' && <button type="button" className="pc-secondary-button" onClick={() => changeSessionStatus('OPEN')}>세션 열기</button>}
                {selectedSession.status !== 'CLOSED' && <button type="button" className="pc-secondary-button" onClick={() => changeSessionStatus('CLOSED')}>세션 종료</button>}
                <Link className="pc-primary-link" to="/admin/live">LiveBoard로 이동</Link>
              </div>
            </div>
          )}
        </AppCard>
      </div>

      <div className="pc-section-gap">
        <AppCard title="등록 참가자">
          <div className="pc-session-participant-list">
            {participants.length === 0 && <div className="pc-empty-note">등록된 참가자가 없습니다.</div>}
            {participants.map((participant) => {
              const member = membersById.get(participant.memberId)
              return (
                <div className="pc-session-participant-row" key={participant.id}>
                  <strong>{member ? `${member.name} ${gradeLabel[participant.gradeSnapshot]}` : `회원 #${participant.memberId}`}</strong>
                  <span>{participant.gameCount}경기</span>
                  <b>{participantStatusLabel[participant.status]}</b>
                  <button type="button" onClick={() => removeParticipant(participant.id)} disabled={participant.status === 'MATCH_READY' || participant.status === 'PLAYING' || participant.gameCount > 0}>
                    삭제
                  </button>
                </div>
              )
            })}
          </div>
        </AppCard>
      </div>
    </AdminPage>
  )
}

const formatSessionDate = (date: string) => date.replaceAll('-', '.')
const formatClock = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '--:--'
const formatHistoryTime = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '-'
const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const restSeconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(restSeconds).padStart(2, '0')}`
}
const matchTitle = (match: HistoryMatch) => `${match.teamA.map((player) => `${player.name} ${player.grade}`).join(' · ')} vs ${match.teamB.map((player) => `${player.name} ${player.grade}`).join(' · ')}`
const attendanceClass = (label: string) => label === '정상 참여' ? 'good' : label === '경기 없음' ? 'ok' : 'bad'

export function HistoryPage() {
  const [sessions, setSessions] = useState<HistorySessionSummary[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [detail, setDetail] = useState<HistoryDetail | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null)
  const [message, setMessage] = useState('운동 이력을 불러오는 중입니다.')

  useEffect(() => {
    let ignore = false

    fetchHistorySessions()
      .then((items) => {
        if (ignore) return
        setSessions(items)
        const firstSession = items[0]
        if (firstSession) setSelectedSessionId(firstSession.id)
        else setMessage('종료된 세션 이력이 없습니다.')
      })
      .catch(() => setMessage('운동 이력을 불러오지 못했습니다. 서버 상태를 확인해주세요.'))

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!selectedSessionId) return
    let ignore = false

    fetchHistoryDetail(selectedSessionId)
      .then((item) => {
        if (ignore) return
        setDetail(item)
        setSelectedParticipantId(item.members[0]?.participantId ?? null)
        setMessage(`${formatSessionDate(item.session.sessionDate)} ${item.session.name} 이력을 불러왔습니다.`)
      })
      .catch(() => setMessage('세션 상세 이력을 불러오지 못했습니다.'))

    return () => {
      ignore = true
    }
  }, [selectedSessionId])

  const selectedMember = detail?.members.find((member) => member.participantId === selectedParticipantId) ?? detail?.members[0] ?? null
  const selectedMemberMatches = useMemo(() => {
    if (!detail || !selectedMember) return []
    return detail.matches.filter((match) => [...match.teamA, ...match.teamB].some((player) => player.id === selectedMember.participantId))
  }, [detail, selectedMember])
  const hasMatchRows = (detail?.matches.length ?? 0) > 0
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null

  return (
    <AdminPage
      title="운동 이력"
      subtitle={message}
      actions={(
        <label className="pc-history-session-select">
          <span>종료 세션</span>
          <select value={selectedSessionId ?? ''} onChange={(event) => setSelectedSessionId(Number(event.target.value) || null)} disabled={sessions.length === 0}>
            {sessions.length === 0 && <option value="">종료된 세션 없음</option>}
            {sessions.map((session) => (
              <option value={session.id} key={session.id}>
                {formatSessionDate(session.sessionDate)} · {session.name}
              </option>
            ))}
          </select>
        </label>
      )}
    >
      <div className="pc-history-stat-grid">
        <AppCard><span className="pc-history-stat-label">완료 경기</span><strong className="pc-stat">{detail?.summary.totalMatches ?? 0}경기</strong></AppCard>
        <AppCard><span className="pc-history-stat-label">참가자</span><strong className="pc-stat">{detail?.summary.totalParticipants ?? 0}명</strong></AppCard>
        <AppCard><span className="pc-history-stat-label">경기 참여</span><strong className="pc-stat">{detail?.summary.playedParticipants ?? 0}명</strong></AppCard>
        <AppCard><span className="pc-history-stat-label">불참/미참석</span><strong className="pc-stat">{(detail?.summary.absentCount ?? 0) + (detail?.summary.notArrivedCount ?? 0)}명</strong></AppCard>
      </div>

      {selectedSession && (
        <div className="pc-history-session-strip">
          <strong>{selectedSession.name}</strong>
          <span>{formatSessionDate(selectedSession.sessionDate)}</span>
          <span>{selectedSession.participantCount}명</span>
          <span>{selectedSession.matchCount}경기</span>
        </div>
      )}

      <div className="pc-history-main-grid">
        <AppCard title="선택 참가자 상세">
          {!selectedMember && <div className="pc-empty-note">참가자 기록이 없습니다.</div>}
          {selectedMember && (
            <div className="pc-history-detail-panel">
              <div>
                <span className={`pc-history-status-pill ${attendanceClass(selectedMember.attendanceLabel)}`}>{selectedMember.attendanceLabel}</span>
                <strong>{selectedMember.name} {selectedMember.grade}</strong>
                <small>{selectedMember.games}경기 · 마지막 경기 {formatHistoryTime(selectedMember.lastMatchEndedAt)}</small>
              </div>
              <div className="pc-history-detail-grid">
                <span>체크인 <b>{formatHistoryTime(selectedMember.checkedInAt)}</b></span>
                <span>참여 경기 <b>{selectedMember.games}경기</b></span>
              </div>
              <div className="pc-history-mini-list">
                {selectedMemberMatches.length === 0 && (
                  <div className="pc-empty-note">
                    {selectedMember.games > 0 ? `${selectedMember.games}경기 기록은 있으나 완료 경기 상세가 없습니다.` : '참여한 경기가 없습니다.'}
                  </div>
                )}
                {selectedMemberMatches.map((match) => (
                  <div key={match.id}>
                    <strong>{match.courtName ?? '코트 미지정'}</strong>
                    <span>{formatClock(match.startedAt)} - {formatClock(match.finishedAt)} · {formatDuration(match.durationSeconds)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AppCard>

        <AppCard title="코트별 진행 이력">
          <div className="pc-history-court-list">
            {!detail?.courtHistories.length && (
              <div className="pc-empty-note">
                {hasMatchRows ? '코트별 기록이 없습니다.' : '완료 경기 상세가 없어 코트별 기록을 만들 수 없습니다.'}
              </div>
            )}
            {detail?.courtHistories.map((court) => (
              <div className="pc-history-court-card" key={court.courtName}>
                <strong>{court.courtName}</strong>
                <span>{court.matchCount}경기 · 총 {formatDuration(court.totalDurationSeconds)}</span>
                <small>평균 {formatDuration(court.matchCount ? court.totalDurationSeconds / court.matchCount : 0)}</small>
              </div>
            ))}
          </div>
        </AppCard>
      </div>

      <AppCard title="참가자 기록" className="pc-section-gap">
        <div className="pc-history-member-list">
          {!detail?.members.length && <div className="pc-empty-note">참가자 기록이 없습니다.</div>}
          {detail?.members.map((member, index) => (
            <button type="button" className={`pc-history-member-row ${selectedParticipantId === member.participantId ? 'selected' : ''}`} key={member.participantId} onClick={() => setSelectedParticipantId(member.participantId)}>
              <span>{index + 1}</span>
              <strong>{member.name} {member.grade}</strong>
              <em className={`pc-history-status-pill ${attendanceClass(member.attendanceLabel)}`}>{member.attendanceLabel}</em>
              <b>{member.games}경기</b>
            </button>
          ))}
        </div>
      </AppCard>

      <AppCard title="완료 경기 목록" className="pc-section-gap">
        <div className="pc-history-match-list">
          {detail && detail.matches.length === 0 && <div className="pc-empty-note">완료된 경기가 없습니다.</div>}
          {detail?.matches.map((match, index) => (
            <div className="pc-history-match-card" key={match.id}>
              <div className="pc-history-match-meta">
                <span>#{detail.matches.length - index}</span>
                <strong>{match.courtName ?? '코트 미지정'}</strong>
                <b>{formatClock(match.startedAt)} - {formatClock(match.finishedAt)}</b>
                <em>{formatDuration(match.durationSeconds)}</em>
              </div>
              <div className="pc-history-match-title">{matchTitle(match)}</div>
              <div className="pc-history-team-grid">
                <div><span>TEAM 1</span>{match.teamA.map((player) => <strong key={player.id}>{player.name} {player.grade}</strong>)}</div>
                <div><span>TEAM 2</span>{match.teamB.map((player) => <strong key={player.id}>{player.name} {player.grade}</strong>)}</div>
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    </AdminPage>
  )
}

export function AnalyticsPage() {
  return (
    <AdminPage title="월간 통계" subtitle="월간 모임 횟수, 완료 경기, 참석 랭킹을 확인합니다.">
      <div className="pc-stat-grid">
        {['모임 횟수 9회', '총 완료 경기 142', '평균 참석 21.4명', '활동 회원 34명'].map((stat) => (
          <AppCard key={stat}>
            <strong className="pc-stat">{stat}</strong>
          </AppCard>
        ))}
      </div>
      <AppCard title="일자별 완료 경기 수" className="pc-chart-card">
        {[13, 17, 15, 21, 18, 24, 16, 18].map((value) => (
          <button type="button" className="pc-bar" style={{ height: `${value * 7}px` }} key={value} onClick={() => alert(`${value}경기`)}>
            {value}
          </button>
        ))}
      </AppCard>
      <div className="pc-admin-grid pc-section-gap">
        <AppCard title="월별 최다 참석자">
          {['김민수 B 88.9%', '이영환 B 88.9%', '박준호 C 77.8%'].map((row) => (
            <div className="pc-queue-row" key={row}><strong>{row}</strong></div>
          ))}
        </AppCard>
        <AppCard title="개인 경기 수 TOP">
          {['김민수 B 32경기', '이영환 B 30경기', '정우 C 28경기'].map((row) => (
            <div className="pc-queue-row" key={row}><strong>{row}</strong></div>
          ))}
        </AppCard>
      </div>
    </AdminPage>
  )
}

export function FinancePage() {
  return (
    <AdminPage title="운영비 관리" subtitle="카카오 모임통장 기준의 참고 이력 장부입니다.">
      <div className="pc-notice">주의: PlayCock 금액은 공식 계좌 잔액이 아닌 참고 장부입니다.</div>
      <div className="pc-admin-grid">
        <AppCard title="운영비 이력">
          {financeRows.map((row) => (
            <button type="button" className="pc-list-button" key={row} onClick={() => alert(row)}>
              {row}
              <span>상세</span>
            </button>
          ))}
        </AppCard>
        <AppCard title="미납 벌금">
          {fineRows.map((row) => (
            <button type="button" className="pc-list-button" key={row} onClick={() => alert(row)}>
              {row}
              <span>납부</span>
            </button>
          ))}
        </AppCard>
      </div>
    </AdminPage>
  )
}
