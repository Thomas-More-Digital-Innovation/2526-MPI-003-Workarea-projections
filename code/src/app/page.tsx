"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, GridCard, Footer, Toast } from "@/components";
import { useRouter } from "next/navigation";

interface CardData {
  id: number;
  title: string;
  description: string;
}

export default function Home() {
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
          
          // For each preset, fetch the first step to get the correct grid layout
          const presetsWithCorrectGrid = await Promise.all(
            (result || []).map(async (preset: any) => {
              try {
                // Get steps for this preset
                let steps = null;
                if (api?.getStepsByPreset) {
                  steps = await api.getStepsByPreset(preset.presetId);
                } else if (api?.getStepsByPresetId) {
                  steps = await api.getStepsByPresetId(preset.presetId);
                }
                
                if (steps && steps.length > 0) {
                  const firstStep = steps[0];
                  // If first step has a grid layout, fetch the grid layout details
                  if (firstStep.gridLayoutId && api?.getGridLayouts) {
                    const gridLayouts = await api.getGridLayouts();
                    const gridLayout = gridLayouts.find((gl: any) => gl.gridLayoutId === firstStep.gridLayoutId);
                    if (gridLayout) {
                      // Return preset with correct grid layout data from first step
                      return {
                        ...preset,
                        gridLayoutId: gridLayout.gridLayoutId,
                        amount: gridLayout.amount,
                        shape: gridLayout.shape,
                        size: gridLayout.size,
                      };
                    }
                  }
                }
                // No grid in first step, return preset without grid data
                return {
                  ...preset,
                  gridLayoutId: null,
                  amount: null,
                  shape: null,
                  size: null,
                };
              } catch (err) {
                console.error(`Failed to load grid for preset ${preset.presetId}:`, err);
                return preset;
              }
            })
          );
          
          setPresets(presetsWithCorrectGrid);
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
      if (selectedPreset.gridLayoutId !== null && selectedPreset.gridLayoutId !== undefined) {
        console.log("✅ Using gridLayoutId from preset:", selectedPreset.gridLayoutId);
        localStorage.setItem('currentGridLayoutId', selectedPreset.gridLayoutId.toString());
        localStorage.setItem('currentPresetId', selectedCard.toString());
        localStorage.setItem('currentStepIndex', '0'); // Reset step index
        router.push("/projection");
        return;
      }

      // If not on the preset object, try to get steps via the Electron API.
      let steps: any[] | null = null;
      if (api?.getStepsByPresetId) {
        steps = await api.getStepsByPresetId(selectedCard);
      } else if (api?.getStepsByPreset) {
        // Older/newer API variant used elsewhere in the codebase
        steps = await api.getStepsByPreset(selectedCard);
      } else {
        console.error("❌ No steps API method found on electronAPI");
        console.log("Available methods:", Object.keys(api || {}));
        showToast("Kan preset stappen niet laden - API methode niet beschikbaar", "error");
        return;
      }

      console.log("Steps for preset:", steps);

      if (!steps || steps.length === 0) {
        showToast("Geen stappen gevonden voor deze preset", "error");
        return;
      }

      const firstStep = steps[0];

      // Always set the preset and reset to step 0. If the first step has a gridLayoutId
      // store it as well; otherwise assume it's an image step and let the projection
      // loader fetch the step data from the API.
      localStorage.setItem('currentPresetId', selectedCard.toString());
      localStorage.setItem('currentStepIndex', '0'); // Reset step index to start from beginning
      if (firstStep.gridLayoutId !== null && firstStep.gridLayoutId !== undefined) {
        localStorage.setItem('currentGridLayoutId', firstStep.gridLayoutId.toString());
      } else {
        // Ensure no stale grid layout id remains
        localStorage.removeItem('currentGridLayoutId');
      }
      router.push("/projection");
      
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
              {filteredPresets.map((p) => {
                // Only pass preset prop if the preset object contains valid grid layout fields
                const hasValidGrid = (
                  p.gridLayoutId &&
                  typeof p.amount === 'number' &&
                  p.amount > 0 &&
                  (p.shape === 'circle' || p.shape === 'rectangle' || p.shape === 'square') &&
                  (p.size === 'small' || p.size === 'medium' || p.size === 'large')
                );
                
                return (
                  <GridCard
                    key={p.presetId}
                    id={p.presetId}
                    title={p.name}
                    description={p.description}
                    preset={hasValidGrid ? p : undefined}
                    active={selectedCard === p.presetId}
                    onSelect={handleSelect}
                  />
                );
              })}
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
            type="primary"
            text={"Bewerken"}
            onClick={() => {
              if (selectedCard === null) {
                showToast("Selecteer eerst een preset", "warning");
                return;
              }
              // Store preset ID in localStorage for the preset page to read
              localStorage.setItem('editPresetId', selectedCard.toString());
              router.push(`/preset`);
            }}
            fullWidth={false}
            fixedWidth={true}
          />
           <Button
            type="secondary"
            text={"Kalibratie"}
            onClick={handleCalibration}
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