const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/runtime.js'), 'utf8')
  .replace('export function initNexplan', 'function initNexplan') +
  '\ninitNexplan(window.Lenis, "https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/");';
function boot({ editor = false, dependencies = true, slider = false, swiper = false, dataset = {} } = {}) {
  const calls = { instances: [], ticks: [], assets: [], warnings: [], errors: [], sliders: [], timers: [], shrunk: null, listeners: {} };
  const nav = { classList: { toggle(name, value) { calls.shrunk = { name, value }; } } };
  const prev = {}, next = {};
  const root = { querySelector(selector) { return selector === '.swiper-prev' ? prev : next; } };
  const element = { dataset, closest() { return root; }, matches(selector) { return selector === '.sw-case-studies .swiper'; } };
  const document = {
    readyState: 'complete', documentElement: { scrollTop: 0 },
    querySelectorAll(selector) {
      if (selector === '.g-navigation-w') return [nav];
      if (slider && selector.includes('.js-swiper .swiper')) return [element];
      return [];
    },
    querySelector(selector) {
      if (selector.includes('nexplan-swiper-css')) return calls.assets.find(a => a.tag === 'link');
      return null;
    },
    createElement(tag) { return { tag, dataset: {} }; },
    head: { appendChild(el) { calls.assets.push(el); } },
    body: { appendChild(el) { calls.assets.push(el); } },
    addEventListener() {},
  };
  const context = {
    document, URL,
    console: { log() {}, warn(...args) { calls.warnings.push(args); }, error(...args) { calls.errors.push(args); } },
    setTimeout(fn) { calls.timers.push(fn); return calls.timers.length; }, clearTimeout() {},
    addEventListener(event, fn) { (calls.listeners[event] ||= []).push(fn); },
    requestAnimationFrame(fn) { calls.frame = fn; return 1; },
    matchMedia() { return { matches: false }; },
    MutationObserver: class { observe() {} },
    Webflow: { env() { return editor; } },
  };
  if (dependencies) {
    context.Lenis = class {
      constructor(options) { this.options = options; calls.instances.push(this); }
      on(event, fn) { this.scrollHandler = fn; }
      raf(ms) { this.rafTime = ms; }
    };
    context.ScrollTrigger = { update() {} };
    context.gsap = { ticker: { add(fn) { calls.ticks.push(fn); }, lagSmoothing() {} } };
  }
  if (swiper) context.Swiper = class { constructor(el, options) { calls.sliders.push({ el, options }); } };
  context.window = context; vm.createContext(context); vm.runInContext(source, context);
  return { context, calls, element, prev, next };
}
test('Lenis retains scrolling settings and connects to the GSAP ticker', () => {
  const { context, calls } = boot();
  assert.equal(context.lenis, calls.instances[0]);
  assert.equal(context.lenis.options.duration, 1.2);
  assert.equal(context.lenis.options.smoothTouch, false);
  assert.equal(context.lenis.scrollHandler, context.ScrollTrigger.update);
  calls.ticks[0](2); assert.equal(context.lenis.rafTime, 2000);
  assert.deepEqual(calls.errors, []);
});
test('duplicate script inclusion creates no duplicate listeners or instances', () => {
  const { context, calls } = boot(); vm.runInContext(source, context);
  assert.equal(calls.instances.length, 1); assert.equal(calls.ticks.length, 1);
  assert.equal(calls.listeners.scroll.length, 1);
});
test('Webflow editor skips smooth scrolling', () => {
  const { calls } = boot({ editor: true });
  assert.equal(calls.instances.length, 0); assert.equal(calls.ticks.length, 0);
});
test('missing GSAP preserves native scrolling and navigation behavior', () => {
  const { calls } = boot({ dependencies: false });
  assert.equal(calls.instances.length, 0);
  assert.deepEqual(calls.shrunk, { name: 'is_shrunk', value: false });
  assert.equal(calls.errors.length, 0);
});
test('pages without sliders make no Swiper asset requests', () => {
  assert.equal(boot().calls.assets.length, 0);
});
test('slider dependencies use the same versioned release as the main bundle', () => {
  const { calls } = boot({ slider: true });
  assert.equal(calls.assets.find(a => a.tag === 'link').href, 'https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/swiper.min.css');
  assert.equal(calls.assets.find(a => a.tag === 'script').src, 'https://cdn.jsdelivr.net/gh/brandvm/nexplan@v1.0.0/dist/swiper.min.js');
});
test('failed Swiper load is caught while smooth scrolling and navigation remain active', async () => {
  const { context, calls } = boot({ slider: true });
  calls.assets.find(a => a.tag === 'script').onerror();
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(context.lenis); assert.equal(calls.listeners.scroll.length, 1);
  assert.match(calls.warnings[0][0], /slider initialization unavailable/);
  assert.equal(calls.errors.length, 0);
});
test('case-study slider preserves breakpoints, scoped navigation and data overrides', () => {
  const { calls, prev, next } = boot({ slider: true, swiper: true, dataset: { swiperLoop: 'false', swiperSpeed: '650' } });
  calls.timers.shift()();
  const { options } = calls.sliders[0];
  assert.equal(options.loop, false); assert.equal(options.speed, 650);
  assert.equal(options.breakpoints[0].slidesPerView, 1.25);
  assert.equal(options.breakpoints[1024].slidesPerView, 2.5);
  assert.equal(options.navigation.prevEl, prev); assert.equal(options.navigation.nextEl, next);
});
test('navigation shrinks only after the original 12px threshold', () => {
  const { context, calls } = boot();
  context.pageYOffset = 12; calls.listeners.scroll[0](); calls.frame();
  assert.equal(calls.shrunk.value, false);
  context.pageYOffset = 13; calls.listeners.scroll[0](); calls.frame();
  assert.deepEqual(calls.shrunk, { name: 'is_shrunk', value: true });
});
