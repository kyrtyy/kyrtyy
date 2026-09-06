/**
 * DIFFUSION SDE PAGE TRANSITION ENGINE
 * Inspired by continuous-time score-based generative models:
 * - Forward SDE: Disperses coherent page structure into maximum-entropy Gaussian noise.
 * - Reverse SDE: Reconstructs crisp structure from stochastic noise fluctuations via score matching.
 */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  // 1. Inject Styles for Diffusion Transition
  const style = document.createElement('style');
  style.textContent = `
    /* Diffusion Transition HUD Pill */
    #diffusion-hud {
      position: fixed;
      top: 1.1rem;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      z-index: 9999;
      pointer-events: none;
      background: rgba(13, 17, 23, 0.92);
      border: 1px solid rgba(167, 139, 250, 0.4);
      box-shadow: 0 4px 24px rgba(124, 58, 237, 0.35);
      border-radius: 50px;
      padding: 0.35rem 1rem;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.72rem;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    #diffusion-hud.active {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    #diffusion-hud .hud-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a78bfa;
      box-shadow: 0 0 8px #a78bfa;
      animation: hud-pulse 1s infinite alternate;
    }

    @keyframes hud-pulse {
      from { transform: scale(0.9); opacity: 0.6; }
      to { transform: scale(1.4); opacity: 1; }
    }

    /* Page Deconstruction / Reconstruction Animations */
    body.diffusion-reconstructing {
      animation: reverse-sde 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    body.diffusion-deconstructing {
      animation: forward-sde 0.32s cubic-bezier(0.7, 0, 0.84, 0) forwards;
      pointer-events: none;
    }

    @keyframes reverse-sde {
      0% {
        opacity: 0;
        filter: blur(14px) contrast(150%);
        transform: scale(0.985) translateY(10px);
      }
      50% {
        opacity: 0.75;
        filter: blur(4px) contrast(110%);
      }
      100% {
        opacity: 1;
        filter: blur(0px) contrast(100%);
        transform: scale(1) translateY(0);
      }
    }

    @keyframes forward-sde {
      0% {
        opacity: 1;
        filter: blur(0px);
        transform: scale(1) translateY(0);
      }
      60% {
        opacity: 0.6;
        filter: blur(8px) contrast(140%);
        transform: scale(1.012) translateY(-6px);
      }
      100% {
        opacity: 0;
        filter: blur(18px) contrast(180%);
        transform: scale(1.025) translateY(-14px);
      }
    }
  `;
  document.head.appendChild(style);

  // 2. Create HUD element
  const hud = document.createElement('div');
  hud.id = 'diffusion-hud';
  hud.innerHTML = '<span class="hud-dot"></span><span id="hud-text">Reverse SDE: Reconstructing Structure</span>';
  document.body.appendChild(hud);

  const hudText = hud.querySelector('#hud-text');

  // 3. Arrival: Trigger Reverse SDE Reconstruction on Page Load
  document.body.classList.add('diffusion-reconstructing');
  hud.classList.add('active');
  hudText.textContent = 'Reverse SDE: Reconstructing Structure [t = T → 0]';

  setTimeout(() => {
    document.body.classList.remove('diffusion-reconstructing');
    hud.classList.remove('active');
  }, 420);

  // 4. Departure: Intercept Navigation and run Forward SDE Dissipation
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip anchors, mailto, external protocols, and new-tab links
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') {
      return;
    }

    // Check if it's an internal site navigation
    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    // Prevent immediate jump
    e.preventDefault();

    // Trigger Forward SDE Decomposition
    hudText.textContent = 'Forward SDE: Dissipating Structure [t = 0 → T]';
    hud.classList.add('active');
    document.body.classList.add('diffusion-deconstructing');

    setTimeout(() => {
      window.location.href = link.href;
    }, 280);
  });
})();
