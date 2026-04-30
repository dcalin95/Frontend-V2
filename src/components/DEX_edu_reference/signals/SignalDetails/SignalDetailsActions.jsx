/**
 * 🔘 SignalDetailsActions Component
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ModalFooter } from '../../common/Modal';
import LoadingSpinner from '../../common/LoadingSpinner';
import '../../../../styles/DEX/components/signal-details.css';

const SignalDetailsActions = ({ signal, onValidate, onClose, validating }) => {
  const canValidate = signal.valid === false;

  return (
    <ModalFooter>
      {canValidate && (
        <button
          className="signal-details-btn signal-details-btn-validate"
          onClick={onValidate}
          disabled={validating}
        >
          {validating ? (
            <LoadingSpinner size="small" message="" />
          ) : (
            <>
              <CheckCircle size={16} />
              Validate Signal
            </>
          )}
        </button>
      )}
      <button
        className="signal-details-btn signal-details-btn-close"
        onClick={onClose}
      >
        Close
      </button>
    </ModalFooter>
  );
};

export default SignalDetailsActions;

