
import { ExtensionManager } from './src/ExtensionManager';


const extension = new ExtensionManager();

export function deactivate() {
  extension.dispose$();
}

export function activate() {
  extension.activate$();
}
