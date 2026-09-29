// ============================================================
// characters.ts — 12 original sitter character definitions
// ============================================================

export interface CharacterDef {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  palette: { body: string; accent: string; detail: string; skin: string; eye: string };
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'suit',
    name: 'The Suit',
    description: 'Middle management, maximum ambition.',
    rarity: 'common',
    palette: { body: '#2C3E50', accent: '#ECF0F1', detail: '#E74C3C', skin: '#DEB887', eye: '#2C3E50' },
  },
  {
    id: 'office_worker',
    name: 'The Office Worker',
    description: 'Has sat in every chair. Trusts none.',
    rarity: 'common',
    palette: { body: '#7F8C8D', accent: '#BDC3C7', detail: '#3498DB', skin: '#F5DEB3', eye: '#2C3E50' },
  },
  {
    id: 'punk',
    name: 'The Punk',
    description: 'Chairs are just another system to fight.',
    rarity: 'uncommon',
    palette: { body: '#1a1a1a', accent: '#E91E63', detail: '#FFC107', skin: '#FFDAB9', eye: '#1a1a1a' },
  },
  {
    id: 'executive',
    name: 'The Executive',
    description: 'Only the finest seats. No exceptions.',
    rarity: 'uncommon',
    palette: { body: '#1B2631', accent: '#D4AC0D', detail: '#FDFEFE', skin: '#D2B48C', eye: '#1B2631' },
  },
  {
    id: 'skeleton',
    name: 'The Skeleton',
    description: 'Has been waiting a very long time.',
    rarity: 'rare',
    palette: { body: '#F5F5DC', accent: '#D5D5C0', detail: '#2C2C2C', skin: '#F5F5DC', eye: '#2C2C2C' },
  },
  {
    id: 'robot',
    name: 'The Robot',
    description: 'Calculating optimal seating trajectory.',
    rarity: 'rare',
    palette: { body: '#95A5A6', accent: '#2ECC71', detail: '#E74C3C', skin: '#BDC3C7', eye: '#2ECC71' },
  },
  {
    id: 'ghost',
    name: 'The Ghost',
    description: 'Fell from a chair once. Never left.',
    rarity: 'rare',
    palette: { body: '#D5E8D4', accent: '#A3C4A3', detail: '#6B8E6B', skin: '#E8F5E8', eye: '#2C3E50' },
  },
  {
    id: 'alien',
    name: 'The Alien',
    description: 'Earth chairs: a fascinating study.',
    rarity: 'rare',
    palette: { body: '#27AE60', accent: '#2ECC71', detail: '#1a1a1a', skin: '#82E0AA', eye: '#F1C40F' },
  },
  {
    id: 'vampire',
    name: 'The Vampire',
    description: 'Prefers thrones. Will settle for less.',
    rarity: 'uncommon',
    palette: { body: '#4A0000', accent: '#8B0000', detail: '#F5F5DC', skin: '#EEDDCC', eye: '#8B0000' },
  },
  {
    id: 'dog',
    name: 'The Dog',
    description: 'Good boy. Bad at chairs.',
    rarity: 'uncommon',
    palette: { body: '#A0522D', accent: '#D2691E', detail: '#1a1a1a', skin: '#CD853F', eye: '#3E2723' },
  },
  {
    id: 'mannequin',
    name: 'The Mannequin',
    description: 'Was made to sit. Was never asked.',
    rarity: 'rare',
    palette: { body: '#F5DEB3', accent: '#DEB887', detail: '#8B7355', skin: '#FFE4C4', eye: '#2C2C2C' },
  },
  {
    id: 'mystery',
    name: 'The Mystery Sitter',
    description: '???',
    rarity: 'legendary',
    palette: { body: '#2C2C2C', accent: '#D4AC0D', detail: '#800020', skin: '#1a1a1a', eye: '#D4AC0D' },
  },
];

