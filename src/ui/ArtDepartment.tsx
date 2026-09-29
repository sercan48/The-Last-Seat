// ============================================================
// ArtDepartment.tsx — Chair gallery / archive screen
// ============================================================

import React, { useRef, useEffect } from 'react';
import { drawChair, getChairName } from '../data/chairs';
import { ChairType, ChairMaterial } from '../game/GameState';
import * as Audio from '../systems/AudioSystem';

interface ArtDepartmentProps {
  onBack: () => void;
}

const ALL_CHAIRS: { type: ChairType; material: ChairMaterial }[] = [
  { type: 'folding', material: 'metal' },
  { type: 'office', material: 'fabric' },
  { type: 'wooden', material: 'wood' },
  { type: 'school', material: 'plastic' },
  { type: 'garden', material: 'painted_wood' },
  { type: 'velvet', material: 'velvet' },
  { type: 'rocking', material: 'wood' },
  { type: 'executive', material: 'leather' },
  { type: 'tiny', material: 'wood' },
  { type: 'giant', material: 'dark_mahogany' },
  { type: 'metal', material: 'chrome' },
  { type: 'plastic', material: 'plastic' },
  { type: 'lounge', material: 'leather' },
  { type: 'luxury', material: 'gold' },
  { type: 'gold', material: 'gold' },
  { type: 'red_velvet', material: 'velvet' },
  { type: 'broken_look', material: 'wood' },
  { type: 'strange', material: 'brass' },
  { type: 'waiting_room', material: 'fabric' },
  { type: 'conference', material: 'chrome' },
  { type: 'director', material: 'wood' },
  { type: 'dentist', material: 'cream_upholstery' },
  { type: 'antique', material: 'dark_mahogany' },
  { type: 'throne', material: 'gold' },
];

const ChairDisplay: React.FC<{ type: ChairType; material: ChairMaterial; index: number }> = ({ type, material, index }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 64 * dpr;
    canvas.height = 64 * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (ctx as any).imageSmoothingEnabled = false;

    ctx.fillStyle = '#2A2218';
    ctx.fillRect(0, 0, 64, 64);

    // Platform
    ctx.fillStyle = '#3A3028';
    ctx.fillRect(8, 54, 48, 4);

    drawChair(ctx, type, material, 32, 36, 40, 0, false, 0, 0, '#800020');

    // Catalog number
    ctx.fillStyle = '#8B8178';
    ctx.font = '6px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SEAT ${String(index + 1).padStart(4, '0')}`, 32, 62);
  }, [type, material, index]);

  return (
    <div className="chair-gallery-item">
      <canvas ref={canvasRef} />
      <span className="chair-label">{getChairName(type)}</span>
    </div>
  );
};

export const ArtDepartment: React.FC<ArtDepartmentProps> = ({ onBack }) => {
  return (
    <div className="screen art-dept">
      <div className="art-dept-content">
        <h2>THE ART DEPARTMENT</h2>
        <p className="subtitle">SEAT ARCHIVE — CHAIR QUALITY CONTROL</p>

        <div className="chair-gallery">
          {ALL_CHAIRS.map((chair, i) => (
            <ChairDisplay key={chair.type} type={chair.type} material={chair.material} index={i} />
          ))}
        </div>

        <button className="btn" onClick={() => { Audio.playClick(); onBack(); }} id="btn-back-art">
          BACK
        </button>
      </div>
    </div>
  );
};
