// ============================================================
// chairs.ts — 24 chair archetypes with unique pixel-art rendering
// ============================================================

import { ChairType, ChairMaterial } from '../game/GameState';

interface MaterialColors {
  primary: string;
  secondary: string;
  highlight: string;
  shadow: string;
}

const MATERIAL_PALETTES: Record<ChairMaterial, MaterialColors> = {
  wood: { primary: '#8B6914', secondary: '#6B4F12', highlight: '#A0812A', shadow: '#4A3508' },
  metal: { primary: '#808080', secondary: '#606060', highlight: '#A0A0A0', shadow: '#404040' },
  plastic: { primary: '#D4C5A9', secondary: '#BEB19B', highlight: '#E8DCC0', shadow: '#9A8E78' },
  velvet: { primary: '#800020', secondary: '#600018', highlight: '#A0002A', shadow: '#400010' },
  leather: { primary: '#654321', secondary: '#4A3015', highlight: '#7E5A37', shadow: '#3A2610' },
  painted_wood: { primary: '#CD853F', secondary: '#A0693A', highlight: '#DEB887', shadow: '#7A4F25' },
  brass: { primary: '#B5A642', secondary: '#8E8234', highlight: '#D4C65A', shadow: '#6B6225' },
  chrome: { primary: '#C0C0C0', secondary: '#909090', highlight: '#E0E0E0', shadow: '#606060' },
  fabric: { primary: '#8B7355', secondary: '#6B5940', highlight: '#A08B6B', shadow: '#4A3D2E' },
  gold: { primary: '#DAA520', secondary: '#B8860B', highlight: '#FFD700', shadow: '#8B6508' },
  dark_mahogany: { primary: '#4E1A0A', secondary: '#3A1208', highlight: '#6B2712', shadow: '#2A0C04' },
  cream_upholstery: { primary: '#F5E6C8', secondary: '#E8D5B0', highlight: '#FFF5E0', shadow: '#C8B898' },
};

function getMat(material: ChairMaterial): MaterialColors {
  return MATERIAL_PALETTES[material] || MATERIAL_PALETTES.wood;
}

