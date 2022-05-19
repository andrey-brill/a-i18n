
export class SortedArray {

  constructor() {
    this.changed = true; // needed to update view component
  }

  get array() {
    return this._array;
  }

  set array(value) {
    this._array = value.sort();
    this.changed = true;
  }

  insert(element, sortedIndex) {

    if (sortedIndex === undefined) {
      sortedIndex = this.sortedIndexOf(element);
    }

    if (sortedIndex >= 0) {
      this.array.splice(sortedIndex, 0, element);
      this.changed = true;
    }
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

    // TODO rewrite with binary search
    for (let i = 0; i < this._array.length; i++) {

      const el = this._array[i];

      if (el < value) {
        continue;
      } else {
        return value === el ? -1 : i;
      }
    }


    return this.array.length;
  }

  indexOf(value) {
    return this.array.indexOf(value);
  }
}
