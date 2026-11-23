// Keyboard + swipe input → discrete actions queue.

export type Action = 'left' | 'right' | 'jump' | 'slide' | 'pause';

export class Input {
  private queue: Action[] = [];
  private start: { x: number; y: number; id: number; fired: boolean; t: number } | null = null;
  enabled = true;
  onAny: (() => void) | null = null;

  constructor(private el: HTMLElement) {
    window.addEventListener('keydown', this.onKey);
    el.addEventListener('pointerdown', this.onDown, { passive: false });
    window.addEventListener('pointermove', this.onMove, { passive: false });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    el.addEventListener('touchmove', this.preventScroll, { passive: false });
  }

  private push(a: Action) {
    this.onAny?.();
    if (!this.enabled && a !== 'pause') return;
    // small buffer: keep the last 3 actions only
    this.queue.push(a);
    if (this.queue.length > 3) this.queue.shift();
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.repeat) return;
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
    const map: Record<string, Action> = {
      ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
      ArrowUp: 'jump', KeyW: 'jump', Space: 'jump', ArrowDown: 'slide', KeyS: 'slide', Escape: 'pause', KeyP: 'pause',
    };
    const a = map[e.code];
    if (a) {
      if (this.enabled || a === 'pause') e.preventDefault();
      this.push(a);
    }
  };

  private preventScroll = (e: TouchEvent) => { if (this.enabled) e.preventDefault(); };

  private onDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    this.start = { x: e.clientX, y: e.clientY, id: e.pointerId, fired: false, t: performance.now() };
  };

  private onMove = (e: PointerEvent) => {
    const s = this.start;
    if (!s || s.id !== e.pointerId || s.fired) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    const threshold = Math.max(28, Math.min(window.innerWidth, window.innerHeight) * 0.05);
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
    s.fired = true;
    if (Math.abs(dx) > Math.abs(dy)) this.push(dx > 0 ? 'right' : 'left');
    else this.push(dy > 0 ? 'slide' : 'jump');
  };

  private onUp = (e: PointerEvent) => {
    if (this.start && this.start.id === e.pointerId) this.start = null;
  };

  next(): Action | undefined { return this.queue.shift(); }
  clear() { this.queue.length = 0; }

  dispose() {
    window.removeEventListener('keydown', this.onKey);
    this.el.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    this.el.removeEventListener('touchmove', this.preventScroll);
  }
}
