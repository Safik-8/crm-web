/**
 * apiClient — Central fetch wrapper
 *
 * Responsibilities:
 *  - Attach credentials (httpOnly cookie auth)
 *  - Serialize JSON bodies
 *  - Optionally drive the global page loader via loaderBridge (opt-in)
 *  - Handle 401 → redirect to /login?session=expired
 *  - Surface parsed error objects to callers
 *
 * Loader integration uses a lightweight "bridge" pattern:
 * The React context cannot be imported directly into a plain JS module, so
 * we expose a `registerLoaderBridge` function that AuthProvider (or App) calls
 * once on mount to wire up showLoader / hideLoader callbacks.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// ─── Loader bridge ────────────────────────────────────────────────────────────
// Populated at runtime by `registerLoaderBridge` called from LoaderProvider.

const loaderBridge = {
  show: /** @type {((msg?: string) => void) | null} */ (null),
  hide: /** @type {(() => void) | null} */ (null),
  forceHide: /** @type {(() => void) | null} */ (null),
};

/**
 * Wire up the global loader to the API client.
 * Optional: call this from the component tree only if any request opts in
 * with `showLoader: true`.
 *
 * @param {{ show: (msg?: string) => void, hide: () => void, forceHide: () => void }} bridge
 */
export const registerLoaderBridge = (bridge) => {
  loaderBridge.show = bridge.show;
  loaderBridge.hide = bridge.hide;
  loaderBridge.forceHide = bridge.forceHide;
};

// ─── Request options ──────────────────────────────────────────────────────────

/**
 * @typedef {RequestInit & {
 *   showLoader?: boolean,
 *   silent?: boolean,
 *   loaderMessage?: string,
 *   signal?: AbortSignal,
 * }} ApiClientOptions
 */

// ─── Core client ─────────────────────────────────────────────────────────────

/**
 * Custom fetch wrapper that automatically includes credentials (cookies)
 * and properly sets Content-Type for JSON payloads.
 *
 * @param {string} endpoint  - Path relative to BASE_URL (e.g. '/auth/me')
 * @param {ApiClientOptions} options
 */
export const apiClient = async (endpoint, options = {}) => {
  const {
    // API calls are silent by default; global loader is route-driven.
    showLoader: shouldShowLoader = false,
    silent = false,
    loaderMessage = '',
    signal,
    ...fetchOptions
  } = options;
  const shouldUseLoader = shouldShowLoader && !silent;

  const url = `${BASE_URL}${endpoint}`;

  const isFormData = fetchOptions.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers || {}),
  };

  const config = {
    ...fetchOptions,
    headers,
    credentials: /** @type {RequestCredentials} */ ('include'),
    ...(signal ? { signal } : {}),
  };

  if (config.body && typeof config.body !== 'string' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }


  // Show loader before the request fires
  if (shouldUseLoader) {
    loaderBridge.show?.(loaderMessage);
  }

  try {
    const response = await fetch(url, config);

    // ── Parse response body ──────────────────────────────────────────────────
    let data;
    try {
      data = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return null;
    }

    // ── Handle HTTP errors ───────────────────────────────────────────────────
    if (!response.ok) {
      const isLoginRequest = endpoint.includes('/auth/login');
      const isLoginPage = window.location.pathname === '/login';

      if (response.status === 401 && !isLoginRequest && !isLoginPage) {
        // Force-hide loader before redirecting so it doesn't persist on the
        // login page if the browser reuses the same JS context.
        loaderBridge.forceHide?.();
        window.location.href = '/login?session=expired';
      }

      throw data;
    }

    return data;
  } catch (error) {
    // ── Swallow AbortError silently (request cancellation) ───────────────────
    if (error?.name === 'AbortError') {
      // Do not re-throw; callers can check their own abort signal if needed.
      return null;
    }
    throw error;
  } finally {
    // Always decrement the loader counter, even on error or cancellation
    if (shouldUseLoader) {
      loaderBridge.hide?.();
    }
  }
};
