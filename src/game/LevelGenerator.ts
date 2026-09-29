// ============================================================
// LevelGenerator.ts — Procedural run generation
// ============================================================

import { SeededRandom } from './Random';
import {
  RunData, RowData, ChairData, ChairType, ChairMaterial,
  FailureAnimation, SafeAnimation, EnvironmentVariant,
  TOTAL_ROWS, Difficulty, DIFFICULTIES
} from './GameState';

const ALL_CHAIR_TYPES: ChairType[] = [
  'folding', 'office', 'wooden', 'school', 'garden',
  'velvet', 'rocking', 'executive', 'tiny', 'giant',
  'metal', 'plastic', 'lounge', 'luxury', 'gold',
  'red_velvet', 'broken_look', 'strange', 'waiting_room',
  'conference', 'director', 'dentist', 'antique',
];

const ALL_MATERIALS: ChairMaterial[] = [
  'wood', 'metal', 'plastic', 'velvet', 'leather',
  'painted_wood', 'brass', 'chrome', 'fabric',
  'gold', 'dark_mahogany', 'cream_upholstery',
];

const FAILURE_ANIMATIONS: FailureAnimation[] = [
  'legs_fold', 'wheels_fly', 'wood_crack', 'rock_collapse',
  'metal_bend', 'tip_over', 'gold_crumble', 'snap_instant',
  'hydraulic_drop', 'armrest_snap', 'wheels_scatter', 'splinter',
];

const SAFE_ANIMATIONS: SafeAnimation[] = [
  'gentle_sit', 'small_bounce', 'subtle_rotate',
  'settle_dust', 'lock_in', 'golden_glow',
];

const ACCENT_COLORS = [
  '#8B4513', '#654321', '#A0522D', '#6B3A2A', '#4A3728',
  '#2F4F4F', '#3B5323', '#800020', '#704214', '#D4A574',
  '#B8860B', '#CD853F', '#DEB887', '#C19A6B', '#8B7355',
];

function getEnvironmentForRow(rowIndex: number): EnvironmentVariant {
  if (rowIndex < 3) return 'normal_office';
  if (rowIndex < 5) return 'archive_room';
  if (rowIndex < 7) return 'gallery_hall';
  if (rowIndex < 9) return 'restricted_area';
  if (rowIndex < 11) return 'dark_archive';
  return 'throne_corridor';
}

export function generateRun(seed?: number, difficulty: Difficulty = 'medium'): RunData {
  const rng = new SeededRandom(seed);
  const rows: RowData[] = [];
  let lastSafePos = -1;
  let sameCount = 0;
  const usedChairTypes = new Set<ChairType>();
  const chairsPerRow = DIFFICULTIES[difficulty]?.chairsPerRow || 3;

  for (let i = 0; i < TOTAL_ROWS; i++) {
    // Determine safe chair position with anti-repetition
    let safeIndex: number;
    do {
      safeIndex = rng.nextInt(0, chairsPerRow - 1);
    } while (safeIndex === lastSafePos && sameCount >= 1 && rng.next() > 0.15);

    if (safeIndex === lastSafePos) {
      sameCount++;
    } else {
      sameCount = 0;
    }
    lastSafePos = safeIndex;

    // Pick distinct chair types for this row
    const availableTypes = rng.shuffle([...ALL_CHAIR_TYPES]);
    const rowTypes: ChairType[] = [];
    for (const t of availableTypes) {
      if (rowTypes.length >= chairsPerRow) break;
      if (rowTypes.includes(t)) continue;
      rowTypes.push(t);
    }
    while (rowTypes.length < chairsPerRow) {
      rowTypes.push(rng.pick(ALL_CHAIR_TYPES));
    }

    const chairs: ChairData[] = [];
    for (let c = 0; c < chairsPerRow; c++) {
      const isSafe = c === safeIndex;
      const chairType = rowTypes[c];
      usedChairTypes.add(chairType);

      chairs.push({
        chairType,
        material: rng.pick(ALL_MATERIALS),
        variant: rng.nextInt(0, 3),
        safe: isSafe,
        failureAnimation: isSafe ? 'legs_fold' : rng.pick(FAILURE_ANIMATIONS),
        safeAnimation: isSafe ? rng.pick(SAFE_ANIMATIONS) : 'gentle_sit',
        colorAccent: rng.pick(ACCENT_COLORS),
      });
    }

    rows.push({
      rowIndex: i,
      safeChairIndex: safeIndex,
      chairs,
      environmentVariant: getEnvironmentForRow(i),
    });
  }

  const run: RunData = {
    seed: rng.seed,
    rows,
    totalRows: TOTAL_ROWS,
    chairsPerRow,
    difficulty,
  };
  validateRun(run);
  return run;
}

function validateRun(run: RunData): void {
  if (run.rows.length !== TOTAL_ROWS) {
    throw new Error(`Invalid run: expected ${TOTAL_ROWS} rows, got ${run.rows.length}`);
  }
  for (const row of run.rows) {
    if (row.chairs.length !== run.chairsPerRow) {
      throw new Error(`Invalid row ${row.rowIndex}: expected ${run.chairsPerRow} chairs, got ${row.chairs.length}`);
    }
    const safeCount = row.chairs.filter(c => c.safe).length;
    if (safeCount !== 1) {
      throw new Error(`Invalid row ${row.rowIndex}: expected 1 safe chair, got ${safeCount}`);
    }
    if (!row.chairs[row.safeChairIndex].safe) {
      throw new Error(`Invalid row ${row.rowIndex}: safeChairIndex mismatch`);
    }
  }
}
