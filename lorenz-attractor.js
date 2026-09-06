/**
 * LORENZ BUTTERFLY CHAOS & ENTROPY ENGINE
 * - 3D Strange Attractor non-linear ODE integration
 * - Scroll-coupled chaos: Decomposing into stochastic entropy dust during scroll
 * - Dissipative phase-space contraction: Reconstructing into the butterfly wings at rest
 * - Interactive 3D mouse rotation & click entropy explosion
 */

(function () {
  const canvas = document.getElementById('lorenz-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    canvas.style.display = 'none';
    return;
  }

  // DPR capping to prevent Retina pixel fill-rate lag
  const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
  let W = window.innerWidth;
  let H = window.innerHeight;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 100);
  }, { passive: true });
  resize();

  // Lorenz parameters: sigma=10, beta=8/3, rho=28
  const SIGMA = 10.0;
  const BETA = 8.0 / 3.0;
  const BASE_RHO = 28.0;

  // 3D Camera / Mouse Gyroscope
  let rotX = 0.32;
  let rotY = 0.0;
  let targetRotX = 0.32;
  let targetRotY = 0.0;

  window.addEventListener('mousemove', e => {
    const nx = (e.clientX / W) * 2 - 1;
    const ny = (e.clientY / H) * 2 - 1;
    targetRotY = nx * 0.45;
    targetRotX = 0.32 + ny * 0.28;
  }, { passive: true });

  // Scroll Tracking & Entropy Dynamics
  let lastScrollY = window.scrollY;
  let scrollDelta = 0;
  let entropy = 0; // 0 = crystalline attractor manifold; >0 = entropy dispersion

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    scrollDelta += Math.abs(currentY - lastScrollY);
    lastScrollY = currentY;
  }, { passive: true });

  // Click: Localized Kinetic Entropy Burst (ignored on clickable links/buttons)
  window.addEventListener('click', e => {
    if (e.target.closest('a, button, input, textarea')) return;
    entropy = Math.min(1.6, entropy + 0.85);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vx += (Math.random() - 0.5) * 6;
      p.vy += (Math.random() - 0.5) * 6;
      p.vz += (Math.random() - 0.5) * 6;
    }
  });

  // ─── 1. CORE ATTRACTOR PARTICLES (Expansive Wingspan) ─────────────────
  const NUM_PARTICLES = 130;
  const TRAIL_LENGTH = 22;
  const particles = [];

  function createAttractorParticle() {
    const side = Math.random() > 0.5 ? 1 : -1;
    return {
      x: side * (6 + Math.random() * 8),
      y: side * (6 + Math.random() * 8),
      z: 22 + (Math.random() - 0.5) * 12,
      vx: 0,
      vy: 0,
      vz: 0,
      trail: [],
      speed: 0.0025 + Math.random() * 0.0015
    };
  }

  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(createAttractorParticle());
  }

  // ─── 2. AMBIENT PHASE-SPACE STREAMLINE FIELD ──────────────────────────
  // Covers the entire screen to eliminate isolation
  const NUM_AMBIENT = 75;
  const ambientParticles = [];

  function createAmbientParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      life: 50 + Math.random() * 150,
      maxLife: 200,
      alpha: 0.04 + Math.random() * 0.08
    };
  }

  for (let i = 0; i < NUM_AMBIENT; i++) {
    ambientParticles.push(createAmbientParticle());
  }

  // Non-linear Lorenz ODE derivatives
  function getDerivatives(x, y, z, rho) {
    return {
      dx: SIGMA * (y - x),
      dy: x * (rho - z) - y,
      dz: x * y - BETA * z
    };
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // Camera smoothing
    rotX += (targetRotX - rotX) * 0.06;
    rotY += (targetRotY - rotY) * 0.06;

    // Scroll entropy dynamics
    if (scrollDelta > 0.5) {
      entropy = Math.min(1.4, entropy + scrollDelta * 0.018);
      scrollDelta *= 0.65;
    } else {
      scrollDelta = 0;
    }
    entropy *= 0.94; // Exponential dissipative cooling back to the attractor

    const currentRho = BASE_RHO + entropy * 12.0;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    // Adaptive scale: Wide wingspan embracing the viewport
    const scale = Math.min(W * 0.032, Math.max(18, H * 0.038));
    const centerX = W / 2;
    const centerY = H / 2 + 20;

    // Batch buckets for 100% lag-free rendering
    // Instead of thousands of ctx.stroke calls, we draw only 4 batch strokes!
    const batchViolet = []; // Left wing (Cosmic Violet)
    const batchCyan = [];   // Right wing (Cherenkov Cyan)
    const batchGold = [];   // Saddle node crossings (Gold)
    const batchAmbient = [];// Screen-wide ambient streamlines
    const headDots = [];    // Leading glowing points

    // ── Update & Project Core Attractor Particles ──
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const dt = p.speed;
      const d = getDerivatives(p.x, p.y, p.z, currentRho);

      // Stochastic Brownian kicks proportional to scroll entropy
      let noiseX = 0, noiseY = 0, noiseZ = 0;
      if (entropy > 0.04) {
        const mag = entropy * 2.2;
        noiseX = (Math.random() - 0.5) * mag;
        noiseY = (Math.random() - 0.5) * mag;
        noiseZ = (Math.random() - 0.5) * mag;
      }

      p.x += d.dx * dt + noiseX + p.vx * 0.05;
      p.y += d.dy * dt + noiseY + p.vy * 0.05;
      p.z += d.dz * dt + noiseZ + p.vz * 0.05;

      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vz *= 0.92;

      // Bound reset
      if (isNaN(p.x) || Math.abs(p.x) > 90 || Math.abs(p.y) > 90 || p.z > 120 || p.z < -10) {
        Object.assign(p, createAttractorParticle());
        continue;
      }

      // 3D Perspective Projection (centered at z ~ 27)
      const cx = p.x;
      const cy = p.y;
      const cz = p.z - 27;

      const rx = cx * cosY + cz * sinY;
      const tempZ = -cx * sinY + cz * cosY;
      const ry = cy * cosX - tempZ * sinX;
      const rz = cy * sinX + tempZ * cosX;

      const fov = 170;
      const pers = fov / (fov + rz * 0.35);

      const px = centerX + rx * scale * pers;
      const py = centerY - ry * scale * pers;

      p.trail.push({ x: px, y: py, valX: p.x });
      if (p.trail.length > TRAIL_LENGTH) {
        p.trail.shift();
      }

      // Bucket segments for single-call drawing
      if (p.trail.length > 2) {
        const len = p.trail.length;
        for (let j = 1; j < len; j++) {
          const pt1 = p.trail[j - 1];
          const pt2 = p.trail[j];
          const seg = [pt1.x, pt1.y, pt2.x, pt2.y];

          if (Math.abs(pt2.valX) < 2.5) {
            batchGold.push(seg);
          } else if (pt2.valX < 0) {
            batchViolet.push(seg);
          } else {
            batchCyan.push(seg);
          }
        }
      }

      // Leading particle node
      headDots.push({
        x: px,
        y: py,
        color: p.x < 0 ? 'rgba(167, 139, 250, 0.6)' : 'rgba(45, 212, 191, 0.6)'
      });
    }

    // ── Update & Project Ambient Phase-Space Streamlines ──
    for (let i = 0; i < ambientParticles.length; i++) {
      const ap = ambientParticles[i];
      ap.life++;

      // Subtle gravitational drift toward closest wing center
      const targetX = ap.x < W / 2 ? centerX - scale * 12 : centerX + scale * 12;
      const targetY = centerY;
      const dx = targetX - ap.x;
      const dy = targetY - ap.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;

      // Subtle orbital circulation around lobes
      ap.vx += (dy / dist) * 0.08 + (dx / dist) * 0.02;
      ap.vy += (-dx / dist) * 0.08 + (dy / dist) * 0.02;

      // Damping & speed cap
      ap.vx *= 0.96;
      ap.vy *= 0.96;

      const prevX = ap.x;
      const prevY = ap.y;
      ap.x += ap.vx;
      ap.y += ap.vy;

      if (ap.life > ap.maxLife || ap.x < -20 || ap.x > W + 20 || ap.y < -20 || ap.y > H + 20) {
        Object.assign(ap, createAmbientParticle());
      } else {
        batchAmbient.push([prevX, prevY, ap.x, ap.y]);
      }
    }

    // ── FAST BATCH RENDER: DRAW CALL 1 (Ambient Streamlines) ──
    if (batchAmbient.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < batchAmbient.length; i++) {
        const s = batchAmbient[i];
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[2], s[3]);
      }
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.09)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // ── FAST BATCH RENDER: DRAW CALL 2 (Left Wing — Cosmic Violet) ──
    if (batchViolet.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < batchViolet.length; i++) {
        const s = batchViolet[i];
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[2], s[3]);
      }
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.25)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // ── FAST BATCH RENDER: DRAW CALL 3 (Right Wing — Complementary Teal) ──
    if (batchCyan.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < batchCyan.length; i++) {
        const s = batchCyan[i];
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[2], s[3]);
      }
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    // ── FAST BATCH RENDER: DRAW CALL 4 (Saddle Node Crossings — Warm Gold) ──
    if (batchGold.length > 0) {
      ctx.beginPath();
      for (let i = 0; i < batchGold.length; i++) {
        const s = batchGold[i];
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[2], s[3]);
      }
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // ── FAST BATCH RENDER: Leading Nodes (Faint Dots) ──
    for (let i = 0; i < headDots.length; i++) {
      const dot = headDots[i];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = dot.color;
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  step();
})();
