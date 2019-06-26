const PlaySound = (soundName) => {
  const sound = new Audio(`../sounds/${soundName}.wav`);
  sound.play();
};

export default PlaySound;
