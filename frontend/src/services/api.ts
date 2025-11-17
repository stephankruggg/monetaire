const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiError {
  error: string;
  details?: string;
}

export class ApiException extends Error {
  constructor(
    public status: number,
    public body: ApiError | string,
    message?: string
  ) {
    super(message || (typeof body === 'string' ? body : body.error));
    this.name = 'ApiException';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle non-JSON responses (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiException(response.status, data, data.error);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    // Network error or JSON parse error
    throw new ApiException(
      0,
      'Network error. Please check your connection.',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

export async function apiClientFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData - browser sets it with boundary
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiException(response.status, data, data.error);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }

    throw new ApiException(
      0,
      'Network error. Please check your connection.',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}
