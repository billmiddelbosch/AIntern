export interface FaqItemLocale {
  question: string
  answer: string
}

export interface FaqItem {
  id: string
  order: number
  nl: FaqItemLocale
  en: FaqItemLocale
}

export interface NoCureNoPayFaqSectionProps {
  faqs: FaqItem[]
}
