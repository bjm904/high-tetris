let GAME = null;

const blockInit = (gameGlobal) => {
  GAME = gameGlobal;
};

const blockColors = [
  'red',
  'cyan',
  'green',
  'magenta',
  'orangered',
  'blue',
  'pink',
  'purple',
];

const getBlockSpawnPosition = () => ({
  x: Math.floor(Math.random() * (GAME.gridSize.width - 5)) + 1,
  y: 0,
});

const blockStructures = [
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 3, y: 0 },
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ],
  [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
  ],
  [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
  ],
  [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 },
  ],
];

const generateBlockStructure = () => {
  const structure = blockStructures[Math.floor(Math.random() * blockStructures.length)];
  const structureCopy = JSON.parse(JSON.stringify(structure));
  return structureCopy;
};

class Block {
  constructor(props) {
    this.id = props ? props.id : Math.random();
    this.subBlocks = props ? props.subBlocks : generateBlockStructure();
    this.color = props ? props.color : blockColors[Math.floor(Math.random() * blockColors.length)];
    this.isActive = props ? props.isActive : true;

    if (!props) {
      this.applyMovement(getBlockSpawnPosition());
    }
  }

  applyMovement(movementDelta) {
    this.subBlocks.forEach((subBlock) => {
      subBlock.x = Math.round((movementDelta.x + subBlock.x) * 10) / 10;
      subBlock.y = Math.round((movementDelta.y + subBlock.y) * 10) / 10;
    });
  }

  draw(gameData, context, size) {
    // Draw each sub block
    this.subBlocks.forEach((subBlock) => {
      context.beginPath();

      const percComplete = (gameData.rows[Math.round(subBlock.y)] / gameData.gridSize.width) / 0.7;
      if (percComplete >= 1) {
        // Row is complete
        context.strokeStyle = '#FFF';
        context.rect(
          size * subBlock.x,
          size * subBlock.y,
          size,
          size,
        );
      } else {
        // Set the color for this block
        context.strokeStyle = this.color;
        context.rect(
          size * subBlock.x + 1,
          size * subBlock.y + 1,
          size - 2,
          size - 2,
        );
      }
      context.fillStyle = `rgba(255, 255, 255, ${0.8 * percComplete})`;
      context.fill();

      if (percComplete < 1) {
        // Draw the block outline if row is not complete
        context.stroke();
      }
    });
  }

  makeNotActive() {
    this.isActive = false;
  }

  tryToApplyMovement(movementDelta) {
    const willCollideWithWall = this.checkIfWillCollideWithWall(movementDelta);
    const willCollideWithOtherBlock = this.checkIfWillCollideWithOtherBlock(movementDelta);

    const canApplyDelta = (!willCollideWithWall && !willCollideWithOtherBlock);
    if (canApplyDelta) {
      this.applyMovement(movementDelta);
    } else if (movementDelta.x === 0 && movementDelta.y > 0) {
      this.makeNotActive();
    } else if (movementDelta.x === 0 && movementDelta.y === 0) {
      // We're done
    } else {
      if (movementDelta.x > 0) {
        movementDelta.x -= 1;
      } else if (movementDelta.x < 0) {
        movementDelta.x += 1;
      } else if (movementDelta.y > 0) {
        movementDelta.y -= 1;
      } else if (movementDelta.y < 0) {
        movementDelta.y += 1;
      }
      this.tryToApplyMovement(movementDelta);
    }
  }

  checkIfWillCollideWithWall(movmentDelta) {
    return this.subBlocks.some((subBlock) => {
      const newSubBlockPos = {
        x: Math.round((subBlock.x + movmentDelta.x) * 10) / 10,
        y: Math.round((subBlock.y + movmentDelta.y) * 10) / 10,
      };

      // Check right wall
      if (newSubBlockPos.x + 1 > GAME.gridSize.width) {
        return true;
      }

      // Check left wall
      if (newSubBlockPos.x < 0) {
        return true;
      }

      // Check floor
      if (newSubBlockPos.y + 1 > GAME.gridSize.height) {
        return true;
      }

      // Must be good then
      return false;
    });
  }

  checkIfWillCollideWithOtherBlock(movmentDelta) {
    return this.subBlocks.some((subBlock) => {
      const newSubBlockPos = {
        x: subBlock.x + movmentDelta.x,
        y: subBlock.y + movmentDelta.y,
      };

      return GAME.blocks.some((blockOther) => {
        if (blockOther.id === this.id) {
          return false;
        }
        return !blockOther.subBlocks.every(subBlockOther => (
          newSubBlockPos.x > subBlockOther.x + 0.9
          || newSubBlockPos.x + 0.9 < subBlockOther.x
          || newSubBlockPos.y + 0.9 < subBlockOther.y
          || newSubBlockPos.y > subBlockOther.y + 0.9
        ));
      });
    });
  }
}

export { Block, blockInit };
