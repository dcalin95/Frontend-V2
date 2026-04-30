/**
 * 📋 StrategyConfigHeader Component
 */

import React from 'react';
import { ModalHeader } from '../../common/Modal';

const StrategyConfigHeader = ({ strategy, onClose }) => {
  return (
    <ModalHeader 
      title={strategy ? 'Edit Strategy' : 'Create Strategy'} 
      onClose={onClose}
    />
  );
};

export default StrategyConfigHeader;

