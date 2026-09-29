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
    canvas.width = 320 * dpr;
    canvas.height = 200 * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (ctx as any).imageSmoothingEnabled = false;

    let animFrame = 0;
    let time = 0;

    // Atmospheric floating dust motes
    const particles = Array.from({ length: 18 }, () => ({
      x: Math.random() * 320,
      y: Math.random() * 200,
      vy: -0.3 - Math.random() * 0.4,
      size: 1 + Math.random() * 1.5,
      alpha: 0.2 + Math.random() * 0.4,
    }));

    function draw() {
      const c = ctx!;
      // Dark arena background with depth gradient
      const bgGrad = c.createLinearGradient(0, 0, 0, 200);
      bgGrad.addColorStop(0, '#060910');
      bgGrad.addColorStop(0.5, '#0C1320');
      bgGrad.addColorStop(1, '#04070C');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, 320, 200);

      // Arena ceiling girders
      c.strokeStyle = '#1E2C3F';
      c.lineWidth = 1;
      c.globalAlpha = 0.35;
      for (let x = 0; x < 320; x += 40) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x + 20, 35);
        c.lineTo(x + 40, 0);
        c.stroke();
      }
      c.strokeRect(0, 35, 320, 2);

      // Suspension bridge cables
      c.strokeStyle = '#3A4E68';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(10, 10);
      c.quadraticCurveTo(80, 80, 160, 45);
      c.stroke();
      c.beginPath();
      c.moveTo(310, 10);
      c.quadraticCurveTo(240, 80, 160, 45);
      c.stroke();
      c.globalAlpha = 1;

      // Distant Golden Throne Platform (The Objective)
      const throneX = 160;
      const throneY = 48;
      // Golden halo
      const throneGlow = c.createRadialGradient(throneX, throneY, 5, throneX, throneY, 55);
      throneGlow.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
      throneGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      c.fillStyle = throneGlow;
      c.fillRect(throneX - 60, throneY - 30, 120, 60);

      // Golden rays
      c.save();
      c.globalAlpha = 0.08;
      c.fillStyle = '#FFD700';
      for (let i = 0; i < 6; i++) {
        c.save();
        c.translate(throneX, throneY - 10);
        c.rotate(i * (Math.PI / 6) - Math.PI / 2.5 + Math.sin(time * 0.8) * 0.04);
        c.fillRect(-1.5, 0, 3, 100);
        c.restore();
      }
      c.restore();

      // Miniature Golden Throne
      drawChair(c, 'throne', 'gold', throneX, throneY, 26, 0, false, 0, 0.8, '#FF0055');

      // Volumetric Spotlights shining onto 3 suspended bridge chairs
      const spotConfigs = [
        { x: 75, y: 115, type: 'executive' as const, mat: 'leather' as const, size: 38 },
        { x: 160, y: 110, type: 'velvet' as const, mat: 'velvet' as const, size: 42 },
        { x: 245, y: 115, type: 'office' as const, mat: 'metal' as const, size: 38 },
      ];

      for (let i = 0; i < spotConfigs.length; i++) {
        const spot = spotConfigs[i];
        // Spotlight cone
        const sGrad = c.createLinearGradient(spot.x, 0, spot.x, spot.y + 20);
        sGrad.addColorStop(0, 'rgba(255, 240, 200, 0.02)');
        sGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.08)');
        sGrad.addColorStop(1, 'rgba(0, 240, 255, 0.22)');
        c.fillStyle = sGrad;
        c.beginPath();
        c.moveTo(spot.x - 12, 0);
        c.lineTo(spot.x + 12, 0);
        c.lineTo(spot.x + 28, spot.y + 16);
        c.lineTo(spot.x - 28, spot.y + 16);
        c.closePath();
        c.fill();

        // Suspended tempered glass pedestal
        c.fillStyle = 'rgba(0, 240, 255, 0.18)';
        c.fillRect(spot.x - 24, spot.y + 10, 48, 8);
        c.strokeStyle = '#00F0FF';
        c.lineWidth = 1;
        c.strokeRect(spot.x - 24, spot.y + 10, 48, 8);

        // Chair on pedestal with subtle float
        const floatY = Math.sin(time * 2.2 + i * 1.6) * 1.5;
        drawChair(c, spot.type, spot.mat, spot.x, spot.y + floatY, spot.size, i, false, 0, 0, '#DAA520');
      }

      // Foreground Launch Platform (Bottom)
      const launchY = 162;
      const platGrad = c.createLinearGradient(0, launchY, 0, 200);
      platGrad.addColorStop(0, '#1A2536');
      platGrad.addColorStop(1, '#0C121C');
      c.fillStyle = platGrad;
      c.fillRect(20, launchY, 280, 38);

      // Warning hazard stripes on launch edge
      c.fillStyle = '#FFB800';
      c.fillRect(20, launchY - 2, 280, 2.5);

      // Player character standing at platform edge looking forward
      drawCharacter(c, 'suit', 160, launchY - 14, 38, 'idle', time);

      // Floating dust particles
      c.fillStyle = '#A0E6FF';
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < 20) {
          p.y = 190;
          p.x = Math.random() * 320;
        }
        c.globalAlpha = p.alpha;
        c.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      c.globalAlpha = 1;

      // Illuminated Title Card Badge
      c.fillStyle = 'rgba(10, 18, 30, 0.85)';
      c.fillRect(24, 10, 100, 16);
      c.strokeStyle = '#00F0FF';
      c.lineWidth = 1;
      c.strokeRect(24, 10, 100, 16);
      c.fillStyle = '#00F0FF';
      c.font = 'bold 7px "IBM Plex Mono", monospace';
      c.textAlign = 'center';
      c.fillText('SUSPENDED BRIDGE TRIAL', 74, 21);

      time += 0.016;
      animFrame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <div className="screen title-screen">
      <div className="title-content">
        <div className="title-header">
          <h1>THE LAST SEAT</h1>
          <p className="tagline">Every step needs a seat. Only one survives.</p>
        </div>

        <div className="title-visual">
          <canvas ref={visualRef} />
        </div>

        {/* Difficulty Selection */}
        <div className="difficulty-section">
          <span className="difficulty-label">SELECT DIFFICULTY</span>
          <div className="difficulty-buttons">
            <button
              type="button"
              className={`diff-btn diff-easy ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('easy'); }}
              id="btn-diff-easy"
            >
              <span>🟢 EASY</span>
              <span className="diff-sub">2 Chairs (50%)</span>
            </button>
            <button
              type="button"
              className={`diff-btn diff-medium ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('medium'); }}
              id="btn-diff-medium"
            >
              <span>🟡 MEDIUM</span>
              <span className="diff-sub">3 Chairs (33%)</span>
            </button>
            <button
              type="button"
              className={`diff-btn diff-deadly ${difficulty === 'deadly' ? 'active' : ''}`}
              onClick={() => { Audio.playClick(); onSelectDifficulty('deadly'); }}
              id="btn-diff-deadly"
            >
              <span>🔴 DEADLY</span>
              <span className="diff-sub">4 Chairs (25%)</span>
            </button>
          </div>
        </div>

        <div className="title-buttons">
          <button
            className="btn btn-primary"
            onClick={() => { Audio.playClick(); onPlay(); }}
            aria-label="Play the game"
            id="btn-play"
          >
            PLAY
          </button>
          <button
            className="btn"
            onClick={() => { Audio.playClick(); onHowToPlay(); }}
            aria-label="How to play"
            id="btn-how"
          >
            HOW TO PLAY
          </button>
          <button
            className="btn"
            onClick={() => { Audio.playClick(); onArtDept(); }}
            aria-label="Art Department gallery"
            id="btn-art"
          >
            ART DEPARTMENT
          </button>
        </div>

        {stats.runs > 0 && (
          <div className="title-stats">
            <h3>YOUR RECORD</h3>
            <div className="stat-row"><span>RUNS</span><span>{stats.runs}</span></div>
            <div className="stat-row"><span>WINS</span><span>{stats.wins}</span></div>
            <div className="stat-row"><span>BEST ROW</span><span>{stats.bestRow} / 12</span></div>
            {stats.fastestWin !== null && (
              <div className="stat-row"><span>BEST TIME</span><span>{stats.fastestWin.toFixed(2)}s</span></div>
            )}
          </div>
        )}

        {/* Legal / Fan Art Disclaimer */}
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

        <p className="title-footer">A MUTUAL FUN FAN-ART MINI-GAME</p>
      </div>
    </div>
  );
};
