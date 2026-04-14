import { PremiumMarketing } from '@/components/PremiumMarketing';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface SyllabusLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyllabusLockModal({ open, onOpenChange }: SyllabusLockModalProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="fixed top-auto right-4 bottom-28 left-4 max-h-[80vh] w-[calc(100%-2rem)] max-w-none translate-x-0 translate-y-0 overflow-hidden overflow-y-auto rounded-[3rem] border-0 bg-white p-0 shadow-[0_20px_50px_rgba(0,0,0,0.3)] duration-200 sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2.5rem]"
      >
        <DialogTitle className="sr-only">UPSC Zen 2026</DialogTitle>
        <PremiumMarketing onUnlock={() => router.push('/pricing')} />
      </DialogContent>
    </Dialog>
  );
}
