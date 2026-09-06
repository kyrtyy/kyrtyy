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

  let W, H;
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  // Lorenz parameters
  const SIGMA = 10.0;
  const BETA = 8.0 / 3.0;
  let baseRho = 28.0;

  // 3D Camera / Mouse Gyroscope
  let rotX = 0.35;
  let rotY = 0.0;
  let targetRotX = 0.35;
  let targetRotY = 0.0;

  window.addEventListener('mousemove', e => {
    const nx = (e.clientX / W) * 2 - 1;
    const ny = (e.clientY / H) * 2 - 1;
    targetRotY = nx * 0.75;
    targetRotX = 0.35 + ny * 0.45;
  }, { passive: true });

  // Scroll Tracking & Entropy Dynamics
  let lastScrollY = window.scrollY;
  let scrollSpeed = 0;
  let entropy = 0; // Scales from 0 (coherent attractor) to 1 (entropy cloud)

  window.addEventListener('scroll', () => {
    const currentY = window.scrollY;
    const delta = Math.abs(currentY - lastScrollY);
    lastScrollY = currentY;
    scrollSpeed = Math.min(45, scrollSpeed + delta * 0.15);
  }, { passive: true });

  // Click: Entropy Burst
  window.addEventListener('click', () => {
    entropy = Math.min(1.8, entropy + 1.1);
    for (let p of particles) {
      p.vx += (Math.random() - 0.5) * 8;
      p.vy += (Math.random() - 0.5) * 8;
      p.vz += (Math.random() - 0.5) * 8;
    }
  });

  // Particle Ensemble in Phase Space
  const NUM_PARTICLES = 160;
  const TRAIL_LENGTH = 18;
  const particles = [];

  function createParticle(seedOffset = 0) {
    return {
      x: (Math.random() - 0.5) * 4 + 0.1,
      y: (Math.random() - 0.5) * 4 + 0.1,
      z: 20 + (Math.random() - 0.5) * 10,
      vx: 0,
      vy: 0,
      vz: 0,
      trail: [],
      speedMultiplier: 0.007 + Math.random() * 0.003
    };
  }

  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push(createParticle(i));
  }

  // Runge-Kutta / Euler derivative
  function getDerivatives(x, y, z, rho) {
    return {
      dx: SIGMA * (y - x),
      dy: x * (rho - z) - y,
      dz: x * y - BETA * z
    };
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // Smooth camera interpolation
    rotX += (targetRotX - rotX) * 0.05;
    rotY += (targetRotY - rotY) * 0.05;

    // Entropy evolution: scroll accelerates chaos; at rest it decays exponentially
    if (scrollSpeed > 0.5) {
      entropy = Math.min(1.5, entropy + scrollSpeed * 0.025);
    }
    entropy *= 0.94; // Exponential relaxation back to strange attractor manifold
    scrollSpeed *= 0.88;

    const currentRho = baseRho + entropy * 14.0;
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    const scale = Math.min(W, H) * 0.024;
    const centerX = W / 2;
    const centerY = H / 2 + 30;

    for (let p of particles) {
      // 1. Evaluate Lorenz system
      const dt = p.speedMultiplier;
      const d = getDerivatives(p.x, p.y, p.z, currentRho);

      // 2. Add stochastic Brownian noise proportional to entropy (scroll)
      let noiseX = 0, noiseY = 0, noiseZ = 0;
      if (entropy > 0.05) {
        const noiseMag = entropy * 2.4;
        noiseX = (Math.random() - 0.5) * noiseMag;
        noiseY = (Math.random() - 0.5) * noiseMag;
        noiseZ = (Math.random() - 0.5) * noiseMag;
      }

      // Update position
      p.x += d.dx * dt + noiseX + p.vx * 0.05;
      p.y += d.dy * dt + noiseY + p.vy * 0.05;
      p.z += d.dz * dt + noiseZ + p.vz * 0.05;

      p.vx *= 0.92;
      p.vy *= 0.92;
      p.vz *= 0.92;

      // Bound safety
      if (isNaN(p.x) || Math.abs(p.x) > 120 || Math.abs(p.y) > 120 || p.z > 140 || p.z < -20) {
        Object.assign(p, createParticle());
        continue;
      }

      // 3. 3D to 2D Perspective Projection
      // Center z around ~27 (attractor centroid)
      const cx = p.x;
      const cy = p.y;
      const cz = p.z - 27;

      // Rotation around Y then X
      const rx = cx * cosY + cz * sinY;
      const tempZ = -cx * sinY + cz * cosY;
      const ry = cy * cosX - tempZ * sinX;
      const rz = cy * sinX + tempZ * cosX;

      // Subtle perspective divisor
      const fov = 160;
      const pers = fov / (fov + rz * 0.4);

      const px = centerX + rx * scale * pers;
      const py = centerY - ry * scale * pers;

      // Store trail point
      p.trail.push({ x: px, y: py, valX: p.x, entropy });
      if (p.trail.length > TRAIL_LENGTH) {
        p.trail.shift();
      }

      // 4. Render smooth glowing trails
      if (p.trail.length > 2) {
        for (let j = 1; j < p.trail.length; j++) {
          const pt1 = p.trail[j - 1];
          const pt2 = p.trail[j];
          const progress = j / p.trail.length;

          // Color palette:
          // Left wing (x < 0): Luminous cosmic violet (#a78bfa)
          // Right wing (x > 0): Cherenkov ice-cyan (#38bdf8)
          // Near origin / saddle: Gold highlight (#f59e0b)
          let color;
          const alpha = (progress * (0.16 - Math.min(0.08, entropy * 0.05))).toFixed(3);

          if (Math.abs(pt2.valX) < 2.5) {
            color = `rgba(245, 158, 11, ${alpha})`; // Saddle point
          } else if (pt2.valX < 0) {
            color = `rgba(167, 139, 250, ${alpha})`; // Left wing (violet)
          } else {
            color = `rgba(56, 189, 248, ${alpha})`; // Right wing (cyan)
          }

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 0.65 + progress * 0.5;
          ctx.stroke();
        }
      }

      // Render leading point
      const headAlpha = (0.35 + (1 - Math.min(1, entropy)) * 0.25).toFixed(3);
      ctx.beginPath();
      ctx.arc(px, py, entropy > 0.3 ? 1.2 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = p.x < 0 ? `rgba(167, 139, 250, ${headAlpha})` : `rgba(56, 189, 248, ${headAlpha})`;
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
})();
