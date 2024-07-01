const LARGE = 11;
const SMALL = 6;

const MARKERS = {
  general: {
    selected: { size: LARGE, color: 'red' },
    unselected: { size: SMALL, color: 'black' },
  },
  user: {
    submitted: { size: LARGE, color: 'green' },
    none: { size: SMALL, color: 'green' },
    shared: { size: SMALL, color: 'green' },
    unshared: { size: SMALL, color: 'green', opacity: 0.3 },
  },
  user2: {
    submitted: { size: LARGE, color: 'blueviolet', symbol: 'diamond' },
    shared: { size: SMALL, color: 'blueviolet', symbol: 'diamond' },
    unshared: {
      size: SMALL, color: 'blueviolet', symbol: 'diamond', opacity: 0.3,
    },
  },
  average: {
    submitted: {
      size: LARGE,
      color: 'gray',
    },
    submitted2: {
      size: LARGE,
      color: 'gray',
      symbol: 'diamond',
    },
    none: {
      size: SMALL,
      color: 'gray',
      opacity: 0.5,
    },
  },
  bar: {
    user: { color: 'green', opacity: 0.3 },
    user2: { color: 'blueviolet', opacity: 0.4 },
  },
};

export default MARKERS;
