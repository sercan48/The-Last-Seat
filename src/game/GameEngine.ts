// ============================================================
// GameEngine.ts — High-Stakes Suspended Bridge Game Engine
// ============================================================

import {
  GameState, GameScreen, Particle, RunData, RowData,
  TOTAL_ROWS, MAX_TIME, FAILURE_MESSAGES,
  createInitialState, saveStats, Difficulty, DIFFICULTIES,
} from './GameState';
import { generateRun } from './LevelGenerator';
import { drawChair } from '../data/chairs';
import { drawCharacter } from '../data/characters';
import * as Audio from '../systems/AudioSystem';

// High-tension Squid Game / Industrial Arena Palette
const PAL = {
  voidBg: '#080C14',
  arenaSteel: '#141E2C',
  steelGirder: '#223249',
  steelHighlight: '#3B5373',
  abyssFog: '#0B1522',
  neonCyan: '#00F0FF',
  neonCyanDim: 'rgba(0, 240, 255, 0.25)',
  neonPink: '#FF0055',
  neonAmber: '#FFB800',
  neonGreen: '#00FF66',
  dangerRed: '#FF2A42',
  spotlightWarm: 'rgba(255, 235, 190, 0.08)',
  spotlightCone: 'rgba(255, 250, 220, 0.12)',
  gold: '#DAA520',
  goldBright: '#FFD700',
  ivory: '#FDFBF5',
  cream: '#F5E6C8',
  darkOverlay: 'rgba(8, 12, 20, 0.85)',
};

export type GameCallback = (state: GameState) => void;

