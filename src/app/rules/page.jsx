"use client";

import { useState } from "react";

const RULES = {
  general: [
    "No se puede dibujar letras, números ni símbolos del teclado. Solo se permiten flechas.",
    "El dibujante no puede hablar tras ver la palabra.",
    "Quien adivina no puede mirar la palabra secreta."
  ],
  competitiva: [
    "Solo se permiten gestos simples de sí/no o cantidad. Nada de mímica relacionada con la palabra.",
    "Hay que decir la palabra o frase exacta y en el orden correcto.",
    "No se pueden reutilizar dibujos anteriores."
  ],
  pasarloBien: [
    "Vale con adivinar el concepto principal o parte de la palabra.",
    "Se puede combinar dibujo y mímica.",
    "Puedes usar dibujos anteriores para ayudarte.",
  ]
};

function RulesToggle({ variant, setVariant }) {
  return (
    <div className="flex gap-2 mb-6">
      <button
        className={`px-4 py-2 rounded-lg font-semibold transition-colors border border-border focus:outline-none ${variant === "competitiva" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-primary/10"}`}
        onClick={() => setVariant("competitiva")}
        type="button"
      >
        Variante competitiva
      </button>
      <button
        className={`px-4 py-2 rounded-lg font-semibold transition-colors border border-border focus:outline-none ${variant === "pasarloBien" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-primary/10"}`}
        onClick={() => setVariant("pasarloBien")}
        type="button"
      >
        Variante para pasarlo bien
      </button>
    </div>
  );
}

export default function RulesPage() {
  const [variant, setVariant] = useState("competitiva");

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 md:px-0 text-foreground">
      <h1 className="text-4xl font-extrabold mb-4 text-primary">Normas de Pictionario</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-2">¿Cómo se juega?</h2>
        <p className="mb-2">
          Un jugador dibuja una palabra secreta. Su equipo debe adivinarla antes de que acabe el tiempo. No se puede hablar ni escribir palabras, solo dibujar. El equipo que acierta avanza en el tablero. Gana quien llega primero a la meta.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Normas básicas</h2>
        <ul className="list-disc pl-6 space-y-2">
          {RULES.general.map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>
      <RulesToggle variant={variant} setVariant={setVariant} />
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {variant === "competitiva" ? "Variante competitiva" : "Variante para pasarlo bien"}
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          {(variant === "competitiva" ? RULES.competitiva : RULES.pasarloBien).map((rule, i) => (
            <li key={i}>{rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
