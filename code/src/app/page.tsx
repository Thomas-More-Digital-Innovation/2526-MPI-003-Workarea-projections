"use client";

import { Navbar, Button, Popup, GridCard } from "@/components";
import { useState } from "react";

interface CardData {
  id: number;
  title: string;
  description: string;
}

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Temporary static data (later from DB)
  const cards: CardData[] = [
    { id: 1, title: "Pralines verpakken", description: "Bij deze taak steek je 20 pralines in een doosje voor dat het gesloten wordt." },
    { id: 2, title: "Test 1", description: "Bij deze taak steek je 20 pralines in een doosje voor dat het gesloten wordt." },
    { id: 3, title: "Test 2", description: "Bij deze taak steek je 20 pralines in een doosje voor dat het gesloten wordt." },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]/20">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <Button text="Grid toevoegen (tijdelijke link)" onClick={() => setShowPopup(true)} />

        {/* Dynamische GridCards */}
        <div className="grid grid-cols-6 gap-4">
          {cards.map((card) => (
            <GridCard
              key={card.id}
              id={card.id}
              title={card.title}
              description={card.description}
              active={selectedCard === card.id}
              onSelect={setSelectedCard}
            />
          ))}
        </div>
      </main>

      {showPopup && <Popup popupType="gridPreset" />}
    </div>
  );
} 