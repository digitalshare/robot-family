import { family } from '../data/family'
import useScrapbook from '../hooks/useScrapbook'

function ScrapbookCard({ member, hasBadge, snapshot, onRemoveSnapshot }) {
  const { scrapbook } = member
  const badgeState = hasBadge ? 'Collected' : 'Locked'

  return (
    <article className={`scrapbook-card${hasBadge ? ' scrapbook-card--collected' : ''}`} style={{ '--scrapbook-accent': member.room.accent }}>
      <div className="scrapbook-card__identity">
        <div className="scrapbook-badge" aria-hidden="true"><span>{hasBadge ? member.name.slice(0, 1) : '?'}</span></div>
        <div>
          <p className="scrapbook-card__role">{member.role}</p>
          <h3>{member.name}</h3>
        </div>
      </div>

      <div className="scrapbook-card__badge-copy">
        <p className="scrapbook-card__label">{badgeState} badge</p>
        <p className="scrapbook-card__title">{scrapbook.badgeTitle}</p>
        <p className="scrapbook-card__description">
          {hasBadge ? scrapbook.badgeDescription : `Complete “${member.mission.title}” to collect this badge.`}
        </p>
      </div>

      {snapshot ? (
        <figure className="scrapbook-snapshot">
          <img src={snapshot} alt={`Snapshot of ${member.name}'s 3D room`} />
          <figcaption>
            <span>Room snapshot saved</span>
            <button type="button" onClick={() => onRemoveSnapshot(member.id)} aria-label={`Remove ${member.name}'s room snapshot`}>Remove</button>
          </figcaption>
        </figure>
      ) : (
        <div className="scrapbook-snapshot scrapbook-snapshot--empty">
          <span>Snapshot slot empty</span>
          <p>Visit this profile to capture its room.</p>
        </div>
      )}
    </article>
  )
}

export default function Scrapbook({ onBack }) {
  const { badges, snapshots, removeSnapshot } = useScrapbook()
  const collectedCount = family.filter((member) => badges[member.id]).length

  return (
    <section className="scrapbook-stage" aria-labelledby="scrapbook-title">
      <div className="scrapbook-shell">
        <header className="scrapbook-header">
          <p className="bubble-kicker">Hangar collection</p>
          <h2 id="scrapbook-title">Hangar Scrapbook</h2>
          <p>Keep a badge for every room mission and a snapshot of the places you explored.</p>
          <p className="scrapbook-progress">{collectedCount} of {family.length} badges collected</p>
        </header>

        <div className="scrapbook-grid">
          {family.map((member) => (
            <ScrapbookCard
              key={member.id}
              member={member}
              hasBadge={Boolean(badges[member.id])}
              snapshot={snapshots[member.id]}
              onRemoveSnapshot={removeSnapshot}
            />
          ))}
        </div>

        <button type="button" className="profile-back scrapbook-back" onClick={onBack}>Back to family</button>
      </div>
    </section>
  )
}
