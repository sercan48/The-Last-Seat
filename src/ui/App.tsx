// ============================================================
// App.tsx — Main application component
// ============================================================

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine';
import { GameState, GameScreen, Difficulty, createInitialState, loadStats } from '../game/GameState';
import { TitleScreen } from './TitleScreen';
import { CharacterSelect } from './CharacterSelect';
import { HowToPlay } from './HowToPlay';
import { ResultsScreen } from './ResultsScreen';
import { ArtDepartment } from './ArtDepartment';
import * as Audio from '../systems/AudioSystem';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [screen, setScreen] = useState<GameScreen>('TITLE');
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [muted, setMuted] = useState(false);

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, (state) => {
      setScreen(state.screen);
      setGameState({ ...state });
    });
    engineRef.current = engine;
    engine.start();

    return () => engine.stop();
  }, []);

  // Input handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      engineRef.current?.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      engineRef.current?.handleClick(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        engineRef.current?.handleClick(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        engineRef.current?.handleKey(e.key);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    window.addEventListener('keydown', handleKey);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => engineRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePlay = useCallback(() => {
    setScreen('CHARACTER_SELECT');
    if (engineRef.current) {
      engineRef.current.state.screen = 'CHARACTER_SELECT';
    }
  }, []);

  const handleCharSelect = useCallback((charId: string) => {
    engineRef.current?.startGame(charId, difficulty);
  }, [difficulty]);

  const handlePlayAgain = useCallback(() => {
    const lastChar = gameState.selectedCharacter;
    if (lastChar && engineRef.current) {
      engineRef.current.startGame(lastChar, difficulty);
    }
  }, [gameState.selectedCharacter, difficulty]);

  const handleHome = useCallback(() => {
    setScreen('TITLE');
    if (engineRef.current) {
      engineRef.current.state.screen = 'TITLE';
      engineRef.current.state.stats = loadStats();
    }
  }, []);

  const handleMute = useCallback(() => {
    const newMuted = !muted;
    setMuted(newMuted);
    Audio.setMuted(newMuted);
  }, [muted]);

  const isGameplayScreen = screen === 'PLAYING' || screen === 'SELECTING' ||
    screen === 'SAFE_ANIMATION' || screen === 'FAILURE_ANIMATION' ||
    screen === 'ROW_TRANSITION' || screen === 'VICTORY_ANIMATION' ||
    screen === 'COUNTDOWN';

  return (
    <>
      {/* Game canvas — always present */}
      <div className="game-container" style={{ opacity: isGameplayScreen ? 1 : 0, pointerEvents: isGameplayScreen ? 'auto' : 'none' }}>
        <canvas ref={canvasRef} className="game-canvas" aria-label="The Last Seat game canvas" />
      </div>

      {/* UI screens */}
      {screen === 'TITLE' && (
        <TitleScreen
          stats={gameState.stats}
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onPlay={handlePlay}
          onHowToPlay={() => setScreen('HOW_TO_PLAY')}
          onArtDept={() => setScreen('ART_DEPARTMENT')}
        />
      )}

      {screen === 'CHARACTER_SELECT' && (
        <CharacterSelect
          difficulty={difficulty}
          onSelectDifficulty={setDifficulty}
          onSelect={handleCharSelect}
          onBack={handleHome}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlay onBack={handleHome} />
      )}

      {screen === 'ART_DEPARTMENT' && (
        <ArtDepartment onBack={handleHome} />
      )}

      {screen === 'RESULTS' && (
        <ResultsScreen state={gameState} onPlayAgain={handlePlayAgain} onHome={handleHome} />
      )}

      {/* Global mute button */}
      <button
        className="mute-btn"
        onClick={handleMute}
        aria-label={muted ? 'Unmute' : 'Mute'}
        id="btn-mute"
      >
        {muted ? '🔇 MUTED' : '🔊 SOUND'}
      </button>
    </>
  );
};
