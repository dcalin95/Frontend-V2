/**
 * 📋 SignalDetailsHeader Component
 */

import React from 'react';
import { ModalHeader } from '../../common/Modal';
import { StatusBadge } from '../../common/StatusBadge';
import { getSignalTypeConfig } from '../../../utils/statusConfigs';

const SignalDetailsHeader = ({ signal, onClose }) => {
  const signalConfig = getSignalTypeConfig(signal.signal);

  return (
    <ModalHeader title="Signal Details" onClose={onClose}>
      <StatusBadge status={signal.signal} config={signalConfig} />
    </ModalHeader>
  );
};

export default SignalDetailsHeader;

