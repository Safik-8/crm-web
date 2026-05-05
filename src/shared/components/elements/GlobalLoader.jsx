/**
 * GlobalLoader
 *
 * Full-screen overlay that renders the Lottie animation while the app is
 * loading data or transitioning between routes.
 *
 * Design decisions:
 *  - z-index 9998 keeps it below Sonner toasts (9999) so notifications
 *    remain visible even while the loader is active.
 *  - CSS-driven fade-in / fade-out via the `.loader-overlay` classes
 *    defined in index.css — no JS animation library needed.
 *  - The Lottie JSON is imported directly (Vite handles JSON imports natively)
 *    and serialized into a data URI so no public-folder copy is needed.
 *  - An orange radial glow behind the animation ties the loader into the
 *    brand palette without modifying the animation JSON itself.
 *  - The @dotlottie/player CDN script is injected once into <head> on first
 *    render, keeping the npm bundle lean.
 */

import { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '../../context/LoaderContext';
import loaderAnimationData from '../../loader/loader.json';

// ─── Lottie CDN bootstrap ────────────────────────────────────────────────────
// Inject the @dotlottie/player script once when this module is first imported.
const LOTTIE_CDN =
  'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs';

let lottieScriptInjected = false;

function ensureLottieScript() {
  if (lottieScriptInjected) return;
  if (document.querySelector(`script[src="${LOTTIE_CDN}"]`)) {
    lottieScriptInjected = true;
    return;
  }
  const script = document.createElement('script');
  script.type = 'module';
  script.src = LOTTIE_CDN;
  document.head.appendChild(script);
  lottieScriptInjected = true;
}

// ─── Component ───────────────────────────────────────────────────────────────

const GlobalLoader = () => {
  const { isLoading, message } = useLoader();
  const overlayRef = useRef(null);

  // Inject Lottie CDN script on first render
  useEffect(() => {
    ensureLottieScript();
  }, []);

  // Serialize the imported JSON into a data URI once (stable reference)
  const animationSrc = useMemo(
    () =>
      `data:application/json;base64,${btoa(
        unescape(encodeURIComponent(JSON.stringify(loaderAnimationData)))
      )}`,
    []
  );

  // Manage visibility class for CSS fade transition.
  // We keep the element in the DOM (pointer-events:none when hidden) so the
  // fade-out animation can complete before the element disappears.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    if (isLoading) {
      el.classList.remove('loader-overlay--hidden');
      el.classList.add('loader-overlay--visible');
    } else {
      el.classList.remove('loader-overlay--visible');
      el.classList.add('loader-overlay--hidden');
    }
  }, [isLoading]);

  return (
    <div
      ref={overlayRef}
      className="loader-overlay loader-overlay--hidden"
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading, please wait…'}
      aria-busy={isLoading}
    >
      {/* Orange radial glow — brand accent behind the animation */}
      <div className="loader-glow" aria-hidden="true" />

      {/* Lottie animation via dotlottie-player custom element */}
      <div className="loader-animation-wrapper">
        {/* eslint-disable-next-line react/no-unknown-property */}
        <dotlottie-player
          src={animationSrc}
          autoplay
          loop
          style={{ width: '160px', height: '160px' }}
        />
      </div>

      {/* Optional contextual message */}
      {message && (
        <p className="loader-message" aria-hidden="true">
          {message}
        </p>
      )}
    </div>
  );
};

export default GlobalLoader;
