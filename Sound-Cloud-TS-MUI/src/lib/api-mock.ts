// Types for API mocking
import * as url from "node:url";

interface MockApiResponse {
  data: {
    result: never[];
    meta: {
      total: number;
      page: number;
      size: number;
      pages: number;
    };
  };
}

// Mock API responses for build time to prevent network calls
export const mockApiResponse: MockApiResponse = {
  data: {
    result: [],
    meta: {
      total: 0,
      page: 1,
      size: 5,
      pages: 1
    }
  }
};

// Mock sendRequest function for build time
export const mockSendRequest = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = input instanceof Request ? input.url : input.toString();
  // console.log(`[BUILD MOCK] API call to ${url} skipped during build time`);
  const createMockResponse = (data: any) => {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  // Return mock response for common API endpoints
  if (url.includes('/tracks')) {
    return createMockResponse(mockApiResponse);
  }
  if (url.includes('/tracks/likes')) {
    return createMockResponse(mockApiResponse);
  }

  if (url.includes('/tracks/users/')) {
    return createMockResponse(mockApiResponse);
  }
    return createMockResponse(mockApiResponse);
  // Default empty response
  // return new Response(JSON.stringify(mockApiResponse), {
  //   status: 200,
  //   headers: { 'Content-Type': 'application/json' }
  // });
};
