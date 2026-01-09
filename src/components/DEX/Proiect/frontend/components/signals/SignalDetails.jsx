/**
 * 📄 SignalDetails Component - Signal Details Modal
 * 
 * Refactorized: Using reusable components for better maintainability
 * 
 * @module SignalDetails
 */

import React, { useState, useEffect } from 'react';
import { useSignals } from '../../hooks/useSignals';
import { Modal, ModalBody } from '../common/Modal';
import { getSignalTypeConfig } from '../../utils/statusConfigs';
import {
  SignalDetailsHeader,
  SignalDetailsBasicInfo,
  SignalDetailsPrices,
  SignalDetailsMetadata,
  SignalDetailsActions
} from './SignalDetails';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/signal-details.css';

const SignalDetails = ({ userId, signalId, onClose }) => {
  const { getSignal, validateSignal, loading, error } = useSignals(userId);
  const [signal, setSignal] = useState(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (signalId) {
      loadSignal();
    }
  }, [signalId]);

  const loadSignal = async () => {
    try {
      const signalData = await getSignal(signalId);
      setSignal(signalData);
    } catch (error) {
      console.error('Error loading signal:', error);
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      await validateSignal(signalId);
      await loadSignal();
    } catch (error) {
      console.error('Error validating signal:', error);
    } finally {
      setValidating(false);
    }
  };

  if (loading && !signal) {
    return (
      <Modal isOpen={true} onClose={onClose} size="medium">
        <ModalBody>
          <LoadingSpinner message="Loading signal details..." />
        </ModalBody>
      </Modal>
    );
  }

  if (!signal) {
    return (
      <Modal isOpen={true} onClose={onClose} size="small" title="Error">
        <ModalBody>
          <div className="signal-details-error">
            <p>{error || 'Signal not found'}</p>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  const signalConfig = getSignalTypeConfig(signal.signal);

  return (
    <Modal isOpen={true} onClose={onClose} size="large" showHeader={false}>
      <SignalDetailsHeader signal={signal} onClose={onClose} />

      <ModalBody>
        {/* Signal Type */}
        <div className="signal-details-section">
          <div className={`signal-details-signal signal-details-signal-${signalConfig.className}`}>
            <span className="signal-details-signal-label">Signal:</span>
            <span className="signal-details-signal-value">{signalConfig.label}</span>
          </div>
        </div>

        {/* Basic Info */}
        <SignalDetailsBasicInfo signal={signal} />

        {/* Prices */}
        <SignalDetailsPrices signal={signal} />

        {/* Metadata */}
        <SignalDetailsMetadata signal={signal} />
      </ModalBody>

      {/* Actions */}
      <SignalDetailsActions
        signal={signal}
        onValidate={handleValidate}
        onClose={onClose}
        validating={validating}
      />
    </Modal>
  );
};

export default SignalDetails;
