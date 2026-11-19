/* The site's languages, in the order the picker shows them. The one list:
   the build (integrations/i18n-pages.mjs), the layout (picker markup and
   the language script in Base.astro) and the tests all read it.

   code      URL prefix (/pt/…) and the value saved in localStorage "lang".
             English is the source language and has no prefix.
   htmlLang  <html lang>.
   hreflang  rel="alternate" hreflang. English stays plain "en" so it
             serves every English-speaking market, not only the US.
   ogLocale  og:locale.
   label     Name in its own language, as shown in the picker.
   short     Two letters shown on the settings button. */
export const LANGUAGES = [
  { code: 'en', htmlLang: 'en-US',   hreflang: 'en',      ogLocale: 'en_US', label: 'English (US)', short: 'EN' },
  { code: 'pt', htmlLang: 'pt-PT',   hreflang: 'pt',      ogLocale: 'pt_PT', label: 'Português',    short: 'PT' },
  { code: 'es', htmlLang: 'es',      hreflang: 'es',      ogLocale: 'es_ES', label: 'Español',      short: 'ES' },
  { code: 'fr', htmlLang: 'fr',      hreflang: 'fr',      ogLocale: 'fr_FR', label: 'Français',     short: 'FR' },
  { code: 'de', htmlLang: 'de',      hreflang: 'de',      ogLocale: 'de_DE', label: 'Deutsch',      short: 'DE' },
  { code: 'zh', htmlLang: 'zh-Hans', hreflang: 'zh-Hans', ogLocale: 'zh_CN', label: '简体中文',      short: 'ZH' },
  { code: 'ja', htmlLang: 'ja',      hreflang: 'ja',      ogLocale: 'ja_JP', label: '日本語',        short: 'JA' },
];

export const SOURCE_LANG = 'en';
export const TRANSLATED = LANGUAGES.filter((l) => l.code !== SOURCE_LANG);
export const byCode = (code) => LANGUAGES.find((l) => l.code === code);

/* Dictionary key for an English string: whitespace collapsed and trimmed.
   Used the same way at build time and in the browser. */
export const keyOf = (s) => String(s).replace(/\s+/g, ' ').trim();
