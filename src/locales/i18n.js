import * as RNLocalize from 'react-native-localize'
import i18n from 'i18n-js'

i18n.defaultLocale = 'fr'
i18n.locale = 'fr'
i18n.fallbacks = true

export const loadLocale = async () => {
  for (const locale of RNLocalize.getLocales()) {
    if (i18n.translations[locale.languageCode] !== null) {
      i18n.locale = locale.languageCode
      switch (locale.languageCode) {
        case 'en':
          import('./en.json').then(en => {
            i18n.translations = { en }
          })
          break
        default:
        case 'fr':
          import('./fr.json').then(fr => {
            i18n.translations = { fr }
          })
          break
      }
      break
    }
  }
}

export default i18n
