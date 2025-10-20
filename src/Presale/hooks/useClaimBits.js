// src/components/SelectPaymentMethod/hooks/useClaimBits.js
import { useState, useEffect } from "react";
import { ethers } from "ethers";

const useClaimBits = (bitsTokenAddress, provider) => {
    const [bitsBalance, setBitsBalance] = useState(0);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        if (bitsTokenAddress && provider) {
            const signer = provider.getSigner();
            const bitsContract = new ethers.Contract(bitsTokenAddress, [
                "function balanceOf(address) view returns (uint256)",
                "function transfer(address to, uint256 amount) returns (bool)"
            ], signer);
            setContract(bitsContract);
        }
    }, [bitsTokenAddress, provider]);

    const fetchBalance = async (address) => {
        try {
            if (contract) {
                const balance = await contract.balanceOf(address);
                setBitsBalance(parseFloat(ethers.utils.formatUnits(balance, 18)));
            }
        } catch (error) {
            console.error("Failed to fetch BITS balance:", error);
        }
    };

    const claimBits = async (address) => {
        try {
            if (contract) {
                const tx = await contract.transfer(address, ethers.utils.parseUnits(bitsBalance.toString(), 18));
                await tx.wait();
                return true;
            }
        } catch (error) {
            console.error("Failed to claim BITS:", error);
            return false;
        }
    };

    return { bitsBalance, fetchBalance, claimBits };
};

export default useClaimBits;

