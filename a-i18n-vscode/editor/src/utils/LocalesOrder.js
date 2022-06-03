
import { LocaleRegExp } from '../../../../a-i18n-core-js/index.js';


function toLocales(localesOrder) {

  const rawLocales = (localesOrder || '').split(/\s+/);

  const validLocales = [];

  for (const rawLocale of rawLocales) {
    if (LocaleRegExp.test(rawLocale)) {
      validLocales.push(rawLocale);
    }
  }

  return {
    isValid: rawLocales.length === validLocales.length,
    locales: validLocales
  }
}

export function isValidLocalesOrder(localesOrder) {
  return toLocales(localesOrder).isValid;
}

export function orderByLocalesOrder(unordered = [], localesOrder) {

  const { locales } = toLocales(localesOrder);

  const existing = locales.filter(l => unordered.indexOf(l) >= 0);
  const rest = unordered.filter(l => existing.indexOf(l) < 0).sort();
  return existing.concat(rest);

}