// Draw a character sprite on a canvas context at given position
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  charId: string,
  x: number,
  y: number,
  size: number,
  frame: 'idle' | 'walk' | 'sit' | 'fall' | 'victory',
  animT: number = 0
) {
  const char = CHARACTERS.find(c => c.id === charId);
  if (!char) return;
  const p = char.palette;
  const s = size / 32; // scale factor from 32px base
  const px = (n: number) => Math.round(n * s);

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  // Animation offsets
  let bodyOffsetY = 0;
  let headTilt = 0;
  let armAngle = 0;
  let legBend = 0;

  if (frame === 'idle') {
    bodyOffsetY = Math.sin(animT * 2) * px(1);
  } else if (frame === 'walk') {
    bodyOffsetY = Math.abs(Math.sin(animT * 6)) * px(2);
    legBend = Math.sin(animT * 6) * 0.3;
  } else if (frame === 'sit') {
    bodyOffsetY = px(4);
    legBend = 0.5;
  } else if (frame === 'fall') {
    bodyOffsetY = animT * px(20);
    headTilt = animT * 0.5;
    armAngle = animT * 1.5;
  } else if (frame === 'victory') {
    armAngle = -Math.PI * 0.6;
    bodyOffsetY = Math.sin(animT * 4) * px(2);
  }

  ctx.translate(0, bodyOffsetY);

  // Draw based on character type
  if (charId === 'skeleton') {
    drawSkeleton(ctx, p, px, headTilt, armAngle, legBend, frame, animT);
  } else if (charId === 'robot') {
    drawRobot(ctx, p, px, headTilt, armAngle, legBend, frame, animT);
  } else if (charId === 'ghost') {
    drawGhost(ctx, p, px, headTilt, armAngle, frame, animT);
  } else if (charId === 'dog') {
    drawDog(ctx, p, px, headTilt, legBend, frame, animT);
  } else if (charId === 'alien') {
    drawAlien(ctx, p, px, headTilt, armAngle, legBend, frame, animT);
  } else {
    drawHumanoid(ctx, p, px, headTilt, armAngle, legBend, frame, animT, charId);
  }

  ctx.restore();
}

type Pal = CharacterDef['palette'];
type Px = (n: number) => number;

function drawHumanoid(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, armAngle: number, legBend: number, frame: string, animT: number, charId: string) {
  // Legs
  ctx.fillStyle = p.body;
  const legSpread = Math.abs(legBend) * px(3);
  ctx.fillRect(px(-5) - legSpread, px(6), px(4), px(10));
  ctx.fillRect(px(1) + legSpread, px(6), px(4), px(10));

  // Shoes
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px(-6) - legSpread, px(14), px(6), px(3));
  ctx.fillRect(px(0) + legSpread, px(14), px(6), px(3));

  // Body
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(-6), px(12), px(14));

  // Shirt/accent
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-4), px(-2), px(8), px(4));

  // Detail (tie, badge, etc.)
  ctx.fillStyle = p.detail;
  if (charId === 'suit' || charId === 'executive') {
    ctx.fillRect(px(-1), px(-2), px(2), px(6)); // tie
  } else if (charId === 'punk') {
    // spikes on shoulders
    ctx.fillRect(px(-7), px(-5), px(2), px(2));
    ctx.fillRect(px(5), px(-5), px(2), px(2));
    ctx.fillRect(px(-6), px(-7), px(2), px(2));
    ctx.fillRect(px(4), px(-7), px(2), px(2));
  } else if (charId === 'vampire') {
    // cape
    ctx.fillStyle = p.body;
    ctx.fillRect(px(-8), px(-6), px(2), px(16));
    ctx.fillRect(px(6), px(-6), px(2), px(16));
  } else {
    ctx.fillRect(px(-2), px(0), px(1), px(1)); // button
  }

  // Arms
  ctx.save();
  ctx.fillStyle = p.body;
  if (frame === 'victory') {
    // Arms up
    ctx.fillRect(px(-9), px(-10), px(3), px(8));
    ctx.fillRect(px(6), px(-10), px(3), px(8));
    // Hands
    ctx.fillStyle = p.skin;
    ctx.fillRect(px(-9), px(-12), px(3), px(3));
    ctx.fillRect(px(6), px(-12), px(3), px(3));
  } else if (frame === 'fall') {
    ctx.fillRect(px(-9), px(-8 - animT * 4), px(3), px(8));
    ctx.fillRect(px(6), px(-6 + animT * 2), px(3), px(8));
  } else {
    ctx.fillRect(px(-9), px(-4), px(3), px(8));
    ctx.fillRect(px(6), px(-4), px(3), px(8));
    // Hands
    ctx.fillStyle = p.skin;
    ctx.fillRect(px(-9), px(3), px(3), px(3));
    ctx.fillRect(px(6), px(3), px(3), px(3));
  }
  ctx.restore();

  // Head
  ctx.save();
  if (headTilt) ctx.rotate(headTilt);
  ctx.fillStyle = p.skin;
  ctx.fillRect(px(-5), px(-14), px(10), px(9));

  // Eyes
  ctx.fillStyle = p.eye;
  const blink = Math.sin(animT * 3) > 0.95;
  if (!blink) {
    ctx.fillRect(px(-3), px(-11), px(2), px(2));
    ctx.fillRect(px(1), px(-11), px(2), px(2));
  } else {
    ctx.fillRect(px(-3), px(-10), px(2), px(1));
    ctx.fillRect(px(1), px(-10), px(2), px(1));
  }

  // Mouth
  ctx.fillStyle = '#4A3728';
  if (frame === 'fall') {
    ctx.fillRect(px(-2), px(-8), px(4), px(2)); // O mouth
  } else if (frame === 'victory') {
    ctx.fillRect(px(-2), px(-7), px(4), px(1)); // smile
  } else {
    ctx.fillRect(px(-1), px(-7), px(2), px(1));
  }

  // Hair / head detail
  ctx.fillStyle = charId === 'mystery' ? p.body : (charId === 'vampire' ? '#1a1a1a' : '#4A3728');
  ctx.fillRect(px(-5), px(-16), px(10), px(3));
  if (charId === 'punk') {
    ctx.fillStyle = p.detail;
    ctx.fillRect(px(-3), px(-20), px(2), px(5));
    ctx.fillRect(px(0), px(-21), px(2), px(6));
    ctx.fillRect(px(3), px(-19), px(2), px(4));
  }
  if (charId === 'mystery') {
    // Full face cover
    ctx.fillStyle = p.body;
    ctx.fillRect(px(-5), px(-14), px(10), px(9));
    ctx.fillStyle = p.accent;
    ctx.fillRect(px(-3), px(-11), px(2), px(2)); // glowing eyes
    ctx.fillRect(px(1), px(-11), px(2), px(2));
  }
  if (charId === 'mannequin') {
    ctx.fillStyle = p.skin;
    ctx.fillRect(px(-5), px(-16), px(10), px(3)); // smooth head
  }

  ctx.restore();
}

