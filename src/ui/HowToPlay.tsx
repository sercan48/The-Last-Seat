// ============================================================
// HowToPlay.tsx — Instructions screen
// ============================================================

import React from 'react';
import * as Audio from '../systems/AudioSystem';

interface HowToPlayProps {
  onBack: () => void;
}

export const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
  return (
    <div className="screen how-to-play">
      <div className="how-content">
        <h2>HOW TO PLAY</h2>

        <div className="how-steps">
          <div className="how-step">
            <span className="how-step-num">1</span>
            <div className="how-step-text">
              Choose your sitter character. <span>Each one is equally capable of sitting.</span>
            </div>
          </div>
          <div className="how-step">
            <span className="how-step-num">2</span>
            <div className="how-step-text">
              Each tier presents 2, 3, or 4 suspended chairs depending on difficulty. <span>Only one holds. The others drop into the void.</span>
            </div>
          </div>
          <div className="how-step">
            <span className="how-step-num">3</span>
            <div className="how-step-text">
              Pick a chair. <span>Your sitter will leap across the chasm. Hope for the best.</span>
            </div>
          </div>
          <div className="how-step">
            <span className="how-step-num">4</span>
            <div className="how-step-text">
              Survive all 12 perilous tiers to claim <span style={{ color: '#DAA520' }}>THE GOLDEN THRONE</span>.
            </div>
          </div>
          <div className="how-step">
            <span className="how-step-num">5</span>
            <div className="how-step-text">
              You have 75 seconds. <span>Don't overthink it, but don't rush blindly.</span>
            </div>
          </div>
        </div>

        <div className="how-controls">
          <h3>CONTROLS</h3>
          <p>🖱️ Click or tap any chair to leap across</p>
          <p>⌨️ Press [1]-[2], [1]-[3], or [1]-[4] on your keyboard</p>
          <p>📱 Responsive touch controls on mobile & tablet</p>
        </div>

        <div className="how-controls">
          <h3>IMPORTANT NOTICE</h3>
          <p style={{ color: '#F5E6C8' }}>
            Every run is completely randomized. There is no pattern to memorize.
            Trust your instincts. Please sit responsibly.
          </p>
        </div>

        <button className="btn" onClick={() => { Audio.playClick(); onBack(); }} id="btn-back-how">
          BACK
        </button>
      </div>
    </div>
  );
};
