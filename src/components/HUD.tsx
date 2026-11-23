import { useGame } from '../store/gameStore';
import { POWERUP_BY_ID } from '../data/items';
import { Icon, Thumb } from './ui';

export function HUD({ onPause }: { onPause: () => void }) {
  const score = useGame((s) => s.run.score);
  const distance = useGame((s) => s.run.distance);
  const lives = useGame((s) => s.run.lives);
  const maxLives = useGame((s) => s.run.maxLives);
  const food = useGame((s) => s.run.food);
  const hygiene = useGame((s) => s.run.hygiene);
  const mult = useGame((s) => s.run.multiplier);
  const powers = useGame((s) => s.powers);
  const zone = useGame((s) => s.zoneName);

  return (
    <div className="hud" aria-live="off">
      <div className="hud-left">
        <div className="hearts" aria-label={`${lives} lives`}>
          {Array.from({ length: maxLives }, (_, i) => (
            <span key={i} className={i < lives ? 'heart on' : 'heart'}><Icon name={i < lives ? 'heart' : 'heartEmpty'} size={26} /></span>
          ))}
        </div>
        <div className="counters">
          <span className="counter hygiene" title="Period-care items"><Thumb id="pad" size={30} /> {hygiene}</span>
          <span className="counter food" title="Healthy food"><Thumb id="apple" size={30} /> {food}</span>
        </div>
      </div>
      <div className="hud-right">
        <div className="score-box">
          <span className="score">{score.toLocaleString()}</span>
          <span className="dist">{distance} m</span>
          <span className="zone-chip" key={zone}>{zone}</span>
        </div>
        {mult > 1 && <span className="mult" key={mult}>×{mult}</span>}
        <button type="button" className="pause-btn" onClick={onPause} aria-label="Pause"><Icon name="pause" size={24} /></button>
      </div>
      {powers.length > 0 && (
        <div className="powers">
          {powers.map((p) => {
            const def = POWERUP_BY_ID[p.id];
            const frac = p.remaining < 0 ? 1 : p.remaining / p.duration;
            return (
              <div className="power" key={p.id} style={{ ['--pc' as string]: def.color, ['--frac' as string]: frac }}>
                <span className="power-ring"><Thumb id={`pu-${p.id}`} size={34} /></span>
                <span className="power-name">{def.short}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
