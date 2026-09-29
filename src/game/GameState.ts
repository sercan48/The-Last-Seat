// ============================================================
// GameState.ts — Central state machine and game data
// ============================================================

export type GameScreen =
  | 'TITLE'
  | 'CHARACTER_SELECT'
  | 'HOW_TO_PLAY'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'SELECTING'
  | 'SAFE_ANIMATION'
  | 'FAILURE_ANIMATION'
  | 'ROW_TRANSITION'
  | 'VICTORY_ANIMATION'
  | 'RESULTS'
  | 'ART_DEPARTMENT';

export type ChairType =
  | 'folding' | 'office' | 'wooden' | 'school' | 'garden'
  | 'velvet' | 'rocking' | 'executive' | 'tiny' | 'giant'
  | 'metal' | 'plastic' | 'lounge' | 'luxury' | 'gold'
  | 'red_velvet' | 'broken_look' | 'strange' | 'waiting_room'
  | 'conference' | 'director' | 'dentist' | 'antique' | 'throne';

export type ChairMaterial =
  | 'wood' | 'metal' | 'plastic' | 'velvet' | 'leather'
  | 'painted_wood' | 'brass' | 'chrome' | 'fabric'
  | 'gold' | 'dark_mahogany' | 'cream_upholstery';

export type FailureAnimation =
  | 'legs_fold' | 'wheels_fly' | 'wood_crack' | 'rock_collapse'
  | 'metal_bend' | 'tip_over' | 'gold_crumble' | 'snap_instant'
  | 'hydraulic_drop' | 'armrest_snap' | 'wheels_scatter' | 'splinter';

export type SafeAnimation =
  | 'gentle_sit' | 'small_bounce' | 'subtle_rotate'
  | 'settle_dust' | 'lock_in' | 'golden_glow';

export type EnvironmentVariant =
  | 'normal_office' | 'archive_room' | 'gallery_hall'
  | 'restricted_area' | 'dark_archive' | 'throne_corridor';

export interface ChairData {
  chairType: ChairType;
  material: ChairMaterial;
  variant: number;
  safe: boolean;
  failureAnimation: FailureAnimation;
  safeAnimation: SafeAnimation;
  colorAccent: string;
}

export type Difficulty = 'easy' | 'medium' | 'deadly';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  chairsPerRow: number;
  description: string;
  badge: string;
  chance: string;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    chairsPerRow: 2,
    description: '2 Chairs (Squid Game Glass Bridge)',
    badge: '🟢 EASY (2)',
    chance: '50% Chance',
  },
  medium: {
    id: 'medium',
    label: 'MEDIUM',
    chairsPerRow: 3,
    description: '3 Chairs (Balanced Risk)',
    badge: '🟡 MEDIUM (3)',
    chance: '33% Chance',
  },
  deadly: {
    id: 'deadly',
    label: 'DEADLY',
    chairsPerRow: 4,
    description: '4 Chairs (Maximum Peril)',
    badge: '🔴 DEADLY (4)',
    chance: '25% Chance',
  },
};

export interface RowData {
  rowIndex: number;
  safeChairIndex: number;
  chairs: ChairData[];
  environmentVariant: EnvironmentVariant;
}

export interface RunData {
  seed: number;
  rows: RowData[];
  totalRows: number;
  chairsPerRow: number;
  difficulty: Difficulty;
}

export interface PlayerStats {
  runs: number;
  wins: number;
  losses: number;
  bestRow: number;
  bestTime: number | null;
  fastestWin: number | null;
  lastCharacter: string | null;
}

export interface GameState {
  screen: GameScreen;
  run: RunData | null;
  currentRow: number;
  selectedCharacter: string | null;
  difficulty: Difficulty;
  timer: number;
  maxTime: number;
  countdownValue: number;
  selectedChair: number;
  animationProgress: number;
  isVictory: boolean;
  finalTime: number;
  muted: boolean;
  debug: boolean;
  stats: PlayerStats;
  shakeAmount: number;
  shakeTimer: number;
  particles: Particle[];
  cameraY: number;
  targetCameraY: number;
  failureMessage: string;
  rowTransitionTimer: number;
  inputLocked: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'dust' | 'wood' | 'metal' | 'spark' | 'gold' | 'confetti' | 'glass';
  rotation: number;
  rotationSpeed: number;
}

export const TOTAL_ROWS = 12;
export const CHAIRS_PER_ROW = 4;
export const MAX_TIME = 75;
export const COUNTDOWN_DURATION = 4; // 3, 2, 1, SIT

export const FAILURE_MESSAGES = [
  "That chair had other plans.",
  "Quality control has been notified.",
  "The Art Department regrets nothing.",
  "Please do not blame the chair.",
  "Seat inspection: FAILED.",
  "That was not the one.",
  "The chair was a lie.",
  "Furniture happens.",
  "Not all chairs are created equal.",
  "Your sitting privileges have been revoked.",
  "The chair sends its regards.",
  "This seat is no longer available.",
  "Please sit responsibly next time.",
  "Structural integrity: compromised.",
  "The Mutual thanks you for your sacrifice.",
];

export function createInitialState(): GameState {
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  return {
    screen: 'TITLE',
    run: null,
    currentRow: 0,
    selectedCharacter: null,
    difficulty: 'medium',
    timer: MAX_TIME,
    maxTime: MAX_TIME,
    countdownValue: 3,
    selectedChair: -1,
    animationProgress: 0,
    isVictory: false,
    finalTime: 0,
    muted: false,
    debug,
    stats: loadStats(),
    shakeAmount: 0,
    shakeTimer: 0,
    particles: [],
    cameraY: 0,
    targetCameraY: 0,
    failureMessage: '',
    rowTransitionTimer: 0,
    inputLocked: false,
  };
}

const STATS_KEY = 'chair_ladder_stats';

export function loadStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { runs: 0, wins: 0, losses: 0, bestRow: 0, bestTime: null, fastestWin: null, lastCharacter: null };
}

export function saveStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch { /* ignore */ }
}
