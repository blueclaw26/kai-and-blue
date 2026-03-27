// Dungeon Generation - BSP Algorithm
var Dungeon = (function() {
  'use strict';

  var TILE = {
    WALL: 0,
    FLOOR: 1,
    CORRIDOR: 2,
    STAIRS_DOWN: 3,
    WATER: 4,
    LAVA: 6
  };

  function createGrid(width, height) {
    var grid = [];
    for (var y = 0; y < height; y++) {
      grid[y] = [];
      for (var x = 0; x < width; x++) {
        grid[y][x] = TILE.WALL;
      }
    }
    return grid;
  }

  // BSP Node
  function BSPNode(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.left = null;
    this.right = null;
    this.room = null;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function splitNode(node, depth) {
    if (depth <= 0 || node.w < 10 || node.h < 10) return;

    var splitH = node.w < node.h ? true : node.h < node.w ? false : Math.random() < 0.5;

    if (splitH) {
      var splitY = randInt(node.y + 5, node.y + node.h - 5);
      node.left = new BSPNode(node.x, node.y, node.w, splitY - node.y);
      node.right = new BSPNode(node.x, splitY, node.w, node.y + node.h - splitY);
    } else {
      var splitX = randInt(node.x + 5, node.x + node.w - 5);
      node.left = new BSPNode(node.x, node.y, splitX - node.x, node.h);
      node.right = new BSPNode(splitX, node.y, node.x + node.w - splitX, node.h);
    }

    splitNode(node.left, depth - 1);
    splitNode(node.right, depth - 1);
  }

  function createRoom(node) {
    if (node.left || node.right) {
      if (node.left) createRoom(node.left);
      if (node.right) createRoom(node.right);
      return;
    }

    // Leaf node - create a room (10% chance L-shaped)
    var roomW = randInt(4, Math.min(10, node.w - 2));
    var roomH = randInt(4, Math.min(8, node.h - 2));
    var roomX = randInt(node.x + 1, node.x + node.w - roomW - 1);
    var roomY = randInt(node.y + 1, node.y + node.h - roomH - 1);

    if (Math.random() < 0.10 && roomW >= 6 && roomH >= 6) {
      // L-shaped room: combine two overlapping rectangles
      var halfW = Math.floor(roomW / 2);
      var halfH = Math.floor(roomH / 2);
      node.room = {
        x: roomX, y: roomY, w: roomW, h: roomH,
        lShaped: true,
        rect1: { x: roomX, y: roomY, w: roomW, h: halfH + 1 },
        rect2: { x: roomX, y: roomY + halfH, w: halfW + 1, h: roomH - halfH }
      };
    } else {
      node.room = { x: roomX, y: roomY, w: roomW, h: roomH };
    }
  }

  function getRoom(node) {
    if (node.room) return node.room;
    if (node.left) {
      var leftRoom = getRoom(node.left);
      if (leftRoom) return leftRoom;
    }
    if (node.right) {
      var rightRoom = getRoom(node.right);
      if (rightRoom) return rightRoom;
    }
    return null;
  }

  function getRoomCenter(room) {
    return {
      x: Math.floor(room.x + room.w / 2),
      y: Math.floor(room.y + room.h / 2)
    };
  }

  function carveRoom(grid, room, roomIndex) {
    if (room.lShaped) {
      // Carve two rectangles for L-shape
      var r1 = room.rect1;
      var r2 = room.rect2;
      for (var y = r1.y; y < r1.y + r1.h; y++) {
        for (var x = r1.x; x < r1.x + r1.w; x++) {
          if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
            grid[y][x] = TILE.FLOOR;
          }
        }
      }
      for (var y = r2.y; y < r2.y + r2.h; y++) {
        for (var x = r2.x; x < r2.x + r2.w; x++) {
          if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
            grid[y][x] = TILE.FLOOR;
          }
        }
      }
    } else {
      for (var y = room.y; y < room.y + room.h; y++) {
        for (var x = room.x; x < room.x + room.w; x++) {
          if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
            grid[y][x] = TILE.FLOOR;
          }
        }
      }
    }
    if (roomIndex !== undefined) {
      room.roomIndex = roomIndex;
    }
  }

  function carveCorridor(grid, x1, y1, x2, y2) {
    var x = x1;
    var y = y1;

    // L-shaped corridor: go horizontal first, then vertical
    while (x !== x2) {
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        if (grid[y][x] === TILE.WALL) {
          grid[y][x] = TILE.CORRIDOR;
        }
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
        if (grid[y][x] === TILE.WALL) {
          grid[y][x] = TILE.CORRIDOR;
        }
      }
      y += y < y2 ? 1 : -1;
    }
  }

  function connectRooms(grid, node) {
    if (!node.left || !node.right) return;

    var leftRoom = getRoom(node.left);
    var rightRoom = getRoom(node.right);

    if (leftRoom && rightRoom) {
      var c1 = getRoomCenter(leftRoom);
      var c2 = getRoomCenter(rightRoom);
      carveCorridor(grid, c1.x, c1.y, c2.x, c2.y);
    }

    connectRooms(grid, node.left);
    connectRooms(grid, node.right);
  }

  function collectRooms(node, rooms) {
    if (node.room) {
      rooms.push(node.room);
    }
    if (node.left) collectRooms(node.left, rooms);
    if (node.right) collectRooms(node.right, rooms);
  }

  // --- Big Room generator (大部屋) ---
  function generateBigRoom(width, height) {
    var grid = createGrid(width, height);

    // One giant room filling most of the map (leave 1-tile border)
    var room = { x: 1, y: 1, w: width - 2, h: height - 2 };
    carveRoom(grid, room);

    // Add room bounds
    room.x1 = room.x;
    room.y1 = room.y;
    room.x2 = room.x + room.w - 1;
    room.y2 = room.y + room.h - 1;

    var rooms = [room];

    // Player start
    var startPos = { x: randInt(2, 6), y: randInt(2, 6) };

    // Stairs somewhere far from start
    var stairsPos = { x: randInt(width - 8, width - 3), y: randInt(height - 8, height - 3) };
    grid[stairsPos.y][stairsPos.x] = TILE.STAIRS_DOWN;

    return {
      grid: grid,
      rooms: rooms,
      stairs: stairsPos,
      playerStart: startPos,
      width: width,
      height: height,
      floorType: 'big_room'
    };
  }

  // --- Maze generator (迷路フロア) ---
  function generateMaze(width, height) {
    var grid = createGrid(width, height);

    // Use recursive backtracker on odd cells
    // Work on a sub-grid of odd coordinates
    var visited = {};
    var stack = [];

    // Start at (1,1)
    var sx = 1, sy = 1;
    grid[sy][sx] = TILE.CORRIDOR;
    visited[sx + ',' + sy] = true;
    stack.push({ x: sx, y: sy });

    while (stack.length > 0) {
      var curr = stack[stack.length - 1];
      var neighbors = [];
      var mazeDirs = [[0, -2], [0, 2], [-2, 0], [2, 0]];

      for (var d = 0; d < mazeDirs.length; d++) {
        var nx = curr.x + mazeDirs[d][0];
        var ny = curr.y + mazeDirs[d][1];
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[nx + ',' + ny]) {
          neighbors.push({ x: nx, y: ny, mx: curr.x + mazeDirs[d][0] / 2, my: curr.y + mazeDirs[d][1] / 2 });
        }
      }

      if (neighbors.length > 0) {
        var next = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[next.my][next.mx] = TILE.CORRIDOR;
        grid[next.y][next.x] = TILE.CORRIDOR;
        visited[next.x + ',' + next.y] = true;
        stack.push({ x: next.x, y: next.y });
      } else {
        stack.pop();
      }
    }

    // Add a few tiny rooms (2x2) at random maze junctions
    var rooms = [];
    var roomCount = 3 + Math.floor(Math.random() * 3);
    var attempts = 0;
    while (rooms.length < roomCount && attempts < 100) {
      attempts++;
      var rx = randInt(2, width - 5);
      var ry = randInt(2, height - 5);
      // Check if near a corridor
      var nearCorridor = false;
      for (var dy = -1; dy <= 3; dy++) {
        for (var dx = -1; dx <= 3; dx++) {
          if (ry + dy >= 0 && ry + dy < height && rx + dx >= 0 && rx + dx < width) {
            if (grid[ry + dy][rx + dx] === TILE.CORRIDOR) nearCorridor = true;
          }
        }
      }
      if (!nearCorridor) continue;

      var room = { x: rx, y: ry, w: 3, h: 3 };
      carveRoom(grid, room);
      room.x1 = room.x;
      room.y1 = room.y;
      room.x2 = room.x + room.w - 1;
      room.y2 = room.y + room.h - 1;
      rooms.push(room);
    }

    // Ensure connectivity: connect first room to maze
    if (rooms.length > 0) {
      for (var ri = 0; ri < rooms.length; ri++) {
        var rc = getRoomCenter(rooms[ri]);
        // Find nearest corridor tile
        var best = null;
        var bestDist = 999;
        for (var cy = 1; cy < height - 1; cy++) {
          for (var cx = 1; cx < width - 1; cx++) {
            if (grid[cy][cx] === TILE.CORRIDOR) {
              var dist = Math.abs(cx - rc.x) + Math.abs(cy - rc.y);
              if (dist < bestDist) {
                bestDist = dist;
                best = { x: cx, y: cy };
              }
            }
          }
        }
        if (best) {
          carveCorridor(grid, rc.x, rc.y, best.x, best.y);
        }
      }
    }

    // If no rooms were created, make a fake room at the start
    if (rooms.length === 0) {
      var fakeRoom = { x: 1, y: 1, w: 3, h: 3 };
      carveRoom(grid, fakeRoom);
      fakeRoom.x1 = 1; fakeRoom.y1 = 1; fakeRoom.x2 = 3; fakeRoom.y2 = 3;
      rooms.push(fakeRoom);
    }

    // Player start
    var startRoom = rooms[0];
    var startPos = getRoomCenter(startRoom);

    // Stairs: far from player
    var stairsPlaced = false;
    for (var tries = 0; tries < 200; tries++) {
      var stx = randInt(1, width - 2);
      var sty = randInt(1, height - 2);
      if (grid[sty][stx] !== TILE.WALL && grid[sty][stx] !== TILE.STAIRS_DOWN) {
        var sdist = Math.abs(stx - startPos.x) + Math.abs(sty - startPos.y);
        if (sdist > 15 || tries > 150) {
          grid[sty][stx] = TILE.STAIRS_DOWN;
          stairsPlaced = true;
          var stairsPos = { x: stx, y: sty };
          break;
        }
      }
    }
    if (!stairsPlaced) {
      // Fallback: put stairs at last corridor tile found
      for (var fy = height - 2; fy > 0; fy--) {
        for (var fx = width - 2; fx > 0; fx--) {
          if (grid[fy][fx] === TILE.CORRIDOR || grid[fy][fx] === TILE.FLOOR) {
            grid[fy][fx] = TILE.STAIRS_DOWN;
            stairsPos = { x: fx, y: fy };
            stairsPlaced = true;
            break;
          }
        }
        if (stairsPlaced) break;
      }
    }

    return {
      grid: grid,
      rooms: rooms,
      stairs: stairsPos || { x: 1, y: 1 },
      playerStart: startPos,
      width: width,
      height: height,
      floorType: 'maze'
    };
  }

  function generateFloor(width, height, floorNum) {
    width = width || 40;
    height = height || 30;
    floorNum = floorNum || 1;

    // Special floor type rolls
    if (floorNum >= B('dungeon.mazeMinFloor', 8) && Math.random() < B('dungeon.mazeChance', 0.05)) {
      return generateMaze(width, height);
    }
    if (floorNum >= B('dungeon.bigRoomMinFloor', 5) && Math.random() < B('dungeon.bigRoomChance', 0.05)) {
      return generateBigRoom(width, height);
    }

    var grid = createGrid(width, height);
    var root = new BSPNode(0, 0, width, height);

    // Depth 3 gives ~4-8 rooms
    splitNode(root, 3);
    createRoom(root);

    // Carve rooms
    var rooms = [];
    collectRooms(root, rooms);
    rooms.forEach(function(room, idx) {
      carveRoom(grid, room, idx);
    });

    // Connect rooms
    connectRooms(grid, root);

    // Extra corridors: 20% chance for an additional loop-creating corridor
    if (rooms.length >= 3 && Math.random() < 0.20) {
      var rA = Math.floor(Math.random() * rooms.length);
      var rB = Math.floor(Math.random() * rooms.length);
      var maxAttempts = 10;
      while (rB === rA && maxAttempts-- > 0) {
        rB = Math.floor(Math.random() * rooms.length);
      }
      if (rA !== rB) {
        var cA = getRoomCenter(rooms[rA]);
        var cB = getRoomCenter(rooms[rB]);
        carveCorridor(grid, cA.x, cA.y, cB.x, cB.y);
      }
    }

    // Water/lava pools: poolChance of rooms get a small pool in the center
    for (var pi = 0; pi < rooms.length; pi++) {
      if (rooms[pi].w >= 5 && rooms[pi].h >= 5 && Math.random() < B('dungeon.poolChance', 0.10)) {
        var pr = rooms[pi];
        var poolType = (floorNum >= B('dungeon.lavaMinFloor', 20) && Math.random() < B('dungeon.lavaChance', 0.4)) ? TILE.LAVA : TILE.WATER;
        var cx = Math.floor(pr.x + pr.w / 2);
        var cy = Math.floor(pr.y + pr.h / 2);
        // Small 2x2 pool
        for (var pdy = 0; pdy <= 1; pdy++) {
          for (var pdx = 0; pdx <= 1; pdx++) {
            var ppx = cx + pdx;
            var ppy = cy + pdy;
            if (ppy > pr.y && ppy < pr.y + pr.h - 1 && ppx > pr.x && ppx < pr.x + pr.w - 1) {
              if (grid[ppy][ppx] === TILE.FLOOR) {
                grid[ppy][ppx] = poolType;
              }
            }
          }
        }
        rooms[pi].hasPool = poolType;
      }
    }

    // Add room bounds for FOV system
    for (var r = 0; r < rooms.length; r++) {
      rooms[r].x1 = rooms[r].x;
      rooms[r].y1 = rooms[r].y;
      rooms[r].x2 = rooms[r].x + rooms[r].w - 1;
      rooms[r].y2 = rooms[r].y + rooms[r].h - 1;
    }

    // Player start: center of first room
    var startRoom = rooms[0];
    var startPos = getRoomCenter(startRoom);

    // Stairs: random room that isn't the start room
    var stairsRoomIdx = randInt(1, rooms.length - 1);
    var stairsRoom = rooms[stairsRoomIdx];
    var stairsPos = getRoomCenter(stairsRoom);
    grid[stairsPos.y][stairsPos.x] = TILE.STAIRS_DOWN;

    // Build roomMap grid: maps each tile to its room index (-1 = not in a room)
    var roomMap = [];
    for (var rmy = 0; rmy < height; rmy++) {
      roomMap[rmy] = [];
      for (var rmx = 0; rmx < width; rmx++) {
        roomMap[rmy][rmx] = -1;
      }
    }
    for (var ri = 0; ri < rooms.length; ri++) {
      var rm = rooms[ri];
      for (var rry = rm.y; rry < rm.y + rm.h; rry++) {
        for (var rrx = rm.x; rrx < rm.x + rm.w; rrx++) {
          if (rry >= 0 && rry < height && rrx >= 0 && rrx < width) {
            roomMap[rry][rrx] = ri;
          }
        }
      }
    }

    // Monster House: chance scales with depth (configurable via BALANCE)
    var mhTable = B('dungeon.monsterHouseTable', [[3,10,0.08],[11,30,0.12],[31,60,0.18],[61,99,0.25]]);
    var mhChance = 0;
    for (var mhi = 0; mhi < mhTable.length; mhi++) {
      if (floorNum >= mhTable[mhi][0] && floorNum <= mhTable[mhi][1]) {
        mhChance = mhTable[mhi][2];
        break;
      }
    }
    var monsterHouseRoom = null;
    if (floorNum >= 3 && Math.random() < mhChance && rooms.length > 2) {
      // Pick a room that isn't the start room and isn't too small
      var mhCandidates = [];
      for (var mi = 1; mi < rooms.length; mi++) {
        if (rooms[mi].w >= 5 && rooms[mi].h >= 4) {
          mhCandidates.push(rooms[mi]);
        }
      }
      if (mhCandidates.length > 0) {
        monsterHouseRoom = mhCandidates[Math.floor(Math.random() * mhCandidates.length)];
      }
    }

    return {
      grid: grid,
      rooms: rooms,
      roomMap: roomMap,
      stairs: stairsPos,
      playerStart: startPos,
      width: width,
      height: height,
      floorType: 'normal',
      monsterHouseRoom: monsterHouseRoom
    };
  }

  // Convert a floor to big room (for 大部屋の巻物)
  function convertToBigRoom(dungeon) {
    var grid = dungeon.grid;
    var width = dungeon.width;
    var height = dungeon.height;

    for (var y = 1; y < height - 1; y++) {
      for (var x = 1; x < width - 1; x++) {
        if (grid[y][x] === TILE.WALL) {
          grid[y][x] = TILE.FLOOR;
        }
      }
    }

    // Replace rooms with one big room
    var bigRoom = { x: 1, y: 1, w: width - 2, h: height - 2 };
    bigRoom.x1 = 1;
    bigRoom.y1 = 1;
    bigRoom.x2 = width - 3;
    bigRoom.y2 = height - 3;
    dungeon.rooms = [bigRoom];
  }

  return {
    TILE: TILE,
    generateFloor: generateFloor,
    convertToBigRoom: convertToBigRoom
  };
})();
