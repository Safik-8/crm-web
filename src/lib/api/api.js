const BASE_URL = '/api';

/**
 * Custom fetch wrapper that automatically includes credentials (cookies)
 * and properly sets Content-Type for JSON payloads.
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Extremely important for receiving/sending httpOnly tokens
  };

  if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  const response = await fetch(url, fetchOptions);
  
  // Try to parse JSON, if it fails, throw a standard error
  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return null;
  }

  // If response not ok, handle errors
  if (!response.ok) {
    // Option B: Automatically navigate to login on authentication failure (401)
    const isLoginRequest = endpoint.includes('/auth/login');
    const isLoginPage = window.location.pathname === '/login';

    if (response.status === 401 && !isLoginRequest && !isLoginPage) {
      // Option B: Redirect to login with a flag to show a toast message
      window.location.href = '/login?session=expired';
    }

    throw data;
  }

  return data;
};
