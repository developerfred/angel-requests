export interface Project {
  uid: string;
  title: string;
  description: string;
  recipient: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  detailsLastUpdatedAt: string;
  grantLastUpdatedAt: string;
  noOfGrants: number;
  noOfGrantMilestones: number;
  noOfProjectMilestones: number;
  pointers: Array<{_id: { $oid: string }}>;
  symlinks: string[];
}

export interface ProjectsResponse {
  data: Project[];
  pageInfo: {
    totalItems: number;
    page: number;
    pageLimit: number;
  };
}

export interface AngelRequest {
  id: string;
  title: string;
  description: string;
  creator: string;
  targetAmount: string;
  currentAmount: string;
  status: 'active' | 'funded' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  tips: Tip[];
  basename: string;
  progress: number;
}

export interface Tip {
  from: string;
  amount: string;
  message: string;
  timestamp: number;
  token: string;
}

export interface Creator {
  basename: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  totalTipsReceived: string;
  tipCount: number;
  isActive: boolean;
  createdAt: number;
}