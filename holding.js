'use strict';

(() => {
  const screen = document.querySelector('.holding');
  const scene = screen.querySelector('.scene');
  const follow = screen.querySelector('.nat-follow');
  const status = screen.querySelector('.thought-text');
  const control = screen.querySelector('.motion-control');
  const label = screen.querySelector('.motion-label');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // A single 9.6s timeline. Transforms/opacity keep every element in place.
  const duration = 9600;
  const beats = [
    { at: 0, phase: 'calm' },
    { at: 700, phase: 'analysis', text: 'Analyzing market…' },
    { at: 1850, phase: 'analysis', text: 'Checking fundamentals…' },
    { at: 3000, phase: 'analysis', text: 'Reading the whitepaper…' },
    { at: 4150, phase: 'analysis', text: 'Considering risk…' },
    { at: 5300, phase: 'tempted' },
    { at: 6250, phase: 'press' },
    { at: 6480, phase: 'glitch' },
    { at: 6760, phase: 'resolve' },
    { at: 7700, phase: 'calm' }
  ];
  let timer;
  let startedAt = 0;
  let elapsed = 0;
  let userPaused = false;
  let running = false;

  function resetPointer() {
    follow.style.removeProperty('--follow-x');
    follow.style.removeProperty('--follow-y');
    follow.style.removeProperty('--follow-r');
  }

  function tick() {
    const position = (performance.now() - startedAt) % duration;
    let index = beats.length - 1;
    while (beats[index].at > position) index--;
    const beat = beats[index];
    if (beat.text) status.textContent = beat.text;
    screen.dataset.phase = beat.phase;
    const next = beats[index + 1]?.at ?? duration;
    timer = window.setTimeout(tick, Math.max(1, next - position));
  }

  function syncMotion() {
    const shouldRun = !reducedMotion.matches && !userPaused && !document.hidden;
    control.hidden = reducedMotion.matches;
    control.setAttribute('aria-pressed', String(userPaused));
    control.setAttribute('aria-label', userPaused ? 'Play animation' : 'Pause animation');
    label.textContent = userPaused ? 'Play' : 'Pause';
    if (running && !shouldRun) {
      elapsed = (performance.now() - startedAt) % duration;
      clearTimeout(timer);
      running = false;
    }
    screen.classList.toggle('is-static', !shouldRun);
    if (!shouldRun) {
      screen.dataset.phase = 'calm';
      resetPointer();
      if (reducedMotion.matches || userPaused) elapsed = 0;
    } else if (!running) {
      startedAt = performance.now() - elapsed;
      running = true;
      tick();
    }
  }

  control.addEventListener('click', () => {
    userPaused = !userPaused;
    syncMotion();
  });
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', resetPointer);
  document.addEventListener('visibilitychange', syncMotion);

  // Flat, unmodified illustration: a small tilt preserves the original face.
  // No frame loop or touch listeners; the CSS transition smooths pointer input.
  screen.addEventListener('pointermove', event => {
    if (!running || !finePointer.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left - rect.width / 2) / rect.width));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top - rect.height / 2) / rect.height));
    follow.style.setProperty('--follow-x', `${x * 2}px`);
    follow.style.setProperty('--follow-y', `${y}px`);
    follow.style.setProperty('--follow-r', `${x * .45}deg`);
  }, { passive: true });
  screen.addEventListener('pointerleave', resetPointer);
  syncMotion();
})();
