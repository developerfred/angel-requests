import React, { useState, useEffect } from 'react';
import { Wallet, LogOut, Copy, Check, AlertCircle } from 'lucide-react';
import { walletService } from '../services/wallet';

interface WalletConnectButtonProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
    onConnect,
    onDisconnect
}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [address, setAddress] = useState('');
    const [balance, setBalance] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            if (walletService.isConnected()) {
                const addr = await walletService.getAddress();
                const bal = await walletService.getBalance();

                setAddress(addr);
                setBalance(parseFloat(bal).toFixed(4));
                setIsConnected(true);
                onConnect?.(addr);
            }
        } catch (error) {
            console.error('Connection check failed:', error);
        }
    };

    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            setError('');

            const addr = await walletService.connect();
            const bal = await walletService.getBalance();

            setAddress(addr);
            setBalance(parseFloat(bal).toFixed(4));
            setIsConnected(true);
            onConnect?.(addr);

        } catch (error: any) {
            setError(error.message || 'Failed to connect wallet');
            console.error('Connection failed:', error);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await walletService.disconnect();
            setIsConnected(false);
            setAddress('');
            setBalance('');
            onDisconnect?.();
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    };

    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
        }
    };

    const shortenAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (isConnected) {
        return (
            <div className="wallet-connected">
                <div className="wallet-info">
                    <div className="balance">{balance} ETH</div>
                    <button
                        className="address-btn"
                        onClick={copyAddress}
                        title="Copy address"
                    >
                        <Wallet size={16} />
                        <span>{shortenAddress(address)}</span>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>
                <button
                    className="disconnect-btn"
                    onClick={handleDisconnect}
                    title="Disconnect wallet"
                >
                    <LogOut size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="wallet-connect-section">
            {error && (
                <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <button
                className="connect-btn"
                onClick={handleConnect}
                disabled={isConnecting}
            >
                <Wallet size={16} />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
        </div>
    );
};