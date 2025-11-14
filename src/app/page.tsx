import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LanguageCode } from '@/lib/i18n';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('mark6-language');
  const params = await searchParams;

  let targetLanguage: LanguageCode = 'zh-TW';

  if (languageCookie?.value === 'en') {
    targetLanguage = 'en';
  }

  // Preserve the data parameter when redirecting
  const dataParam = params.data;
  const redirectUrl = dataParam ? `/${targetLanguage}?data=${dataParam}` : `/${targetLanguage}`;
  
  redirect(redirectUrl);
}
