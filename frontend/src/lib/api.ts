export async function apiRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: 'include', // Cookie 자동 전송
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function uploadFile<T = unknown>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    method: 'POST',
    credentials: 'include', // Cookie 자동 전송
    // Content-Type 헤더 없이 (브라우저가 자동으로 multipart/form-data 설정)
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }

  return response.json();
}
