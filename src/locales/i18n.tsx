import * as RNLocalize from 'react-native-localize'
import i18n from 'i18n-js'

i18n.defaultLocale = 'fr'
i18n.locale = 'fr'
i18n.fallbacks = true

export const loadLocale = async () => {
  let hasMatchingLang = false
  for (const locale of RNLocalize.getLocales()) {
    if (i18n.translations[locale.languageCode]) {
      i18n.locale = locale.languageCode
      hasMatchingLang = true
      switch (locale.languageCode) {
        case 'en':
          import('./en.json').then((en) => {
            i18n.translations = { en }
          })
          break
        default:
        case 'fr':
          import('./fr.json').then((fr) => {
            i18n.translations = { fr }
          })
          break
      }
      break
    }
  }
  if (!hasMatchingLang) {
    import('./fr.json').then((fr) => {
      i18n.translations = { fr }
    })
  }
}

export default i18n
