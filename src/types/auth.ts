export type UserRole = 'guest' | 'user' | 'admin' | 'superadmin' | 'counselor' | 'teacher';
export type PlanTier = 'free' | 'lite' | 'pro' | 'combo' | 'mains';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  role: UserRole;
  planTier: PlanTier;
  isSubscribed: boolean;
  accessExpiresAt: Date | null;
  accessGrants: string[];
  sessionVersion: number | null;
  examType?: string | null;
  createdAt?: Date | null;
  _mismatch?: boolean;
}
