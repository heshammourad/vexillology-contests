const LARGE = 11;
const SMALL = 6;

const MARKERS = {
  general: {
    selected: { size: LARGE, color: 'red' },
    unselected: { size: SMALL, color: 'black' },
  },
  user1: {
    selected: { size: LARGE, color: 'red' },
    unselected: { size: SMALL, color: 'green' },
  },
  user2: {
    selected: { size: LARGE, color: 'blueviolet', symbol: 'diamond' },
    unselected: { size: SMALL, color: 'blue', symbol: 'diamond' },
  },
  average: {
    selected: {
      size: LARGE,
      color: 'red',
      symbol: 'circle-open',
      line: {
        width: 2,
      },
    },
    selected2: {
      size: LARGE,
      color: 'blueviolet',
      symbol: 'diamond-open',
      line: {
        width: 2,
      },
    },
    unselected: {
      size: SMALL,
      color: 'gray',
      symbol: 'circle-open',
      line: {
        width: 2,
      },
    },
  },
  bar: {
    user: { color: 'red', opacity: 0.4 },
    user2: { color: 'blueviolet', opacity: 0.4 },
  },
};

export default MARKERS;
