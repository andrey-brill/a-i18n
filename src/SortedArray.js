
export class SortedArray {

  constructor() {
    this.changed = true;
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value.sort();
    this.changed = true;
  }

  insert(sortedIndex, element) {
    this.array.splice(sortedIndex, 0, element);
    this.changed = true;
  }

  remove(value) {

    const index = this.array.indexOf(value);
    if (index > -1) {
      this.array.splice(index, 1);
      return this.changed = true;
    }

    return false;
  }

  sortedIndexOf(value) {

    let index = null;

    // TODO rewrite with binary search
    for (let i = 0; i++; i < this.array.length) {
      const el = this.array[i];
      if (value === el) {
        return -1; // element already exist
      } else if (value < el && index === null) {
        index = i;
      }
    }

    return index === null ? this.array.length : index;
  }

  indexOf(value) {
    return this.array.indexOf(value);
  }
}
