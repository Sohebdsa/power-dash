import { useGame } from '../store/gameStore';
import { Button, Icon, Logo, GauriAvatar } from './ui';
import { audio } from '../systems/audio';
import { ACHIEVEMENTS } from '../data/achievements';
import { COLLECTIBLES } from '../data/items';
import { CHARACTER_BY_ID } from '../game/models/kid';

export function Menu({ onPlay }: { onPlay: () => void }) {
  const setScreen = useGame((s) => s.setScreen);
  const openSettings = useGame((s) => s.openSettings);
  const progress = useGame((s) => s.progress);
  const unlocked = progress.achievements.length;
  const hero = CHARACTER_BY_ID[useGame((s) => s.settings.character)] ?? CHARACTER_BY_ID.devi;

  return (
    <div className="menu" role="main">
      <div className="menu-panel">
        <Logo />
        <p className="menu-tag">
          Run with <strong>{hero.name}</strong> through the Wellness World.
          <span className="hindi" lang="hi"> बदलाव सामान्य हैं</span>
        </p>
        <button type="button" className="char-chip" onClick={() => { audio.sfx('click'); setScreen('characters'); }}>
          <span className="char-chip-label">Runner</span>
          <span className="char-chip-name">{hero.name}</span>
          <span className="char-chip-change">Change <Icon name="back" size={14} /></span>
        </button>
        <Button size="lg" onClick={onPlay} className="play-btn">
          <Icon name="play" size={28} /> Play
        </Button>
        <div className="menu-grid">
          <Button variant="secondary" onClick={() => setScreen('learning')}><Icon name="book" /> Learning Center</Button>
          <Button variant="secondary" onClick={() => setScreen('encyclopedia')}><Icon name="leaf" /> Encyclopedia</Button>
          <Button variant="secondary" onClick={() => setScreen('achievements')}><Icon name="trophy" /> Achievements <span className="pill">{unlocked}/{ACHIEVEMENTS.length}</span></Button>
          <Button variant="secondary" onClick={() => setScreen('howto')}><Icon name="help" /> How to Play</Button>
        </div>
        <div className="menu-foot">
          <div className="best">
            <span className="best-label">Best score</span>
            <span className="best-value">{progress.bestScore.toLocaleString()}</span>
          </div>
          <div className="best">
            <span className="best-label">Discovered</span>
            <span className="best-value">{progress.discovered.length}/{COLLECTIBLES.length}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => openSettings('menu')} ariaLabel="Settings"><Icon name="gear" /> Settings</Button>
        </div>
      </div>
      <div className="menu-bubble" aria-hidden>
        <GauriAvatar size={40} />
        <span>Hi! I'm Gauri. Collect healthy food and period-care items with {hero.name}!</span>
      </div>
    </div>
  );
}