function drawSkeleton(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, armAngle: number, legBend: number, frame: string, animT: number) {
  // Ribs/spine
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-1), px(-4), px(2), px(10));
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px(-4), px(-3 + i * 2), px(8), px(1));
  }
  // Pelvis
  ctx.fillRect(px(-4), px(5), px(8), px(2));
  // Legs
  ctx.fillRect(px(-4), px(6), px(2), px(10));
  ctx.fillRect(px(2), px(6), px(2), px(10));
  // Feet
  ctx.fillRect(px(-5), px(14), px(4), px(2));
  ctx.fillRect(px(1), px(14), px(4), px(2));
  // Arms
  if (frame === 'victory') {
    ctx.fillRect(px(-7), px(-10), px(2), px(8));
    ctx.fillRect(px(5), px(-10), px(2), px(8));
  } else {
    ctx.fillRect(px(-7), px(-3), px(2), px(8));
    ctx.fillRect(px(5), px(-3), px(2), px(8));
  }
  // Skull
  ctx.save();
  if (headTilt) ctx.rotate(headTilt);
  ctx.fillRect(px(-4), px(-12), px(8), px(8));
  // Eye sockets
  ctx.fillStyle = p.detail;
  ctx.fillRect(px(-3), px(-10), px(2), px(2));
  ctx.fillRect(px(1), px(-10), px(2), px(2));
  // Teeth
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-2), px(-6), px(1), px(1));
  ctx.fillRect(px(-0), px(-6), px(1), px(1));
  ctx.fillRect(px(1), px(-6), px(1), px(1));
  ctx.restore();
}

function drawRobot(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, armAngle: number, legBend: number, frame: string, animT: number) {
  // Body
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(-5), px(12), px(12));
  // Chest panel
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-4), px(-3), px(8), px(4));
  // LED
  ctx.fillStyle = Math.sin(animT * 5) > 0 ? p.accent : p.detail;
  ctx.fillRect(px(-2), px(-1), px(2), px(2));
  ctx.fillRect(px(1), px(0), px(1), px(1));
  // Legs
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-5), px(6), px(4), px(8));
  ctx.fillRect(px(1), px(6), px(4), px(8));
  // Feet
  ctx.fillStyle = '#555';
  ctx.fillRect(px(-6), px(13), px(6), px(3));
  ctx.fillRect(px(0), px(13), px(6), px(3));
  // Arms
  ctx.fillStyle = p.body;
  if (frame === 'victory') {
    ctx.fillRect(px(-9), px(-9), px(3), px(6));
    ctx.fillRect(px(6), px(-9), px(3), px(6));
  } else {
    ctx.fillRect(px(-9), px(-3), px(3), px(8));
    ctx.fillRect(px(6), px(-3), px(3), px(8));
  }
  // Head
  ctx.save();
  if (headTilt) ctx.rotate(headTilt);
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-5), px(-13), px(10), px(8));
  // Visor
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px(-4), px(-11), px(8), px(3));
  // Eyes
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-3), px(-10), px(2), px(2));
  ctx.fillRect(px(2), px(-10), px(2), px(2));
  // Antenna
  ctx.fillStyle = p.body;
  ctx.fillRect(px(0), px(-16), px(1), px(3));
  ctx.fillStyle = p.detail;
  ctx.fillRect(px(-1), px(-17), px(3), px(2));
  ctx.restore();
}

