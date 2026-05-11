import { mockSendRequest } from './api-mock';

// Check if we're in build time
export const isBuildTime = process.env.NODE_ENV === 'production' && process.env.SKIP_API_CALLS === 'true';

// Mock the global fetch during build time
const originalFetch = global.fetch;

if (isBuildTime) {
  global.fetch = mockSendRequest;
  console.log('[BUILD UTILS] API calls mocked during build time');
} else {
  global.fetch = originalFetch;
  console.log('[BUILD UTILS] API calls enabled during runtime');
}

export const restoreFetch = () => {
  global.fetch = originalFetch;
};
