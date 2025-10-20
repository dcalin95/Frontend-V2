import React from 'react';
import './AdjustFontButton.css'; // dacă vrei să-l stilizezi frumos

const AdjustFontButton = () => {
  const increaseFont = () => {
    const root = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(root).fontSize);
    root.style.fontSize = (currentSize + 2) + "px"; // crește cu 2px
  };

  const decreaseFont = () => {
    const root = document.documentElement;
    const currentSize = parseFloat(getComputedStyle(root).fontSize);
    if (currentSize > 8) { // protecție să nu fie prea mic
      root.style.fontSize = (currentSize - 2) + "px"; // scade cu 2px
    }
  };

  return (
    <div className="adjust-font-buttons">
      <button onClick={decreaseFont}>A-</button>
      <button onClick={increaseFont}>A+</button>
    </div>
  );
};

export default AdjustFontButton;
