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

  // If response not ok, throw the parsed data as an error so we can catch it seamlessly
  // maintaining the backend's provided structure
  if (!response.ok) {
    throw data;
  }

  return data;
};
