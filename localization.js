'use client';

import LocalizedStrings from 'react-localization';

// import chinese from './dictionaries/chinese';
import english from './dictionaries/en';

const strings = new LocalizedStrings({
  en: english,
  // zh: chinese,
});

export default strings;
