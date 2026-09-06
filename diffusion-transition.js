/**
 * "ONE IS ALL, AND ALL IS ONE" — CONTINUOUS TRANSMUTATION ENGINE
 * Inspired by Fullmetal Alchemist: Brotherhood & Continuous-Time Diffusion SDEs:
 * - Deconstruction (One -> All): Content dissipates into the living quantum background.
 * - Transmutation: DOM and state swap asynchronously without refreshing the page or restarting the physics canvas.
 * - Reconstruction (All -> One): Coherent physical structure and equations condense from the field.
 */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Create or ensure HUD element
  let hud = document.getElementById('diffusion-hud');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'diffusion-hud';
    hud.innerHTML = '<span class="hud-dot"></span><span id="hud-text">All is One &bull; Continuous Field</span>';
    document.body.appendChild(hud);
  }
  const hudText = hud.querySelector('#hud-text');

  function showHud(text, duration = 1200) {
    if (reduceMotion) return;
    hudText.textContent = text;
    hud.classList.add('active');
    setTimeout(() => {
      hud.classList.remove('active');
    }, duration);
  }

  // 2. Initial Page Load Animation
  const initialContent = document.getElementById('app-content') || document.querySelector('main');
  if (initialContent && !reduceMotion) {
    initialContent.classList.add('reconstructing');
    showHud('Reconstruction: All condenses into One', 1000);
    setTimeout(() => {
      initialContent.classList.remove('reconstructing');
    }, 450);
  }

  // 3. Smooth Dynamic Transmutation (SPA-like without page reloads)
  async function transmuteTo(url, push = true) {
    const contentEl = document.getElementById('app-content') || document.querySelector('main');
    if (!contentEl || reduceMotion) {
      window.location.href = url;
      return;
    }

    try {
      // Phase 1: Deconstruction (One -> All)
      showHud('Deconstruction: One dissolves into All', 800);
      contentEl.classList.remove('reconstructing');
      contentEl.classList.add('deconstructing');

      // Fetch new page content in parallel
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response not ok');
      const htmlText = await response.text();

      // Parse incoming DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const newContent = doc.getElementById('app-content') || doc.querySelector('main');

      if (!newContent) {
        window.location.href = url;
        return;
      }

      // Wait for deconstruction animation to complete (~250ms)
      await new Promise(resolve => setTimeout(resolve, 260));

      // Phase 2: Transmutation (Swap DOM and Metadata)
      contentEl.innerHTML = newContent.innerHTML;
      document.title = doc.title;

      if (push) {
        window.history.pushState({ url }, doc.title, url);
      }

      // Update Navigation Links active state
      const currentPath = new URL(url, window.location.origin).pathname;
      document.querySelectorAll('.nav-links a').forEach(a => {
        const linkPath = new URL(a.href, window.location.origin).pathname;
        if (linkPath === currentPath || (currentPath.endsWith('/') && linkPath.endsWith('index.html'))) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });

      // Re-hydrate KaTeX mathematical expressions
      if (window.renderMathInElement) {
        window.renderMathInElement(contentEl, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      }

      // Re-wire Easter egg buttons if on index.html
      wireObservationNode();

      // Scroll smoothly to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Phase 3: Reconstruction (All -> One)
      contentEl.classList.remove('deconstructing');
      contentEl.classList.add('reconstructing');
      showHud('Reconstruction: All condenses into One', 1100);

      setTimeout(() => {
        contentEl.classList.remove('reconstructing');
      }, 420);

    } catch (err) {
      console.warn('Continuous transmutation fallback to standard load:', err);
      window.location.href = url;
    }
  }

  // 4. Intercept Internal Clicks
  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip anchors, mailto, tel, target=_blank
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') {
      return;
    }

    // Check same origin
    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    // If local file protocol and CORS blocks fetch, allow default navigation
    if (window.location.protocol === 'file:') {
      return;
    }

    e.preventDefault();
    transmuteTo(link.href, true);
  });

  // 5. Handle Browser Back/Forward Buttons (Popstate)
  window.addEventListener('popstate', e => {
    transmuteTo(window.location.href, false);
  });

  // 6. Re-wire Quantum Observation Node if present
  function wireObservationNode() {
    const collapseBtn = document.getElementById('collapse-btn');
    const quoteEl = document.getElementById('obs-quote');
    const authorEl = document.getElementById('obs-author');
    const tagEl = document.getElementById('obs-tag');

    if (!collapseBtn || !quoteEl) return;

    const easterEggs = [
      {
        quote: "The universe is the All, and I am the One. A tiny part of the whole. Everything flows and connects. Mass and energy cannot be created nor destroyed—only deconstructed and reconstructed.",
        author: "— Fullmetal Alchemist: Brotherhood (Yock Island Epiphany)",
        tag: "// First Law of Thermodynamics & Cosmic Unity: Mass-energy conservation and the eternal cycle of physical transformation."
      },
      {
        quote: "Nature isn't classical, dammit, and if you want to make a simulation of nature, you'd better make it quantum mechanical!",
        author: "— Richard P. Feynman, Simulating Physics with Computers (1982)",
        tag: "// Quantum Supremacy: Exact representation of n entangled qubits requires 2^n complex amplitudes."
      },
      {
        quote: "With four parameters I can fit an elephant, and with five I can make him wiggle his trunk.",
        author: "— John von Neumann (as recounted by Freeman Dyson, 2004)",
        tag: "// Overparameterization & Regularization: Why deep neural networks generalize despite millions of parameters."
      },
      {
        quote: "A method is more important than a discovery, since the right method will lead to new and even more wonderful discoveries.",
        author: "— Lev Landau, Course of Theoretical Physics",
        tag: "// Theoretical Rigor: From symmetry groups to variational principles in computational mechanics."
      },
      {
        quote: "Time is a state: the flame in which there lives the salamander of the human soul.",
        author: "— Andrei Tarkovsky, Sculpting in Time (1986)",
        tag: "// Non-Inertial Time: Exploring duration, temporal rhythm, and memory in cinema and non-equilibrium physics."
      },
      {
        quote: "If your theory is found to be against the second law of thermodynamics I can give you no hope; there is nothing for it but to collapse in deepest humiliation.",
        author: "— Sir Arthur Eddington, The Nature of the Physical World (1928)",
        tag: "// Irreversibility: Microscopic laws are time-reversible; macroscopic thermodynamics dictates the arrow of time."
      }
    ];

    let currentIdx = 0;
    collapseBtn.onclick = () => {
      quoteEl.style.opacity = '0';
      authorEl.style.opacity = '0';
      tagEl.style.opacity = '0';

      setTimeout(() => {
        let nextIdx;
        do {
          nextIdx = Math.floor(Math.random() * easterEggs.length);
        } while (nextIdx === currentIdx);
        currentIdx = nextIdx;

        quoteEl.textContent = `"${easterEggs[currentIdx].quote}"`;
        authorEl.textContent = easterEggs[currentIdx].author;
        tagEl.textContent = easterEggs[currentIdx].tag;

        quoteEl.style.opacity = '1';
        authorEl.style.opacity = '1';
        tagEl.style.opacity = '1';
      }, 200);
    };
  }

  // Initialize on load
  wireObservationNode();
})();
