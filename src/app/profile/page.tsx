import { redirect } from 'next/navigation';
import { verifyAuth } from '@/lib/auth';
import ProfileClient from './ProfileClient';
import { getUserProfile } from './actions';

export default async function ProfilePage() {
  const authUser = await verifyAuth();

  if (!authUser) {
    redirect('/login');
  }

  const user = await getUserProfile();

  if (!user) {
    redirect('/login');
  }

  return <ProfileClient user={{ ...user, email: user.email || '', createdAt: user.createdAt || null }} />;
}
