let GAME = null;

const blockInit = (gameGlobal) => {
  GAME = gameGlobal;
};


const blockColors = [
  'red',
  'cyan',
  'green',
  'magenta',
  'white',
  'blue',
  'pink',
  'purple',
];

const getBlockSpawnPosition = () => ({
  x: GAME.gridSize.width / 2,
  y: -1,
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
    { x: 1, y: 1 },
    { x: 1, y: 2 },
  ],
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 1, y: 1 },
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
      subBlock.x += movementDelta.x;
      subBlock.y += movementDelta.y;
    });
  }

  draw(context, size) {
    // Set the color for this block
    context.strokeStyle = this.color;

    context.beginPath();

    // Draw each sub block
    this.subBlocks.forEach((subBlock) => {
      context.rect(
        size * subBlock.x + 1,
        size * subBlock.y + 1,
        size - 2,
        size - 2,
      );
    });

    // Draw the block
    context.stroke();
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
    } else if (movementDelta.x === 0 && movementDelta.y === 1) {
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
        x: subBlock.x + movmentDelta.x,
        y: subBlock.y + movmentDelta.y,
      };

      // Check right wall
      if (newSubBlockPos.x >= GAME.gridSize.width) {
        return true;
      }

      // Check left wall
      if (newSubBlockPos.x < 0) {
        return true;
      }

      // Check floor
      if (newSubBlockPos.y >= GAME.gridSize.height) {
        return true;
      }

      // Check right ceiling?
      if (newSubBlockPos.y < 0) {
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
        return blockOther.subBlocks.some(subBlockOther => (
          newSubBlockPos.x === subBlockOther.x && newSubBlockPos.y === subBlockOther.y
        ));
      });
    });
  }
}

export { Block, blockInit };