export function drawChair(
  ctx: CanvasRenderingContext2D,
  chairType: ChairType,
  material: ChairMaterial,
  x: number,
  y: number,
  size: number,
  variant: number = 0,
  highlight: boolean = false,
  breakProgress: number = 0, // 0 = intact, 1 = fully broken
  safeProgress: number = 0, // 0 = not selected, 1 = fully safe anim
  colorAccent: string = '#800020'
) {
  const m = getMat(material);
  const s = size / 48; // base 48px
  const px = (n: number) => Math.round(n * s);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  if (highlight) {
    ctx.shadowColor = 'rgba(218, 165, 32, 0.4)';
    ctx.shadowBlur = px(6);
  }

  // Apply break transform
  if (breakProgress > 0) {
    const bp = breakProgress;
    ctx.translate(Math.sin(bp * 20) * px(2) * (1 - bp), bp * px(4));
    ctx.rotate(bp * 0.3 * (variant % 2 === 0 ? 1 : -1));
    ctx.globalAlpha = 1 - bp * 0.3;
  }

  // Apply safe bounce
  if (safeProgress > 0 && safeProgress < 1) {
    const bounce = Math.sin(safeProgress * Math.PI) * px(3);
    ctx.translate(0, -bounce);
  }

  switch (chairType) {
    case 'folding': drawFolding(ctx, m, px, breakProgress, colorAccent); break;
    case 'office': drawOffice(ctx, m, px, breakProgress, colorAccent); break;
    case 'wooden': drawWooden(ctx, m, px, breakProgress, colorAccent); break;
    case 'school': drawSchool(ctx, m, px, breakProgress, colorAccent); break;
    case 'garden': drawGarden(ctx, m, px, breakProgress, colorAccent); break;
    case 'velvet': drawVelvet(ctx, m, px, breakProgress, colorAccent); break;
    case 'rocking': drawRocking(ctx, m, px, breakProgress, colorAccent); break;
    case 'executive': drawExecutive(ctx, m, px, breakProgress, colorAccent); break;
    case 'tiny': drawTiny(ctx, m, px, breakProgress, colorAccent); break;
    case 'giant': drawGiant(ctx, m, px, breakProgress, colorAccent); break;
    case 'metal': drawMetal(ctx, m, px, breakProgress, colorAccent); break;
    case 'plastic': drawPlastic(ctx, m, px, breakProgress, colorAccent); break;
    case 'lounge': drawLounge(ctx, m, px, breakProgress, colorAccent); break;
    case 'luxury': drawLuxury(ctx, m, px, breakProgress, colorAccent); break;
    case 'gold': drawGold(ctx, m, px, breakProgress, colorAccent); break;
    case 'red_velvet': drawRedVelvet(ctx, m, px, breakProgress, colorAccent); break;
    case 'broken_look': drawBrokenLook(ctx, m, px, breakProgress, colorAccent); break;
    case 'strange': drawStrange(ctx, m, px, breakProgress, colorAccent); break;
    case 'waiting_room': drawWaitingRoom(ctx, m, px, breakProgress, colorAccent); break;
    case 'conference': drawConference(ctx, m, px, breakProgress, colorAccent); break;
    case 'director': drawDirector(ctx, m, px, breakProgress, colorAccent); break;
    case 'dentist': drawDentist(ctx, m, px, breakProgress, colorAccent); break;
    case 'antique': drawAntique(ctx, m, px, breakProgress, colorAccent); break;
    case 'throne': drawThrone(ctx, m, px, safeProgress, colorAccent); break;
    default: drawWooden(ctx, m, px, breakProgress, colorAccent);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.restore();
}

type Px = (n: number) => number;

// 1. Folding Chair — X-frame legs, thin seat
function drawFolding(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  const collapse = bp * px(8);
  // X legs
  ctx.fillStyle = m.primary;
  ctx.save();
  ctx.translate(px(-8), px(0));
  ctx.rotate(0.15 + bp * 0.5);
  ctx.fillRect(0, 0, px(2), px(16));
  ctx.restore();
  ctx.save();
  ctx.translate(px(-4), px(0));
  ctx.rotate(-0.15 - bp * 0.5);
  ctx.fillRect(0, 0, px(2), px(16));
  ctx.restore();
  ctx.save();
  ctx.translate(px(4), px(0));
  ctx.rotate(0.15 + bp * 0.3);
  ctx.fillRect(0, 0, px(2), px(16));
  ctx.restore();
  ctx.save();
  ctx.translate(px(8), px(0));
  ctx.rotate(-0.15 - bp * 0.3);
  ctx.fillRect(0, 0, px(2), px(16));
  ctx.restore();
  // Seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-10), px(-2) + collapse, px(20), px(3));
  // Back
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(-16), px(2), px(14));
  ctx.fillRect(px(8), px(-16), px(2), px(14));
  // Backrest fabric
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-14), px(16), px(8));
}

// 2. Office Chair — wheels, cylinder, armrests
function drawOffice(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Wheels (5-star base)
  ctx.fillStyle = m.shadow;
  const wheelSpread = bp * px(8);
  ctx.fillRect(px(-12) - wheelSpread, px(14), px(4), px(3));
  ctx.fillRect(px(-4), px(14), px(4), px(3));
  ctx.fillRect(px(4), px(14), px(4), px(3));
  ctx.fillRect(px(8) + wheelSpread, px(14), px(4), px(3));
  // Base
  ctx.fillRect(px(-10), px(12), px(20), px(3));
  // Cylinder
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-2), px(2), px(4), px(10));
  // Seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-2), px(20), px(5));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-10), px(-2), px(20), px(1));
  // Back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-16), px(16), px(14));
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-16), px(16), px(2));
  // Armrests
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-12), px(-4), px(3), px(2));
  ctx.fillRect(px(9), px(-4), px(3), px(2));
  ctx.fillRect(px(-12), px(-4), px(1), px(6));
  ctx.fillRect(px(11), px(-4), px(1), px(6));
}

