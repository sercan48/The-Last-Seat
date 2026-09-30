// ============================================================
// ResultsScreen.tsx — Win/loss results with prominent cards & action buttons
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { GameState, TOTAL_ROWS } from '../game/GameState';
import * as Audio from '../systems/AudioSystem';

interface ResultsScreenProps {
  state: GameState;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ state, onPlayAgain, onHome }) => {
  const [copied, setCopied] = useState(false);
  const [showShareText, setShowShareText] = useState(false);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const isVictory = state.isVictory;
  const rowReached = isVictory ? TOTAL_ROWS : state.currentRow + 1;
  const timeUsed = state.finalTime;
  const diffName = state.difficulty.toUpperCase();
  const chairsPerRow = state.run?.chairsPerRow || 3;

  // Celebratory confetti animation on Victory
  useEffect(() => {
    if (!isVictory) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const colors = ['#FFD700', '#00F0FF', '#FF0055', '#00FF66', '#FFF', '#FFAA00'];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * -window.innerHeight,
      w: 6 + Math.random() * 8,
      h: 4 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 60,
      vy: 120 + Math.random() * 160,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let lastT = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - lastT) / 1000, 0.1);
      lastT = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isVictory]);

  const shareText = isVictory
    ? `I conquered THE LAST SEAT.\n\n${TOTAL_ROWS}/${TOTAL_ROWS} suspended tiers survived.\nDifficulty: ${diffName} (${chairsPerRow} chairs)\nTime: ${timeUsed}s\n\nTHE THRONE IS MINE.\n\n#TheLastSeat`
    : `THE LAST SEAT\n\nTier ${rowReached}/${TOTAL_ROWS} (${diffName})\n\nThe abyss claimed me.\nI'll be back.\n\n#TheLastSeat`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setShowShareText(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback */ }
  };

  return (
    <div className="screen screen-overlay results-screen">
      {isVictory && <canvas ref={confettiCanvasRef} className="results-confetti-canvas" />}

      <div className="results-card">
        {isVictory ? (
          <div className="results-header victory-header">
            <div className="results-badge victory-badge">👑 SUPREME CHAMPION 👑</div>
            <h2 className="victory">THE LAST SEAT CONQUERED</h2>
            <p className="results-subtitle">
              ALL {TOTAL_ROWS} PERILOUS TIERS SURVIVED • THE GOLDEN THRONE IS YOURS
            </p>
          </div>
        ) : (
          <div className="results-header defeat-header">
            <div className="results-badge defeat-badge">💀 RUN TERMINATED 💀</div>
            <h2 className="defeat">CHAIR BROKEN.</h2>
            <p className="results-subtitle">
              THE TEMPERED GLASS SHATTERED INTO THE VOID
            </p>
          </div>
        )}

        {/* Scorecard Grid */}
        <div className="results-scorecard">
          <div className="score-box">
            <span className="score-label">TIER REACHED</span>
            <span className={`score-value ${isVictory ? 'gold' : 'amber'}`}>
              {rowReached} <span className="score-denom">/ {TOTAL_ROWS}</span>
            </span>
          </div>

          <div className="score-box">
            <span className="score-label">TIME USED</span>
            <span className="score-value cyan">
              {timeUsed}s
            </span>
          </div>

          <div className="score-box">
            <span className="score-label">DIFFICULTY</span>
            <span className="score-value white">
              {diffName} <span className="score-denom">({chairsPerRow} Chairs)</span>
            </span>
          </div>

          <div className="score-box">
            <span className="score-label">BEST RECORD</span>
            <span className="score-value green">
              {state.stats.bestRow > 0 ? `Tier ${state.stats.bestRow}/12` : 'First Run'}
            </span>
          </div>
        </div>

        {!isVictory && state.failureMessage && (
          <div className="results-quote-box">
            <span className="quote-mark">“</span>
            <p className="results-message">{state.failureMessage}</p>
            <span className="quote-mark right">”</span>
          </div>
        )}

        {/* Action Buttons matching Choose Your Sitter Format */}
        <div className="char-select-actions results-actions">
          <button
            className="btn btn-sit-down-large"
            onClick={() => { Audio.playClick(); onPlayAgain(); }}
            id="btn-play-again"
          >
            {isVictory ? '👑 START NEW EXPEDITION' : '🪑 TRY AGAIN (RETRY)'}
          </button>

          <button
            className="btn btn-char-back"
            onClick={() => { Audio.playClick(); handleShare(); }}
            id="btn-share"
          >
            {copied ? '✓ COPIED!' : '📤 SHARE RESULT'}
          </button>

          <button
            className="btn btn-char-back"
            onClick={() => { Audio.playClick(); onHome(); }}
            id="btn-home"
          >
            ◄ BACK TO TITLE
          </button>
        </div>

        {showShareText && (
          <div className="share-box-container">
            <div className="share-text">{shareText}</div>
            <button className="btn btn-char-back" onClick={handleCopy}>
              {copied ? '✓ COPIED!' : 'COPY RESULT'}
            </button>
          </div>
        )}

        {copied && (
          <div className="copied-toast">
            ✓ Result copied to clipboard! Share your glory.
          </div>
        )}
      </div>
    </div>
  );
};
