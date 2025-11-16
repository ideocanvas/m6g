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

  // Preserve the data and s parameters when redirecting
  const dataParam = params.data;
  const shortIdParam = params.s;
  
  let redirectUrl = `/${targetLanguage}`;
  const urlParams = new URLSearchParams();
  
  if (dataParam) {
    urlParams.set('data', dataParam as string);
  }
  if (shortIdParam) {
    urlParams.set('s', shortIdParam as string);
  }
  
  const queryString = urlParams.toString();
  if (queryString) {
    redirectUrl += `?${queryString}`;
  }
  
  redirect(redirectUrl);
}
