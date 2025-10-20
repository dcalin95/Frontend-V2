// src/components/SelectPaymentMethod/hooks/useBlockchainSelector.js
import { useState, useEffect } from "react";

const useBlockchainSelector = () => {
    const [currentBlockchain, setCurrentBlockchain] = useState("EVM");

    useEffect(() => {
        // Logică pentru selectarea blockchain-ului activ
        const detectBlockchain = async () => {
            if (window.ethereum) {
                setCurrentBlockchain("EVM");
            } else if (window.solana && window.solana.isPhantom) {
                setCurrentBlockchain("Solana");
            } else {
                console.warn("No supported blockchain detected.");
            }
        };

        detectBlockchain();
    }, []);

    return { currentBlockchain, setCurrentBlockchain };
};

export default useBlockchainSelector;

