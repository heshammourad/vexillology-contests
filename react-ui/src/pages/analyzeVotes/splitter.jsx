/**
 * Returns [unselected, selected]
 * @param {number[]|string[]} array
 * @param {number[]|string[]} selectedPositions
 * @returns
 */
export function splitter(array, selectedPositions) {
  const unselected = [];
  const selected = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < array.length; i++) {
    if (selectedPositions.includes(i)) {
      selected.push(array[i]);
    } else {
      unselected.push(array[i]);
    }
  }

  return [unselected, selected];
}

export function createScatter(name, x, y, marker, text, isBar) {
  return {
    name, x, y, marker, mode: 'markers', type: 'scatter', ...text && { text, hovertemplate: '%{text}' }, ...isBar && { type: 'bar', width: 1 },
  };
}

export function trimUsername(username, chars = 6) {
  return `${username.length < chars ? username : username.substring(0, chars)}...`;
}

export function roundTwoDecimals(num) {
  return Math.round(num * 100) / 100;
}
