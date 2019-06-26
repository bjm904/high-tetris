const pressedKeys = new Set();

window.onkeydown = (event) => {
  pressedKeys.add(event.keyCode);
};
window.onkeyup = (event) => {
  pressedKeys.delete(event.keyCode);
};

const PressedKeys = pressedKeys;

export default PressedKeys;