// 3. Wooden Chair — classic 4-leg
function drawWooden(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  const legTilt = bp * px(4);
  // Legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10) - legTilt, px(0), px(3), px(14));
  ctx.fillRect(px(-4), px(0), px(3), px(14));
  ctx.fillRect(px(3), px(0), px(3), px(14));
  ctx.fillRect(px(8) + legTilt, px(0), px(3), px(14));
  // Seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-11), px(-3), px(22), px(4));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-11), px(-3), px(22), px(1));
  // Back spindles
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-9), px(-18), px(2), px(15));
  ctx.fillRect(px(-3), px(-18), px(2), px(15));
  ctx.fillRect(px(3), px(-18), px(2), px(15));
  ctx.fillRect(px(7), px(-18), px(2), px(15));
  // Top rail
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-10), px(-20), px(20), px(3));
}

// 4. School Chair — metal frame, plastic seat
function drawSchool(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Metal frame
  ctx.fillStyle = '#707070';
  ctx.fillRect(px(-10), px(10), px(20), px(2));
  ctx.fillRect(px(-10), px(0), px(2), px(12));
  ctx.fillRect(px(8), px(0), px(2), px(12));
  // Legs
  ctx.fillRect(px(-10), px(10), px(2), px(6));
  ctx.fillRect(px(8), px(10), px(2), px(6));
  // Seat
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-9), px(-2), px(18), px(4));
  // Back
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-14), px(16), px(12));
  // Desk attachment
  ctx.fillStyle = '#808080';
  ctx.fillRect(px(6), px(-6), px(10), px(2));
  ctx.fillRect(px(6), px(-6), px(2), px(4));
}

// 5. Garden Chair — slatted, wider
function drawGarden(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Wide legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-12), px(2), px(3), px(12));
  ctx.fillRect(px(9), px(2), px(3), px(12));
  // Armrests
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-14), px(-2), px(5), px(3));
  ctx.fillRect(px(9), px(-2), px(5), px(3));
  // Seat slats
  ctx.fillStyle = m.primary;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(px(-10), px(-1 + i * 2), px(20), px(1));
  }
  // Back slats
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px(-9), px(-16 + i * 3), px(18), px(2));
  }
}

// 6. Velvet Chair — plush, curved back
function drawVelvet(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Short legs
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-8), px(6), px(3), px(8));
  ctx.fillRect(px(5), px(6), px(3), px(8));
  // Seat cushion (thick)
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-2), px(20), px(8));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-10), px(-2), px(20), px(2));
  // Back cushion (rounded look)
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-18), px(20), px(16));
  ctx.fillRect(px(-8), px(-20), px(16), px(2));
  // Tufting dots
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-4), px(-12), px(2), px(2));
  ctx.fillRect(px(2), px(-12), px(2), px(2));
  ctx.fillRect(px(-1), px(-8), px(2), px(2));
}

// 7. Rocking Chair — curved base
function drawRocking(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Rocker base
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-14), px(14), px(28), px(2));
  ctx.fillRect(px(-16), px(13), px(4), px(2));
  ctx.fillRect(px(12), px(13), px(4), px(2));
  // Legs
  ctx.fillRect(px(-8), px(2), px(2), px(12));
  ctx.fillRect(px(6), px(2), px(2), px(12));
  // Seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-10), px(-2), px(20), px(4));
  // Back spindles
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-18), px(2), px(16));
  ctx.fillRect(px(-3), px(-16), px(2), px(14));
  ctx.fillRect(px(2), px(-16), px(2), px(14));
  ctx.fillRect(px(6), px(-18), px(2), px(16));
  // Top rail
  ctx.fillRect(px(-9), px(-20), px(18), px(3));
  // Armrests
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-12), px(-4), px(4), px(2));
  ctx.fillRect(px(8), px(-4), px(4), px(2));
}

