
// NB! Don't touch
// if returns -i then (i-1) is index where value should be placed
// if returns i then i is index of the value
function binarySortedIndex (array, value) {

  let start = 0, end = array.length - 1;

  while (start <= end){

      let mid = Math.floor((start + end)/2);

      if (array[mid] < value) {
        start = mid + 1;
      } else if (array[mid] > value) {
        end = mid - 1;
      } else if (array[mid] === value) {
        return mid;
      }
  }

  return - (1 + Math.max(start, end));
}



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

  insert(value, sortedIndex) {

    if (sortedIndex === undefined) {
      sortedIndex = this.sortedIndexOf(value);
    }

    if (sortedIndex < 0) {
      this.array.splice( -(sortedIndex + 1), 0, value);
      this.changed = true;
    }
  }

  remove(value) {

    const index = this.sortedIndexOf(value);
    if (index >= 0) {
      this.array.splice(index, 1);
      return this.changed = true;
    }

    return false;
  }

  sortedIndexOf(value) {
    return binarySortedIndex(this.array, value);
  }

  has(value) {
    return this.sortedIndexOf(value) >= 0;
  }

}
