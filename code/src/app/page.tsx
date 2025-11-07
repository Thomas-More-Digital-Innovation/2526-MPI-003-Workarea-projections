"use client";
"use client";


import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer } from "@/components";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";

interface CardData {
  id: number;
  title: string;
  description: string;
}

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const router = useRouter();

  const handleSelect = (id: string | number) => {
    const num = Number(id);
    setSelectedCard((prev) => (prev === num ? null : num));
  };

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const api = (globalThis as any)?.electronAPI;
        if (api?.getPresetsWithGridLayouts) {
          const result = await api.getPresetsWithGridLayouts();
          setPresets(result || []);
        }
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    };

    loadPresets();
  }, []);
    
    function handleCalibration() {
    router.push("/calibration");
  }

  return (
    <div className="p-4 min-h-screen bg-[var(--color-secondary)]/20 flex flex-col justify-between gap-4">

      <Navbar />

      <main id="Presets" className="bg-white shadow-md px-3 py-3 flex justify-between rounded-2xl w-full flex-1">
        <div className="grid grid-cols-6 gap-6">
          {presets.length > 0 ? (
            presets.map((p) => (
              <GridCard
                key={p.presetId}
                id={p.presetId}
                title={p.name}
                description={p.description}
                preset={p.gridLayoutId ? p : undefined}
                active={selectedCard === p.presetId}
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
        
        {/* <Button onClick={handleCalibration} text="Start Calibratie" />
        <Button text="Grid toevoegen (tijdelijke link)" onClick={() => setShowPopup(true)} /> */}
      </main>

      <Footer>
        <Button type="secondary"  text={"Bewerken"} onClick={() => {}} fullWidth={false} fixedWidth={true} />
        <Button type="primary" text={"Start"} onClick={() => {}} fullWidth={false} fixedWidth={true} />
      </Footer>
    </div>
  );
}