// 8. Executive Chair — tall back, plush
function drawExecutive(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Star base with wheels
  ctx.fillStyle = '#505050';
  ctx.fillRect(px(-12), px(14), px(24), px(2));
  ctx.fillRect(px(-14), px(15), px(3), px(2));
  ctx.fillRect(px(11), px(15), px(3), px(2));
  // Cylinder
  ctx.fillStyle = '#707070';
  ctx.fillRect(px(-2), px(4), px(4), px(10));
  // Seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-2), px(20), px(6));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-10), px(-2), px(20), px(1));
  // Tall back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-9), px(-24), px(18), px(22));
  // Headrest
  ctx.fillRect(px(-7), px(-28), px(14), px(4));
  // Stitching
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-1), px(-22), px(2), px(16));
  // Armrests
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-13), px(-4), px(4), px(2));
  ctx.fillRect(px(9), px(-4), px(4), px(2));
  ctx.fillRect(px(-13), px(-4), px(1), px(6));
  ctx.fillRect(px(12), px(-4), px(1), px(6));
}

// 9. Tiny Chair — comically small
function drawTiny(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  ctx.save();
  ctx.scale(0.6, 0.6);
  ctx.translate(0, px(8));
  // Simple small chair
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-6), px(2), px(2), px(8));
  ctx.fillRect(px(4), px(2), px(2), px(8));
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-8), px(-1), px(16), px(3));
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-6), px(-12), px(2), px(11));
  ctx.fillRect(px(4), px(-12), px(2), px(11));
  ctx.fillRect(px(-6), px(-13), px(12), px(2));
  ctx.restore();
}

// 10. Giant Chair — oversized
function drawGiant(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  ctx.save();
  ctx.scale(1.3, 1.3);
  ctx.translate(0, px(-4));
  // Thick legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(2), px(4), px(14));
  ctx.fillRect(px(6), px(2), px(4), px(14));
  // Seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-12), px(-2), px(24), px(5));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-12), px(-2), px(24), px(1));
  // Massive back
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(-22), px(20), px(20));
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-20), px(16), px(14));
  ctx.restore();
}

// 11. Metal Chair — industrial
function drawMetal(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Tubular legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(0), px(2), px(14));
  ctx.fillRect(px(-10), px(12), px(8), px(2));
  ctx.fillRect(px(8), px(0), px(2), px(14));
  ctx.fillRect(px(2), px(12), px(8), px(2));
  // Seat (flat metal)
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-10), px(-2), px(20), px(3));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-8), px(-2), px(4), px(1));
  // Back (perforated look)
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-16), px(16), px(14));
  // Holes
  ctx.fillStyle = m.shadow;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillRect(px(-5 + c * 4), px(-13 + r * 4), px(2), px(2));
    }
  }
}

// 12. Plastic Chair — modern, monobloc
function drawPlastic(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Thin legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-9), px(2), px(2), px(12));
  ctx.fillRect(px(7), px(2), px(2), px(12));
  ctx.fillRect(px(-7), px(4), px(2), px(10));
  ctx.fillRect(px(5), px(4), px(2), px(10));
  // Seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-10), px(-1), px(20), px(3));
  // Back (curved)
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-9), px(-14), px(18), px(13));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-7), px(-12), px(14), px(8));
}

// 13. Lounge Chair — low, wide
function drawLounge(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Low base
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-12), px(8), px(24), px(4));
  ctx.fillRect(px(-12), px(10), px(3), px(4));
  ctx.fillRect(px(9), px(10), px(3), px(4));
  // Wide seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-12), px(-2), px(24), px(10));
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-12), px(-2), px(24), px(2));
  // Low back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-12), px(-10), px(24), px(8));
  // Armrests
  ctx.fillRect(px(-14), px(-6), px(3), px(8));
  ctx.fillRect(px(11), px(-6), px(3), px(8));
}

