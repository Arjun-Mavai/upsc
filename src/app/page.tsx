import { UPSCLanding } from '@/components/home/UPSCLanding';
import { getExamContext } from '@/lib/exam-context';

export default async function Home() {
  const exam = await getExamContext();
  return <UPSCLanding exam={exam} />;
}
