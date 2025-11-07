import React, { useState, useEffect } from 'react';
import { RequestCard } from './components/RequestCard';
import { TipModal } from './components/TipModal';
import { WalletConnectButton } from './components/WalletConnectButton';
import { AngelRequest, Project, Creator } from './types';
import { Package, Search, Plus } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { walletService } from './services/wallet';

function App() {
  const [requests, setRequests] = useState<AngelRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AngelRequest | null>(null);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    loadAppVersion();
    loadProjects();
    checkWalletConnection();
  }, []);

  const loadAppVersion = async () => {
    try {
      const version = await invoke<string>('get_app_version');
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  };

  const checkWalletConnection = () => {
    const connected = walletService.isConnected();
    setIsConnected(connected);
    if (connected) {
      walletService.getAddress().then(setUserAddress);
    }
  };

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const response = await invoke<{ data: Project[] }>('get_projects', {
        page: 1,
        limit: 20
      });

      const angelRequests = await convertProjectsToRequests(response.data);
      setRequests(angelRequests);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const convertProjectsToRequests = async (projects: Project[]): Promise<AngelRequest[]> => {
    return Promise.all(projects.map(async (project) => {
      try {
        const creator = await invoke<Creator>('get_creator', {
          address: project.recipient
        });

        return {
          id: project.uid,
          title: project.title,
          description: project.description,
          creator: project.recipient,
          targetAmount: '1.0',
          currentAmount: '0.0',
          status: 'active' as const,
          createdAt: new Date(project.created_at).getTime(),
          updatedAt: new Date(project.updated_at).getTime(),
          tips: [],
          basename: creator.basename,
          progress: 0
        };
      } catch (error) {
        console.error(`Failed to load creator for ${project.recipient}:`, error);

        return {
          id: project.uid,
          title: project.title,
          description: project.description,
          creator: project.recipient,
          targetAmount: '1.0',
          currentAmount: '0.0',
          status: 'active' as const,
          createdAt: new Date(project.created_at).getTime(),
          updatedAt: new Date(project.updated_at).getTime(),
          tips: [],
          basename: 'unknown',
          progress: 0
        };
      }
    }));
  };

  const handleWalletConnect = (address: string) => {
    setUserAddress(address);
    setIsConnected(true);
  };

  const handleWalletDisconnect = () => {
    setUserAddress('');
    setIsConnected(false);
  };

  const handleTip = (request: AngelRequest) => {
    if (!isConnected) {
      return; // O WalletConnectButton já lida com a conexão
    }
    setSelectedRequest(request);
    setIsTipModalOpen(true);
  };

  const handleSendTip = async (amount: string, message: string) => {
    if (!selectedRequest) return;

    try {
      // Garantir que estamos na Base Network
      await walletService.ensureBaseNetwork();

      // Enviar transação
      const tx = await walletService.sendTransaction(selectedRequest.creator, amount);
      console.log('Transaction sent:', tx);

      // Registrar tip na API
      const result = await invoke<string>('send_tip', {
        tipRequest: {
          to: selectedRequest.creator,
          amount,
          message,
          token: 'ETH'
        }
      });

      console.log('Tip registered:', result);
      setIsTipModalOpen(false);
      setSelectedRequest(null);

      // Reload to update amounts
      loadProjects();
    } catch (error) {
      console.error('Tip failed:', error);
      alert('Tip failed. Please try again.');
    }
  };

  const handleViewDetails = (request: AngelRequest) => {
    console.log('View details:', request);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="logo">
            <h1>Angel Requests</h1>
            <span>Fund ideas that matter</span>
          </div>

          <div className="header-actions">
            <div className="app-version">
              <Package size={14} />
              <span>v{appVersion}</span>
            </div>

            <WalletConnectButton
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="page-header">
            <h2>Featured Requests</h2>
            <div className="search-bar">
              <Search size={20} />
              <input type="text" placeholder="Search requests..." />
            </div>
          </div>

          {isLoading ? (
            <div className="loading">Loading requests...</div>
          ) : (
            <div className="requests-grid">
              {requests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onTip={handleTip}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <TipModal
        request={selectedRequest}
        isOpen={isTipModalOpen}
        onClose={() => {
          setIsTipModalOpen(false);
          setSelectedRequest(null);
        }}
        onTip={handleSendTip}
      />
    </div>
  );
}

export default App;