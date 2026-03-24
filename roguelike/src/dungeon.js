// Dungeon Generation - BSP Algorithm
var Dungeon = (function() {
  'use strict';

  var TILE = {
    WALL: 0,
    FLOOR: 1,
    CORRIDOR: 2,
    STAIRS_DOWN: 3
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

    // Leaf node - create a room
    var roomW = randInt(4, Math.min(10, node.w - 2));
    var roomH = randInt(4, Math.min(8, node.h - 2));
    var roomX = randInt(node.x + 1, node.x + node.w - roomW - 1);
    var roomY = randInt(node.y + 1, node.y + node.h - roomH - 1);

    node.room = { x: roomX, y: roomY, w: roomW, h: roomH };
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

  function carveRoom(grid, room) {
    for (var y = room.y; y < room.y + room.h; y++) {
      for (var x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
          grid[y][x] = TILE.FLOOR;
        }
      }
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

  function generateFloor(width, height) {
    width = width || 40;
    height = height || 30;

    var grid = createGrid(width, height);
    var root = new BSPNode(0, 0, width, height);

    // Depth 3 gives ~4-8 rooms
    splitNode(root, 3);
    createRoom(root);

    // Carve rooms
    var rooms = [];
    collectRooms(root, rooms);
    rooms.forEach(function(room) {
      carveRoom(grid, room);
    });

    // Connect rooms
    connectRooms(grid, root);

    // Player start: center of first room
    var startRoom = rooms[0];
    var startPos = getRoomCenter(startRoom);

    // Stairs: random room that isn't the start room
    var stairsRoomIdx = randInt(1, rooms.length - 1);
    var stairsRoom = rooms[stairsRoomIdx];
    var stairsPos = getRoomCenter(stairsRoom);
    grid[stairsPos.y][stairsPos.x] = TILE.STAIRS_DOWN;

    return {
      grid: grid,
      rooms: rooms,
      stairs: stairsPos,
      playerStart: startPos,
      width: width,
      height: height
    };
  }

  return {
    TILE: TILE,
    generateFloor: generateFloor
  };
})();
