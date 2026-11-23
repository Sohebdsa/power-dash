import { useState } from 'react';
import { useGame } from '../store/gameStore';
import { DEFAULT_PROGRESS } from '../systems/persistence';
import { Screen, Icon, Button } from './ui';
import { audio } from '../systems/audio';

export function Settings({ onBack }: { onBack: () => void }) {
  const settings = useGame((s) => s.settings);
  const update = useGame((s) => s.updateSettings);
  const mutate = useGame((s) => s.mutateProgress);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <Screen title="Settings" onBack={onBack} className="settings">
      <div className="setting">
        <label htmlFor="music">Music volume</label>
        <input id="music" type="range" min={0} max={1} step={0.05} value={settings.musicVolume}
          onChange={(e) => update({ musicVolume: Number(e.target.value) })} />
        <span className="val">{Math.round(settings.musicVolume * 100)}</span>
      </div>
      <div className="setting">
        <label htmlFor="sfx">Sound effects</label>
        <input id="sfx" type="range" min={0} max={1} step={0.05} value={settings.sfxVolume}
          onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
          onPointerUp={() => audio.sfx('food', 3)} />
        <span className="val">{Math.round(settings.sfxVolume * 100)}</span>
      </div>
      <div className="setting">
        <span className="label">All sound</span>
        <Button variant={settings.muted ? 'primary' : 'secondary'} size="sm" onClick={() => update({ muted: !settings.muted })}>
          <Icon name={settings.muted ? 'mute' : 'sound'} /> {settings.muted ? 'Muted' : 'On'}
        </Button>
      </div>
      <div className="setting">
        <span className="label">Graphics quality</span>
        <div className="seg">
          {(['auto', 'high', 'low'] as const).map((q) => (
            <button key={q} type="button" className={settings.quality === q ? 'on' : ''} onClick={() => { audio.sfx('click'); update({ quality: q }); }}>{q}</button>
          ))}
        </div>
      </div>
      <p className="muted small">Quality changes apply the next time the game loads.</p>
      <div className="setting">
        <span className="label">Reduce motion (no camera shake)</span>
        <Button variant={settings.reduceMotion ? 'primary' : 'secondary'} size="sm" onClick={() => update({ reduceMotion: !settings.reduceMotion })}>
          {settings.reduceMotion ? 'On' : 'Off'}
        </Button>
      </div>
      <div className="setting danger">
        <span className="label">Reset all progress</span>
        {done ? <span className="muted">Progress cleared.</span> : !confirm ? (
          <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>Reset…</Button>
        ) : (
          <span className="confirm-row">
            <span className="muted small">Scores, discoveries and achievements will be erased.</span>
            <Button variant="primary" size="sm" onClick={() => { mutate((p) => Object.assign(p, structuredClone(DEFAULT_PROGRESS))); setConfirm(false); setDone(true); }}>Yes, reset</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
          </span>
        )}
      </div>
      <p className="muted small privacy">
        POWER DASH saves your progress only on this device. No accounts, no ads, no chat, and no personal information is collected.
      </p>
    </Screen>
  );
}
