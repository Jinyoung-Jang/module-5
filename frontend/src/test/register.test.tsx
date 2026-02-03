import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '@/app/register/page';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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

describe('RegisterPage', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: jest.fn(),
      register: mockRegister,
      logout: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the registration form with all fields', () => {
      render(<RegisterPage />);

      expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
      expect(screen.getByLabelText('이메일')).toBeInTheDocument();
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
      expect(screen.getByLabelText('이름 (선택)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
    });

    it('should render login link', () => {
      render(<RegisterPage />);

      const loginLink = screen.getByRole('link', { name: '로그인' });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render email input with correct placeholder', () => {
      render(<RegisterPage />);

      const emailInput = screen.getByPlaceholderText('example@email.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should render password input with correct type', () => {
      render(<RegisterPage />);

      const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form submission', () => {
    it('should call register function with form data on submit', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.type(screen.getByLabelText('이름 (선택)'), 'Test User');

      await user.click(screen.getByRole('button', { name: '회원가입' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User'
        );
      });
    });

    it('should call register with undefined fullName when name field is empty', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');

      await user.click(screen.getByRole('button', { name: '회원가입' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          undefined
        );
      });
    });

    it('should redirect to login page after successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '회원가입' }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveRegister: (value: void) => void;
      mockRegister.mockImplementationOnce(
        () => new Promise((resolve) => { resolveRegister = resolve; })
      );

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '회원가입' }));

      expect(screen.getByText('처리중...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();

      // Resolve the promise to complete the test
      resolveRegister!();
      await waitFor(() => {
        expect(screen.queryByText('처리중...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when registration fails', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce(new Error('이미 등록된 이메일입니다.'));

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '회원가입' }));

      await waitFor(() => {
        expect(screen.getByText('이미 등록된 이메일입니다.')).toBeInTheDocument();
      });
    });

    it('should display default error message when error is not an Error instance', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce('Unknown error');

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');
      await user.click(screen.getByRole('button', { name: '회원가입' }));

      await waitFor(() => {
        expect(screen.getByText('회원가입에 실패했습니다.')).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const user = userEvent.setup();
      mockRegister
        .mockRejectedValueOnce(new Error('첫 번째 에러'))
        .mockResolvedValueOnce(undefined);

      render(<RegisterPage />);

      await user.type(screen.getByLabelText('이메일'), 'test@example.com');
      await user.type(screen.getByLabelText('비밀번호'), 'password123');

      // First submission - should fail
      await user.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.getByText('첫 번째 에러')).toBeInTheDocument();
      });

      // Second submission - error should be cleared
      await user.click(screen.getByRole('button', { name: '회원가입' }));
      await waitFor(() => {
        expect(screen.queryByText('첫 번째 에러')).not.toBeInTheDocument();
      });
    });
  });
});
