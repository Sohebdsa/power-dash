import { useGame } from '../store/gameStore';
import { Button, Icon } from './ui';

export function Pause({ onResume, onRestart, onMenu }: { onResume: () => void; onRestart: () => void; onMenu: () => void }) {
  const openSettings = useGame((s) => s.openSettings);
  const run = useGame((s) => s.run);
  return (
    <div className="overlay">
      <div className="card pause-card" role="dialog" aria-label="Paused">
        <div className="kicker">Taking a breather</div>
        <h1>Paused</h1>
        <p className="muted">{run.score.toLocaleString()} points · {run.distance} m</p>
        <div className="stack">
          <Button size="lg" onClick={onResume}><Icon name="play" /> Resume</Button>
          <Button variant="secondary" onClick={onRestart}><Icon name="restart" /> Restart</Button>
          <Button variant="secondary" onClick={() => openSettings('paused')}><Icon name="gear" /> Settings</Button>
          <Button variant="ghost" onClick={onMenu}><Icon name="home" /> Main Menu</Button>
        </div>
      </div>
    </div>
  );
}
