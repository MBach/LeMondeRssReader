import { findBestLanguageTag } from 'react-native-localize'
import { I18n } from 'i18n-js'

export const i18n = new I18n()

i18n.defaultLocale = 'fr'
i18n.locale = 'fr'

const translationGetters: Record<string, () => object> = {
  en: () => require('./en.json'),
  fr: () => require('./fr.json')
}

export const setI18nConfig = async (): Promise<string> => {
  const fallback = { languageTag: 'fr', isRTL: false }
  const { languageTag } = findBestLanguageTag(Object.keys(translationGetters)) || fallback
  i18n.translations = {
    [languageTag]: translationGetters[languageTag]()
  }
  i18n.locale = languageTag
  return languageTag
}
