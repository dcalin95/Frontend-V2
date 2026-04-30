/**
 * 🪙 Add Custom Token Modal
 *
 * Form for adding a custom BSC token: symbol, name, address, decimals.
 * Saved through customTokenManager.addCustomToken(); on success, refreshes
 * the HeaderTokenSelector list.
 *
 * @module AddCustomTokenModal
 */

import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';
import { addCustomToken } from '../../utils/customTokenManager';
import { hasToken } from '../../services/tokenRegistry';
import '../../styles/components/add-custom-token-modal.css';

const BSC_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const AddCustomTokenModal = ({ isOpen, onClose, onSuccess }) => {
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [decimals, setDecimals] = useState('18');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setSymbol('');
    setName('');
    setAddress('');
    setDecimals('18');
    setError('');
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose?.();
  }, [onClose, resetForm]);

  const handleFieldChange = useCallback((field, value) => {
    setError('');
    if (field === 'symbol') setSymbol(String(value).toUpperCase().replace(/[^A-Za-z0-9]/g, '').slice(0, 20));
    if (field === 'name') setName(String(value).slice(0, 80));
    if (field === 'address') setAddress(String(value).trim().slice(0, 42));
    if (field === 'decimals') {
      const v = String(value).replace(/\D/g, '').slice(0, 2);
      const n = parseInt(v, 10);
      if (v === '' || (!Number.isNaN(n) && n >= 0 && n <= 18)) setDecimals(v);
    }
  }, []);

  const validate = useCallback(() => {
    const s = symbol.trim();
    const n = name.trim();
    const a = address.trim();

    if (!s) {
      setError('Enter the token symbol (e.g. MATIC).');
      return false;
    }
    if (!/^[A-Za-z0-9]{1,20}$/.test(s)) {
      setError('Symbol: letters and digits only, max 20 characters.');
      return false;
    }
    if (!n) {
      setError('Enter the token name.');
      return false;
    }
    if (!a) {
      setError('Enter the BSC contract address (0x...).');
      return false;
    }
    if (!BSC_ADDRESS_REGEX.test(a)) {
      setError('Address must be 0x followed by 40 hex characters (BSC).');
      return false;
    }
    const dec = decimals === '' ? 18 : parseInt(decimals, 10);
    if (Number.isNaN(dec) || dec < 0 || dec > 18) {
      setError('Decimals: between 0 and 18.');
      return false;
    }
    if (hasToken(s)) {
      setError('This token already exists in the list (built-in or previously added).');
      return false;
    }
    return true;
  }, [symbol, name, address, decimals]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (submitting) return;
      if (!validate()) return;

      setSubmitting(true);
      setError('');

      const success = addCustomToken({
        symbol: symbol.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        decimals: decimals === '' ? 18 : parseInt(decimals, 10) || 18
      });

      setSubmitting(false);
      if (success) {
        const addedSymbol = symbol.trim().toUpperCase();
        resetForm();
        onSuccess?.(addedSymbol);
      } else {
        setError('Could not save token. Check the data.');
      }
    },
    [symbol, name, address, decimals, submitting, validate, onSuccess, resetForm]
  );

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add token"
      size="small"
      showHeader={true}
    >
      <form
        className="add-custom-token-form"
        onSubmit={handleSubmit}
        noValidate
        aria-describedby="add-token-hint add-token-error"
      >
        <p id="add-token-hint" className="add-custom-token-hint">
          Add a BEP-20 token (BSC) by contract address. You can find the address on BscScan.
        </p>

        {error && (
          <div id="add-token-error" className="add-custom-token-error" role="alert">
            {error}
          </div>
        )}

        <FormField
          label="Symbol"
          name="symbol"
          type="text"
          value={symbol}
          onChange={handleFieldChange}
          placeholder="ex: CAKE"
          required
        />
        <FormField
          label="Name"
          name="name"
          type="text"
          value={name}
          onChange={handleFieldChange}
          placeholder="ex: Polygon"
          required
        />
        <FormField
          label="BSC contract address"
          name="address"
          type="text"
          value={address}
          onChange={handleFieldChange}
          placeholder="0x..."
          required
        />
        <FormField
          label="Decimals"
          name="decimals"
          type="number"
          value={decimals}
          onChange={handleFieldChange}
          min={0}
          max={18}
          required
        />

        <div className="add-custom-token-footer">
          <button type="button" className="add-custom-token-btn add-custom-token-btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="add-custom-token-btn add-custom-token-btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add token'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddCustomTokenModal;
