// ============================================================
// ResultsScreen.tsx — Win/loss results with share functionality
// ============================================================

import React, { useState } from 'react';
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

  const isVictory = state.isVictory;
  const rowReached = isVictory ? TOTAL_ROWS : state.currentRow + 1;
  const timeUsed = state.finalTime;

  const shareText = isVictory
    ? `I conquered THE LAST SEAT.\n\n${TOTAL_ROWS}/${TOTAL_ROWS} suspended chairs survived.\nTime: ${timeUsed}s\n\nTHE THRONE IS MINE.\n\n#TheLastSeat`
    : `THE LAST SEAT\n\nTier ${rowReached}/${TOTAL_ROWS}\n\nThe abyss claimed me.\nI'll be back.\n\n#TheLastSeat`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowShareText(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback already shown */ }
  };

  return (
    <div className="screen screen-overlay results-screen">
      <div className="results-content">
        {isVictory ? (
          <>
            <h2 className="victory">CHAIR LADDER COMPLETE</h2>
            <p className="results-subtitle">THE THRONE IS YOURS.</p>
          </>
        ) : (
          <>
            <h2>CHAIR BROKEN.</h2>
            <p className="results-subtitle">RUN ENDED.</p>
          </>
        )}

        <div className="results-stats">
          <div className="stat-row">
            <span className="label">ROW</span>
            <span className="value">{rowReached} / {TOTAL_ROWS}</span>
          </div>
          <div className="stat-row">
            <span className="label">TIME</span>
            <span className="value">{timeUsed}s</span>
          </div>
          {state.stats.bestRow > 0 && (
            <div className="stat-row">
              <span className="label">BEST ROW</span>
              <span className="value">{state.stats.bestRow}</span>
            </div>
          )}
          {state.stats.fastestWin !== null && (
            <div className="stat-row">
              <span className="label">BEST TIME</span>
              <span className="value">{state.stats.fastestWin.toFixed(2)}s</span>
            </div>
          )}
        </div>

        {!isVictory && (
          <p className="results-message">"{state.failureMessage}"</p>
        )}

        <div className="results-buttons">
          <button
            className="btn btn-primary"
            onClick={() => { Audio.playClick(); onPlayAgain(); }}
            id="btn-play-again"
          >
            {isVictory ? 'PLAY AGAIN' : 'TRY AGAIN'}
          </button>
          <button
            className="btn"
            onClick={() => { Audio.playClick(); handleShare(); }}
            id="btn-share"
          >
            {copied ? 'COPIED!' : 'SHARE RESULT'}
          </button>
          <button
            className="btn btn-small"
            onClick={() => { Audio.playClick(); onHome(); }}
            id="btn-home"
          >
            HOME
          </button>
        </div>

        {showShareText && (
          <>
            <div className="share-text">{shareText}</div>
            <button className="btn btn-small" onClick={handleCopy}>
              {copied ? 'COPIED!' : 'COPY RESULT'}
            </button>
          </>
        )}

        {copied && <p className="copied-toast">Result copied to clipboard!</p>}
      </div>
    </div>
  );
};
