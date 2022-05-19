
export class Disposable {

  constructor() {
    this.dispose = this.dispose.bind(this);
    this.dispose();
  }

  dispose() {

    if (this.disposables) {
      for (const disposable of this.disposables.reverse()) {
        if (disposable.dispose) {
          disposable.dispose();
        } else {
          disposable();
        }
      }
    }

    this.disposables = [];
  }

  dis$(disposable) {

    if (!disposable) {
      throw new Error('WTF?');
    }

    this.disposables.push(disposable);
    return disposable;
  }
}
