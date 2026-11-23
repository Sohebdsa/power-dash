import { useState } from 'react';
import { LEARNING_SECTIONS, DISCLAIMER, type Section } from '../data/learning';
import { useGame } from '../store/gameStore';
import { Art, Screen, Icon, Rangoli } from './ui';
import { audio } from '../systems/audio';

export function LearningCenter({ onBack }: { onBack: () => void }) {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const section = LEARNING_SECTIONS.find((s) => s.id === sectionId) ?? null;
  const progress = useGame((s) => s.progress);

  return (
    <Screen
      title={section ? section.title : 'Learning Center'}
      kicker={section ? `Section ${section.letter}` : 'Menstrual health & nutrition'}
      onBack={section ? () => setSectionId(null) : onBack}
      className="learning"
    >
      {!section ? (
        <>
          <div className="lc-intro">
            <Rangoli size={84} />
            <p>
              Periods are a normal, healthy part of growing up. Here you can learn about your body, period products,
              staying clean and comfortable, and eating well. Read at your own pace — and remember, you can always ask a trusted adult.
            </p>
          </div>
          <div className="section-grid">
            {LEARNING_SECTIONS.map((s) => {
              const total = s.topics?.length ?? s.myths?.length ?? 0;
              const read = s.topics
                ? s.topics.filter((t) => progress.topicsRead.includes(`${s.id}.${t.id}`)).length
                : s.myths!.filter((m) => progress.mythsRead.includes(m.id)).length;
              return (
                <button type="button" key={s.id} className="section-card" style={{ ['--sc' as string]: s.color }}
                  onClick={() => { audio.sfx('click'); setSectionId(s.id); }}>
                  <span className="section-letter">{s.letter}</span>
                  <span className="section-title">{s.title}</span>
                  <span className="section-blurb">{s.blurb}</span>
                  <span className="section-progress"><span style={{ width: `${(read / Math.max(1, total)) * 100}%` }} /></span>
                  <span className="section-count">{read}/{total} read</span>
                </button>
              );
            })}
          </div>
          <p className="disclaimer">{DISCLAIMER}</p>
        </>
      ) : (
        <SectionView section={section} />
      )}
    </Screen>
  );
}

function SectionView({ section }: { section: Section }) {
  const mutate = useGame((s) => s.mutateProgress);
  const progress = useGame((s) => s.progress);
  const checkAchievements = useGame((s) => s.checkAchievements);
  const [open, setOpen] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  const markTopic = (id: string) => {
    const key = `${section.id}.${id}`;
    if (!progress.topicsRead.includes(key)) mutate((p) => { p.topicsRead.push(key); });
  };

  if (section.myths) {
    return (
      <>
        <p className="lc-hint">Tap a card to flip it from <strong>myth</strong> to <strong>fact</strong>.</p>
        <div className="myth-grid">
          {section.myths.map((m) => {
            const isFlipped = !!flipped[m.id];
            return (
              <button type="button" key={m.id} className={`myth-card ${isFlipped ? 'flipped' : ''}`} aria-pressed={isFlipped}
                onClick={() => {
                  audio.sfx(isFlipped ? 'click' : 'discovery');
                  setFlipped((f) => ({ ...f, [m.id]: !f[m.id] }));
                  if (!progress.mythsRead.includes(m.id)) {
                    mutate((p) => { p.mythsRead.push(m.id); });
                    const fresh = checkAchievements();
                    if (fresh.includes('mythBuster')) audio.sfx('achievement');
                  }
                }}>
                <span className="myth-face myth-front">
                  <span className="myth-tag">Myth</span>
                  <span className="myth-text">“{m.myth}”</span>
                  <span className="myth-cta">Tap to see the fact</span>
                </span>
                <span className="myth-face myth-back">
                  <span className="myth-tag fact">Fact <Icon name="check" size={16} /></span>
                  <span className="myth-text">{m.fact}</span>
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div className="topic-list">
      {section.topics!.map((t) => {
        const isOpen = open === t.id;
        const read = progress.topicsRead.includes(`${section.id}.${t.id}`);
        return (
          <article key={t.id} className={`topic ${isOpen ? 'open' : ''}`} style={{ ['--sc' as string]: section.color }}>
            <button type="button" className="topic-head" aria-expanded={isOpen}
              onClick={() => { audio.sfx('click'); setOpen(isOpen ? null : t.id); if (!isOpen) markTopic(t.id); }}>
              <Art name={t.art} size={56} />
              <span className="topic-title">{t.title}</span>
              {read && <span className="topic-read" aria-label="read"><Icon name="check" size={16} /></span>}
              <span className="chev" aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="topic-body">
                <Art name={t.art} size={120} />
                <div>{t.body.map((p, i) => <p key={i}>{p}</p>)}</div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
