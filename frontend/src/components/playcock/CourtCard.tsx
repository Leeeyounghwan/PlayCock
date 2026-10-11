import AppCard from '@/components/common/AppCard'

type CourtCardProps = {
  courtName: string
  teamA: string[]
  teamB: string[]
  elapsed?: string
  onClick?: () => void
}

export default function CourtCard({ courtName, teamA, teamB, elapsed, onClick }: CourtCardProps) {
  return (
    <button type="button" className="pc-click-card" onClick={onClick}>
      <AppCard className="pc-court-card">
      <div className="pc-court-head">
        <strong>{courtName}</strong>
        {elapsed && <span>{elapsed}</span>}
      </div>
      <div className="pc-court-teams">
        <div>{teamA.map((name) => <b key={name}>{name}</b>)}</div>
        <span>VS</span>
        <div>{teamB.map((name) => <b key={name}>{name}</b>)}</div>
      </div>
      </AppCard>
    </button>
  )
}
