import ClientHome from './client-home';
import { LanguageCode } from '@/lib/i18n';

interface HomePageProps {
  params: Promise<{
    lang: LanguageCode;
  }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  return <ClientHome language={lang} />;
}