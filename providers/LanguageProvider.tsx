import { FC, ReactNode } from 'react';

import { LanguageContext } from './useLang';

export interface LanguageProviderProps {
    children: ReactNode;
    language: string;
}

export const LanguageProvider: FC<LanguageProviderProps> = ({ language, children }) =>
    <LanguageContext.Provider value={{ language }}>{children}</LanguageContext.Provider>;
