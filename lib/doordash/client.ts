/**
 * DoorDash Drive API Client
 * 
 * Provides helper functions for making authenticated requests to DoorDash Drive API
 */

import { getDoorDashAuthToken } from './jwt';

const DOORDASH_API_BASE_URL = process.env.DOORDASH_SANDBOX === 'true'
  ? 'https://openapi.doordash.com/drive/v2'
  : 'https://openapi.doordash.com/drive/v2';

interface DoorDashAPIResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an authenticated request to DoorDash Drive API
 */
export async function doordashAPIRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<DoorDashAPIResponse<T>> {
  const authToken = getDoorDashAuthToken();

  if (!authToken) {
    return {
      error: 'DoorDash credentials not configured. Please set DOORDASH_DEVELOPER_ID, DOORDASH_KEY_ID, and DOORDASH_SIGNING_SECRET',
      status: 500,
    };
  }

  const url = `${DOORDASH_API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();
    let data: T | undefined;
    let error: string | undefined;

    if (responseText) {
      try {
        data = JSON.parse(responseText) as T;
      } catch {
        error = responseText;
      }
    }

    if (!response.ok) {
      error = error || `HTTP ${response.status}: ${response.statusText}`;
    }

    return {
      data,
      error,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
    };
  }
}

/**
 * Check if DoorDash API is configured
 */
export function isDoorDashConfigured(): boolean {
  return getDoorDashAuthToken() !== null;
}

