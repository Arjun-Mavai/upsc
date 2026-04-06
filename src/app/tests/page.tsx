import { Metadata } from 'next';
import { getTests } from '@/data/tests';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Clock, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: 'UPSC 2026 Test Series — Practice Quizzes & Mock Tests',
  description:
    'Free UPSC 2026 test series with unit-wise quizzes, PYQs, CSAT practice, and full-length mock tests. Track your score and improve daily!',
  keywords: ['UPSC Test Series', 'UPSC Mock Test', 'UPSC Quiz', 'UPSC PYQ', 'UPSC Practice'],
};

// ISR: Revalidate every week
export const revalidate = 604800;

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const params = await searchParams;
  const tag = params.tag;
  const tests = await getTests({ unitId: tag });

  return (
    <div className="min-h-screen bg-neutral-50 p-6 font-sans md:p-12 dark:bg-neutral-950">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
              Mavai Test Series
            </h1>
            <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
              Master your preparation with our premium full-length and unit tests.
            </p>
          </div>
          {/* Admin Link for convenience during dev */}
          {process.env.NODE_ENV === 'development' && (
            <Link href="/admin/content-manager" className="text-xs text-blue-500 hover:underline">
              Admin Upload
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="absolute top-4 right-4">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    test.type === 'FLT'
                      ? 'border-purple-200 bg-purple-100 text-purple-700'
                      : test.type === 'CSAT'
                        ? 'border-orange-200 bg-orange-100 text-orange-700'
                        : 'border-blue-200 bg-blue-100 text-blue-700'
                  }`}
                >
                  {test.type}
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="pr-12 text-xl leading-tight font-bold text-neutral-900 dark:text-neutral-100">
                  {test.title}
                </h3>
                <p className="line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {test.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {test.durationMinutes} mins
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" />
                    {test.totalMarks} Marks
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
                <Link href={`/tests/${test.slug}`} className="block w-full">
                  <Button className="w-full bg-black font-semibold text-white shadow-lg hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200">
                    Start Test
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {tests.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-neutral-300 bg-white py-20 text-center dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                No Tests Available Yet
              </h3>
              <p className="mt-2 mb-6 text-neutral-500">
                Tests are being prepared. Check back soon!
              </p>
              <Link href="/admin/content-manager">
                <Button variant="outline">Upload Test Data</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
