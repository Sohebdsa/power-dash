import { useCallback, useEffect, useRef } from 'react';
import { Game } from './game/Game';
import { buildSprites } from './game/models/sprites';
import { useGame } from './store/gameStore';
import { audio } from './systems/audio';
import { Menu } from './components/Menu';
import { HUD } from './components/HUD';
import { Pause } from './components/Pause';
import { GameOver } from './components/GameOver';
import { LearningCenter } from './components/LearningCenter';
import { Encyclopedia } from './components/Encyclopedia';
import { Achievements } from './components/Achievements';
import { Settings } from './components/Settings';
import { HowToPlay } from './components/HowToPlay';
import { CharacterSelect } from './components/CharacterSelect';
import type { CharacterId } from './game/models/kid';
import { Logo } from './components/ui';

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const screen = useGame((s) => s.screen);
  const settings = useGame((s) => s.settings);
  const settingsReturn = useGame((s) => s.settingsReturn);
  const setScreen = useGame((s) => s.setScreen);

  useEffect(() => {
    if (!stageRef.current || !popRef.current) return;
    const game = new Game(stageRef.current, popRef.current);
    gameRef.current = game;
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    Promise.race([fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]).then(() => {
      if (cancelled) return;
      // Item sprites double as UI thumbnails, so the HUD and encyclopedia match the game.
      buildSprites(game.renderer.capabilities.getMaxAnisotropy()).then((thumbs) => {
        if (cancelled) return;
        useGame.getState().setThumbs(thumbs);
        useGame.getState().setScreen('menu');
      });
    });
    if (import.meta.env.DEV) {
      // debugging handles for development only
      const w = window as unknown as { __powerDash?: Game; __store?: typeof useGame };
      w.__powerDash = game;
      w.__store = useGame;
    }
    return () => {
      cancelled = true;
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    audio.setVolumes(settings.musicVolume, settings.sfxVolume, settings.muted);
    gameRef.current?.setReduceMotion(settings.reduceMotion);
  }, [settings]);

  const play = useCallback(() => {
    setScreen('playing');
    gameRef.current?.start();
  }, [setScreen]);
  const pause = useCallback(() => gameRef.current?.pause(), []);
  const resume = useCallback(() => gameRef.current?.resume(), []);
  const goMenu = useCallback(() => {
    gameRef.current?.toMenu();
    setScreen('menu');
  }, [setScreen]);

  const previewCharacter = useCallback((id: CharacterId) => gameRef.current?.setCharacter(id), []);
  const closeCharacters = useCallback(() => setScreen('menu'), [setScreen]);

  return (
    <div className="app">
      <div className="stage" ref={stageRef} />
      <div className="pop-layer" ref={popRef} aria-hidden />
      {screen === 'loading' && (
        <div className="loading">
          <Logo />
          <div className="loader" aria-label="Loading" />
        </div>
      )}
      {screen === 'menu' && <Menu onPlay={play} />}
      {screen === 'characters' && <CharacterSelect onPreview={previewCharacter} onDone={closeCharacters} />}
      {(screen === 'playing' || screen === 'paused') && <HUD onPause={pause} />}
      {screen === 'paused' && <Pause onResume={resume} onRestart={play} onMenu={goMenu} />}
      {screen === 'gameover' && <GameOver onPlay={play} onMenu={goMenu} />}
      {screen === 'learning' && <LearningCenter onBack={goMenu} />}
      {screen === 'encyclopedia' && <Encyclopedia onBack={goMenu} />}
      {screen === 'achievements' && <Achievements onBack={goMenu} />}
      {screen === 'howto' && <HowToPlay onBack={goMenu} />}
      {screen === 'settings' && <Settings onBack={() => setScreen(settingsReturn === 'paused' ? 'paused' : 'menu')} />}
    </div>
  );
}
