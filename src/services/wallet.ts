import { walletConnectService } from './walletConnect';

export class WalletService {
    private currentAddress: string = '';

    async connect() {
        try {
            this.currentAddress = await walletConnectService.connect();
            return this.currentAddress;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            throw error;
        }
    }

    async disconnect() {
        await walletConnectService.disconnect();
        this.currentAddress = '';
    }

    async getAddress(): Promise<string> {
        if (!this.currentAddress) {
            throw new Error('Not connected to wallet');
        }
        return this.currentAddress;
    }

    async getBalance(): Promise<string> {
        return walletConnectService.getBalance();
    }

    async sendTransaction(to: string, amount: string): Promise<any> {
        return walletConnectService.sendTransaction(to, amount);
    }

    async signMessage(message: string): Promise<string> {
        return walletConnectService.signMessage(message);
    }

    async switchToBaseNetwork() {
        await walletConnectService.switchNetwork('0x2105'); // Base Mainnet
    }

    isConnected(): boolean {
        return walletConnectService.isConnected();
    }

    
    async ensureBaseNetwork() {
        try {
            const network = await walletConnectService.getNetwork();
            if (network.chainId !== 8453n) { 
                await this.switchToBaseNetwork();
            }
        } catch (error) {
            console.error('Failed to ensure Base network:', error);
            throw error;
        }
    }
}

export const walletService = new WalletService();