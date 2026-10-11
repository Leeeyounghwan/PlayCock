import CourtCard from '@/components/playcock/CourtCard'
import { useState } from 'react'

const initialQueue = ['서현 B', '지훈 C', '은지 초심', '하늘 입문']

export default function ViewerShellPage() {
  const [queue, setQueue] = useState(initialQueue)
  const [refreshedAt, setRefreshedAt] = useState('방금 전')

  const refresh = () => {
    setQueue((items) => [...items].reverse())
    setRefreshedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
  }

  return (
    <div className="pc-viewer-board">
      <header>
        <div>
          <h1>PlayCock</h1>
          <p>9월 22일 화요모임 · 참가자 조회</p>
        </div>
        <span>LIVE</span>
      </header>
      <section>
        <h2>진행 중 코트</h2>
        <div className="pc-mobile-courts">
          <CourtCard courtName="1코트" teamA={['김민수 B', '박준호 D']} teamB={['이영희 C', '정가람 초심']} elapsed="08:32" />
          <CourtCard courtName="2코트" teamA={['서현 B', '지훈 C']} teamB={['은지 초심', '하늘 입문']} />
        </div>
      </section>
      <section>
        <div className="pc-section-head">
          <div>
            <h2>대기열 · {queue.length}명</h2>
            <p>자동 갱신 10초 · {refreshedAt}</p>
          </div>
          <button type="button" className="pc-secondary-button" onClick={refresh}>새로고침</button>
        </div>
        <div className="pc-card">
          {queue.map((name, index) => (
            <div className="pc-queue-row" key={name}>
              <span>{index + 1}</span>
              <strong>{name}</strong>
              <b>{index === 1 ? '2경기' : '1경기'}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
