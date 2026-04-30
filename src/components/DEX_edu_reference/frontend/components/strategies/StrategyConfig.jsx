/**
 * ⚙️ StrategyConfig Component - Strategy Configuration Modal
 * 
 * Refactorized: Using reusable components and hooks for better maintainability
 * 
 * @module StrategyConfig
 */

import React, { useState } from 'react';
import { useStrategies } from '../../hooks/useStrategies';
import { Save } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '../common/Modal';
import { BasicInfoForm, RiskLimitsForm, useStrategyForm, StrategyConfigHeader } from './StrategyConfig/index';
import LoadingSpinner from '../common/LoadingSpinner';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/strategy-config.css';

const StrategyConfig = ({ userId, strategy, onClose }) => {
  const { createStrategy, updateStrategy, loading, error } = useStrategies(userId);
  const { formData, formErrors, handleInputChange, validate, setFormErrors } = useStrategyForm(strategy);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      if (strategy?.id) {
        await updateStrategy(strategy.id, formData);
      } else {
        await createStrategy(formData);
      }
      onClose?.();
    } catch (error) {
      errorWithPrefix('StrategyConfig', 'Error saving strategy:', error);
      setFormErrors({ submit: error.message || 'Failed to save strategy' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      size="large"
      showHeader={false}
    >
      <StrategyConfigHeader strategy={strategy} onClose={onClose} />

      <form onSubmit={handleSave}>
        <ModalBody>
          <BasicInfoForm
            formData={formData}
            formErrors={formErrors}
            onChange={handleInputChange}
          />

          <RiskLimitsForm
            formData={formData}
            formErrors={formErrors}
            onChange={handleInputChange}
          />

          {(formErrors.submit || error) && (
            <div className="strategy-config-error-message">
              {formErrors.submit || error}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            className="strategy-config-btn strategy-config-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="strategy-config-btn strategy-config-btn-save"
            disabled={saving || loading}
          >
            {saving ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <Save size={16} />
                {strategy ? 'Update' : 'Create'} Strategy
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default StrategyConfig;
