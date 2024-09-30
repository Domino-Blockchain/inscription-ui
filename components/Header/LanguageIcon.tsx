import Image from 'next/image';

import en_flag from './en_flag_sm.png';
import zh_flag from './zh_flag_sm.png';

export function LanguageIcon({ lang }: { lang: string }) {
  const images: any = {
    en: en_flag,
    zh_Hant: zh_flag,
  };

  return <Image alt={lang} src={images[lang]} style={{ width: 22.5, height: 'auto' }} />;
}
