/**
 * ⌨️ useKeyboardShortcuts Hook - Keyboard Shortcuts Handler
 * 
 * Hook pentru gestionarea keyboard shortcuts în DEX:
 * - Ctrl+B / Cmd+B: Focus buy tab/action
 * - Ctrl+S / Cmd+S: Focus sell tab/action
 * - Ctrl+K / Cmd+K: Open search/filters
 * - Escape: Close modals
 * - Custom shortcuts support
 * 
 * @module useKeyboardShortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * useKeyboardShortcuts Hook
 * @param {Object} shortcuts - Object cu shortcut-uri și handler-ele lor
 * @param {boolean} enabled - Dacă shortcuts sunt enabled
 * @param {Array} dependencies - Dependencies pentru handler-e
 */
const useKeyboardShortcuts = (shortcuts = {}, enabled = true, dependencies = []) => {
  const shortcutsRef = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  // Update refs when props change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
    enabledRef.current = enabled;
  }, [shortcuts, enabled]);

  const handleKeyDown = useCallback((event) => {
    if (!enabledRef.current) return;

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modifier = ctrlKey || metaKey; // Support both Ctrl (Windows/Linux) and Cmd (Mac)

    // Build shortcut key
    const shortcutKey = [
      modifier && 'mod',
      shiftKey && 'shift',
      altKey && 'alt',
      key.toLowerCase()
    ].filter(Boolean).join('+');

    // Check if we have a handler for this shortcut
    const handler = shortcutsRef.current[shortcutKey];
    
    if (handler) {
      event.preventDefault();
      event.stopPropagation();
      handler(event);
    }
  }, dependencies);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

export default useKeyboardShortcuts;

/**
 * Predefined shortcuts for common actions
 */
export const COMMON_SHORTCUTS = {
  // Trading actions
  'mod+b': 'buy', // Ctrl+B / Cmd+B
  'mod+s': 'sell', // Ctrl+S / Cmd+S
  'mod+k': 'search', // Ctrl+K / Cmd+K
  'mod+h': 'history', // Ctrl+H / Cmd+H
  'mod+a': 'alerts', // Ctrl+A / Cmd+A
  
  // Navigation
  'escape': 'close', // Escape key
  
  // Modifiers
  'mod+shift+b': 'buy_max', // Ctrl+Shift+B
  'mod+shift+s': 'sell_max', // Ctrl+Shift+S
};
