
import { FullKeySeparator } from './Constants.js';


export const FullKey = (fileName, key) => fileName + FullKeySeparator + key;

FullKey.fileName = (fullKey) => fullKey.substring(0, fullKey.lastIndexOf(FullKeySeparator));
FullKey.split = (fullKey) => fullKey.split(FullKeySeparator);
