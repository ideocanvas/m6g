import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { LanguageCode } from '@/lib/i18n';

export default async function Home() {
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get('mark6-language');

  let targetLanguage: LanguageCode = 'zh-TW';

  if (languageCookie?.value === 'en') {
    targetLanguage = 'en';
  }

  redirect(`/${targetLanguage}`);
}
