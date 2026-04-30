/**
 * ⌨️ KeyboardShortcutsHelp Component - Keyboard Shortcuts Help Modal
 * 
 * Component pentru afișarea listei de keyboard shortcuts disponibile
 * 
 * @module KeyboardShortcutsHelp
 */

import React from 'react';
import { Keyboard } from 'lucide-react';
import Modal from './Modal/Modal';
import '../../styles/components/keyboard-shortcuts-help.css';

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const shortcuts = [
    { keys: ['Ctrl', 'B'], description: 'Switch to Buy tab (Limit Orders)' },
    { keys: ['Ctrl', 'S'], description: 'Switch to Sell tab (Limit Orders)' },
    { keys: ['Ctrl', 'Shift', 'B'], description: 'Buy tab + Set market price' },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Sell tab + Set market price' },
    { keys: ['Ctrl', 'H'], description: 'Open Trading History' },
    { keys: ['Ctrl', 'A'], description: 'Open Price Alerts' },
    { keys: ['Ctrl', 'K'], description: 'Search / Focus search' },
    { keys: ['Esc'], description: 'Close modals / Cancel' }
  ];

  const getKeyDisplay = (key) => {
    if (key === 'Ctrl') {
      return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';
    }
    return key;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="medium"
      className="keyboard-shortcuts-help-modal"
    >
      <div className="keyboard-shortcuts-help-content">
        <div className="keyboard-shortcuts-help-intro">
          <Keyboard size={24} className="keyboard-shortcuts-help-icon" />
          <p>Use these keyboard shortcuts to navigate faster</p>
        </div>
        <div className="keyboard-shortcuts-list">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="keyboard-shortcut-item">
              <div className="keyboard-shortcut-keys">
                {shortcut.keys.map((key, keyIndex) => (
                  <React.Fragment key={keyIndex}>
                    <kbd className="keyboard-shortcut-key">{getKeyDisplay(key)}</kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="keyboard-shortcut-separator">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="keyboard-shortcut-description">
                {shortcut.description}
              </div>
            </div>
          ))}
        </div>
        <div className="keyboard-shortcuts-help-note">
          <p>Note: On Mac, use ⌘ (Cmd) instead of Ctrl</p>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsHelp;
