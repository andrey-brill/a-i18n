
export const CommentLine = '/';
export const ApprovedLine = '+';
export const NotApprovedLine = '-';
export const DeleteLine = '#';

export const KeyValueSeparator = '=';
export const FullKeySeparator = '='; // As key don't contains =, we can use '=' to split fullKey.

export const I18n = '.i18n';
export const DefaultLocale = 'en';
export const DefaultI18n = DefaultLocale + I18n;
export const BacklogI18n = '@.i18n';
export const I18nJs = '.i18n.js';
export const I18nConfig = '.i18n.json';

export const LocaleRegExp = /^([a-z][a-z])(-[A-Z][A-Z])?$/;
export const FileNameRegExp = /^(.*[^a-zA-Z])?([a-z][a-z])(-[A-Z][A-Z])?\.i18n$/; // must be without @ to ignore changes

export const AutoExport = 'auto';
export const ManualExport = 'manual';

export const NewLineSymbol = `\\_`;
export const NewLineSymbolRegEx = /\\_/g;

export const Encoding = 'utf8';
export const RootDirectory = './';

export const TypeFile = 1;
export const TypeDirectory = 2;

export const KeyState = {
  New: 'New',
  Changed: 'Changed',
  Deleted: 'Deleted',
  Original: 'Original',
  Missing: 'Missing'
}

export const EmptyT = Object.freeze({
  approved: false,
  value: ''
})