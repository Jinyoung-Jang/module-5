import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

// Mock the api module
jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

// Test component to access useAuth hook
function TestConsumer() {
  const { user, isLoading, login, register, logout } = useAuth();
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => register('test@example.com', 'password', 'Test User')}>Register</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

// Test component that uses useAuth outside of provider
function TestWithoutProvider() {
  try {
    useAuth();
    return <div>No error</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('AuthProvider', () => {
  beforeEach(() => {
    mockApiRequest.mockClear();
  });

  it('should render children correctly', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <div data-testid="child">Child Content</div>
      </AuthProvider>
    );

    expect(screen.getByTestId('child')).toHaveTextContent('Child Content');
  });

  it('should check auth on mount and set user if authenticated', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    };
    mockApiRequest.mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Wait for auth check to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
  });

  it('should set user to null if auth check fails', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Not authenticated'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });
});

describe('useAuth hook', () => {
  beforeEach(() => {
    mockApiRequest.mockClear();
  });

  it('should throw error when used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<TestWithoutProvider />);

    expect(screen.getByTestId('error')).toHaveTextContent(
      'useAuth must be used within AuthProvider'
    );

    consoleSpy.mockRestore();
  });

  it('should provide login function that calls API and refreshes user', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    // First call: initial auth check (fail)
    // Second call: login
    // Third call: checkAuth after login (success)
    mockApiRequest
      .mockRejectedValueOnce(new Error('Not authenticated'))
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });
  });

  it('should provide register function that calls API', async () => {
    const user = userEvent.setup();
    mockApiRequest
      .mockRejectedValueOnce(new Error('Not authenticated'))
      .mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });

    await user.click(screen.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          full_name: 'Test User',
        }),
      });
    });
  });

  it('should provide logout function that calls API and clears user', async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      full_name: 'Test User',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockApiRequest
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(undefined);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(mockApiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
    });
  });
});
