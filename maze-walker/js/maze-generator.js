function generateRandomMaze(
  width = 15,
  height = 15,
  complexity = 20, // higher = more random branches
  walls = 'W',
  paths = '.',
  entrySymbol = 'E',
  exitSymbol = 'X'
) {
  // Initialize all cells as walls
  const maze = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => walls)
  );

  // Pick a random odd coordinate within bounds
  function randomOdd(max) {
    let n = Math.floor(Math.random() * max);
    if (n % 2 === 0) n += 1;
    if (n >= max) n -= 2;
    return Math.max(1, n);
  }

  // Carving function (recursive backtracking)
  function carve(x, y) {
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0] // up, down, left, right
    ].sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        ny > 0 && ny < height - 1 &&
        nx > 0 && nx < width - 1 &&
        maze[ny][nx] === walls
      ) {
        maze[ny][nx] = paths;
        maze[y + dy / 2][x + dx / 2] = paths;
        carve(nx, ny);
      }
    }
  }

  // Random start (entry) position on an edge
  const edges = [
    [randomOdd(width - 1), 0],
    [randomOdd(width - 1), height - 1],
    [0, randomOdd(height - 1)],
    [width - 1, randomOdd(height - 1)],
  ];
  const entry = edges[Math.floor(Math.random() * edges.length)];
  maze[entry[1]][entry[0]] = entrySymbol;

  // Carve from just inside the entry point
  const startX = Math.min(Math.max(1, entry[0] + (entry[0] === 0 ? 1 : entry[0] === width - 1 ? -1 : 0)), width - 2);
  const startY = Math.min(Math.max(1, entry[1] + (entry[1] === 0 ? 1 : entry[1] === height - 1 ? -1 : 0)), height - 2);
  maze[startY][startX] = paths;

  // Carve the maze
  carve(startX, startY);

  // Apply complexity: add random extra openings
  for (let i = 0; i < complexity; i++) {
    const x = randomOdd(width - 1);
    const y = randomOdd(height - 1);
    if (maze[y][x] === walls) {
      maze[y][x] = paths;
    }
  }

  // Random exit on opposite edge (ensure it’s on a path)
  let exit;
  for (let tries = 0; tries < 50; tries++) {
    const candidate = edges[Math.floor(Math.random() * edges.length)];
    if (maze[candidate[1]]?.[candidate[0]] === paths) {
      exit = candidate;
      break;
    }
  }

  if (!exit) exit = [width - 2, height - 2];
  maze[exit[1]][exit[0]] = exitSymbol;

  return maze;
}

// 🧱 Print nicely
function printMaze(maze) {
  console.log(maze.map(row => row.map(cell => cell === 'W' ? '+' : (cell === "." ? " " : cell)).join(' ')).join('\n'));
}

// Example
// const maze = generateRandomMaze(21, 21, 15);
// printMaze(maze);
