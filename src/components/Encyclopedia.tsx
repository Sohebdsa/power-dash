import { useState } from 'react';
import { FOODS, HYGIENE, HAZARDS, POWERUPS, type CollectibleDef } from '../data/items';
import { useGame } from '../store/gameStore';
import { Screen, Thumb, Icon } from './ui';
import { audio } from '../systems/audio';

type Tab = 'hygiene' | 'food' | 'avoid' | 'powers';

export function Encyclopedia({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('hygiene');
  const discovered = useGame((s) => s.progress.discovered);
  const [sel, setSel] = useState<CollectibleDef | null>(null);

  const list = tab === 'hygiene' ? HYGIENE : FOODS;
  const tabs: [Tab, string][] = [['hygiene', 'Period Care'], ['food', 'Healthy Food'], ['avoid', 'Things to Avoid'], ['powers', 'Power-ups']];

  return (
    <Screen title="Encyclopedia" kicker={`${discovered.length} of ${FOODS.length + HYGIENE.length} discovered`} onBack={onBack} className="ency">
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={`tab ${tab === id ? 'on' : ''}`}
            onClick={() => { audio.sfx('click'); setTab(id); setSel(null); }}>{label}</button>
        ))}
      </div>
      {(tab === 'hygiene' || tab === 'food') && (
        <>
          <div className="ency-grid">
            {list.map((c) => {
              const known = discovered.includes(c.id);
              return (
                <button type="button" key={c.id} className={`ency-item ${known ? '' : 'locked'} ${sel?.id === c.id ? 'sel' : ''}`}
                  onClick={() => { audio.sfx('click'); setSel(c); }}>
                  <Thumb id={c.id} size={72} locked={!known} alt={known ? c.name : 'Not yet discovered'} />
                  <span className="ency-name">{known ? c.name : '???'}</span>
                  {!known && <span className="ency-lock"><Icon name="lock" size={14} /></span>}
                  {known && c.category !== 'hygiene' && <span className={`cat cat-${c.category}`}>{c.category}</span>}
                </button>
              );
            })}
          </div>
          {sel && (
            <div className="ency-detail" key={sel.id}>
              <Thumb id={sel.id} size={110} locked={!discovered.includes(sel.id)} />
              <div>
                {discovered.includes(sel.id) ? (
                  <>
                    <h2>{sel.name} <span className="pts">+{sel.points}</span></h2>
                    <p>{sel.fact}</p>
                    <p className="muted">{sel.more}</p>
                  </>
                ) : (
                  <>
                    <h2>Not discovered yet</h2>
                    <p className="muted">Collect this item during a run to unlock its fact.</p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      {tab === 'avoid' && (
        <>
          <p className="lc-hint">These show <strong>unsafe practices</strong> or foods to enjoy only sometimes. Period products themselves are never “bad” — it's how we use and care for them that matters.</p>
          <div className="avoid-list">
            {HAZARDS.map((h) => (
              <div key={h.id} className={`avoid ${h.kind}`}>
                <Thumb id={h.id} size={64} />
                <div>
                  <strong>{h.name}</strong>
                  <span>{h.message}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {tab === 'powers' && (
        <div className="avoid-list">
          {POWERUPS.map((p) => (
            <div key={p.id} className="avoid power-row" style={{ ['--pc' as string]: p.color }}>
              <Thumb id={`pu-${p.id}`} size={64} />
              <div>
                <strong>{p.name}</strong>
                <span>{p.description}{p.duration ? ` (${p.duration}s)` : ' (until used)'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Screen>
  );
}
