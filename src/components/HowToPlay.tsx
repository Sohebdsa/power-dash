import { Screen, Thumb, GauriAvatar } from './ui';

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <Screen title="How to Play" kicker="Run, collect, learn" onBack={onBack} className="howto">
      <div className="howto-grid">
        <section className="howto-card">
          <h2>Controls</h2>
          <table className="keys">
            <tbody>
              <tr><td><kbd>←</kbd> <kbd>A</kbd></td><td>Swipe left</td><td>Move left</td></tr>
              <tr><td><kbd>→</kbd> <kbd>D</kbd></td><td>Swipe right</td><td>Move right</td></tr>
              <tr><td><kbd>↑</kbd> <kbd>W</kbd> <kbd>Space</kbd></td><td>Swipe up</td><td>Jump</td></tr>
              <tr><td><kbd>↓</kbd> <kbd>S</kbd></td><td>Swipe down</td><td>Slide (or drop fast in the air)</td></tr>
              <tr><td><kbd>Esc</kbd></td><td>Pause button</td><td>Pause</td></tr>
            </tbody>
          </table>
        </section>
        <section className="howto-card">
          <h2>Collect</h2>
          <div className="howto-row"><Thumb id="pad" size={48} /><Thumb id="cup" size={48} /><Thumb id="cloth" size={48} /><Thumb id="water" size={48} /></div>
          <p>Period-care items give big points and unlock facts.</p>
          <div className="howto-row"><Thumb id="apple" size={48} /><Thumb id="carrot" size={48} /><Thumb id="egg" size={48} /><Thumb id="beans" size={48} /></div>
          <p>Healthy food fuels your run. Collect <strong>5 different foods</strong> in a row for a Healthy Streak!</p>
        </section>
        <section className="howto-card">
          <h2>Avoid</h2>
          <div className="howto-row"><Thumb id="damp_cloth" size={48} /><Thumb id="bad_disposal" size={48} /><Thumb id="soda" size={48} /><Thumb id="burger" size={48} /></div>
          <p>Unsafe hygiene habits and too many treats cost a heart. Jump over low things, slide under high things, and switch lanes around big ones.</p>
        </section>
        <section className="howto-card">
          <h2>Power-ups</h2>
          <div className="howto-row"><Thumb id="pu-shield" size={48} /><Thumb id="pu-hygieneMagnet" size={48} /><Thumb id="pu-knowledge" size={48} /><Thumb id="pu-energy" size={48} /></div>
          <p>Grab glowing rings for shields, magnets, boosts and super jumps.</p>
        </section>
      </div>
      <div className="howto-gauri">
        <GauriAvatar size={52} />
        <p>Collect fruit, vegetables, protein <em>and</em> a period-care item for a <strong>Balanced Health Bonus</strong>. Every new item you find goes into your Encyclopedia!</p>
      </div>
    </Screen>
  );
}
