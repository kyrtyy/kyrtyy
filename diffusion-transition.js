/**
 * "ONE IS ALL, AND ALL IS ONE" — CONTINUOUS TRANSMUTATION ENGINE (V2 — ZERO LAG & CACHED)
 * - Deconstruction (One -> All): Content fades out smoothly without freezing the thread.
 * - Instant Cache & Fetch: In-memory page preloading on hover for 0ms wait times.
 * - Transmutation: Swaps #app-content AND synchronizes <nav> so relative links never break on subpages.
 * - Reconstruction (All -> One): Snappy, hardware-accelerated fade-in with KaTeX rendering.
 */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // In-memory page cache for instant 0ms transitions
  const pageCache = new Map();

  // Sleek top progress indicator
  let progressBar = document.getElementById('transmute-progress');
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.id = 'transmute-progress';
    document.body.appendChild(progressBar);
  }

  function setProgress(pct, opacity = 1) {
    if (reduceMotion || !progressBar) return;
    progressBar.style.width = pct + '%';
    progressBar.style.opacity = opacity;
  }

  // Preload page in background on link hover
  async function preloadPage(url) {
    if (pageCache.has(url) || window.location.protocol === 'file:') return;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        pageCache.set(url, text);
      }
    } catch (e) {
      // Ignore background preload failures
    }
  }

  // Smooth Dynamic Transmutation (SPA-like without page reloads)
  async function transmuteTo(url, push = true) {
    const contentEl = document.getElementById('app-content') || document.querySelector('main');
    if (!contentEl || reduceMotion) {
      window.location.href = url;
      return;
    }

    try {
      setProgress(50, 1);

      // Phase 1: Rapid deconstruction
      contentEl.classList.remove('reconstructing');
      contentEl.classList.add('deconstructing');

      // Fetch or retrieve from cache
      let htmlText = pageCache.get(url);
      if (!htmlText) {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response not ok: ' + response.status);
        htmlText = await response.text();
        pageCache.set(url, htmlText);
      }

      setProgress(85, 1);

      // Parse incoming DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const newContent = doc.getElementById('app-content') || doc.querySelector('main');

      if (!newContent) {
        window.location.href = url;
        return;
      }

      // Small tick for smooth opacity transition (~90ms)
      await new Promise(resolve => setTimeout(resolve, 90));

      // Phase 2: Transmutation (Swap DOM, Nav, Styles, and Metadata)
      contentEl.innerHTML = newContent.innerHTML;
      document.title = doc.title;

      // Synchronize navbar to maintain correct relative link depths
      const newNav = doc.querySelector('nav');
      const currentNav = document.querySelector('nav');
      if (newNav && currentNav) {
        currentNav.innerHTML = newNav.innerHTML;
      }

      // Synchronize any page-specific style blocks from incoming head
      const incomingStyles = doc.querySelectorAll('style');
      let dynamicStyles = document.getElementById('transmute-dynamic-styles');
      if (!dynamicStyles) {
        dynamicStyles = document.createElement('style');
        dynamicStyles.id = 'transmute-dynamic-styles';
        document.head.appendChild(dynamicStyles);
      }
      let combinedCss = '';
      incomingStyles.forEach(s => { combinedCss += s.textContent + '\n'; });
      dynamicStyles.textContent = combinedCss;

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

      // Re-hydrate ALL KaTeX mathematical expressions across the entire document
      window.renderAllMath(document.body);

      // Re-wire Easter egg buttons if on index.html
      wireObservationNode();

      // Scroll instantly to top
      window.scrollTo({ top: 0, behavior: 'instant' });

      // Phase 3: Reconstruction
      contentEl.classList.remove('deconstructing');
      contentEl.classList.add('reconstructing');

      setProgress(100, 1);
      setTimeout(() => {
        setProgress(100, 0);
        setTimeout(() => {
          if (progressBar) progressBar.style.width = '0%';
        }, 200);
        contentEl.classList.remove('reconstructing');
      }, 160);

    } catch (err) {
      console.warn('Continuous transmutation fallback to standard navigation:', err);
      window.location.href = url;
    }
  }

  // Preload on mouseover
  document.addEventListener('mouseover', e => {
    const link = e.target.closest('a');
    if (!link || !link.href) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
    const targetUrl = new URL(link.href, window.location.href);
    if (targetUrl.origin === window.location.origin) {
      preloadPage(link.href);
    }
  }, { passive: true });

  // Intercept Internal Clicks
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

  // Handle Browser Back/Forward Buttons (Popstate)
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

  // Universal KaTeX Math Renderer (Supporting $$, $, \(, and \[)
  window.renderAllMath = function (target = document.body) {
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(target, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false },
            { left: '$', right: '$', display: false }
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "canvas", "svg"],
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX render issue:', e);
      }
    } else {
      // Retry if script is still downloading from CDN
      let retries = 0;
      const interval = setInterval(() => {
        retries++;
        if (typeof renderMathInElement === 'function') {
          clearInterval(interval);
          window.renderAllMath(target);
        } else if (retries > 30) {
          clearInterval(interval);
        }
      }, 80);
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      wireObservationNode();
      window.renderAllMath(document.body);
    });
  } else {
    wireObservationNode();
    window.renderAllMath(document.body);
  }
  window.addEventListener('load', () => window.renderAllMath(document.body), { once: true });
})();
