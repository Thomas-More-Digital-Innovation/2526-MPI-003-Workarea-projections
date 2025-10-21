"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer } from "@/components";

interface CardData {
  id: number;
  title: string;
  description: string;
}

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [presets, setPresets] = useState<any[]>([]);

  const handleSelect = (id: string | number) => {
    const num = Number(id);
    setSelectedCard((prev) => (prev === num ? null : num));
  };

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const api = (globalThis as any)?.electronAPI;
        if (api?.getPresets) {
          const result = await api.getPresets();
          setPresets(result || []);
        }
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    };

    loadPresets();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-secondary)]/20">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <Button
          text="Grid toevoegen (tijdelijke link)"
          onClick={() => setShowPopup(true)}
        />

        <div className="mt-4">
          <Button
            text={selectedCard ? "Actie op geselecteerde preset" : "Selecteer een preset om actie te doen"}
            onClick={() => {
              if (selectedCard != null) {
                // replace with real action later
                console.log('Action for selected preset', selectedCard);
              }
            }}
            disabled={selectedCard == null}
            type="secondary"
          />
        </div>

        {/* Dynamische GridCards (from DB) */}
        <div className="grid grid-cols-6 gap-4 mt-6">
          {presets.length > 0 ? (
            presets.map((p) => (
              <GridCard
                key={p.gridLayoutId}
                id={p.gridLayoutId}
                title={`Preset ${p.gridLayoutId}`}
                description={`${p.amount} ${p.shape} ${p.size}`}
                preset={p}
                active={selectedCard === p.gridLayoutId}
                onSelect={handleSelect}
              />
            ))
          ) : (
            <div className="col-span-6 p-8 rounded-2xl bg-[var(--color-popup)] text-center">
              <p className="text-lg font-semibold">Geen presets gevonden</p>
              <p className="text-sm text-[var(--color-text)] mt-2">Voeg een nieuw grid toe met de knop hierboven.</p>
            </div>
          )}
        </div>
      </main>

      {/* Popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <Popup popupType="gridPreset" onClose={() => setShowPopup(false)} />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setShowPopup(false)}
          >
            &times;
          </button>
        </div>
      )}

      {/*Footer*/}
      <Footer></Footer>
    </div>
  );
}
