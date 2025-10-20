import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PWAInstallPrompt from '../PWAInstallPrompt';

// Mock the usePWA hook
jest.mock('../../hooks/usePWA', () => ({
  usePWA: jest.fn(),
}));

const mockUsePWA = require('../../hooks/usePWA').usePWA;

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('PWAInstallPrompt', () => {
  const mockInstallApp = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when not installable', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    const { container } = renderWithRouter(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when already installed', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: true,
      isOnline: true,
      installApp: mockInstallApp,
    });

    const { container } = renderWithRouter(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when installable and not installed', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    renderWithRouter(<PWAInstallPrompt />);
    
    expect(screen.getByText('Install BitSwapDEX AI')).toBeInTheDocument();
    expect(screen.getByText('Get the full app experience with offline access and notifications')).toBeInTheDocument();
    expect(screen.getByText('Install App')).toBeInTheDocument();
    expect(screen.getByText('Not Now')).toBeInTheDocument();
  });

  it('should call installApp when Install App button is clicked', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    renderWithRouter(<PWAInstallPrompt />);
    
    const installButton = screen.getByText('Install App');
    fireEvent.click(installButton);
    
    expect(mockInstallApp).toHaveBeenCalledTimes(1);
  });

  it('should hide prompt when Not Now button is clicked', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    const { container } = renderWithRouter(<PWAInstallPrompt />);
    
    const notNowButton = screen.getByText('Not Now');
    fireEvent.click(notNowButton);
    
    // The component should be hidden after clicking "Not Now"
    expect(container.firstChild).toBeNull();
  });

  it('should show offline indicator when offline', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: false,
      installApp: mockInstallApp,
    });

    renderWithRouter(<PWAInstallPrompt />);
    
    expect(screen.getByText(/You're offline - some features may be limited/)).toBeInTheDocument();
  });

  it('should not show offline indicator when online', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    renderWithRouter(<PWAInstallPrompt />);
    
    expect(screen.queryByText(/You're offline - some features may be limited/)).not.toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    const { container } = renderWithRouter(<PWAInstallPrompt />);
    
    const prompt = container.querySelector('.pwa-install-prompt');
    const content = container.querySelector('.pwa-install-content');
    const icon = container.querySelector('.pwa-install-icon');
    const text = container.querySelector('.pwa-install-text');
    const actions = container.querySelector('.pwa-install-actions');
    
    expect(prompt).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
    expect(actions).toBeInTheDocument();
  });

  it('should have proper button styling', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    const { container } = renderWithRouter(<PWAInstallPrompt />);
    
    const installButton = container.querySelector('.pwa-install-btn');
    const dismissButton = container.querySelector('.pwa-dismiss-btn');
    
    expect(installButton).toBeInTheDocument();
    expect(dismissButton).toBeInTheDocument();
    expect(installButton).toHaveClass('pwa-install-btn');
    expect(dismissButton).toHaveClass('pwa-dismiss-btn');
  });

  it('should be accessible', () => {
    mockUsePWA.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      isOnline: true,
      installApp: mockInstallApp,
    });

    renderWithRouter(<PWAInstallPrompt />);
    
    // Check if buttons are accessible
    expect(screen.getByRole('button', { name: 'Install App' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not Now' })).toBeInTheDocument();
    
    // Check if text is accessible
    expect(screen.getByText('Install BitSwapDEX AI')).toBeInTheDocument();
  });
}); 