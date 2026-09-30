// ============================================================
// TitleScreen.tsx — Main title screen with visual and stats
// ============================================================

import React, { useRef, useEffect } from 'react';
import { drawChair } from '../data/chairs';
import { drawCharacter } from '../data/characters';
import { PlayerStats, Difficulty } from '../game/GameState';
import * as Audio from '../systems/AudioSystem';

interface TitleScreenProps {
  stats: PlayerStats;
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onPlay: () => void;
  onHowToPlay: () => void;
  onArtDept: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  stats,
  difficulty,
  onSelectDifficulty,
  onPlay,
  onHowToPlay,
  onArtDept,
}) => {
  const visualRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = visualRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    let W = 480;
    let H = 240;
    const ctx = canvas.getContext('2d')!;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      W = Math.max(320, Math.round(rect.width));
      H = Math.max(130, Math.round(rect.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      (ctx as any).imageSmoothingEnabled = false;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    let animFrame = 0;
    let time = 0;

    // Atmospheric floating dust motes
    const particles = Array.from({ length: 26 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: -0.25 - Math.random() * 0.45,
      size: 1 + Math.random() * 1.8,
      alpha: 0.15 + Math.random() * 0.45,
    }));

    function draw() {
      const c = ctx!;
      // Dark arena background with depth gradient
      const bgGrad = c.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, '#05080E');
      bgGrad.addColorStop(0.4, '#0A121E');
      bgGrad.addColorStop(0.8, '#060B12');
      bgGrad.addColorStop(1, '#020408');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, W, H);

      // Arena ceiling girders
      c.save();
      c.strokeStyle = '#1A2738';
      c.lineWidth = 1;
      c.globalAlpha = 0.35;
      for (let x = 0; x < W; x += 40) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 20, 36);
        c.lineTo(x + 40, 0);
        c.stroke();
      }
      c.strokeRect(0, 36, W, 2);

      // Suspension bridge heavy cables running from high ceiling to throne
      c.strokeStyle = '#34475E';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(20, 10);
      c.quadraticCurveTo(120, 90, 240, 48);
      c.stroke();
      c.beginPath();
      c.moveTo(W - 20, 10);
      c.quadraticCurveTo(W - 120, 90, 240, 48);
      c.stroke();
      c.restore();

      // Distant Golden Throne Platform (The Endgame)
      const throneX = 240;
      const throneY = 48;
      // Golden halo
      const throneGlow = c.createRadialGradient(throneX, throneY, 6, throneX, throneY, 70);
      throneGlow.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
      throneGlow.addColorStop(0.7, 'rgba(218, 165, 32, 0.1)');
      throneGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      c.fillStyle = throneGlow;
      c.fillRect(throneX - 80, throneY - 35, 160, 70);

      // Golden rays
      c.save();
      c.globalAlpha = 0.08;
      c.fillStyle = '#FFD700';
      for (let i = 0; i < 8; i++) {
        c.save();
        c.translate(throneX, throneY - 10);
        c.rotate(i * (Math.PI / 8) - Math.PI / 2.3 + Math.sin(time * 0.8) * 0.04);
        c.fillRect(-1.5, 0, 3, 110);
        c.restore();
      }
      c.restore();

      // Miniature Golden Throne waiting at the end
      drawChair(c, 'throne', 'gold', throneX, throneY, 30, 0, false, 0, 0.85, '#FF0055');

      // Volumetric Spotlights shining onto 3 suspended bridge chairs
      const spotConfigs = [
        { x: 120, y: 130, type: 'executive' as const, mat: 'leather' as const, size: 44, color: '#DAA520' },
        { x: 240, y: 122, type: 'velvet' as const, mat: 'velvet' as const, size: 48, color: '#FF0055' },
        { x: 360, y: 130, type: 'office' as const, mat: 'metal' as const, size: 44, color: '#00F0FF' },
      ];

      for (let i = 0; i < spotConfigs.length; i++) {
        const spot = spotConfigs[i];
        // Spotlight cone
        const sGrad = c.createLinearGradient(spot.x, 0, spot.x, spot.y + 24);
        sGrad.addColorStop(0, 'rgba(255, 240, 200, 0.02)');
        sGrad.addColorStop(0.65, 'rgba(0, 240, 255, 0.08)');
        sGrad.addColorStop(1, 'rgba(0, 240, 255, 0.24)');
        c.fillStyle = sGrad;
        c.beginPath();
        c.moveTo(spot.x - 16, 0);
        c.lineTo(spot.x + 16, 0);
        c.lineTo(spot.x + 36, spot.y + 20);
        c.lineTo(spot.x - 36, spot.y + 20);
        c.closePath();
        c.fill();

        // Suspended tempered glass pedestal with neon cyan edge
        c.fillStyle = 'rgba(0, 240, 255, 0.2)';
        c.fillRect(spot.x - 30, spot.y + 12, 60, 10);
        c.strokeStyle = '#00F0FF';
        c.lineWidth = 1.5;
        c.strokeRect(spot.x - 30, spot.y + 12, 60, 10);

        // Subtle floating chair on pedestal
        const floatY = Math.sin(time * 2.2 + i * 1.6) * 2;
        drawChair(c, spot.type, spot.mat, spot.x, spot.y + floatY, spot.size, i, false, 0, 0, spot.color);
      }

      // Foreground Launch Platform (Bottom)
      const launchY = 188;
      const platGrad = c.createLinearGradient(0, launchY, 0, H);
      platGrad.addColorStop(0, '#1E2C3F');
      platGrad.addColorStop(0.3, '#141E2C');
      platGrad.addColorStop(1, '#090E16');
      c.fillStyle = platGrad;
      c.fillRect(30, launchY, W - 60, 52);

      // Warning hazard stripes on launch edge
      c.fillStyle = '#FFB800';
      c.fillRect(30, launchY - 3, W - 60, 3);

      // Player character standing at platform edge looking forward
      drawCharacter(c, 'suit', 240, launchY - 16, 42, 'idle', time);

      // Floating dust particles
      c.fillStyle = '#A0E6FF';
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < 20) {
          p.y = H - 10;
          p.x = Math.random() * W;
        }
        c.globalAlpha = p.alpha;
        c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      c.globalAlpha = 1;

      // Illuminated Title Card Badge in top corner
      c.fillStyle = 'rgba(10, 18, 30, 0.85)';
      c.fillRect(20, 10, 120, 18);
      c.strokeStyle = '#00F0FF';
      c.lineWidth = 1;
      c.strokeRect(20, 10, 120, 18);
      c.fillStyle = '#00F0FF';
      c.font = 'bold 8px "IBM Plex Mono", monospace';
      c.textAlign = 'center';
      c.fillText('PERILOUS TRIAL ARENA', 80, 22);

      time += 0.016;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  return (
    <div className="screen title-screen">
      <div className="title-content">
        {/* Header */}
        <div className="title-header">
          <div className="title-badge">A MUTUAL FUN FAN-ART TRIAL</div>
          <h1>THE LAST SEAT</h1>
          <p className="tagline">EVERY STEP NEEDS A SEAT • ONLY ONE SURVIVES</p>
        </div>

        {/* Hero Preview Stage */}
        <div className="title-visual">
          <canvas ref={visualRef} />
          <div className="visual-scanline-overlay" />
        </div>

        {/* Difficulty Selection */}
        <div className="difficulty-section">
          <div className="difficulty-header">
            <span className="difficulty-label">SELECT DIFFICULTY LEVEL</span>
            <span className="difficulty-sublabel">CHOOSE YOUR SURVIVAL ODDS</span>
          </div>
          <div className="difficulty-buttons">
            <button
              type="button"
              className={`diff-btn diff-easy ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('easy'); }}
              id="btn-diff-easy"
            >
              <div className="diff-top">
                <span className="diff-icon">🟢</span>
                <span className="diff-title">EASY</span>
              </div>
              <span className="diff-sub">2 Chairs Per Row</span>
              <span className="diff-odds">50% Odds • Keys [1][2]</span>
            </button>
            <button
              type="button"
              className={`diff-btn diff-medium ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('medium'); }}
              id="btn-diff-medium"
            >
              <div className="diff-top">
                <span className="diff-icon">🟡</span>
                <span className="diff-title">MEDIUM</span>
              </div>
              <span className="diff-sub">3 Chairs Per Row</span>
              <span className="diff-odds">33% Odds • Keys [1][2][3]</span>
            </button>
            <button
              type="button"
              className={`diff-btn diff-deadly ${difficulty === 'deadly' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('deadly'); }}
              id="btn-diff-deadly"
            >
              <div className="diff-top">
                <span className="diff-icon">🔴</span>
                <span className="diff-title">DEADLY</span>
              </div>
              <span className="diff-sub">4 Chairs Per Row</span>
              <span className="diff-odds">25% Odds • Keys [1][2][3][4]</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="title-action-row">
          <button
            className="btn btn-primary btn-play-large"
            onClick={() => { Audio.playClick(); onPlay(); }}
            aria-label="Play the game"
            id="btn-play"
          >
            <span className="play-icon">▶</span> START GAME
          </button>
          <div className="secondary-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => { Audio.playClick(); onHowToPlay(); }}
              aria-label="How to play"
              id="btn-how"
            >
              HOW TO PLAY
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { Audio.playClick(); onArtDept(); }}
              aria-label="Art Department gallery"
              id="btn-art"
            >
              ART DEPARTMENT
            </button>
          </div>
        </div>

        {/* Player Stats Record */}
        {stats.runs > 0 && (
          <div className="title-stats-bar">
            <div className="stat-pill"><span className="label">RUNS</span><span className="val">{stats.runs}</span></div>
            <div className="stat-pill"><span className="label">WINS</span><span className="val">{stats.wins}</span></div>
            <div className="stat-pill"><span className="label">BEST ROW</span><span className="val">{stats.bestRow}/12</span></div>
            {stats.fastestWin !== null && (
              <div className="stat-pill"><span className="label">BEST TIME</span><span className="val">{stats.fastestWin.toFixed(2)}s</span></div>
            )}
          </div>
        )}

        {/* Legal Disclaimer */}
        <div className="title-disclaimer">
          ⚠️ <strong>Disclaimer:</strong> This game is an unofficial fan-art project created by{' '}
          <a
            href="https://x.com/alphapandaeth"
            target="_blank"
            rel="noopener noreferrer"
            title="@alphapandaeth on X"
          >
            @alphapandaeth
          </a>
          . It is not an official Mutual Fun game.
        </div>
      </div>
    </div>
  );
};
