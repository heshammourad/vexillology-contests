/**
 * Returns [unselected, selected]
 * @param {number[]|string[]} array
 * @param {number[]|string[]} selectedPositions
 * @returns
 */

export function splitter(array, selectedPositions) {
  const unselected = [];
  const selected = [];
  array.forEach((value, index) => {
    if (selectedPositions.includes(index)) {
      selected.push(value);
    } else {
      unselected.push(value);
    }
  });
  return [unselected, selected];
}

export function createScatter(name, x, y, marker, text, isBar) {
  return {
    name, x, y, marker, mode: 'markers', type: 'scatter', ...text && { text, hovertemplate: '%{text}' }, ...isBar && { type: 'bar', width: 1 },
  };
}
