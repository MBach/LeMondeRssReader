import * as RNLocalize from 'react-native-localize'
import { I18n } from 'i18n-js'

const i18n = new I18n()

i18n.defaultLocale = 'fr'
i18n.locale = 'fr'

const translationGetters: any = {
  en: () => require('./en.json'),
  fr: () => require('./fr.json')
}

export const setI18nConfig = async () => {
  const fallback = { languageTag: 'fr', isRTL: false }
  const { languageTag } = RNLocalize.findBestLanguageTag(Object.keys(translationGetters)) || fallback
  i18n.translations = {
    [languageTag]: translationGetters[languageTag]()
  }
  i18n.locale = languageTag
}

export default i18n