// 14. Luxury Chair — ornate
function drawLuxury(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Carved legs
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-9), px(2), px(3), px(12));
  ctx.fillRect(px(6), px(2), px(3), px(12));
  // Leg details
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-9), px(6), px(3), px(2));
  ctx.fillRect(px(6), px(6), px(3), px(2));
  // Seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-2), px(20), px(5));
  // Ornate back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-20), px(16), px(18));
  // Crown ornament
  ctx.fillStyle = m.highlight;
  ctx.fillRect(px(-4), px(-22), px(8), px(3));
  ctx.fillRect(px(-2), px(-24), px(4), px(2));
  ctx.fillRect(px(-1), px(-25), px(2), px(1));
  // Armrests
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-12), px(-4), px(3), px(2));
  ctx.fillRect(px(9), px(-4), px(3), px(2));
}

// 15. Gold Chair
function drawGold(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  const g = MATERIAL_PALETTES.gold;
  // Ornate legs
  ctx.fillStyle = g.primary;
  ctx.fillRect(px(-8), px(2), px(3), px(12));
  ctx.fillRect(px(5), px(2), px(3), px(12));
  // Decorative feet
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-9), px(12), px(5), px(3));
  ctx.fillRect(px(4), px(12), px(5), px(3));
  // Seat
  ctx.fillStyle = g.secondary;
  ctx.fillRect(px(-10), px(-2), px(20), px(5));
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-10), px(-2), px(20), px(1));
  // Back
  ctx.fillStyle = g.primary;
  ctx.fillRect(px(-8), px(-18), px(16), px(16));
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-6), px(-16), px(12), px(10));
  // Crown
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-4), px(-20), px(8), px(3));
}

// 16. Red Velvet
function drawRedVelvet(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  const v = MATERIAL_PALETTES.velvet;
  // Carved legs
  ctx.fillStyle = '#4A2010';
  ctx.fillRect(px(-8), px(4), px(3), px(10));
  ctx.fillRect(px(5), px(4), px(3), px(10));
  // Thick cushion
  ctx.fillStyle = v.primary;
  ctx.fillRect(px(-10), px(-4), px(20), px(8));
  ctx.fillStyle = v.highlight;
  ctx.fillRect(px(-10), px(-4), px(20), px(2));
  // Tall back
  ctx.fillStyle = v.primary;
  ctx.fillRect(px(-9), px(-22), px(18), px(18));
  // Tufting
  ctx.fillStyle = v.shadow;
  ctx.fillRect(px(-5), px(-18), px(2), px(2));
  ctx.fillRect(px(3), px(-18), px(2), px(2));
  ctx.fillRect(px(-1), px(-14), px(2), px(2));
  ctx.fillRect(px(-5), px(-10), px(2), px(2));
  ctx.fillRect(px(3), px(-10), px(2), px(2));
}

// 17. Broken-Looking Chair (but may still be safe!)
function drawBrokenLook(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Wonky legs
  ctx.fillStyle = m.primary;
  ctx.save();
  ctx.translate(px(-8), px(2));
  ctx.rotate(-0.1);
  ctx.fillRect(0, 0, px(2), px(12));
  ctx.restore();
  ctx.fillRect(px(6), px(2), px(2), px(12));
  ctx.fillRect(px(-3), px(2), px(2), px(10)); // short leg
  // Seat (tilted look)
  ctx.fillStyle = m.secondary;
  ctx.save();
  ctx.translate(px(-10), px(-2));
  ctx.rotate(-0.05);
  ctx.fillRect(0, 0, px(20), px(4));
  ctx.restore();
  // Back (cracked)
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-16), px(16), px(14));
  // Crack lines
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-2), px(-14), px(1), px(8));
  ctx.fillRect(px(-2), px(-10), px(4), px(1));
}

// 18. Strange Chair — weird shape
function drawStrange(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // One thick leg (center)
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-2), px(2), px(4), px(12));
  // Circular-ish seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-4), px(20), px(6));
  ctx.fillRect(px(-12), px(-2), px(24), px(2));
  // Asymmetric back
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(-18), px(8), px(14));
  ctx.fillRect(px(2), px(-14), px(6), px(10));
  // Weird ornament
  ctx.fillStyle = accent;
  ctx.fillRect(px(-6), px(-20), px(4), px(3));
}

