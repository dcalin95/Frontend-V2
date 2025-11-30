import React, { useState, useEffect } from 'react';
import CosmicLoader from '../DEX/CosmicLoader';
import './InstallAppModal.mobile.css'; // 🚨 CSS Separat pentru Mobile

const InstallAppModal = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Verifică dacă este deja instalată (Standalone Mode)
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone === true;
      if (isStandalone) {
        setIsInstalled(true);
        setShowModal(false); // Nu afișa dacă e deja instalat
      }
    };

    checkIfInstalled();

    // 2. Ascultă evenimentul de instalare (Chrome/Android)
    const handler = (e) => {
      e.preventDefault(); // Previne prompt-ul nativ urât
      setSupportsPWA(true);
      setPromptInstall(e);
      
      // 🚨 Logica ta: Dacă NU e instalat, întreabă de fiecare dată când se deschide
      if (!isInstalled) {
        setShowModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isInstalled]);

  // Funcția de instalare
  const handleInstallClick = (e) => {
    e.preventDefault();
    if (!promptInstall) {
      return;
    }
    
    // Activează prompt-ul nativ
    promptInstall.prompt();
    
    // Așteaptă răspunsul userului
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowModal(false); // Închide modalul după accept
      } else {
        console.log('User dismissed the install prompt');
        // Rămâne deschis sau se poate închide, user choice. 
        // Aici îl lăsăm să decidă userul dacă închide cu butonul X
      }
      setPromptInstall(null);
    });
  };

  const handleClose = () => {
    setShowModal(false);
  };

  // Dacă e deja instalat sau nu suportă PWA (încă), nu afișa nimic
  if (!showModal || !supportsPWA) {
    return null;
  }

  return (
    <div className="install-modal-overlay">
      <div className="install-modal-content">
        {/* 🚀 INTEGRATED COSMIC LOADER (Visual Only) */}
        <div className="install-loader-wrapper">
            <CosmicLoader /> 
        </div>

        {/* Content Overlay peste Loader */}
        <div className="install-content-ui">
            <h2 className="install-title">INSTALL BITSWAPDEX AI</h2>
            <p className="install-desc">
                Install the official App for a smoother, faster experience with direct Neural Link access.
            </p>

            <div className="install-actions">
                <button className="btn-install-app" onClick={handleInstallClick}>
                    <i className="fas fa-download"></i> INSTALL APP
                </button>
                
                <button className="btn-maybe-later" onClick={handleClose}>
                    Maybe Later
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InstallAppModal;
