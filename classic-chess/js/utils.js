function getCellWidth(screenWidth, screenHeight, gridCount) {
  // Add optional padding or margin if needed (currently 0)
  const padding = 150;
  const availableWidth = Math.min(screenWidth, screenHeight) - padding;

  // Divide total width by number of columns (grids)
  const cellWidth = availableWidth / gridCount;

  return cellWidth;
}

const limiterMap = (i, j, callback) => {
  const _i = Math.max(0, Math.min(i, 7));
  const _j = Math.max(0, Math.min(j, 7));
  if (i === _i && j === _j) callback(i, j);
};

const checkIsOpponent = (piece) => {
  return (piece === piece?.toUpperCase() && playerTurn != 0) || (piece === piece?.toLowerCase() && playerTurn != 1)
};

const sumMap = (firstMap, secondMap) => firstMap.map((row, i) => row.map((cell, j) => {
  if (cell === null & secondMap[i][j] === null) return null;
  return (cell != null ? (typeof cell === 'string' ? 1 : cell) : 0) + (secondMap[i][j] != null ? (typeof secondMap[i][j] === 'string' ? 1 : secondMap[i][j]) : 0);
}));