'use client';

import LocalizedStrings from 'react-localization';

import english from './dictionaries/en';
import zhHant from './dictionaries/zh_Hant';

const strings = new LocalizedStrings({
  en: english,
  zh_Hant: zhHant,
});

export default strings;