interface BridgePlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  chairSize: number;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public state: GameState;
  private animFrame: number = 0;
  private lastTime: number = 0;
  private gameTime: number = 0;
  private onStateChange: GameCallback;
  private reducedMotion: boolean;

  private chairHover: number = -1;
  private selectAnimTimer: number = 0;
  private safeAnimTimer: number = 0;
  private failAnimTimer: number = 0;
  private transitionTimer: number = 0;
  private victoryTimer: number = 0;
  private countdownTimer: number = 0;

  // Jump animation kinematics
  private charStartX: number = 0;
  private charStartY: number = 0;
  private charCurrentX: number = 0;
  private charCurrentY: number = 0;
  private charTargetX: number = 0;
  private charTargetY: number = 0;

  // Conquered platform tracking for camera glide forward
  private lastConqueredX: number = 0;
  private lastConqueredChairType: string = 'office';
  private lastConqueredMaterial: string = 'metal';
  private lastConqueredColor: string = '#DAA520';
  private hasConqueredAnyRow: boolean = false;

  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private timerWarnPlayed: boolean = false;
  private timerCritPlayed: boolean = false;

  constructor(canvas: HTMLCanvasElement, onStateChange: GameCallback) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.state = createInitialState();
    this.onStateChange = onStateChange;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvasWidth = rect.width;
    this.canvasHeight = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    (this.ctx as any).imageSmoothingEnabled = false;
  }

  start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  private loop = (time: number) => {
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.gameTime += dt;
    this.update(dt);
    this.render();
    this.animFrame = requestAnimationFrame(this.loop);
  };

  // ---- State Transitions ----
  setScreen(screen: GameScreen) {
    this.state.screen = screen;
    this.state.inputLocked = false;
    this.notify();
  }

  startGame(characterId: string, difficulty?: Difficulty) {
    if (difficulty) {
      this.state.difficulty = difficulty;
    }
    this.state.selectedCharacter = characterId;
    this.state.run = generateRun(undefined, this.state.difficulty);
    this.state.currentRow = 0;
    this.state.timer = MAX_TIME;
    this.state.selectedChair = -1;
    this.state.isVictory = false;
    this.state.particles = [];
    this.state.shakeAmount = 0;
    this.chairHover = -1;

    // Reset player standing position on the initial launch platform
    this.lastConqueredX = this.canvasWidth / 2;
    this.hasConqueredAnyRow = false;
    this.charStartX = this.canvasWidth / 2;
    this.charStartY = this.getLaunchPlatformY() - 25;
    this.charCurrentX = this.charStartX;
    this.charCurrentY = this.charStartY;

    this.timerWarnPlayed = false;
    this.timerCritPlayed = false;

    // Start countdown
    this.state.countdownValue = 3;
    this.countdownTimer = 0;
    this.setScreen('COUNTDOWN');
    Audio.playCountdown();
  }

  advanceRow() {
    // Record the newly conquered safe chair
    const row = this.state.run!.rows[this.state.currentRow];
    const chair = row.chairs[this.state.selectedChair];
    this.lastConqueredX = this.charTargetX;
    this.lastConqueredChairType = chair.chairType;
    this.lastConqueredMaterial = chair.material;
    this.lastConqueredColor = chair.colorAccent;
    this.hasConqueredAnyRow = true;

    this.state.currentRow++;
    this.state.selectedChair = -1;
    this.chairHover = -1;

    if (this.state.currentRow >= TOTAL_ROWS) {
      this.state.isVictory = true;
      this.state.finalTime = MAX_TIME - this.state.timer;
      this.victoryTimer = 0;
      this.setScreen('VICTORY_ANIMATION');
      Audio.playThrone();
    } else {
      this.transitionTimer = 0;
      this.setScreen('ROW_TRANSITION');
      // Player remains right on the safe chair they sat on!
      this.charStartX = this.charTargetX;
      this.charStartY = this.charTargetY;
      this.charCurrentX = this.charStartX;
      this.charCurrentY = this.charStartY;
    }
  }

  selectChair(index: number) {
    if (this.state.screen !== 'PLAYING' || this.state.inputLocked) return;
    const maxChairs = this.state.run?.chairsPerRow || 3;
    if (index < 0 || index >= maxChairs) return;

    this.state.selectedChair = index;
    this.state.inputLocked = true;
    this.selectAnimTimer = 0;

    const row = this.state.run!.rows[this.state.currentRow];
    const chair = row.chairs[index];

    // Compute jump target coordinates
    const layout = this.getActiveRowLayout();
    const targetPlatform = layout.platforms[index];
    this.charTargetX = targetPlatform.x;
    // Avatar lands on seat
    this.charTargetY = targetPlatform.y - targetPlatform.chairSize * 0.05;

    // Avatar start point is current position
    this.charStartX = this.charCurrentX;
    this.charStartY = this.charCurrentY;

    this.setScreen('SELECTING');
    Audio.playChairSelect();
  }

  private handleSafe() {
    this.safeAnimTimer = 0;
    this.setScreen('SAFE_ANIMATION');
    Audio.playBridgeStep();
    Audio.playSafeChair();

    // Spawn celebration sparks on safe lock
    const layout = this.getActiveRowLayout();
    const plat = layout.platforms[this.state.selectedChair];
    for (let i = 0; i < 16; i++) {
      this.state.particles.push({
        x: plat.x + (Math.random() - 0.5) * 40,
        y: plat.y + 10,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 80 - 20,
        life: 0.8,
        maxLife: 0.8,
        size: 2 + Math.random() * 2,
        color: PAL.neonGreen,
        type: 'spark',
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  private handleFailure() {
    this.failAnimTimer = 0;
    this.state.shakeAmount = 14;
    this.setScreen('FAILURE_ANIMATION');

    const row = this.state.run!.rows[this.state.currentRow];
    const chair = row.chairs[this.state.selectedChair];

    // Shatter audio
    Audio.playCollapse();
    setTimeout(() => Audio.playFall(), 250);

    // Spawn shattering glass and chair debris
    const layout = this.getActiveRowLayout();
    const plat = layout.platforms[this.state.selectedChair];
    this.spawnShatterParticles(plat.x, plat.y, chair.material);

    // Pick failure message
    const msg = FAILURE_MESSAGES[Math.floor(Math.random() * FAILURE_MESSAGES.length)];
    this.state.failureMessage = msg;
  }

  private endRun(victory: boolean) {
    this.state.isVictory = victory;
    this.state.finalTime = Math.round((MAX_TIME - this.state.timer) * 100) / 100;

    const stats = this.state.stats;
    stats.runs++;
    if (victory) {
      stats.wins++;
      if (!stats.fastestWin || this.state.finalTime < stats.fastestWin) {
        stats.fastestWin = this.state.finalTime;
      }
    } else {
      stats.losses++;
    }
    if (this.state.currentRow > stats.bestRow) {
      stats.bestRow = this.state.currentRow;
    }
    stats.lastCharacter = this.state.selectedCharacter;
    saveStats(stats);

    this.setScreen('RESULTS');
  }

  // ---- Update ----
  private update(dt: number) {
    // Screen shake decay
    if (this.state.shakeAmount > 0) {
      this.state.shakeAmount = Math.max(0, this.state.shakeAmount - dt * 20);
    }

    // Update particle physics
    this.updateParticles(dt);

    // Abyss background floating fog particles
    if (Math.random() > 0.6) {
      this.spawnAbyssFog();
    }

    // State machine updates
    switch (this.state.screen) {
      case 'COUNTDOWN':
        this.countdownTimer += dt;
        if (this.countdownTimer >= 1.0) {
          this.countdownTimer = 0;
          this.state.countdownValue--;
          if (this.state.countdownValue === 0) {
            Audio.playCountdownGo();
          } else if (this.state.countdownValue > 0) {
            Audio.playCountdown();
          } else {
            this.setScreen('PLAYING');
          }
        }
        break;

      case 'PLAYING':
        // Timer countdown
        this.state.timer -= dt;
        if (this.state.timer <= 0) {
          this.state.timer = 0;
          this.handleFailure();
          return;
        }

        // Audio warnings
        if (this.state.timer <= 15 && !this.timerWarnPlayed) {
          Audio.playTimerWarning();
          this.timerWarnPlayed = true;
        }
        if (this.state.timer <= 5 && !this.timerCritPlayed) {
          Audio.playTimerCritical();
          this.timerCritPlayed = true;
        }
        break;

      case 'SELECTING':
        this.selectAnimTimer += dt;
        // Parabolic jump arc from start to chosen chair
        const jumpDuration = 0.55;
        const p = Math.min(this.selectAnimTimer / jumpDuration, 1.0);
        // Easing
        const easeT = p * (2 - p);
        this.charCurrentX = this.charStartX + (this.charTargetX - this.charStartX) * easeT;
        // Parabolic high leap across the void
        const jumpApex = 45;
        this.charCurrentY = this.charStartY + (this.charTargetY - this.charStartY) * easeT - Math.sin(p * Math.PI) * jumpApex;

        if (this.selectAnimTimer >= jumpDuration) {
          const row = this.state.run!.rows[this.state.currentRow];
          const chair = row.chairs[this.state.selectedChair];
          if (chair.safe) {
            this.handleSafe();
          } else {
            this.handleFailure();
          }
        }
        break;

      case 'SAFE_ANIMATION':
        this.safeAnimTimer += dt;
        this.charCurrentX = this.charTargetX;
        this.charCurrentY = this.charTargetY;
        if (this.safeAnimTimer > 1.0) {
          this.advanceRow();
        }
        break;

      case 'FAILURE_ANIMATION':
        this.failAnimTimer += dt;
        // Character flails and plummets into the abyss
        this.charCurrentX = this.charTargetX;
        this.charCurrentY += dt * 380 + (this.failAnimTimer * 200) * dt;
        if (this.failAnimTimer > 2.0) {
          this.endRun(false);
        }
        break;

      case 'ROW_TRANSITION':
        this.transitionTimer += dt;
        const transDur = 0.85;
        const pTrans = Math.min(this.transitionTimer / transDur, 1.0);
        const easeGlide = pTrans * pTrans * (3 - 2 * pTrans);

        const { rowY: baseRowY, chairSize: cs } = this.getActiveRowLayout(0);
        const launchDeckY = this.getLaunchPlatformY();
        const charScaleH = cs * 0.88;

        // Player smoothly rides the conquered chair down as camera tracks forward
        const sittingY = baseRowY - cs * 0.05;
        const standingY = launchDeckY - charScaleH * 0.45;
        this.charCurrentX = this.lastConqueredX;
        this.charCurrentY = sittingY + (standingY - sittingY) * easeGlide;

        if (this.transitionTimer >= transDur) {
          this.charStartX = this.lastConqueredX;
          this.charStartY = standingY;
          this.charCurrentX = this.charStartX;
          this.charCurrentY = this.charStartY;
          this.setScreen('PLAYING');
        }
        break;

      case 'VICTORY_ANIMATION':
        this.victoryTimer += dt;
        if (this.victoryTimer > 0.3 && this.victoryTimer < 5.2) {
          // Continuous raining gold & festive confetti
          if (Math.random() > 0.45) {
            this.spawnGoldConfetti(
              Math.random() * this.canvasWidth,
              -5
            );
          }
          // Periodic multi-color fireworks bursting
          if (Math.random() > 0.92) {
            this.spawnFirework(
              this.canvasWidth * 0.15 + Math.random() * this.canvasWidth * 0.7,
              this.canvasHeight * 0.12 + Math.random() * this.canvasHeight * 0.38
            );
            Audio.playBridgeStep();
          }
        }
        if (this.victoryTimer > 5.5) {
          Audio.playVictory();
          this.endRun(true);
        }
        break;
    }
  }

  // ---- Geometry & Layout Helpers ----
  private getLaunchPlatformY(): number {
    return this.canvasHeight * 0.80;
  }

  private getActiveRowLayout(offsetY: number = 0): { platforms: BridgePlatform[]; rowY: number; chairSize: number } {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const rowY = h * 0.56 + offsetY;

    const count = this.state.run?.chairsPerRow || DIFFICULTIES[this.state.difficulty]?.chairsPerRow || 3;
    // Proportional chair sizing
    const chairSize = Math.max(54, Math.min(w * 0.13, 86));
    // Dynamic spacing: wider for 2 chairs (Squid game style), balanced for 3, tighter for 4
    const spacing = count === 2 ? Math.min(w * 0.28, 180) : (count === 3 ? Math.min(w * 0.24, 150) : Math.min(w * 0.22, 135));
    const totalWidth = (count - 1) * spacing;
    const startX = (w - totalWidth) / 2;

    const platforms: BridgePlatform[] = [];
    for (let i = 0; i < count; i++) {
      platforms.push({
        x: startX + i * spacing,
        y: rowY,
        width: chairSize * 1.05,
        height: chairSize * 0.35,
        chairSize,
      });
    }
    return { platforms, rowY, chairSize };
  }

  // ---- Master Render ----
  private render() {
    const ctx = this.ctx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.save();

    // Screen Shake
    if (this.state.shakeAmount > 0 && !this.reducedMotion) {
      const sx = (Math.random() - 0.5) * this.state.shakeAmount;
      const sy = (Math.random() - 0.5) * this.state.shakeAmount;
      ctx.translate(sx, sy);
    }

    // 1. Render Dark Cavernous Arena & Abyss
    this.renderSuspendedArena(ctx, w, h);

    // 2. Render Bridge Structure & Chairs
    if (this.state.screen === 'VICTORY_ANIMATION') {
      this.renderVictoryThrone(ctx, w, h);
    } else {
      this.renderBridge(ctx, w, h);
    }

    // 3. Render Particles (Glass shards, sparks, abyss mist)
    this.renderParticles(ctx);

    // 4. Render Squid Game Progression HUD & Mission Bar
    if (this.state.screen !== 'TITLE') {
      this.renderSquidGameHUD(ctx, w, h);
    }

    // 5. Render Countdown Overlay
    if (this.state.screen === 'COUNTDOWN') {
      this.renderCountdown(ctx, w, h);
    }

    ctx.restore();
  }

  // ---- Dark Suspended Arena & Chasm Background ----
  private renderSuspendedArena(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Base Abyss Gradient: pitch-black abyss at bottom to moody dark navy at top
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#060A10');
    bgGrad.addColorStop(0.4, '#0A101C');
    bgGrad.addColorStop(0.8, '#070C14');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Distant Industrial Arena Girders & High Rafters
    ctx.save();
    ctx.strokeStyle = PAL.steelGirder;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.25;

    // Arena ceiling trusses
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 40, h * 0.25);
      ctx.lineTo(x + 80, 0);
      ctx.stroke();
    }
    // Arena crossbeams
    ctx.strokeRect(0, h * 0.12, w, 2);
    ctx.strokeRect(0, h * 0.22, w, 2);

    // Bottomless Abyss Structural Beams deep below (Depth Parallax)
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = PAL.steelHighlight;
    const abyssY = h * 0.82;
    for (let x = -40; x < w + 80; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x, abyssY);
      ctx.lineTo(x + 60, h);
      ctx.lineTo(x + 120, abyssY);
      ctx.stroke();
    }
    ctx.restore();

    // Arena Warning Stadium Displays in background
    ctx.save();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.fillRect(w * 0.04, h * 0.08, 180, 48);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w * 0.04, h * 0.08, 180, 48);
    ctx.fillStyle = PAL.neonCyan;
    ctx.font = '8px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MUTUAL FUN HIGH-STAKES TRIAL', w * 0.04 + 10, h * 0.08 + 18);
    ctx.fillStyle = PAL.cream;
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillText('SUSPENDED CHAIR BRIDGE', w * 0.04 + 10, h * 0.08 + 36);

    if (w > 640) {
      ctx.fillStyle = 'rgba(255, 0, 85, 0.05)';
      ctx.fillRect(w - 200, h * 0.08, 160, 48);
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.2)';
      ctx.strokeRect(w - 200, h * 0.08, 160, 48);
      ctx.fillStyle = PAL.neonPink;
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.fillText('FALL HAZARD: MAXIMUM', w - 190, h * 0.08 + 18);
      ctx.fillStyle = PAL.dangerRed;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillText('1 HOLDS • 3 COLLAPSE', w - 190, h * 0.08 + 36);
    }
    ctx.restore();

    // Dual High-Tensile Suspension Bridge Main Cables running into depth
    ctx.save();
    ctx.strokeStyle = '#34475E';
    ctx.lineWidth = 3;
    // Left Cable
    ctx.beginPath();
    ctx.moveTo(w * 0.08, 0);
    ctx.quadraticCurveTo(w * 0.22, h * 0.45, w * 0.38, h * 0.22);
    ctx.stroke();
    // Right Cable
    ctx.beginPath();
    ctx.moveTo(w * 0.92, 0);
    ctx.quadraticCurveTo(w * 0.78, h * 0.45, w * 0.62, h * 0.22);
    ctx.stroke();

    // Suspension vertical dropper cables
    ctx.strokeStyle = 'rgba(100, 140, 180, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const lx = w * 0.12 + i * (w * 0.04);
      const ly = h * 0.15 + i * (h * 0.06);
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx, ly + 90);
      ctx.stroke();

      const rx = w * 0.88 - i * (w * 0.04);
      ctx.beginPath();
      ctx.moveTo(rx, ly);
      ctx.lineTo(rx, ly + 90);
      ctx.stroke();
    }
    ctx.restore();

    // Atmospheric Fog in Abyss (Bottom)
    ctx.save();
    const fogGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
    fogGrad.addColorStop(0, 'rgba(8, 16, 26, 0)');
    fogGrad.addColorStop(0.5, 'rgba(11, 24, 38, 0.4)');
    fogGrad.addColorStop(1, 'rgba(6, 12, 20, 0.8)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);
    ctx.restore();
  }

  // ---- Suspended Bridge Structure & Multi-Tier Perspective ----
  private renderBridge(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.state.run) return;

    const curRow = this.state.currentRow;

    // Calculate forward camera glide offset during ROW_TRANSITION
    let camGlide = 0;
    let easeT = 1;
    if (this.state.screen === 'ROW_TRANSITION') {
      const p = Math.min(this.transitionTimer / 0.85, 1.0);
      easeT = p * p * (3 - 2 * p);
      camGlide = 1.0 - easeT;
    }

    const rowStepY = h * 0.085;
    const glideY = -camGlide * rowStepY;

    const { platforms, rowY, chairSize } = this.getActiveRowLayout(glideY);

    // ---- 1. Far Golden Finish Platform (The Goal at the end of the chasm) ----
    const finishY = h * 0.22;
    ctx.save();
    // Distant platform glow
    const finishGlow = ctx.createRadialGradient(w / 2, finishY, 10, w / 2, finishY, 120);
    finishGlow.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
    finishGlow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = finishGlow;
    ctx.fillRect(w / 2 - 140, finishY - 60, 280, 100);

    // Distant finish platform deck
    ctx.fillStyle = '#2C2010';
    ctx.fillRect(w / 2 - 60, finishY, 120, 8);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(w / 2 - 60, finishY - 2, 120, 2);

    // Miniature Golden Throne waiting in the distance
    drawChair(ctx, 'throne', 'gold', w / 2, finishY - 14, 28, 0, false, 0, 0.8, PAL.dangerRed);

    // Sign above throne
    ctx.fillStyle = PAL.goldBright;
    ctx.font = 'bold 9px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ GOLDEN THRONE (STAGE 12) ★', w / 2, finishY - 34);
    ctx.restore();

    // ---- 2. Upcoming Rows in Perspective Depth (Rows N+1, N+2, N+3) ----
    for (let offset = 3; offset >= 1; offset--) {
      const futureRowIndex = curRow + offset;
      if (futureRowIndex >= TOTAL_ROWS) continue;

      const futureRow = this.state.run.rows[futureRowIndex];
      const rowChairsCount = futureRow.chairs.length;
      // Perspective scale factor
      const pScale = 1 - offset * 0.18;
      const futY = rowY - offset * rowStepY;
      const futChairSize = chairSize * pScale;
      const futSpacing = (rowChairsCount === 2 ? Math.min(w * 0.28, 180) : (rowChairsCount === 3 ? Math.min(w * 0.24, 150) : Math.min(w * 0.22, 135))) * pScale;
      const futTotalWidth = (rowChairsCount - 1) * futSpacing;
      const futStartX = (w - futTotalWidth) / 2;

      ctx.save();
      ctx.globalAlpha = 0.45 - offset * 0.08;

      // Suspended steel cross-beam connecting this future row
      ctx.fillStyle = PAL.arenaSteel;
      ctx.fillRect(futStartX - futChairSize * 0.4, futY + futChairSize * 0.28, futTotalWidth + futChairSize * 0.8, 4);

      // Render preview chairs in depth
      for (let c = 0; c < rowChairsCount; c++) {
        const chair = futureRow.chairs[c];
        const cx = futStartX + c * futSpacing;

        // Dim glass stepping platform
        ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.fillRect(cx - futChairSize * 0.45, futY + futChairSize * 0.2, futChairSize * 0.9, futChairSize * 0.15);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - futChairSize * 0.45, futY + futChairSize * 0.2, futChairSize * 0.9, futChairSize * 0.15);

        // Chair sprite
        drawChair(ctx, chair.chairType, chair.material, cx, futY, futChairSize, chair.variant, false, 0, 0, chair.colorAccent);
      }

      // Tier label in perspective
      ctx.fillStyle = PAL.steelHighlight;
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ROW ${String(futureRowIndex + 1).padStart(2, '0')}`, futStartX - futChairSize * 0.6, futY + 6);
      ctx.restore();
    }

    // ---- 3. Active Row (Row N) — High Stakes Focus ----
    const row = this.state.run.rows[curRow];

    // Main heavy suspension cross-beam under active row
    const totalSpan = platforms[platforms.length - 1].x - platforms[0].x + chairSize * 1.4;
    const beamStartX = platforms[0].x - chairSize * 0.7;
    const beamY = rowY + chairSize * 0.34;

    ctx.save();
    // Steel I-beam
    ctx.fillStyle = PAL.arenaSteel;
    ctx.fillRect(beamStartX, beamY, totalSpan, 12);
    ctx.strokeStyle = PAL.steelHighlight;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(beamStartX, beamY, totalSpan, 12);

    // Warning hazard stripes along the beam edge
    ctx.save();
    ctx.beginPath();
    ctx.rect(beamStartX, beamY, totalSpan, 12);
    ctx.clip();
    ctx.fillStyle = PAL.neonAmber;
    for (let sx = beamStartX - 20; sx < beamStartX + totalSpan + 20; sx += 24) {
      ctx.beginPath();
      ctx.moveTo(sx, beamY);
      ctx.lineTo(sx + 10, beamY);
      ctx.lineTo(sx - 2, beamY + 12);
      ctx.lineTo(sx - 12, beamY + 12);
      ctx.fill();
    }
    ctx.restore();

    // Overhead Volumetric Industrial Spotlights shining onto active chairs
    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];
      const isHovered = this.chairHover === i && this.state.screen === 'PLAYING';

      // Volumetric spotlight cone from ceiling
      const spotGrad = ctx.createLinearGradient(plat.x, 0, plat.x, rowY + 30);
      spotGrad.addColorStop(0, 'rgba(255, 245, 220, 0.02)');
      spotGrad.addColorStop(0.6, isHovered ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 245, 220, 0.06)');
      spotGrad.addColorStop(1, isHovered ? 'rgba(0, 240, 255, 0.22)' : 'rgba(255, 245, 220, 0.10)');

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(plat.x - 20, 0);
      ctx.lineTo(plat.x + 20, 0);
      ctx.lineTo(plat.x + plat.width * 0.65, rowY + plat.height);
      ctx.lineTo(plat.x - plat.width * 0.65, rowY + plat.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Render Suspended Tempered Glass Platforms & Chairs
    for (let i = 0; i < platforms.length; i++) {
      const plat = platforms[i];
      const chair = row.chairs[i];
      const isHovered = this.chairHover === i && this.state.screen === 'PLAYING';
      const isSelected = this.state.selectedChair === i;

      let breakP = 0;
      let safeP = 0;
      if (isSelected) {
        if (this.state.screen === 'FAILURE_ANIMATION') {
          breakP = Math.min(this.failAnimTimer / 1.0, 1.0);
        } else if (this.state.screen === 'SAFE_ANIMATION') {
          safeP = Math.min(this.safeAnimTimer / 0.5, 1.0);
        }
      }

      ctx.save();

      // Platform Glass Pane: If broken, pane shatters away
      if (breakP < 0.3) {
        // Platform shadow over abyss
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(plat.x - plat.width * 0.5, plat.y + chairSize * 0.32, plat.width, plat.height);

        // Tempered glass slab
        const glassGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
        if (isHovered) {
          glassGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
          glassGrad.addColorStop(1, 'rgba(0, 180, 255, 0.15)');
        } else {
          glassGrad.addColorStop(0, 'rgba(100, 180, 220, 0.22)');
          glassGrad.addColorStop(1, 'rgba(40, 80, 120, 0.12)');
        }

        ctx.fillStyle = glassGrad;
        ctx.fillRect(plat.x - plat.width * 0.48, plat.y + chairSize * 0.28, plat.width * 0.96, plat.height * 0.6);

        // Neon edge rim brackets
        ctx.strokeStyle = isHovered ? PAL.neonCyan : (safeP > 0 ? PAL.neonGreen : 'rgba(0, 240, 255, 0.4)');
        ctx.lineWidth = isHovered ? 2 : 1.2;
        ctx.strokeRect(plat.x - plat.width * 0.48, plat.y + chairSize * 0.28, plat.width * 0.96, plat.height * 0.6);

        // Corner metal brackets
        ctx.fillStyle = PAL.steelHighlight;
        const bw = 6;
        const bh = 5;
        const gx = plat.x - plat.width * 0.48;
        const gy = plat.y + chairSize * 0.28;
        const gw = plat.width * 0.96;
        const gh = plat.height * 0.6;
        ctx.fillRect(gx, gy, bw, bh);
        ctx.fillRect(gx + gw - bw, gy, bw, bh);
        ctx.fillRect(gx, gy + gh - bh, bw, bh);
        ctx.fillRect(gx + gw - bw, gy + gh - bh, bw, bh);
      } else {
        // Cracked spiderweb fracture remnant
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plat.x - 20, plat.y + 20);
        ctx.lineTo(plat.x, plat.y + 25);
        ctx.lineTo(plat.x + 24, plat.y + 18);
        ctx.stroke();
      }

      // Prominent Digital Keyboard Number Badge [1] [2] [3] [4]
      const badgeY = plat.y + chairSize * 0.48;
      ctx.fillStyle = isHovered ? PAL.neonCyan : 'rgba(20, 32, 48, 0.9)';
      ctx.fillRect(plat.x - 14, badgeY - 10, 28, 18);
      ctx.strokeStyle = isHovered ? '#FFFFFF' : PAL.steelHighlight;
      ctx.lineWidth = 1;
      ctx.strokeRect(plat.x - 14, badgeY - 10, 28, 18);

      ctx.fillStyle = isHovered ? '#080C14' : PAL.cream;
      ctx.font = 'bold 12px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, plat.x, badgeY + 4);

      // Chair Hover Float Animation
      const hoverOffset = isHovered ? -4 : 0;
      const idleFloat = Math.sin(this.gameTime * 2.0 + i * 1.5) * 1.2;

      // Draw Chair Sprite
      if (breakP < 0.95) {
        drawChair(
          ctx, chair.chairType, chair.material,
          plat.x, plat.y + hoverOffset + idleFloat,
          chairSize, chair.variant, isHovered,
          breakP, safeP, chair.colorAccent
        );
      }

      ctx.restore();
    }

    // ---- 4. Launch / Safe Walkway Platform (Where the Player Stands) ----
    const launchY = this.getLaunchPlatformY();
    const charScaleSize = chairSize * 0.88;

    if (!this.hasConqueredAnyRow) {
      // Row 0: Solid initial diamond-plate steel deck
      ctx.save();
      const deckH = h - launchY;
      const deckGrad = ctx.createLinearGradient(0, launchY, 0, h);
      deckGrad.addColorStop(0, '#1E2C3F');
      deckGrad.addColorStop(0.3, '#141E2C');
      deckGrad.addColorStop(1, '#0C121C');
      ctx.fillStyle = deckGrad;
      ctx.fillRect(w * 0.15, launchY, w * 0.7, deckH);

      // Hazard safety railing line on platform lip
      ctx.fillStyle = PAL.neonAmber;
      ctx.fillRect(w * 0.15, launchY - 2, w * 0.7, 3);

      // Steel support bolts & warning markers
      ctx.fillStyle = PAL.steelHighlight;
      for (let bx = w * 0.18; bx < w * 0.82; bx += 36) {
        ctx.fillRect(bx, launchY + 6, 4, 4);
      }

      // Floor platform label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`◄ LAUNCH PLATFORM — STEP FORWARD ONTO ROW ${curRow + 1} ►`, w / 2, launchY + 22);

      // Connectors/cables from launch platform to active row
      ctx.strokeStyle = 'rgba(59, 83, 115, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < platforms.length; i++) {
        ctx.beginPath();
        ctx.moveTo(platforms[i].x, rowY + chairSize * 0.35);
        ctx.lineTo(w * 0.25 + i * (w * 0.5 / Math.max(1, platforms.length - 1)), launchY);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Conquered Safe Platform: Glides down as camera tracks forward along the bridge
      const baseRowY = h * 0.56;
      const platY = this.state.screen === 'ROW_TRANSITION'
        ? baseRowY + (launchY - baseRowY) * easeT
        : launchY;

      const platW = chairSize * 1.25;
      const platH = chairSize * 0.4;
      const px = this.lastConqueredX;

      ctx.save();
      // Drop shadow over abyss
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(px - platW * 0.5, platY + 10, platW, platH);

      // Reinforced tempered glass slab with glowing green neon edge
      const glassGrad = ctx.createLinearGradient(px, platY, px, platY + platH);
      glassGrad.addColorStop(0, 'rgba(0, 255, 102, 0.35)');
      glassGrad.addColorStop(1, 'rgba(0, 180, 80, 0.15)');
      ctx.fillStyle = glassGrad;
      ctx.fillRect(px - platW * 0.48, platY, platW * 0.96, platH);

      ctx.strokeStyle = PAL.neonGreen;
      ctx.lineWidth = 2;
      ctx.strokeRect(px - platW * 0.48, platY, platW * 0.96, platH);

      // Steel corner brackets
      ctx.fillStyle = PAL.steelHighlight;
      ctx.fillRect(px - platW * 0.48, platY, 8, 6);
      ctx.fillRect(px + platW * 0.48 - 8, platY, 8, 6);

      // Safe chair resting on the conquered platform
      drawChair(
        ctx,
        this.lastConqueredChairType as any,
        this.lastConqueredMaterial as any,
        px,
        platY - chairSize * 0.25,
        chairSize * 0.85,
        0,
        false,
        0,
        1.0,
        this.lastConqueredColor
      );

      // Illuminated Safe Tier Badge
      ctx.fillStyle = 'rgba(10, 26, 18, 0.9)';
      ctx.fillRect(px - 48, platY + platH - 4, 96, 16);
      ctx.strokeStyle = PAL.neonGreen;
      ctx.lineWidth = 1;
      ctx.strokeRect(px - 48, platY + platH - 4, 96, 16);
      ctx.fillStyle = PAL.neonGreen;
      ctx.font = 'bold 8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`✓ TIER ${curRow} SAFE`, px, platY + platH + 8);

      // Suspension cables connecting conquered platform forward to active row
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.25)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < platforms.length; i++) {
        ctx.beginPath();
        ctx.moveTo(platforms[i].x, rowY + chairSize * 0.35);
        ctx.lineTo(px, platY);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ---- 5. Player Character (Correctly Proportioned to Chairs & Bridge) ----
    if (this.state.selectedCharacter) {
      let charFrame: 'idle' | 'walk' | 'sit' | 'fall' | 'victory' = 'idle';
      if (this.state.screen === 'SELECTING') {
        charFrame = 'walk'; // leaping arc
      } else if (this.state.screen === 'SAFE_ANIMATION') {
        charFrame = 'sit';
      } else if (this.state.screen === 'ROW_TRANSITION') {
        const p = Math.min(this.transitionTimer / 0.85, 1.0);
        charFrame = p < 0.45 ? 'sit' : 'idle';
      } else if (this.state.screen === 'FAILURE_ANIMATION') {
        charFrame = 'fall';
      } else if (this.state.screen === 'PLAYING' || this.state.screen === 'COUNTDOWN') {
        charFrame = 'idle';
      }

      ctx.save();
      // Drop shadow on platform or bridge
      if (this.state.screen !== 'FAILURE_ANIMATION') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(this.charCurrentX, this.charCurrentY + charScaleSize * 0.48, charScaleSize * 0.28, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw character sprite
      drawCharacter(
        ctx,
        this.state.selectedCharacter,
        this.charCurrentX,
        this.charCurrentY,
        charScaleSize,
        charFrame,
        this.gameTime
      );
      ctx.restore();
    }
  }

  // ---- Squid Game Style Bridge Progression HUD ----
  private renderSquidGameHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const curRow = this.state.currentRow;

    // ---- Top Danger & Objective Banner ----
    ctx.save();
    ctx.fillStyle = PAL.darkOverlay;
    ctx.fillRect(0, 0, w, 52);
    ctx.fillStyle = PAL.neonCyan;
    ctx.fillRect(0, 52, w, 2);

    // Left: Game Title & Stage
    ctx.fillStyle = PAL.ivory;
    ctx.font = 'bold 13px "IBM Plex Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('THE LAST SEAT', 18, 22);

    // Prominent stage counter
    ctx.fillStyle = PAL.neonCyan;
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    ctx.fillText(`TIER ${String(curRow + 1).padStart(2, '0')} OF ${TOTAL_ROWS}`, 18, 38);

    // Center: Urgent Objective Instructions (Squid Game Theme)
    const chairsCount = this.state.run?.chairsPerRow || 3;
    const diffCfg = DIFFICULTIES[this.state.difficulty || 'medium'];
    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.neonAmber;
    ctx.font = 'bold 12px "IBM Plex Mono", monospace';
    ctx.fillText(`⚠️ [${diffCfg.label.toUpperCase()}] BRIDGE: 1 SAFE • ${chairsCount - 1} COLLAPSE`, w / 2, 22);

    ctx.fillStyle = PAL.cream;
    ctx.font = '10px "IBM Plex Mono", monospace';
    const keyNums = Array.from({ length: chairsCount }, (_, i) => `[${i + 1}]`).join(' ');
    ctx.fillText(`PRESS ${keyNums} OR CLICK A CHAIR TO LEAP`, w / 2, 38);

    // Right: High-Stakes Digital LED Stopwatch
    const timeLeft = Math.max(0, this.state.timer);
    let timerColor = PAL.neonCyan;
    if (timeLeft <= 5) timerColor = PAL.dangerRed;
    else if (timeLeft <= 15) timerColor = PAL.neonAmber;

    ctx.textAlign = 'right';
    ctx.fillStyle = timerColor;
    ctx.font = 'bold 18px "IBM Plex Mono", monospace';
    ctx.fillText(`${timeLeft.toFixed(2)}s`, w - 116, 26);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '8px "IBM Plex Mono", monospace';
    ctx.fillText('SURVIVAL CLOCK', w - 116, 40);

    // Heartbeat pulse for critical timer
    if (timeLeft <= 10 && !this.reducedMotion) {
      const pulse = Math.sin(this.gameTime * 10) * 0.4 + 0.6;
      ctx.fillStyle = `rgba(255, 42, 66, ${pulse * 0.3})`;
      ctx.fillRect(0, 0, w, 54);
    }
    ctx.restore();

    // ---- Left Side: Vertical 12-Tier Bridge Progression Tracker ----
    const trackerX = 18;
    const trackerY = 66;
    const tierH = Math.min((h - 150) / TOTAL_ROWS, 36);
    const trackerW = 56;

    ctx.save();
    // Background bar with glowing border
    ctx.fillStyle = 'rgba(10, 18, 30, 0.94)';
    const totalTrackerH = TOTAL_ROWS * tierH + 34;
    ctx.fillRect(trackerX, trackerY, trackerW, totalTrackerH);
    ctx.strokeStyle = '#284160';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(trackerX, trackerY, trackerW, totalTrackerH);

    // Neon gold top accent
    ctx.fillStyle = PAL.goldBright;
    ctx.fillRect(trackerX, trackerY, trackerW, 2);

    // Top Goal Icon (Throne 👑)
    ctx.font = '14px serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText('👑', trackerX + trackerW / 2, trackerY + 16);
    ctx.shadowBlur = 0;

    ctx.font = 'bold 8px "IBM Plex Mono", monospace';
    ctx.fillStyle = PAL.gold;
    ctx.fillText('THRONE', trackerX + trackerW / 2, trackerY + 26);

    // 12 Tier Steps (Row 12 at top, Row 1 at bottom)
    for (let r = 0; r < TOTAL_ROWS; r++) {
      // Step index from bottom to top
      const tierIndex = TOTAL_ROWS - 1 - r;
      const ty = trackerY + 30 + r * tierH;
      const blockPadX = 4;
      const blockPadY = 2;
      const blockW = trackerW - blockPadX * 2;
      const blockH = tierH - blockPadY * 2;

      const isCleared = tierIndex < curRow;
      const isCurrent = tierIndex === curRow;

      if (isCleared) {
        // Cleared step (Solid Neon Green with bright checkmark and glowing border)
        ctx.fillStyle = 'rgba(0, 255, 102, 0.22)';
        ctx.fillRect(trackerX + blockPadX, ty, blockW, blockH);
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(trackerX + blockPadX, ty, blockW, blockH);

        ctx.fillStyle = '#00FF66';
        ctx.font = 'bold 11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00FF66';
        ctx.shadowBlur = 6;
        ctx.fillText(`✓ ${String(tierIndex + 1).padStart(2, '0')}`, trackerX + trackerW / 2, ty + blockH * 0.72);
        ctx.shadowBlur = 0;
      } else if (isCurrent) {
        // Current step (High-Visibility Pulsing Gold / Amber beacon)
        const pulse = Math.sin(this.gameTime * 7) * 0.25 + 0.75;
        ctx.fillStyle = `rgba(255, 184, 0, ${pulse * 0.35})`;
        ctx.fillRect(trackerX + blockPadX, ty, blockW, blockH);
        ctx.strokeStyle = PAL.neonAmber;
        ctx.lineWidth = 2;
        ctx.shadowColor = PAL.neonAmber;
        ctx.shadowBlur = 10;
        ctx.strokeRect(trackerX + blockPadX, ty, blockW, blockH);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = PAL.neonAmber;
        ctx.shadowBlur = 8;
        ctx.fillText(`► ${String(tierIndex + 1).padStart(2, '0')}`, trackerX + trackerW / 2, ty + blockH * 0.72);
        ctx.shadowBlur = 0;
      } else {
        // Future step (Distinct dark metallic slate block with crisp readable numbers)
        ctx.fillStyle = 'rgba(20, 32, 48, 0.85)';
        ctx.fillRect(trackerX + blockPadX, ty, blockW, blockH);
        ctx.strokeStyle = '#23374D';
        ctx.lineWidth = 1;
        ctx.strokeRect(trackerX + blockPadX, ty, blockW, blockH);

        ctx.fillStyle = '#B4C5D6';
        ctx.font = 'bold 11px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${String(tierIndex + 1).padStart(2, '0')}`, trackerX + trackerW / 2, ty + blockH * 0.72);
      }
    }
    ctx.restore();
  }

  // ---- Victory Screen: Sitting on Golden Throne ----
  private renderVictoryThrone(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const fadeIn = Math.min(this.victoryTimer / 1.0, 1);

    // Warm golden victory spotlight halo
    const halo = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, w * 0.6);
    halo.addColorStop(0, 'rgba(255, 215, 0, 0.42)');
    halo.addColorStop(0.45, 'rgba(218, 165, 32, 0.22)');
    halo.addColorStop(0.75, 'rgba(128, 0, 32, 0.2)');
    halo.addColorStop(1, 'rgba(6, 10, 18, 0.95)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, w, h);

    // Dynamic sweeping celebration spotlights criss-crossing over throne
    ctx.save();
    const spotTime = this.gameTime * 2.2;
    const beam1X = w / 2 + Math.sin(spotTime) * (w * 0.28);
    const beam2X = w / 2 - Math.sin(spotTime * 0.75) * (w * 0.28);

    // Left Spotlight (Gold)
    const gradBeam1 = ctx.createRadialGradient(beam1X, h * 0.55, 10, w * 0.1, 0, w * 0.75);
    gradBeam1.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
    gradBeam1.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradBeam1;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(beam1X - 70, h * 0.75);
    ctx.lineTo(beam1X + 70, h * 0.75);
    ctx.closePath();
    ctx.fill();

    // Right Spotlight (Cyan neon)
    const gradBeam2 = ctx.createRadialGradient(beam2X, h * 0.55, 10, w * 0.9, 0, w * 0.75);
    gradBeam2.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
    gradBeam2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = gradBeam2;
    ctx.beginPath();
    ctx.moveTo(w * 0.9, 0);
    ctx.lineTo(beam2X - 70, h * 0.75);
    ctx.lineTo(beam2X + 70, h * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Giant Golden Throne Platform
    const platY = h * 0.62;
    ctx.fillStyle = '#2A1A08';
    ctx.fillRect(w * 0.2, platY, w * 0.6, 26);
    ctx.fillStyle = PAL.gold;
    ctx.fillRect(w * 0.2, platY, w * 0.6, 5);

    // Grand Throne
    const throneSize = Math.min(w * 0.35, 180);
    const throneY = platY - throneSize * 0.4;

    // Golden sunburst rays radiating behind throne
    ctx.save();
    ctx.translate(w / 2, throneY);
    ctx.rotate(this.gameTime * 0.35);
    const rayCount = 16;
    for (let r = 0; r < rayCount; r++) {
      ctx.rotate((Math.PI * 2) / rayCount);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-throneSize * 0.18, -throneSize * 1.3);
      ctx.lineTo(throneSize * 0.18, -throneSize * 1.3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    drawChair(ctx, 'throne', 'gold', w / 2, throneY, throneSize, 0, false, 0, fadeIn, PAL.dangerRed);

    // Character seated triumphantly
    if (this.state.selectedCharacter && this.victoryTimer > 0.8) {
      const charSize = throneSize * 0.44;
      const charY = throneY - throneSize * 0.08;
      drawCharacter(
        ctx,
        this.state.selectedCharacter,
        w / 2,
        charY,
        charSize,
        'victory',
        this.gameTime
      );

      // Floating celebratory Crown over avatar
      const crownBounce = Math.sin(this.gameTime * 4) * 5;
      ctx.font = `${Math.round(charSize * 0.55)}px serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 18;
      ctx.fillText('👑', w / 2, charY - charSize * 0.55 + crownBounce);
      ctx.shadowBlur = 0;
    }

    // Victory Banner with pulsing glow
    if (this.victoryTimer > 1.2) {
      ctx.save();
      const bannerPulse = 1 + Math.sin(this.gameTime * 3) * 0.03;
      ctx.translate(w / 2, h * 0.20);
      ctx.scale(bannerPulse, bannerPulse);
      ctx.shadowColor = 'rgba(255, 215, 0, 0.85)';
      ctx.shadowBlur = 24;

      ctx.fillStyle = PAL.goldBright;
      ctx.font = '900 32px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 THE LAST SEAT CONQUERED! 👑', 0, 0);

      ctx.shadowBlur = 0;
      ctx.fillStyle = PAL.cream;
      ctx.font = '700 14px "IBM Plex Mono", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText('ALL 12 PERILOUS STEPS CONQUERED. THE THRONE IS YOURS.', 0, 32);
      ctx.restore();
    }
  }

  // ---- Countdown Overlay ----
  private renderCountdown(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = 'rgba(8, 12, 20, 0.75)';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);

    const val = this.state.countdownValue;
    const text = val > 0 ? String(val) : 'JUMP!';
    const color = val > 0 ? PAL.neonAmber : PAL.neonGreen;

    const scale = 1 + Math.sin(this.countdownTimer * Math.PI) * 0.2;
    if (!this.reducedMotion) ctx.scale(scale, scale);

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = `bold ${val > 0 ? 84 : 64}px "Playfair Display", serif`;
    ctx.fillText(text, 0, 20);

    ctx.fillStyle = PAL.cream;
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillText('CROSS THE CHASM. TRUST ONLY ONE.', 0, 60);

    ctx.restore();
  }

  // ---- Input Handlers ----
  handleMouseMove(mx: number, my: number) {
    if (this.state.screen !== 'PLAYING') {
      this.chairHover = -1;
      return;
    }

    const { platforms, chairSize } = this.getActiveRowLayout();
    let newHover = -1;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (Math.abs(mx - p.x) < p.width * 0.6 && Math.abs(my - p.y) < chairSize * 0.75) {
        newHover = i;
        break;
      }
    }

    if (newHover !== this.chairHover) {
      this.chairHover = newHover;
      if (newHover >= 0) Audio.playHover();
    }
  }

  handleClick(mx: number, my: number) {
    if (this.state.screen !== 'PLAYING' || this.state.inputLocked) return;

    const { platforms, chairSize } = this.getActiveRowLayout();
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (Math.abs(mx - p.x) < p.width * 0.65 && Math.abs(my - p.y) < chairSize * 0.8) {
        this.selectChair(i);
        return;
      }
    }
  }

  handleKey(key: string) {
    const maxChairs = this.state.run?.chairsPerRow || 3;
    const num = parseInt(key);
    if (!isNaN(num) && num >= 1 && num <= maxChairs) {
      this.selectChair(num - 1);
    }
  }

  // ---- Particle Systems ----
  private spawnShatterParticles(x: number, y: number, material: string) {
    // 1. Tempered Glass Shards (Squid Game Glass Shatter)
    for (let i = 0; i < 28; i++) {
      this.state.particles.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y + 15 + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 220,
        vy: -Math.random() * 140 - 20,
        life: 1.2 + Math.random() * 0.6,
        maxLife: 1.8,
        size: 3 + Math.random() * 5,
        color: ['#00F0FF', '#E8F8FF', '#A0E6FF', '#FFFFFF'][Math.floor(Math.random() * 4)],
        type: 'glass',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
      });
    }

    // 2. Chair Material Splinters
    const isWood = material.includes('wood') || material === 'dark_mahogany';
    const isMetal = material === 'metal' || material === 'chrome' || material === 'brass';
    for (let i = 0; i < 20; i++) {
      this.state.particles.push({
        x: x + (Math.random() - 0.5) * 35,
        y: y + (Math.random() - 0.5) * 25,
        vx: (Math.random() - 0.5) * 160,
        vy: -Math.random() * 120 - 30,
        life: 1.0 + Math.random() * 0.5,
        maxLife: 1.5,
        size: 2 + Math.random() * 4,
        color: isWood ? '#8B5A2B' : isMetal ? '#A0A0A0' : '#4A3728',
        type: isWood ? 'wood' : isMetal ? 'metal' : 'dust',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    // 3. High-Voltage Electrical Sparks
    for (let i = 0; i < 10; i++) {
      this.state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 260,
        vy: -Math.random() * 180,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        size: 2 + Math.random() * 2,
        color: PAL.neonCyan,
        type: 'spark',
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  private spawnAbyssFog() {
    if (this.state.particles.length > 180) return;
    this.state.particles.push({
      x: Math.random() * this.canvasWidth,
      y: this.canvasHeight + 10,
      vx: (Math.random() - 0.5) * 15,
      vy: -Math.random() * 20 - 10,
      life: 3.5,
      maxLife: 3.5,
      size: 14 + Math.random() * 20,
      color: 'rgba(15, 28, 44, 0.25)',
      type: 'dust',
      rotation: 0,
      rotationSpeed: 0,
    });
  }

  private spawnGoldConfetti(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 100,
        vy: -Math.random() * 80 - 30,
        life: 2.5,
        maxLife: 2.5,
        size: 4 + Math.random() * 3,
        color: [PAL.goldBright, PAL.neonAmber, PAL.cream, PAL.neonPink][Math.floor(Math.random() * 4)],
        type: 'confetti',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 6,
      });
    }
  }

  private spawnFirework(x: number, y: number) {
    const colors = [PAL.goldBright, PAL.neonAmber, '#FF0055', '#00F0FF', '#00FF66', '#FFFFFF'];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 70 + Math.random() * 150;
      this.state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        life: 1.2 + Math.random() * 0.6,
        maxLife: 1.8,
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'spark',
        rotation: 0,
        rotationSpeed: 0,
      });
    }
  }

  private updateParticles(dt: number) {
    const gravity = 280;
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.type !== 'dust') {
        p.vy += gravity * dt;
      }
      p.life -= dt;
      p.rotation += p.rotationSpeed * dt;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.state.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.rotation) ctx.rotate(p.rotation);

      if (p.type === 'glass') {
        // Sharp triangular/polygonal glass shards
        ctx.beginPath();
        ctx.moveTo(-p.size / 2, -p.size / 2);
        ctx.lineTo(p.size / 2, 0);
        ctx.lineTo(0, p.size / 2);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === 'confetti') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        // Dust / fog / wood splinter
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1.0;
  }

  private notify() {
    this.onStateChange({ ...this.state });
  }

  getState(): GameState {
    return this.state;
  }
}
