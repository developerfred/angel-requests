import type { UniversalProvider } from '@walletconnect/universal-provider';
import { EthersProvider } from '@walletconnect/ethers-provider';
import { ethers } from 'ethers';

class WalletConnectService {
  private provider: UniversalProvider | null = null;
  private ethersProvider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private accounts: string[] = [];

  // Configuração do projeto WalletConnect - você precisa criar em https://cloud.walletconnect.com/
  private readonly projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';
  private readonly metadata = {
    name: 'Angel Requests',
    description: 'Fund ideas that matter on Base',
    url: 'https://angel-requests.com',
    icons: ['https://angel-requests.com/icon.png']
  };

  async init() {
    try {
      this.provider = await UniversalProvider.init({
        projectId: this.projectId,
        metadata: this.metadata,
        relayUrl: 'wss://relay.walletconnect.com'
      });

      this.setupEventListeners();
      
      // Restore previous session if exists
      if (this.provider.session) {
        await this.setupEthersProvider();
        this.accounts = this.provider.accounts;
      }

      return this.provider;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw error;
    }
  }

  private setupEventListeners() {
    if (!this.provider) return;

    this.provider.on('display_uri', (uri: string) => {
      console.log('WalletConnect URI:', uri);
      this.openWalletConnectModal(uri);
    });

    this.provider.on('session_event', (event) => {
      console.log('Session event:', event);
    });

    this.provider.on('session_update', ({ topic, params }) => {
      console.log('Session update:', topic, params);
      const { accounts } = params;
      this.accounts = accounts;
    });

    this.provider.on('session_delete', () => {
      console.log('Session deleted');
      this.accounts = [];
      this.signer = null;
      this.ethersProvider = null;
    });
  }

  async connect() {
    if (!this.provider) {
      await this.init();
    }

    try {
      const { uri, approval } = await this.provider!.connect({
        namespaces: {
          eip155: {
            methods: [
              'eth_sendTransaction',
              'eth_signTransaction',
              'eth_sign',
              'personal_sign',
              'eth_signTypedData',
              'eth_signTypedData_v4',
              'wallet_switchEthereumChain',
              'wallet_addEthereumChain'
            ],
            chains: ['eip155:8453', 'eip155:84532'], // Base Mainnet & Testnet
            events: ['chainChanged', 'accountsChanged'],
            rpcMap: {
              8453: 'https://mainnet.base.org',
              84532: 'https://sepolia.base.org'
            }
          }
        }
      });

      if (uri) {
        this.openWalletConnectModal(uri);
      }

      const session = await approval();
      this.accounts = session.namespaces.eip155.accounts.map((account: string) => 
        account.split(':')[2]
      );
      
      await this.setupEthersProvider();
      
      return this.accounts[0];
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    }
  }

  private async setupEthersProvider() {
    if (!this.provider) return;

    // Usando o provider do WalletConnect diretamente com ethers
    this.ethersProvider = new ethers.BrowserProvider(
      this.provider as any,
      'any'
    );
    this.signer = await this.ethersProvider.getSigner();
  }

  private openWalletConnectModal(uri: string) {
    // Criar QR Code modal para WalletConnect
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
    `;

    modal.innerHTML = `
      <div style="background: #1e293b; padding: 2rem; border-radius: 12px; text-align: center; color: white; max-width: 400px; width: 90%;">
        <h3 style="margin-bottom: 1rem; color: #f8fafc;">Connect Your Wallet</h3>
        <p style="margin-bottom: 1.5rem; color: #94a3b8; font-size: 0.9rem;">
          Scan this QR code with your wallet app to connect
        </p>
        <div id="qrcode" style="margin-bottom: 1.5rem; display: flex; justify-content: center;"></div>
        <div style="margin-bottom: 1rem;">
          <a href="${uri}" style="color: #6366f1; text-decoration: none; font-size: 0.9rem;">
            Or open wallet directly
          </a>
        </div>
        <button onclick="this.closest('div').parentElement.remove()" 
                style="background: #64748b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
          Cancel
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Gerar QR Code (você pode usar uma biblioteca como qrcode.js)
    this.generateQRCode(uri, modal.querySelector('#qrcode'));
  }

  private generateQRCode(uri: string, container: Element | null) {
    if (!container) return;

    // Método simples para gerar QR Code - em produção use uma biblioteca
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`;
    
    const img = document.createElement('img');
    img.src = qrCodeUrl;
    img.alt = 'WalletConnect QR Code';
    img.style.borderRadius = '8px';
    
    container.appendChild(img);
  }

  async disconnect() {
    if (this.provider?.session) {
      await this.provider.disconnect();
    }
    this.provider = null;
    this.ethersProvider = null;
    this.signer = null;
    this.accounts = [];
  }

  async getAddress(): Promise<string> {
    if (!this.accounts.length) {
      throw new Error('Not connected to wallet');
    }
    return this.accounts[0];
  }

  async getBalance(): Promise<string> {
    if (!this.ethersProvider || !this.accounts.length) {
      throw new Error('Not connected to wallet');
    }
    
    const balance = await this.ethersProvider.getBalance(this.accounts[0]);
    return ethers.formatEther(balance);
  }

  async getNetwork() {
    if (!this.ethersProvider) {
      throw new Error('Not connected to wallet');
    }
    return this.ethersProvider.getNetwork();
  }

  async switchNetwork(chainId: string) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (error: any) {
      // Se a rede não existir na carteira, adicioná-la
      if (error.code === 4902) {
        await this.addBaseNetwork();
      } else {
        throw error;
      }
    }
  }

  async addBaseNetwork() {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    await this.provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x2105', // 8453 em hexadecimal
          chainName: 'Base Mainnet',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        },
      ],
    });
  }

  async sendTransaction(to: string, amount: string, data: string = '0x') {
    if (!this.signer) {
      throw new Error('Not connected to wallet');
    }

    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.parseEther(amount),
      data
    });

    return tx;
  }

  async signMessage(message: string) {
    if (!this.signer) {
      throw new Error('Not connected to wallet');
    }

    return this.signer.signMessage(message);
  }

  isConnected(): boolean {
    return this.accounts.length > 0 && !!this.provider?.session;
  }

  getAccounts(): string[] {
    return this.accounts;
  }

  getProvider() {
    return this.ethersProvider;
  }

  getSigner() {
    return this.signer;
  }
}

export const walletConnectService = new WalletConnectService();