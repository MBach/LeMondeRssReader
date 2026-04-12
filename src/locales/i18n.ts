import * as Localization from 'expo-localization'
import { I18n } from 'i18n-js'

const translations = {
  en: require('./en.json'),
  fr: require('./fr.json')
}

export const i18n = new I18n(translations)
i18n.defaultLocale = 'fr'
i18n.enableFallback = true

const locales = Localization.getLocales()
const tag = locales[0]?.languageCode ?? 'fr'
i18n.locale = Object.keys(translations).includes(tag) ? tag : 'fr'
