import {API_BASE_URL, API_BASE_URLS} from './config';

export type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

export type AuthPayload = {
  token: string;
  user: User;
};

export type RoleKey = 'admin' | 'user';

export type MenuItem = {
  id: string;
  label: string;
  type: 'screen' | 'remote';
  screen?: string;
  remote?: string;
  module?: string;
  permission: string;
};

export type AccessPayload = {
  roles: string[];
  permissions: string[];
  menu: MenuItem[];
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let lastError: Error | null = null;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });

      const body = (await response.json()) as ApiResponse<T> & {error?: string};

      if (!response.ok) {
        throw new Error(body.message ?? body.error ?? 'Error de API');
      }

      return body;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error('Error de red desconocido');
    }
  }

  throw (
    lastError ??
    new Error(`No fue posible conectar con BK-API desde ${API_BASE_URL}`)
  );
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const result = await request<AuthPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return result.data;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const result = await request<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return result.data;
}

export async function getMyAccess(token: string): Promise<AccessPayload> {
  const result = await request<AccessPayload>('/access/me', {method: 'GET'}, token);
  return result.data;
}

export async function switchMyRole(
  token: string,
  roleKey: RoleKey,
): Promise<AccessPayload> {
  const result = await request<AccessPayload>(
    '/access/me/role',
    {
      method: 'POST',
      body: JSON.stringify({roleKey}),
    },
    token,
  );
  return result.data;
}

export async function listUsers(token: string): Promise<User[]> {
  const result = await request<User[]>('/users', {method: 'GET'}, token);
  return result.data;
}
