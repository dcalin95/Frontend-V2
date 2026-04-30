/**
 * OTARegistrationContext – single source of truth for OTA registration state
 *
 * Provider calls useOTARegistration() once; all OTA consumers (OTAPage,
 * OTATradingModeSelector, etc.) use useOTARegistrationContext()
 * so one checkRegistrationStatus / register updates the whole UI.
 *
 * @module OTARegistrationContext
 */

import React, { createContext, useContext } from 'react';
import { useOTARegistration } from '../hooks/useOTARegistration';

const OTARegistrationContext = createContext(null);

export function OTARegistrationProvider({ children }) {
  const registration = useOTARegistration();
  return (
    <OTARegistrationContext.Provider value={registration}>
      {children}
    </OTARegistrationContext.Provider>
  );
}
OTARegistrationProvider.displayName = 'OTARegistrationProvider';

export function useOTARegistrationContext() {
  const ctx = useContext(OTARegistrationContext);
  if (!ctx) {
    throw new Error(
      'useOTARegistrationContext must be used within OTARegistrationProvider'
    );
  }
  return ctx;
}

export default OTARegistrationContext;
