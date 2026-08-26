/**
 * authComponents.test.jsx
 * =====================================================
 * Tests for Login and Register components
 * =====================================================
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

// Mock auth context
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    resetPassword: mockResetPassword,
    loading: false,
    error: null,
    clearError: vi.fn(),
    isAuthenticated: false,
  }),
}));

// Import after mocks
import Login from '../../components/Login';
import Register from '../../components/Register';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithRouter(<Login />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show OAuth buttons', () => {
    renderWithRouter(<Login />);

    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    renderWithRouter(<Login />);
    const user = userEvent.setup();

    const emailInput = screen.getByPlaceholderText('you@company.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('should call login on submit', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });
    renderWithRouter(<Login />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('you@company.com'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Enter your password'), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should toggle password visibility', async () => {
    renderWithRouter(<Login />);
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('Enter your password');
    expect(passwordInput.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: '' });
    await user.click(toggleButton);

    expect(passwordInput.type).toBe('text');
  });

  it('should show link to register', () => {
    renderWithRouter(<Login />);

    const registerLink = screen.getByText(/sign up/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.getAttribute('href')).toBe('/register');
  });

  it('should show demo mode notice', () => {
    renderWithRouter(<Login />);

    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
  });
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should Render registration form', () => {
    renderWithRouter(<Register />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Manufacturing')).toBeInTheDocument();
  });

  it('should show password strength indicator', async () => {
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');
    await user.type(passwordInput, 'Weak');

    expect(screen.getByText(/password strength/i)).toBeInTheDocument();
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('should update password strength as typing', async () => {
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    const passwordInput = screen.getByPlaceholderText('Min. 8 characters');

    await user.type(passwordInput, 'Pass');
    expect(screen.getByText(/weak/i)).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123');
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('should validate name length', async () => {
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('John Doe'), 'J');
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('should call register on submit', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Acme Manufacturing'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'Password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'john@example.com',
        'Password123',
        'John Doe',
        'Acme Corp'
      );
    });
  });

  it('should show error when passwords do not match', async () => {
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Acme Manufacturing'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'DifferentPass123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should show success message when confirmation required', async () => {
    mockRegister.mockResolvedValueOnce({
      success: true,
      needsConfirmation: true,
    });
    renderWithRouter(<Register />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('John Doe'), 'John Doe');
    await user.type(screen.getByPlaceholderText('you@company.com'), 'john@example.com');
    await user.type(screen.getByPlaceholderText('Acme Manufacturing'), 'Acme Corp');
    await user.type(screen.getByPlaceholderText('Min. 8 characters'), 'Password123');
    await user.type(screen.getByPlaceholderText('Re-enter password'), 'Password123');

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should show link to login', () => {
    renderWithRouter(<Register />);

    const loginLink = screen.getByText(/sign in/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });

  it('should show terms link', () => {
    renderWithRouter(<Register />);

    expect(screen.getByText(/terms of service/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument();
  });
});
