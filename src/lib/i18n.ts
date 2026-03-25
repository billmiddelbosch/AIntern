import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import nl from '@/locales/nl.json'

export type MessageSchema = typeof en

export const i18n = createI18n<[MessageSchema], 'en' | 'nl'>({
  legacy: false,
  locale: 'nl',
  fallbackLocale: 'en',
  messages: {
    en,
    nl,
  },
})
