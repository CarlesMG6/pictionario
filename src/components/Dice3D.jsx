import React, { useEffect, useRef } from "react";
import "./Dice3D.css";

// Dice3D: dado 3D animado. Recibe value (1-6) y animate (bool)
export default function Dice3D({ value = 1, animate = false }) {
  const diceRef = useRef();

  // Rotaciones para cada cara
  const faces = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(-90deg) rotateY(0deg)",
    3: "rotateX(0deg) rotateY(-90deg)",
    4: "rotateX(0deg) rotateY(90deg)",
    5: "rotateX(90deg) rotateY(0deg)",
    6: "rotateX(0deg) rotateY(180deg)",
  };

  useEffect(() => {
    if (animate && diceRef.current) {
      // Reinicia animación
      diceRef.current.classList.remove("roll");
      void diceRef.current.offsetWidth; // trigger reflow
      diceRef.current.classList.add("roll");
    }
  }, [value, animate]);

  // Calcula la rotación final para la cara
  const finalTransform = faces[value] || faces[1];

  return (
    <div className="dice3d-container">
      <div
        className={`dice3d ${animate ? "roll" : ""}`}
        ref={diceRef}
        style={{ "--final-transform": finalTransform }}
      >
        <div className="face face1">1</div>
        <div className="face face2">2</div>
        <div className="face face3">3</div>
        <div className="face face4">4</div>
        <div className="face face5">5</div>
        <div className="face face6">6</div>
      </div>
    </div>
  );
}
