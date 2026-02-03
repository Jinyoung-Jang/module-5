import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
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

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: mockLogin,
      register: jest.fn(),
      logout: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the login form with all fields', () => {
      render(<LoginPage />);

      expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    });

    it('should render register link', () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole('link', { name: '회원가입' });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should render email input with correct placeholder', () => {
      render(<LoginPage />);

      const emailInput = screen.getByPlaceholderText('example@email.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input with correct type', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should display "계정이 없으신가요?" text', () => {
      render(<LoginPage />);

      expect(screen.getByText(/계정이 없으신가요\?/)).toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('should call login function with form data on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');

      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should redirect to dashboard after successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: void) => void;
      mockLogin.mockImplementationOnce(
        () => new Promise((resolve) => { resolveLogin = resolve; })
      );

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      expect(screen.getByText('처리중...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolve the promise to complete the test
      resolveLogin!();
      await waitFor(() => {
        expect(screen.queryByText('처리중...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(screen.getByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument();
      });
    });

    it('should display default error message when error is not an Error instance', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce('Unknown error');

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '로그인' }));

      await waitFor(() => {
        expect(screen.getByText('로그인에 실패했습니다.')).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const user = userEvent.setup();
      mockLogin
        .mockRejectedValueOnce(new Error('첫 번째 에러'))
        .mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');

      // First submission - should fail
      await user.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.getByText('첫 번째 에러')).toBeInTheDocument();
      });

      // Second submission - error should be cleared
      await user.click(screen.getByRole('button', { name: '로그인' }));
      await waitFor(() => {
        expect(screen.queryByText('첫 번째 에러')).not.toBeInTheDocument();
      });
    });
  });
});