function drawGhost(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, armAngle: number, frame: string, animT: number) {
  const wobble = Math.sin(animT * 3) * px(1);
  ctx.globalAlpha = 0.7;
  // Body (wavy bottom)
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(-10), px(12), px(18));
  // Wavy bottom
  for (let i = 0; i < 4; i++) {
    const wy = Math.sin(animT * 3 + i) * px(2);
    ctx.fillRect(px(-6 + i * 3), px(8) + wy, px(3), px(4));
  }
  // Eyes
  ctx.fillStyle = p.eye;
  ctx.fillRect(px(-3) + wobble, px(-6), px(2), px(3));
  ctx.fillRect(px(2) + wobble, px(-6), px(2), px(3));
  // Pupils
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(px(-2) + wobble, px(-5), px(1), px(1));
  ctx.fillRect(px(3) + wobble, px(-5), px(1), px(1));
  // Mouth
  if (frame === 'fall') {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(px(-1), px(-2), px(3), px(2));
  }
  // Arms
  if (frame === 'victory') {
    ctx.fillRect(px(-9), px(-8), px(3), px(6));
    ctx.fillRect(px(6), px(-8), px(3), px(6));
  }
  ctx.globalAlpha = 1.0;
}

function drawDog(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, legBend: number, frame: string, animT: number) {
  // Body
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(-2), px(12), px(8));
  // Belly
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-4), px(1), px(8), px(4));
  // Legs (4 legs)
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(5), px(3), px(8));
  ctx.fillRect(px(-2), px(5), px(3), px(8));
  ctx.fillRect(px(1), px(5), px(3), px(8));
  ctx.fillRect(px(4), px(5), px(3), px(8));
  // Paws
  ctx.fillStyle = p.detail;
  ctx.fillRect(px(-6), px(12), px(3), px(2));
  ctx.fillRect(px(-2), px(12), px(3), px(2));
  ctx.fillRect(px(1), px(12), px(3), px(2));
  ctx.fillRect(px(4), px(12), px(3), px(2));
  // Head
  ctx.save();
  if (headTilt) ctx.rotate(headTilt);
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-5), px(-10), px(10), px(8));
  // Ears
  ctx.fillRect(px(-6), px(-14), px(3), px(5));
  ctx.fillRect(px(3), px(-14), px(3), px(5));
  // Snout
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-3), px(-6), px(6), px(3));
  // Nose
  ctx.fillStyle = p.detail;
  ctx.fillRect(px(-1), px(-6), px(2), px(2));
  // Eyes
  ctx.fillStyle = p.eye;
  ctx.fillRect(px(-3), px(-9), px(2), px(2));
  ctx.fillRect(px(2), px(-9), px(2), px(2));
  ctx.restore();
  // Tail
  const tailWag = Math.sin(animT * 8) * px(3);
  ctx.fillStyle = p.body;
  ctx.fillRect(px(6) + tailWag, px(-3), px(4), px(2));
}

function drawAlien(ctx: CanvasRenderingContext2D, p: Pal, px: Px, headTilt: number, armAngle: number, legBend: number, frame: string, animT: number) {
  // Body (slim)
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-4), px(-4), px(8), px(12));
  // Legs
  ctx.fillRect(px(-4), px(7), px(3), px(8));
  ctx.fillRect(px(1), px(7), px(3), px(8));
  // Feet
  ctx.fillStyle = p.accent;
  ctx.fillRect(px(-5), px(14), px(4), px(2));
  ctx.fillRect(px(1), px(14), px(4), px(2));
  // Arms (long)
  ctx.fillStyle = p.body;
  if (frame === 'victory') {
    ctx.fillRect(px(-8), px(-10), px(3), px(10));
    ctx.fillRect(px(5), px(-10), px(3), px(10));
  } else {
    ctx.fillRect(px(-7), px(-2), px(3), px(10));
    ctx.fillRect(px(4), px(-2), px(3), px(10));
  }
  // Head (big)
  ctx.save();
  if (headTilt) ctx.rotate(headTilt);
  ctx.fillStyle = p.body;
  ctx.fillRect(px(-6), px(-16), px(12), px(12));
  // Eyes (large)
  ctx.fillStyle = p.detail;
  ctx.fillRect(px(-5), px(-13), px(4), px(5));
  ctx.fillRect(px(1), px(-13), px(4), px(5));
  // Pupils
  ctx.fillStyle = p.eye;
  ctx.fillRect(px(-3), px(-11), px(2), px(3));
  ctx.fillRect(px(2), px(-11), px(2), px(3));
  ctx.restore();
}
