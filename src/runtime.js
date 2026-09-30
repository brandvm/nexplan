/**
 * File: nexplan-main.js
 *
 * Sections:
 * 1) Console Easter Egg / Credits
 * 2) Utilities (minimal)
 * 3) Modules
 * 4) Init
 */

export function initNexplan(LenisConstructor, assetBase) {
  "use strict";

  // Prevent duplicate listeners and instances if the bundle is included twice.
  if (window.__NEXPLAN_INITIALIZED) return;
  window.__NEXPLAN_INITIALIZED = true;

  //=============================================================================
  // 1) CONSOLE EASTER EGG / CREDITS
  //-----------------------------------------------------------------------------
  window.addEventListener("load", () => {
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 0));
    idle(() => {
      try {
        const a =
          "color:#fff;background:#111;padding:4px 8px;border-radius:4px;";
        const b =
          "color:#111;background:#ff621c;padding:4px 8px;border-radius:4px;";
        const c = "color:#777;font-style:italic;";
        console.log("%cWebsite by Brand Vision Marketing", a);
        console.log("%cBuilt with vanilla JS modules", b);
        console.log("%cType aboutSite() or egg() in the console.", c);
      } catch (_) {}
    });
  });

  Object.defineProperties(window, {
    aboutSite: {
      value: () => ({
        title: document.title || "Untitled",
        url: location.href,
      }),
      writable: false,
      configurable: false,
    },
    egg: {
      value: () => "🥚 Hi! Nothing to see here… probably.",
      writable: false,
      configurable: false,
    },
  });

  //=============================================================================
  // 2) UTILITIES (minimal)
  //-----------------------------------------------------------------------------
  const onReady = (fn) => {
    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    )
      fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  };

  const qsa = (root, sel) =>
    Array.from((root || document).querySelectorAll(sel));

  const num = (v, fallback) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const clamp = (min, n, max) => Math.max(min, Math.min(max, n));

  const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Smooth scrolling migrated from the Webflow footer; settings are unchanged.
  const SmoothScroll = (() => {
    function init() {
      if (window.Webflow?.env?.("editor") || window.lenis) return;
      if (typeof LenisConstructor !== "function" || !window.gsap?.ticker ||
          typeof window.ScrollTrigger?.update !== "function") {
        console.warn("Nexplan: smooth-scroll dependencies unavailable; using native scrolling.");
        return;
      }
      const instance = new LenisConstructor({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: "vertical",
        gestureDirection: "vertical",
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });
      window.lenis = instance;
      instance.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => instance.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    }
    return Object.freeze({ init });
  })();

  //=============================================================================
  // 3) MODULES
  //=============================================================================

  //-----------------------------------------------------------------------------
  // SMART SWIPERJS SLIDER (shared with Athletic)
  //-----------------------------------------------------------------------------
  const SmartSwiper = (() => {
    const hasIO = "IntersectionObserver" in window;
    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // One sensible default + creativeEffect slider config
    const CONFIGS = [
      {
        selector: ".js-swiper .swiper",
        wrapper: ".js-swiper",
        opts: {
          slidesPerView: 2,
          spaceBetween: 20,
          loop: false,
          speed: 400,
          autoplay: false,
          watchOverflow: true,
          touchReleaseOnEdges: true,
          simulateTouch: true,
          breakpoints: {
            0: { spaceBetween: 14 },
            768: { spaceBetween: 16 },
            1024: { spaceBetween: 20 },
          },
        },
        navPrev: ".swiper-prev",
        navNext: ".swiper-next",
      },
      {
        selector: ".sw-resources-s .swiper",
        wrapper: ".sw-resources-s",
        opts: {
          slidesPerView: 2.5,
          spaceBetween: 20,
          loop: true,
          speed: 400,
          autoplay: false,
          watchOverflow: true,
          touchReleaseOnEdges: true,
          simulateTouch: true,
          breakpoints: {
            0: { spaceBetween: 14, slidesPerView: 1.25, centeredSlides: true },
            768: { spaceBetween: 16, slidesPerView: 2 },
            1024: { spaceBetween: 20, slidesPerView: 2.5 },
          },
        },
        navPrev: ".swiper-prev",
        navNext: ".swiper-next",
      },
      {
        selector: ".sw-case-studies .swiper",
        wrapper: ".sw-case-studies",
        opts: {
          slidesPerView: 2.5,
          spaceBetween: 20,
          loop: true,
          speed: 400,
          autoplay: false,
          watchOverflow: true,
          touchReleaseOnEdges: true,
          simulateTouch: true,
          breakpoints: {
            0: { spaceBetween: 14, slidesPerView: 1.25, centeredSlides: true },
            768: { spaceBetween: 16, slidesPerView: 2 },
            1024: { spaceBetween: 20, slidesPerView: 2.5 },
          },
        },
        navPrev: ".swiper-prev",
        navNext: ".swiper-next",
      },
      {
        selector: ".sw-testimonials .swiper",
        wrapper: ".sw-testimonials",
        opts: {
          slidesPerView: 1,
          spaceBetween: 0,
          loop: true,
          speed: 400,
          autoplay: false,
          watchOverflow: true,
          touchReleaseOnEdges: true,
          simulateTouch: true,
          breakpoints: {
            0: { spaceBetween: 14, slidesPerView: 1 },
            768: { spaceBetween: 16, slidesPerView: 1 },
            1024: { spaceBetween: 20, slidesPerView: 1 },
          },
        },
        navPrev: ".swiper-prev",
        navNext: ".swiper-next",
      },
    ];

    const idle = (fn) =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(fn)
        : setTimeout(fn, 0);

    function ensureCSS() {
      if (document.querySelector('link[data-nexplan-swiper-css], link[href*="swiper-bundle.min.css"]')) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.dataset.nexplanSwiperCss = "";
      link.href = new URL("swiper.min.css", assetBase).href;
      document.head.appendChild(link);
    }

    let swiperReady;
    function ensureJS(cb) {
      if (window.Swiper) return cb();
      if (!swiperReady) {
        swiperReady = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = new URL("swiper.min.js", assetBase).href;
          script.dataset.nexplanSwiperJs = "";
          script.defer = true;
          script.onload = () => window.Swiper
            ? resolve()
            : reject(new Error("Swiper did not initialize"));
          script.onerror = () => reject(new Error("Swiper could not load"));
          document.body.appendChild(script);
        });
      }
      swiperReady.then(cb).catch((error) => {
        console.warn("Nexplan: slider initialization unavailable.", error);
      });
    }

    function normalizeOpts(base) {
      const o = Object.assign(
        {
          touchReleaseOnEdges: true,
          simulateTouch: true,
        },
        base || {}
      );

      if (reduceMotion) {
        if (o.autoplay) o.autoplay = false;
        o.speed = Math.min(o.speed || 400, 300);
      }
      return o;
    }

    function withNav(el, cfg, opts) {
      const root = el.closest(cfg.wrapper || ":root") || document;
      const prev = cfg.navPrev
        ? root.querySelector(cfg.navPrev)
        : root.querySelector(".swiper-prev");
      const next = cfg.navNext
        ? root.querySelector(cfg.navNext)
        : root.querySelector(".swiper-next");
      if (prev || next)
        opts.navigation = { prevEl: prev || null, nextEl: next || null };
      return opts;
    }

    function readDataOverrides(el, opts) {
      const over = Object.assign({}, opts);
      const { dataset } = el;

      if ("swiperLoop" in dataset) over.loop = dataset.swiperLoop === "true";
      if ("swiperSpeed" in dataset)
        over.speed = Math.max(
          0,
          parseInt(dataset.swiperSpeed, 10) || over.speed || 400
        );
      if ("swiperAutoplay" in dataset) {
        if (dataset.swiperAutoplay === "false") over.autoplay = false;
        else {
          const delay = Math.max(0, parseInt(dataset.swiperAutoplay, 10) || 0);
          over.autoplay = delay ? { delay, disableOnInteraction: true } : false;
        }
      }

      return over;
    }

    function initOne(el) {
      if (!el || el.dataset.swiperInited) return;

      const cfg = CONFIGS.find((c) => el.matches(c.selector));
      if (!cfg) return;

      const opts = withNav(
        el,
        cfg,
        normalizeOpts(readDataOverrides(el, cfg.opts))
      );

      el.dataset.swiperInited = "1";
      try {
        // eslint-disable-next-line no-undef
        new Swiper(el, opts);
      } catch (err) {
        delete el.dataset.swiperInited;
        throw err;
      }
    }

    function scan() {
      const sels = CONFIGS.map((c) => c.selector).join(", ");
      if (!sels) return [];
      return Array.from(document.querySelectorAll(sels)).filter(
        (el) => !el.dataset.swiperInited
      );
    }

    function observeAndInit(els) {
      if (!els.length) return;
      if (!hasIO) return idle(() => els.forEach(initOne));

      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              initOne(e.target);
              obs.unobserve(e.target);
            }
          });
        },
        { rootMargin: "200px 0px" }
      );

      els.forEach((el) => io.observe(el));
    }

    function boot() {
      const candidates = scan();
      if (!candidates.length) return;
      ensureCSS();
      ensureJS(() => observeAndInit(candidates));
    }

    let debounceT;
    function recheckSoon() {
      clearTimeout(debounceT);
      debounceT = setTimeout(boot, 140);
    }

    function add(newCfg) {
      if (!newCfg || !newCfg.selector) return;
      CONFIGS.push({
        selector: newCfg.selector,
        wrapper: newCfg.wrapper || null,
        opts: newCfg.opts || {},
        navPrev: newCfg.navPrev || null,
        navNext: newCfg.navNext || null,
      });
      recheckSoon();
    }

    function refresh() {
      recheckSoon();
    }

    function init() {
      const start = () => {
        boot();

        const mo = new MutationObserver(recheckSoon);
        mo.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });

        window.addEventListener("resize", recheckSoon, { passive: true });

        Object.defineProperty(window, "athleticSlider", {
          value: Object.freeze({ add, refresh }),
          writable: false,
          configurable: false,
        });
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    }

    return { init, add, refresh };
  })();

  //-----------------------------------------------------------------------------
  // NAV SHRINK (adds .is_shrunk on scroll)
  //-----------------------------------------------------------------------------
  const NavShrink = (() => {
    const SELECTORS = [".g-navigation-w", ".s-g-navigation", ".sw-g-nav"];

    // px scrolled before shrinking
    const THRESHOLD = 12;

    let lastShrunk = null;
    let rafId = 0;

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getTargets = () => {
      const out = [];
      SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => out.push(el));
      });
      return out;
    };

    const apply = (shrunk) => {
      // only touch DOM when state changes
      if (lastShrunk === shrunk) return;
      lastShrunk = shrunk;

      const targets = getTargets();
      if (!targets.length) return;

      targets.forEach((el) => el.classList.toggle("is_shrunk", shrunk));
    };

    const readScrollState = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      return y > THRESHOLD;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        apply(readScrollState());
      });
    };

    const init = () => {
      // initial state
      apply(readScrollState());

      // update on scroll
      window.addEventListener("scroll", onScroll, { passive: true });

      // update on resize (layout shifts can affect scroll positions)
      window.addEventListener("resize", onScroll, { passive: true });

      // if Webflow swaps DOM nodes / variants, re-apply current state
      const mo = new MutationObserver(() => apply(readScrollState()));
      mo.observe(document.documentElement, { childList: true, subtree: true });

      // If user toggles reduced motion, no animations are forced here,
      // but we still keep the class behavior identical.
      if (reduceMotion) {
        // no-op (kept for clarity)
      }
    };

    return { init };
  })();

  //=============================================================================
  // 4) INIT
  //-----------------------------------------------------------------------------
  onReady(() => {
    const modules = [SmoothScroll, SmartSwiper, NavShrink];

    modules.forEach((m) => {
      try {
        if (m && typeof m.init === "function") m.init();
      } catch (e) {
        console.error(`[${(m && m.name) || "Module"}]`, e);
      }
    });
  });
}
