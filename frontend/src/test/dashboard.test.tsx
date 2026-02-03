import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/dashboard/page';
import { useAuth } from '@/contexts/AuthContext';

// Mock useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockPush = jest.fn();

// Override the default mock for useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('DashboardPage', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    full_name: 'Test User',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authenticated user', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });
    });

    it('should render dashboard with user information', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('heading', { name: '대시보드' })).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('활성')).toBeInTheDocument();
    });

    it('should display user email correctly', () => {
      render(<DashboardPage />);

      expect(screen.getByText('이메일')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should display user full name', () => {
      render(<DashboardPage />);

      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should display "미설정" when full_name is null', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, full_name: null },
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      expect(screen.getByText('미설정')).toBeInTheDocument();
    });

    it('should display formatted creation date', () => {
      render(<DashboardPage />);

      expect(screen.getByText('가입일')).toBeInTheDocument();
      // Korean locale date format: "2024년 1월 15일"
      expect(screen.getByText(/2024년/)).toBeInTheDocument();
    });

    it('should display active status for active user', () => {
      render(<DashboardPage />);

      expect(screen.getByText('상태')).toBeInTheDocument();
      const statusElement = screen.getByText('활성');
      expect(statusElement).toHaveClass('text-green-600');
    });

    it('should display inactive status for inactive user', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, is_active: false },
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      const statusElement = screen.getByText('비활성');
      expect(statusElement).toHaveClass('text-red-600');
    });

    it('should render logout button', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    });

    it('should call logout and redirect when logout button is clicked', async () => {
      const user = userEvent.setup();
      mockLogout.mockResolvedValueOnce(undefined);

      render(<DashboardPage />);

      await user.click(screen.getByRole('button', { name: '로그아웃' }));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading spinner when isLoading is true', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      // Check for the loading spinner (animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show dashboard content while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      expect(screen.queryByRole('heading', { name: '대시보드' })).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated user redirect', () => {
    it('should redirect to login when user is not authenticated and not loading', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should not redirect while loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      render(<DashboardPage />);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should return null when user is null and not loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        login: jest.fn(),
        register: jest.fn(),
        logout: mockLogout,
      });

      const { container } = render(<DashboardPage />);

      // The component should render nothing (null) when no user
      expect(container.querySelector('.bg-white')).not.toBeInTheDocument();
    });
  });
});
