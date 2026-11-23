import { useEffect, useState } from 'react';
import { CHARACTERS, type CharacterId } from '../game/models/kid';
import { useGame } from '../store/gameStore';
import { Button, Icon } from './ui';
import { audio } from '../systems/audio';

// The 3D lobby behind this panel shows the highlighted character live.
export function CharacterSelect({ onPreview, onDone }: { onPreview: (id: CharacterId) => void; onDone: () => void }) {
  const saved = useGame((s) => s.settings.character);
  const update = useGame((s) => s.updateSettings);
  const [index, setIndex] = useState(Math.max(0, CHARACTERS.findIndex((c) => c.id === saved)));
  const c = CHARACTERS[index];

  useEffect(() => { onPreview(c.id); }, [c.id, onPreview]);

  const step = (d: number) => {
    audio.sfx('lane');
    setIndex((i) => (i + d + CHARACTERS.length) % CHARACTERS.length);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') step(-1);
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') step(1);
      else if (e.code === 'Escape') cancel();
      else if (e.code === 'Enter') choose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const choose = () => { audio.sfx('powerup'); update({ character: c.id }); onDone(); };
  const cancel = () => { onPreview(saved); onDone(); };

  return (
    <div className="menu" role="dialog" aria-label="Choose your runner">
      <div className="menu-panel char-panel">
        <div className="kicker">Choose your runner</div>
        <div className="char-picker">
          <button type="button" className="char-arrow" onClick={() => step(-1)} aria-label="Previous character"><Icon name="back" size={26} /></button>
          <div className="char-info" key={c.id}>
            <h1 className="char-name">{c.name}</h1>
            <div className="char-tag">{c.tagline}</div>
          </div>
          <button type="button" className="char-arrow next" onClick={() => step(1)} aria-label="Next character"><Icon name="back" size={26} /></button>
        </div>
        <p className="char-about">{c.about}</p>
        <div className="char-dots" role="tablist">
          {CHARACTERS.map((x, i) => (
            <button key={x.id} type="button" role="tab" aria-selected={i === index} aria-label={x.name}
              className={`char-dot ${i === index ? 'on' : ''}`} onClick={() => { audio.sfx('click'); setIndex(i); }}>
              <span>{x.name}</span>
            </button>
          ))}
        </div>
        <Button size="lg" onClick={choose} className="play-btn">
          {saved === c.id ? <><Icon name="check" size={24} /> Keep {c.name}</> : <>Run as {c.name}</>}
        </Button>
        <Button variant="ghost" size="sm" onClick={cancel}><Icon name="back" /> Back</Button>
      </div>
    </div>
  );
}
