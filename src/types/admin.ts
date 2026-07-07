export interface AdminDashboardStats {
  totalTests: number;
  totalQuestions: number;
  totalBlogs: number;
  openPyq2026LeadCount: number;
  typeCount: {
    FLT: number;
    UNIT: number;
    TOPIC: number;
    CSAT: number;
    PYQ: number;
    [key: string]: number;
  };
  blogCategoryCount: Record<string, number>;
}

export interface RecentUpload {
  id: string;
  type: string | null;
  title: string;
  unitId: string | null;
  topicId: string | null;
  totalQuestions: number | null;
  updatedAt: Date | null;
}

export interface RecentGuest {
  id: string;
  name: string;
  email: string | null;
  mobile: string | null;
  createdAt: Date | null;
  leadSource?: string | null;
}

export interface AdminDashboardResponse {
  success: boolean;
  stats?: AdminDashboardStats;
  recentUploads?: RecentUpload[];
  recentBlogs?: any[];
  recentGuests?: RecentGuest[];
  recentOpenPyqLeads?: RecentGuest[];
  topicCoverage?: Record<string, string[]>;
  error?: string;
}
