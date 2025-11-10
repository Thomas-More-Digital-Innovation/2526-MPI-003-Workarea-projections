"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer, Toast } from "@/components";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
  };

  const handleSelect = (id: string | number) => {
    const num = Number(id);
    setSelectedCard((prev) => (prev === num ? null : num));
  };

  // Filter presets based on search query
  const filteredPresets = presets.filter(preset => 
    preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    preset.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      showToast("Selecteer eerst een preset", "warning");
      return;
    }

    try {
      const api = (globalThis as any)?.electronAPI;
      
      console.log("🔍 Available API methods:", Object.keys(api || {}));
      
      // Try to find the selected preset in our already loaded presets
      const selectedPreset = presets.find(p => p.presetId === selectedCard);
      
      console.log("Selected preset:", selectedPreset);
      
      if (!selectedPreset) {
        showToast("Geselecteerde preset niet gevonden", "error");
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
          showToast("Geen stappen gevonden voor deze preset", "error");
          return;
        }

        const firstStep = steps[0];
        
        if (!firstStep.gridLayoutId) {
          showToast("Eerste stap heeft geen grid layout", "error");
          return;
        }

        localStorage.setItem('currentGridLayoutId', firstStep.gridLayoutId.toString());
        localStorage.setItem('currentPresetId', selectedCard.toString());
        localStorage.setItem('currentStepIndex', '0'); // Reset step index to start from beginning
        router.push("/projection");
      } else {
        console.error("❌ getStepsByPresetId not found on electronAPI");
        console.log("Available methods:", Object.keys(api || {}));
        showToast("Kan preset stappen niet laden - API methode niet beschikbaar", "error");
      }
      
    } catch (err) {
      console.error("❌ Failed to load preset steps", err);
      console.error("Error details:", err);
      showToast(`Fout bij laden preset configuratie: ${err}`, "error");
    }
  }

  return (
    <div className="h-screen bg-[var(--color-secondary)]/20 flex flex-col">
      <div className="p-4 pb-0 flex-shrink-0">
        <Navbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      <main className="bg-white shadow-md rounded-2xl me-4 mt-4 ml-4 flex flex-1 min-h-0">
        {/* Scrollable content wrapper */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {filteredPresets.length > 0 ? (
            <div className="flex flex-wrap gap-6">
              {filteredPresets.map((p) => (
                <GridCard
                  key={p.presetId}
                  id={p.presetId}
                  title={p.name}
                  description={p.description}
                  preset={p.gridLayoutId ? p : undefined}
                  active={selectedCard === p.presetId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : presets.length > 0 ? (
            <div className="flex flex-1 items-center justify-center h-full">
              <div className="p-8 rounded-2xl text-center">
                <p className="text-lg font-semibold">Geen presets gevonden voor "{searchQuery}"</p>
                <p className="text-sm text-[var(--color-text)] mt-2">
                  Probeer een andere zoekterm.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center h-full">
              <div className="p-8 rounded-2xl text-center">
                <p className="text-lg font-semibold">Geen presets gevonden</p>
                <p className="text-sm text-[var(--color-text)] mt-2">
                  Voeg een nieuw grid toe met de knop hierboven.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>


      <div className="p-4">
        <Footer>
          <Button
            type="secondary"
            text={"Bewerken"}
            onClick={() => {
              if (selectedCard === null) {
                showToast("Selecteer eerst een preset", "warning");
                return;
              }
              router.push(`/preset?id=${selectedCard}`);
            }}
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

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
