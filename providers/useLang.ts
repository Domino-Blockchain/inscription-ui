import { createContext, useContext } from 'react';

type LanguageContext = {
    language: string;
};

const DEFAULT_CONTEXT: LanguageContext = {
    language: 'en',
};

export const LanguageContext = createContext<LanguageContext>(DEFAULT_CONTEXT);

export function useLang(): string {
    const { language } = useContext(LanguageContext);
    return language;
}
