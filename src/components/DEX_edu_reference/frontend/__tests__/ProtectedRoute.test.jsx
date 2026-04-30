import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const mockCheckAuthStatus = jest.fn();
const mockUseDexAuth = jest.fn();

jest.mock('../context/DexAuthContext', () => ({
  useDexAuth: () => mockUseDexAuth(),
}));

jest.mock('../components/auth/LoginModal', () => ({
  __esModule: true,
  default: ({ isOpen }) => (isOpen ? <div data-testid="wallet-login-modal">wallet modal</div> : null),
}));

jest.mock('../components/auth/EmailAuthModal', () => ({
  __esModule: true,
  default: () => <div data-testid="email-auth-modal">email modal</div>,
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProtectedRoute email auth focus regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDexAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false,
      checkAuthStatus: mockCheckAuthStatus,
      loginWithEmail: jest.fn(),
      registerWithEmail: jest.fn(),
    });
  });

  test('email variant keeps password input focused after first character', async () => {
    render(
      <MemoryRouter>
        <ProtectedRoute authVariant="email">
          <div>protected</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const passwordInput = await screen.findByPlaceholderText('Password');
    passwordInput.focus();
    expect(passwordInput).toHaveFocus();

    fireEvent.change(passwordInput, { target: { value: 'a' } });

    await waitFor(() => {
      expect(screen.queryByTestId('email-auth-modal')).not.toBeInTheDocument();
      expect(passwordInput).toHaveFocus();
      expect(passwordInput).toHaveValue('a');
    });
  });

  test('wallet variant still uses wallet login modal flow', async () => {
    render(
      <MemoryRouter>
        <ProtectedRoute authVariant="wallet">
          <div>protected</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('wallet-login-modal')).toBeInTheDocument();
    });
  });
});
