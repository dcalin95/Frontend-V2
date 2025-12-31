// src/Presale/components/useSOLPaymentProgress.js

import { useState, useEffect } from 'react';

const STEP_TITLES = [
  'Checking Solana Wallet',
  'Connecting to Network',
  'Connecting Wallet',
  'Calculating Amount',
  'Creating Transaction',
  'Getting Blockhash',
  'Signing Transaction',
  'Validating Blockhash',
  'Broadcasting Transaction',
  'Confirming Transaction'
];

export const useSOLPaymentProgress = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(
    STEP_TITLES.map((title, index) => ({
      title,
      details: [],
      error: null
    }))
  );
  const [error, setError] = useState(null);
  const [signature, setSignature] = useState(null);

  useEffect(() => {
    const handleProgress = (event) => {
      const { stepIndex, title, details, error: stepError } = event.detail;
      
      setCurrentStep(stepIndex);
      setIsOpen(true);
      
      setSteps(prev => {
        const newSteps = [...prev];
        newSteps[stepIndex] = {
          title: title || newSteps[stepIndex].title,
          details: details || [],
          error: stepError || null
        };
        return newSteps;
      });

      if (stepError) {
        setError(stepError);
      }
    };

    const handleSuccess = (event) => {
      setSignature(event.detail.signature);
      setCurrentStep(10);
    };

    const handleError = (event) => {
      setError(event.detail.error);
    };

    window.addEventListener('sol-payment-progress', handleProgress);
    window.addEventListener('sol-payment-success', handleSuccess);
    window.addEventListener('sol-payment-error', handleError);

    return () => {
      window.removeEventListener('sol-payment-progress', handleProgress);
      window.removeEventListener('sol-payment-success', handleSuccess);
      window.removeEventListener('sol-payment-error', handleError);
    };
  }, []);

  const close = () => {
    setIsOpen(false);
    // Reset after animation
    setTimeout(() => {
      setCurrentStep(0);
      setError(null);
      setSignature(null);
      setSteps(
        STEP_TITLES.map((title) => ({
          title,
          details: [],
          error: null
        }))
      );
    }, 300);
  };

  return {
    isOpen,
    currentStep,
    steps,
    error,
    signature,
    close
  };
};

