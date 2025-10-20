import React, { useEffect } from "react";
import "./ElectronAnimation.css";

const ElectronAnimation = () => {
  useEffect(() => {
    const container = document.querySelector(".electron-container");

    for (let i = 0; i < 50; i++) {
      const electron = document.createElement("div");
      electron.className = `electron ${["blue", "green", "orange", "purple"][Math.floor(Math.random() * 4)]}`;
      electron.style.setProperty("--direction-x", (Math.random() * 2 - 1).toFixed(2));
      electron.style.setProperty("--direction-y", (Math.random() * 2 - 1).toFixed(2));

      // Poziție inițială aleatorie
      electron.style.left = `${Math.random() * 100}%`;
      electron.style.top = `${Math.random() * 100}%`;

      container.appendChild(electron);

      // Elimină electronii după terminarea animației
      electron.addEventListener("animationend", () => container.removeChild(electron));
    }
  }, []);

  return <div className="electron-container"></div>;
};

export default ElectronAnimation;

