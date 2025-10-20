import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import ProofOfTransfer from './ProofOfTransfer';
import './ProofOfTransfer.css';

const ProofOfTransferPage = () => {
  // 🎯 GOOGLE ADS CONVERSION TRACKING - PROOF OF TRANSFER PAGE
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && !window.proofOfTransferTracked) {
      window.proofOfTransferTracked = true;
      window.gtag('event', 'conversion', {
        send_to: 'AW-952552862/jW1FCOKkrgQQnpubxgM',
        value: 1.0,
        currency: 'EUR'
      });
      console.log('🎯 Google Ads conversion tracked - Proof of Transfer Visit');
    }
  }, []);

  return (
    <motion.div 
      className="page-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <ProofOfTransfer />
    </motion.div>
  );
};

export default ProofOfTransferPage;

