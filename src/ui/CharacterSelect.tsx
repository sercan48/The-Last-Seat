// ============================================================
// CharacterSelect.tsx — Compact, perfectly-proportioned character selection
// ============================================================

import React, { useRef, useEffect, useState } from 'react';
import { CHARACTERS, drawCharacter } from '../data/characters';
import { Difficulty } from '../game/GameState';
import * as Audio from '../systems/AudioSystem';

interface CharacterSelectProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  onSelect: (charId: string) => void;
  onBack: () => void;
}

const CharCard: React.FC<{
  char: typeof CHARACTERS[0];
  selected: boolean;
  onClick: () => void;
}> = ({ char, selected, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 64;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (ctx as any).imageSmoothingEnabled = false;

    let frame = 0;
    let time = 0;
    function draw() {
      ctx.fillStyle = '#121B27';
      ctx.fillRect(0, 0, size, size);

      // Platform pedestal with cyan neon glow
      ctx.fillStyle = '#22344A';
      ctx.fillRect(10, 50, 44, 5);
      ctx.fillStyle = '#00F0FF';
      ctx.fillRect(10, 50, 44, 1.2);

      drawCharacter(ctx, char.id, 32, 42, 30, 'idle', time);

      time += 0.03;
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, [char.id, selected]);

  return (
    <div
      className={`char-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Select ${char.name}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <span className={`char-rarity ${char.rarity}`}>{char.rarity}</span>
      <canvas ref={canvasRef} />
      <span className="char-name">{char.name}</span>
      <span className="char-desc">{char.description}</span>
    </div>
  );
};

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  difficulty,
  onSelectDifficulty,
  onSelect,
  onBack,
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    Audio.playCharacterSelect();
    setSelected(id);
  };

  const handleConfirm = () => {
    if (!selected) return;
    Audio.playClick();
    onSelect(selected);
  };

  return (
    <div className="screen char-select">
      <div className="char-select-content">
        <h2>CHOOSE YOUR SITTER</h2>

        {/* Compact Difficulty Selector Row */}
        <div className="char-diff-row">
          <span className="char-diff-label">DIFFICULTY:</span>
          <button
            type="button"
            className={`char-diff-pill diff-easy ${difficulty === 'easy' ? 'active' : ''}`}
            onClick={() => { Audio.playClick(); onSelectDifficulty('easy'); }}
          >
            🟢 EASY (2 Chairs)
          </button>
          <button
            type="button"
            className={`char-diff-pill diff-medium ${difficulty === 'medium' ? 'active' : ''}`}
            onClick={() => { Audio.playClick(); onSelectDifficulty('medium'); }}
          >
            🟡 MEDIUM (3 Chairs)
          </button>
          <button
            type="button"
            className={`char-diff-pill diff-deadly ${difficulty === 'deadly' ? 'active' : ''}`}
            onClick={() => { Audio.playClick(); onSelectDifficulty('deadly'); }}
          >
            🔴 DEADLY (4 Chairs)
          </button>
        </div>

        <div className="char-grid">
          {CHARACTERS.map(char => (
            <CharCard
              key={char.id}
              char={char}
              selected={selected === char.id}
              onClick={() => handleSelect(char.id)}
            />
          ))}
        </div>

        {/* High-visibility Action Buttons */}
        <div className="char-select-actions">
          <button
            className="btn btn-sit-down-large"
            onClick={handleConfirm}
            disabled={!selected}
            id="btn-sit-down"
            style={{ opacity: selected ? 1 : 0.45 }}
          >
            🪑 SIT DOWN & START TRIAL
          </button>
          <button
            className="btn btn-char-back"
            onClick={() => { Audio.playClick(); onBack(); }}
            id="btn-back-title"
          >
            ◄ BACK TO TITLE
          </button>
        </div>
      </div>
    </div>
  );
};