// 19. Waiting Room Chair
function drawWaitingRoom(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Metal frame
  ctx.fillStyle = '#707070';
  ctx.fillRect(px(-10), px(0), px(2), px(14));
  ctx.fillRect(px(8), px(0), px(2), px(14));
  ctx.fillRect(px(-10), px(12), px(20), px(2));
  // Padded seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-9), px(-2), px(18), px(4));
  // Padded back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-14), px(16), px(12));
  ctx.fillStyle = m.shadow;
  ctx.fillRect(px(-8), px(-14), px(16), px(1));
  // Armrests
  ctx.fillStyle = '#707070';
  ctx.fillRect(px(-12), px(-4), px(3), px(2));
  ctx.fillRect(px(9), px(-4), px(3), px(2));
}

// 20. Conference Chair
function drawConference(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Sled base
  ctx.fillStyle = '#808080';
  ctx.fillRect(px(-10), px(12), px(20), px(2));
  ctx.fillRect(px(-10), px(4), px(2), px(10));
  ctx.fillRect(px(8), px(4), px(2), px(10));
  // Mesh seat
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-9), px(-1), px(18), px(4));
  // Mesh back
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-8), px(-16), px(16), px(15));
  // Mesh pattern
  ctx.fillStyle = m.shadow;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(px(-7), px(-15 + i * 2), px(14), px(1));
  }
}

// 21. Director Chair — canvas, folding
function drawDirector(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // X-frame
  ctx.fillStyle = m.primary;
  ctx.fillRect(px(-10), px(-16), px(2), px(30));
  ctx.fillRect(px(8), px(-16), px(2), px(30));
  // Cross brace
  ctx.save();
  ctx.translate(px(-10), px(4));
  ctx.rotate(0.35);
  ctx.fillRect(0, 0, px(22), px(2));
  ctx.restore();
  // Canvas seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-9), px(-2), px(18), px(4));
  // Canvas back
  ctx.fillStyle = accent;
  ctx.fillRect(px(-8), px(-14), px(16), px(6));
  // Armrests
  ctx.fillStyle = m.secondary;
  ctx.fillRect(px(-12), px(-4), px(4), px(2));
  ctx.fillRect(px(8), px(-4), px(4), px(2));
}

// 22. Dentist Chair — reclining, mechanical
function drawDentist(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  // Heavy base
  ctx.fillStyle = '#606060';
  ctx.fillRect(px(-8), px(10), px(16), px(4));
  // Hydraulic
  ctx.fillStyle = '#808080';
  ctx.fillRect(px(-2), px(2), px(4), px(8));
  // Seat (reclined)
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-4), px(20), px(6));
  // Headrest
  ctx.fillStyle = accent;
  ctx.fillRect(px(-6), px(-12), px(12), px(8));
  ctx.fillRect(px(-4), px(-16), px(8), px(4));
  // Armrests
  ctx.fillStyle = '#707070';
  ctx.fillRect(px(-13), px(-4), px(3), px(4));
  ctx.fillRect(px(10), px(-4), px(3), px(4));
  // Light arm
  ctx.fillStyle = '#909090';
  ctx.fillRect(px(6), px(-18), px(2), px(8));
  ctx.fillRect(px(4), px(-20), px(6), px(3));
}

// 23. Antique Chair
function drawAntique(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, bp: number, accent: string) {
  const dm = MATERIAL_PALETTES.dark_mahogany;
  // Cabriole legs
  ctx.fillStyle = dm.primary;
  ctx.fillRect(px(-9), px(2), px(3), px(4));
  ctx.fillRect(px(-10), px(6), px(3), px(4));
  ctx.fillRect(px(-9), px(10), px(3), px(4));
  ctx.fillRect(px(6), px(2), px(3), px(4));
  ctx.fillRect(px(7), px(6), px(3), px(4));
  ctx.fillRect(px(6), px(10), px(3), px(4));
  // Seat
  ctx.fillStyle = accent;
  ctx.fillRect(px(-10), px(-2), px(20), px(5));
  // Ornate back
  ctx.fillStyle = dm.primary;
  ctx.fillRect(px(-9), px(-20), px(18), px(18));
  // Inner panel
  ctx.fillStyle = accent;
  ctx.fillRect(px(-7), px(-18), px(14), px(12));
  // Scroll top
  ctx.fillStyle = dm.highlight;
  ctx.fillRect(px(-10), px(-22), px(20), px(3));
  ctx.fillRect(px(-6), px(-24), px(12), px(2));
}

