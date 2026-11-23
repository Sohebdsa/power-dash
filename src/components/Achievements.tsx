import { ACHIEVEMENTS } from '../data/achievements';
import { useGame } from '../store/gameStore';
import { Screen, Icon } from './ui';

export function Achievements({ onBack }: { onBack: () => void }) {
  const progress = useGame((s) => s.progress);
  return (
    <Screen title="Achievements" kicker={`${progress.achievements.length} of ${ACHIEVEMENTS.length} unlocked`} onBack={onBack} className="ach">
      <div className="totals">
        <div><span>{progress.bestScore.toLocaleString()}</span>Best score</div>
        <div><span>{progress.totalScore.toLocaleString()}</span>Total score</div>
        <div><span>{progress.totalDistance.toLocaleString()} m</span>Total distance</div>
        <div><span>{progress.totalFood + progress.totalHygiene}</span>Items collected</div>
        <div><span>{progress.discovered.length}</span>Facts unlocked</div>
        <div><span>{progress.runs}</span>Runs</div>
      </div>
      <div className="ach-list">
        {ACHIEVEMENTS.map((a) => {
          const done = progress.achievements.includes(a.id);
          const pct = Math.round(a.progress(progress) * 100);
          return (
            <div key={a.id} className={`ach-item ${done ? 'done' : ''}`}>
              <span className="ach-medal"><Icon name={done ? 'trophy' : 'lock'} size={22} /></span>
              <div className="ach-text">
                <strong>{a.name}</strong>
                <span>{a.description}</span>
                <span className="bar"><span style={{ width: `${done ? 100 : pct}%` }} /></span>
              </div>
              <span className="ach-pct">{done ? <Icon name="check" /> : `${pct}%`}</span>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}
