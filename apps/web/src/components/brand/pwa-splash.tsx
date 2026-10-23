'use client';

import { useEffect, useState } from 'react';

const SEEN_KEY = 'hopenest-pwa-splash';
const ASSETS = ['green', 'blue', 'people', 'wordmark'];

/**
 * Runs inline in <head>, before first paint. It turns the splash on only when HopeNest
 * was launched as an installed app (once per launch), so the website keeps its normal
 * page loader and the app never flashes its content before the splash. `?splash=1`
 * forces it on in a normal browser tab, for previewing.
 */
export const PWA_SPLASH_SCRIPT = `try{var d=document.documentElement,s=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,p=/[?&]splash=1(&|$)/.test(location.search);if(p||(s&&!sessionStorage.getItem('${SEEN_KEY}'))){d.setAttribute('data-pwa-splash','');sessionStorage.setItem('${SEEN_KEY}','1');${JSON.stringify(ASSETS)}.forEach(function(n){var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/brand/splash/'+n+'.webp';document.head.appendChild(l)})}}catch(e){}`;

/** The CSS timeline ends at about 3.1s; hold the finished logo briefly, then fade out. */
const HOLD_MS = 3500;
const REDUCED_MOTION_HOLD_MS = 1400;
const EXIT_MS = 600;

/**
 * Launch screen of the installed app: the blue hand sweeps in from the west, the green
 * leaf from the east, and the three people drop in from the north to complete the
 * HopeNest mark, followed by the wordmark and tagline. The motion lives in globals.css
 * (`.pwa-splash*`). The artwork is set as CSS backgrounds, so browsers skip downloading
 * it while the splash stays hidden on the website.
 */
export function PwaSplash() {
  const [phase, setPhase] = useState<'show' | 'exit' | 'done'>('show');

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute('data-pwa-splash')) {
      setPhase('done');
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hold = reduced ? REDUCED_MOTION_HOLD_MS : HOLD_MS;
    const exitTimer = window.setTimeout(() => setPhase('exit'), hold);
    const doneTimer = window.setTimeout(() => {
      root.removeAttribute('data-pwa-splash');
      setPhase('done');
    }, hold + EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className="pwa-splash" data-phase={phase} role="status" aria-label="Opening HopeNest">
      <span aria-hidden className="pwa-splash-glow pwa-splash-glow--blue" />
      <span aria-hidden className="pwa-splash-glow pwa-splash-glow--green" />

      <div aria-hidden className="pwa-splash-stage">
        <span className="pwa-splash-ring" />
        <div className="pwa-splash-mark">
          {/* Cut from hopenest-mark.png: together they are the official mark, pixel for pixel. */}
          <span className="pwa-splash-piece pwa-splash-piece--green" />
          <span className="pwa-splash-piece pwa-splash-piece--blue" />
          <span className="pwa-splash-piece pwa-splash-piece--people" />
        </div>
      </div>

      <div aria-hidden className="pwa-splash-wordmark" />

      <p className="pwa-splash-tagline">
        <span className="pwa-splash-phrase" style={{ animationDelay: '2.3s' }}>
          Real People<span className="text-[#0066ff]">.</span>
        </span>{' '}
        <span className="pwa-splash-phrase" style={{ animationDelay: '2.45s' }}>
          Real Causes<span className="text-[#00a86b]">.</span>
        </span>{' '}
        <span className="pwa-splash-phrase" style={{ animationDelay: '2.6s' }}>
          Greater Impact<span className="text-[#f59e0b]">.</span>
        </span>
      </p>
      <span aria-hidden className="pwa-splash-rule" />

      <span aria-hidden className="pwa-splash-progress">
        <span />
      </span>
    </div>
  );
}
