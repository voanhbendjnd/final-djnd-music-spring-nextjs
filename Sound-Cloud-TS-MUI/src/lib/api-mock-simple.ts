// Simple mock API responses for build time
export const mockSendRequest = async (input: any) => {
  const url = typeof input === 'string' ? input : input.url || '';
  console.log(`[BUILD MOCK] API call to ${url} skipped during build time`);
  
  // Return mock response that matches expected structure
  return Promise.resolve({
    data: {
      result: [],
      meta: {
        total: 0,
        page: 1,
        size: 5,
        pages: 1
      }
    },
    error: null
  });
};
