import { renderHook, act } from '@testing-library/react';
import { usePWA } from '../usePWA';

// Mock service worker
const mockServiceWorker = {
  register: jest.fn().mockResolvedValue({}),
};

// Mock window.matchMedia
const mockMatchMedia = jest.fn();

// Mock Notification API
const mockNotification = {
  requestPermission: jest.fn().mockResolvedValue('granted'),
  permission: 'granted',
};

// Mock window events
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Mock console methods
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

describe('usePWA', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    global.navigator = {
      onLine: true,
      serviceWorker: mockServiceWorker,
    };
    
    global.window = {
      matchMedia: mockMatchMedia,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    };
    
    global.Notification = mockNotification;
  });

  it('should initialize with default values', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isOnline).toBe(true);
    expect(typeof result.current.installApp).toBe('function');
    expect(typeof result.current.requestNotificationPermission).toBe('function');
    expect(typeof result.current.sendNotification).toBe('function');
  });

  it('should detect if app is installed', () => {
    mockMatchMedia.mockReturnValue({ matches: true });
    
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstalled).toBe(true);
  });

  it('should register service worker on mount', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    renderHook(() => usePWA());

    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('should handle service worker registration error', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));
    
    renderHook(() => usePWA());

    expect(console.error).toHaveBeenCalledWith(
      'Service Worker registration failed:',
      expect.any(Error)
    );
  });

  it('should handle beforeinstallprompt event', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    // Simulate beforeinstallprompt event
    const mockEvent = {
      preventDefault: jest.fn(),
    };

    act(() => {
      // Find the beforeinstallprompt event listener
      const beforeInstallPromptListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1];

      if (beforeInstallPromptListener) {
        beforeInstallPromptListener(mockEvent);
      }
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(result.current.isInstallable).toBe(true);
  });

  it('should handle appinstalled event', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    // Simulate appinstalled event
    act(() => {
      const appInstalledListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'appinstalled'
      )?.[1];

      if (appInstalledListener) {
        appInstalledListener();
      }
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('should handle online/offline events', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    // Simulate offline event
    act(() => {
      const offlineListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];

      if (offlineListener) {
        offlineListener();
      }
    });

    expect(result.current.isOnline).toBe(false);

    // Simulate online event
    act(() => {
      const onlineListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];

      if (onlineListener) {
        onlineListener();
      }
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should request notification permission', async () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    const permission = await result.current.requestNotificationPermission();

    expect(mockNotification.requestPermission).toHaveBeenCalled();
    expect(permission).toBe(true);
  });

  it('should send notification when permission is granted', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    mockNotification.permission = 'granted';
    
    const { result } = renderHook(() => usePWA());

    // Mock Notification constructor
    const mockNotificationInstance = {
      close: jest.fn(),
    };
    global.Notification = jest.fn().mockImplementation(() => mockNotificationInstance);

    act(() => {
      result.current.sendNotification('Test Title', { body: 'Test Body' });
    });

    expect(global.Notification).toHaveBeenCalledWith('Test Title', {
      icon: '/web-app-manifest-192x192.png',
      badge: '/web-app-manifest-192x192.png',
      body: 'Test Body',
    });
  });

  it('should not send notification when permission is denied', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    mockNotification.permission = 'denied';
    
    const { result } = renderHook(() => usePWA());

    global.Notification = jest.fn();

    act(() => {
      result.current.sendNotification('Test Title');
    });

    expect(global.Notification).not.toHaveBeenCalled();
  });

  it('should handle install app when deferred prompt is available', async () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { result } = renderHook(() => usePWA());

    // Mock deferred prompt
    const mockDeferredPrompt = {
      prompt: jest.fn().mockResolvedValue(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    };

    // Simulate beforeinstallprompt event to set deferred prompt
    act(() => {
      const beforeInstallPromptListener = mockAddEventListener.mock.calls.find(
        call => call[0] === 'beforeinstallprompt'
      )?.[1];

      if (beforeInstallPromptListener) {
        beforeInstallPromptListener({
          preventDefault: jest.fn(),
        });
      }
    });

    // Mock the deferred prompt
    act(() => {
      // This is a simplified test - in reality, the deferred prompt would be set internally
      result.current.deferredPrompt = mockDeferredPrompt;
    });

    await act(async () => {
      await result.current.installApp();
    });

    expect(mockDeferredPrompt.prompt).toHaveBeenCalled();
  });

  it('should clean up event listeners on unmount', () => {
    mockMatchMedia.mockReturnValue({ matches: false });
    
    const { unmount } = renderHook(() => usePWA());

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledTimes(4); // 4 event listeners
  });
}); 