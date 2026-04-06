import { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Offline | UPSC Intelligence',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <WifiOff className="h-10 w-10 text-slate-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">No Internet Connection</h1>
      <p className="mb-8 max-w-sm text-slate-600">
        You are currently offline. Please check your internet connection and try again.
      </p>
      <Button asChild>
        <Link href="/syllabus/quiz/pyq">Try Again</Link>
      </Button>
      <p className="mt-8 text-xs text-slate-400">
        Don&apos;t worry, your progress is saved locally.
      </p>
    </div>
  );
}
