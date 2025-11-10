"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer } from "@/components";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import preset from "./preset/page";

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
        console.error("Failed to load presets", err);
      }
    };

    loadPresets();
  }, []);

  function handleCalibration() {
    router.push("/calibration");
  }

  async function handleStart() {
    if (selectedCard === null) {
      alert("Please select a preset first");
      return;
    }

    try {
      const api = (globalThis as any)?.electronAPI;
      
      console.log("🔍 Available API methods:", Object.keys(api || {}));
      
      // Try to find the selected preset in our already loaded presets
      const selectedPreset = presets.find(p => p.presetId === selectedCard);
      
      console.log("Selected preset:", selectedPreset);
      
      if (!selectedPreset) {
        alert("Selected preset not found");
        return;
      }

      // Check if we have gridLayoutId directly from the preset
      if (selectedPreset.gridLayoutId) {
        console.log("✅ Using gridLayoutId from preset:", selectedPreset.gridLayoutId);
        localStorage.setItem('currentGridLayoutId', selectedPreset.gridLayoutId.toString());
        localStorage.setItem('currentPresetId', selectedCard.toString());
        localStorage.setItem('currentStepIndex', '0'); // Reset step index
        router.push("/projection");
        return;
      }

      // If not, try to get steps
      if (api?.getStepsByPresetId) {
        const steps = await api.getStepsByPresetId(selectedCard);
        console.log("Steps for preset:", steps);

        if (!steps || steps.length === 0) {
          alert("No steps found for this preset");
          return;
        }

        const firstStep = steps[0];
        
        if (!firstStep.gridLayoutId) {
          alert("First step has no grid layout");
          return;
        }

        localStorage.setItem('currentGridLayoutId', firstStep.gridLayoutId.toString());
        localStorage.setItem('currentPresetId', selectedCard.toString());
        localStorage.setItem('currentStepIndex', '0'); // Reset step index to start from beginning
        router.push("/projection");
      } else {
        console.error("❌ getStepsByPresetId not found on electronAPI");
        console.log("Available methods:", Object.keys(api || {}));
        alert("Cannot load preset steps - API method not available");
      }
      
    } catch (err) {
      console.error("❌ Failed to load preset steps", err);
      console.error("Error details:", err);
      alert(`Error loading preset configuration: ${err}`);
    }
  }

  return (
    <div className="p-4 min-h-screen bg-[var(--color-secondary)]/20 flex flex-col justify-between gap-4">
      <Navbar />

      <main
        id="Presets"
        className="bg-white shadow-md px-3 py-3 flex justify-between rounded-2xl w-full flex-1"
      >
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
              <p className="text-sm text-[var(--color-text)] mt-2">
                Voeg een nieuw grid toe met de knop hierboven.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer>
        <Button
          type="secondary"
          text={"Bewerken"}
          onClick={() => {}}
          fullWidth={false}
          fixedWidth={true}
        />
        <Button
          type="primary"
          text={"Start"}
          onClick={handleStart}
          fullWidth={false}
          fixedWidth={true}
        />
      </Footer>
    </div>
  );
}