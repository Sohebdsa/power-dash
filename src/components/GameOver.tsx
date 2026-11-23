import { useMemo, useState } from 'react';
import { useGame } from '../store/gameStore';
import { COLLECTIBLE_BY_ID } from '../data/items';
import { ACHIEVEMENTS } from '../data/achievements';
import { Button, GauriAvatar, Icon, Thumb } from './ui';

export function GameOver({ onPlay, onMenu }: { onPlay: () => void; onMenu: () => void }) {
  const run = useGame((s) => s.run);
  const progress = useGame((s) => s.progress);
  const setScreen = useGame((s) => s.setScreen);
  const [showLearned, setShowLearned] = useState(false);
  const isBest = run.score > 0 && run.score >= progress.bestScore;

  // "Today I learned": prioritise hygiene facts, then a hazard lesson, then food.
  const learned = useMemo(() => {
    const ids = [...new Set([...run.newFacts, ...run.seenFacts])];
    const hyg = ids.filter((id) => COLLECTIBLE_BY_ID[id]?.category === 'hygiene');
    const food = ids.filter((id) => COLLECTIBLE_BY_ID[id]?.category !== 'hygiene');
    const out: { key: string; text: string; icon?: string }[] = [];
    hyg.slice(0, 2).forEach((id) => out.push({ key: id, text: COLLECTIBLE_BY_ID[id].fact, icon: id }));
    if (run.hazardLessons[0]) out.push({ key: 'lesson', text: run.hazardLessons[0] });
    food.forEach((id) => { if (out.length < 3) out.push({ key: id, text: COLLECTIBLE_BY_ID[id].fact, icon: id }); });
    if (!out.length) out.push({ key: 'default', text: 'Periods are a natural part of growing up — nothing to be ashamed of.' });
    return out.slice(0, 3);
  }, [run]);

  return (
    <div className="overlay">
      <div className="card results" role="dialog" aria-label="Run results">
        <div className="results-head">
          <GauriAvatar size={56} />
          <div>
            <div className="kicker">{isBest ? 'New personal best!' : 'Great run!'}</div>
            <h1 className="results-score">{run.score.toLocaleString()}</h1>
            <div className="muted">Best {progress.bestScore.toLocaleString()}</div>
          </div>
        </div>
        <div className="stats">
          <div className="stat"><span className="stat-v">{run.distance} m</span><span className="stat-l">Distance</span></div>
          <div className="stat"><Thumb id="pad" size={32} /><span className="stat-v">{run.hygiene}</span><span className="stat-l">Period care</span></div>
          <div className="stat"><Thumb id="apple" size={32} /><span className="stat-v">{run.food}</span><span className="stat-l">Healthy food</span></div>
          <div className="stat"><span className="stat-v">{run.newFacts.length}</span><span className="stat-l">New facts</span></div>
        </div>
        {run.achievementsUnlocked.length > 0 && (
          <div className="unlocked">
            {run.achievementsUnlocked.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id)!;
              return <span key={id} className="badge"><Icon name="trophy" size={16} /> {a.name}</span>;
            })}
          </div>
        )}
        {showLearned && (
          <div className="learned">
            <h2>Today I learned</h2>
            <ol>
              {learned.map((l) => (
                <li key={l.key}>{l.icon ? <Thumb id={l.icon} size={40} /> : <span className="lesson-dot" />}<span>{l.text}</span></li>
              ))}
            </ol>
            <button type="button" className="link" onClick={() => setScreen('learning')}>Explore the Learning Center →</button>
          </div>
        )}
        <div className="row">
          <Button size="lg" onClick={onPlay}><Icon name="restart" /> Play Again</Button>
          {!showLearned && <Button variant="teal" onClick={() => setShowLearned(true)}><Icon name="book" /> What I Learned</Button>}
          <Button variant="ghost" onClick={onMenu}><Icon name="home" /> Main Menu</Button>
        </div>
      </div>
    </div>
  );
}
