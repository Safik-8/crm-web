import axios from 'axios';

/**
 * apiClient — Central Axios-based request wrapper
 *
 * Responsibilities:
 *  - Attach credentials (withCredentials: true)
 *  - Standardise request structures (body -> data, signals)
 *  - Optionally drive the global page loader via loaderBridge (opt-in)
 *  - Handle 401 → redirect to /login?session=expired
 *  - Handle 403 → show permission denied toast
 *  - Surface parsed error objects to callers
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Interceptor to handle automatic token refresh on 401 Unauthorized errors
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check request conditions to avoid loops
    const isLoginRequest = originalRequest?.url?.includes('/auth/login');
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
    const isLoginPage = window.location.pathname === '/login';

    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      !isRefreshRequest &&
      !isLoginPage &&
      !originalRequest?._retry
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token using standard axios post
        await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // Retry the original request with the same Axios instance
        return apiInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear loader and redirect to login
        loaderBridge.forceHide?.();
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

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
 * @typedef {import('axios').AxiosRequestConfig & {
 *   showLoader?: boolean,
 *   silent?: boolean,
 *   loaderMessage?: string,
 *   body?: any,
 * }} ApiClientOptions
 */

// ─── Core client ─────────────────────────────────────────────────────────────

/**
 * Custom Axios wrapper that automatically includes credentials (cookies)
 * and keeps the exact signature for backward compatibility.
 *
 * @param {string} endpoint  - Path relative to BASE_URL (e.g. '/auth/me')
 * @param {ApiClientOptions} options
 */
export const apiClient = async (endpoint, options = {}) => {
  const {
    showLoader: shouldShowLoader = false,
    silent = false,
    loaderMessage = '',
    signal,
    body,
    ...fetchOptions
  } = options;
  const shouldUseLoader = shouldShowLoader && !silent;

  // Show loader before the request fires
  if (shouldUseLoader) {
    loaderBridge.show?.(loaderMessage);
  }

  try {
    // Map standard fetch-like options to Axios config
    const config = {
      url: endpoint,
      method: fetchOptions.method || 'GET',
      headers: fetchOptions.headers || {},
      data: body !== undefined ? body : fetchOptions.body, // support both body and data
      signal,
      ...fetchOptions,
    };

    const response = await apiInstance(config);
    return response.data;
  } catch (error) {
    // Check if request was cancelled/aborted
    if (axios.isCancel(error)) {
      return null;
    }

    const response = error.response;
    if (response) {
      const status = response.status;
      const data = response.data;

      const isLoginRequest = endpoint.includes('/auth/login');
      const isLoginPage = window.location.pathname === '/login';

      // ── Handle HTTP errors ─────────────────────────────────────────────────
      if (status === 401 && !isLoginRequest && !isLoginPage) {
        // Force-hide loader before redirecting so it doesn't persist on the
        // login page if the browser reuses the same JS context.
        loaderBridge.forceHide?.();
        window.location.href = '/login?session=expired';
      }

      if (status === 403 && !silent) {
        try {
          const { enhancedToast } = await import('../../shared/utils/toast');
          enhancedToast.permissionDenied();
        } catch (e) {
          console.error('[API] Failed to show permission denied toast:', e);
        }
      }

      // Throw response body so that the UI can catch standard error shapes
      throw data;
    }

    throw error;
  } finally {
    // Always decrement the loader counter, even on error or cancellation
    if (shouldUseLoader) {
      loaderBridge.hide?.();
    }
  }
};
