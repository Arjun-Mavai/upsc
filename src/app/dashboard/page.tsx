import { redirect } from 'next/navigation';

// Dashboard is user-specific — must NEVER serve cached/stale page
export const dynamic = 'force-dynamic';
import { getUserAnalytics } from '@/features/analytics/actions';

import { getExamContext } from '@/lib/exam-context';
import { syllabusData } from '@/data/syllabusData';
import { verifyAuth } from '@/lib/auth';
import { getUserSyllabusProgress } from '@/features/syllabus/actions/revision';
import { DashboardClient } from './components/DashboardClient';

export default async function DashboardPage() {
  const user = await verifyAuth();
  if (!user) redirect('/login');

  const exam = await getExamContext();

  // Fetch Analytics & Progress concurrently for maximum performance
  const [analyticsData, syllabusProgress] = await Promise.all([
    getUserAnalytics(user.id, exam.id),
    getUserSyllabusProgress()
  ]);

  // Total topics calculation (small loop, no need for intensive optimization)
  const totalTopics = Object.values(syllabusData.units).reduce((acc: number, unit: any) => {
    return acc + (unit.topics?.length || 0);
  }, 0);

  return (
    <DashboardClient 
      user={{ name: user.name, planTier: user.planTier }}
      analyticsData={analyticsData}
      syllabusProgress={syllabusProgress}
      totalTopics={totalTopics}
      exam={exam}
    />
  );
}
