
export const CommentLine = '/';
export const ApprovedLine = '+';
export const NotApprovedLine = '-';
export const DeleteKeyLine = '#';

export const KeyValueSeparator = '=';
export const FullKeySeparator = '='; // As key don't contains =, we can use '=' to split fullKey.

export const I18n = '.i18n';
export const DefaultI18n = 'en' + I18n;
export const BacklogI18n = '@.i18n';
export const I18nJs = '.i18n.js';

export const FileNameRegExp = /^(.*[^a-zA-Z])?([a-z][a-z])(-[A-Z][A-Z])?\.i18n$/; // must be without @ to ignore changes

export const AutoExport = 'auto';
export const ManualExport = 'manual';

export const NewLineSymbol = `\\_`;
export const NewLineSymbolRegEx = /\\_/g;

export const Encoding = 'utf8';
export const RootDirectory = './';

export const TypeFile = 1;
export const TypeDirectory = 2;