// 24. THRONE — the ultimate chair
function drawThrone(ctx: CanvasRenderingContext2D, m: MaterialColors, px: Px, safeP: number, accent: string) {
  const g = MATERIAL_PALETTES.gold;
  // Grand base
  ctx.fillStyle = g.secondary;
  ctx.fillRect(px(-14), px(10), px(28), px(6));
  ctx.fillRect(px(-16), px(14), px(32), px(3));
  // Thick legs
  ctx.fillStyle = g.primary;
  ctx.fillRect(px(-12), px(0), px(4), px(12));
  ctx.fillRect(px(8), px(0), px(4), px(12));
  // Lion paw feet
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-13), px(10), px(6), px(4));
  ctx.fillRect(px(7), px(10), px(6), px(4));
  // Velvet seat
  ctx.fillStyle = '#800020';
  ctx.fillRect(px(-12), px(-4), px(24), px(6));
  ctx.fillStyle = '#A00028';
  ctx.fillRect(px(-12), px(-4), px(24), px(2));
  // Grand back
  ctx.fillStyle = g.primary;
  ctx.fillRect(px(-12), px(-30), px(24), px(26));
  // Inner velvet
  ctx.fillStyle = '#800020';
  ctx.fillRect(px(-10), px(-28), px(20), px(20));
  // Crown ornament
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-8), px(-34), px(16), px(4));
  ctx.fillRect(px(-6), px(-36), px(12), px(2));
  ctx.fillRect(px(-4), px(-38), px(8), px(2));
  ctx.fillRect(px(-2), px(-40), px(4), px(2));
  // Jewels
  ctx.fillStyle = '#E74C3C';
  ctx.fillRect(px(-1), px(-39), px(2), px(2));
  ctx.fillStyle = '#3498DB';
  ctx.fillRect(px(-5), px(-35), px(2), px(2));
  ctx.fillRect(px(3), px(-35), px(2), px(2));
  // Armrests
  ctx.fillStyle = g.primary;
  ctx.fillRect(px(-16), px(-6), px(4), px(3));
  ctx.fillRect(px(12), px(-6), px(4), px(3));
  ctx.fillRect(px(-16), px(-6), px(2), px(8));
  ctx.fillRect(px(14), px(-6), px(2), px(8));
  // Lion head armrest tips
  ctx.fillStyle = g.highlight;
  ctx.fillRect(px(-17), px(-8), px(4), px(4));
  ctx.fillRect(px(13), px(-8), px(4), px(4));
  // Glow effect when safe
  if (safeP > 0) {
    ctx.globalAlpha = safeP * 0.3;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(px(-18), px(-42), px(36), px(60));
    ctx.globalAlpha = 1;
  }
}

export function getChairName(type: ChairType): string {
  const names: Record<ChairType, string> = {
    folding: 'Folding Chair', office: 'Office Chair', wooden: 'Wooden Chair',
    school: 'School Chair', garden: 'Garden Chair', velvet: 'Velvet Chair',
    rocking: 'Rocking Chair', executive: 'Executive Chair', tiny: 'Tiny Chair',
    giant: 'Giant Chair', metal: 'Metal Chair', plastic: 'Plastic Chair',
    lounge: 'Lounge Chair', luxury: 'Luxury Chair', gold: 'Gold Chair',
    red_velvet: 'Red Velvet Chair', broken_look: 'Suspicious Chair', strange: 'Strange Chair',
    waiting_room: 'Waiting Room Chair', conference: 'Conference Chair',
    director: 'Director Chair', dentist: 'Dentist Chair', antique: 'Antique Chair',
    throne: 'THE THRONE',
  };
  return names[type] || type;
}
