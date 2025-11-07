import { Project, ProjectsResponse, AngelRequest, Creator } from '../types';

const API_BASE = 'https://tipchain-api.deno.dev';

export class TipChainAPI {
  static async getProjects(page = 1, limit = 20): Promise<ProjectsResponse> {
    const response = await fetch(`${API_BASE}/projects?page=${page}&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  }

  static async getProject(uid: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${uid}`);
    if (!response.ok) throw new Error('Failed to fetch project');
    return response.json();
  }

  static async getCreator(address: string): Promise<Creator> {
    const response = await fetch(`${API_BASE}/creators/${address}`);
    if (!response.ok) throw new Error('Failed to fetch creator');
    return response.json();
  }

  static async registerCreator(
    basename: string, 
    displayName: string, 
    bio: string, 
    avatarUrl: string
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/creators/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basename, displayName, bio, avatarUrl })
    });
    if (!response.ok) throw new Error('Failed to register creator');
  }

  static async sendTip(
    to: string,
    amount: string,
    message: string,
    token: string = 'ETH'
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/tips/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, amount, message, token })
    });
    if (!response.ok) throw new Error('Failed to send tip');
  }
}