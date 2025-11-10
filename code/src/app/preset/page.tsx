"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer, Toast } from "@/components";
import { InputField } from "@/components";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import GridPreset from "@/components/grid/GridPreset";
import { PencilIcon, TrashIcon, ArrowDownIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";

interface GridLayoutData {
  id: string;
  amount: number;
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  step: number;
}

export default function PresetToevoegen() {
  const [showPopupGridToevoegen, setShowPopupGridToevoegen] = useState(false);
  const [showPopupGridEdit, setShowPopupGridEdit] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [gridLayouts, setGridLayouts] = useState<GridLayoutData[]>([]);
  const [editingGrid, setEditingGrid] = useState<GridLayoutData | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
  };

  // Load preset data if editing
  useEffect(() => {
    const loadPresetData = async () => {
      // Get preset ID from URL query parameter
      const params = new URLSearchParams(window.location.search);
      const presetId = params.get('id');
      
      if (!presetId) return;

      setIsLoading(true);
      try {
        const api = (globalThis as any)?.electronAPI;
        if (!api) {
          showToast("Electron API niet beschikbaar", "error");
          return;
        }

        // Load preset details
        const presets = await api.getPresets();
        const preset = presets.find((p: any) => p.presetId === parseInt(presetId));
        
        if (!preset) {
          showToast("Preset niet gevonden", "error");
          setTimeout(() => router.push('/'), 1500);
          return;
        }

        setEditingPresetId(preset.presetId);
        setPresetName(preset.name);
        setPresetDescription(preset.description || "");

        // Load steps for this preset
        const steps = await api.getStepsByPreset(preset.presetId);
        
        // Load grid layouts for each step
        const gridLayoutsData: GridLayoutData[] = [];
        for (const step of steps) {
          if (step.gridLayoutId) {
            const gridLayouts = await api.getGridLayouts();
            const gridLayout = gridLayouts.find((gl: any) => gl.gridLayoutId === step.gridLayoutId);
            
            if (gridLayout) {
              gridLayoutsData.push({
                id: `grid-${step.stepId}`,
                amount: gridLayout.amount,
                shape: gridLayout.shape,
                size: gridLayout.size,
                step: step.step,
              });
            }
          }
        }

        // Sort by step number
        gridLayoutsData.sort((a, b) => a.step - b.step);
        setGridLayouts(gridLayoutsData);
      } catch (error) {
        console.error("Error loading preset:", error);
        showToast("Fout bij laden preset", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadPresetData();
  }, [router]);

  const handleAddGrid = (amount: number, shape: "circle" | "rectangle", size: "small" | "medium" | "large") => {
    const newGrid: GridLayoutData = {
      id: `grid-${Date.now()}`,
      amount,
      shape,
      size,
      step: gridLayouts.length + 1,
    };
    setGridLayouts([...gridLayouts, newGrid]);
    setShowPopupGridToevoegen(false);
  };

  const handleCopyGrid = (index: number) => {
    const gridToCopy = gridLayouts[index];
    const copiedGrid: GridLayoutData = {
      ...gridToCopy,
      id: `grid-${Date.now()}`,
      step: gridLayouts.length + 1,
    };
    setGridLayouts([...gridLayouts, copiedGrid]);
  };

  const handleEditGrid = (index: number) => {
    setEditingGrid({ ...gridLayouts[index], step: index });
    setShowPopupGridEdit(true);
  };

  const handleUpdateGrid = (amount: number, shape: "circle" | "rectangle", size: "small" | "medium" | "large") => {
    if (editingGrid) {
      const updatedGrids = [...gridLayouts];
      updatedGrids[editingGrid.step] = {
        ...updatedGrids[editingGrid.step],
        amount,
        shape,
        size,
      };
      setGridLayouts(updatedGrids);
      setShowPopupGridEdit(false);
      setEditingGrid(null);
    }
  };

  const handleDeleteGrid = (index: number) => {
    const updatedGrids = gridLayouts.filter((_, i) => i !== index);
    // Renumber steps
    const renumberedGrids = updatedGrids.map((grid, i) => ({
      ...grid,
      step: i + 1,
    }));
    setGridLayouts(renumberedGrids);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedGrids = [...gridLayouts];
    const draggedItem = updatedGrids[draggedIndex];
    updatedGrids.splice(draggedIndex, 1);
    updatedGrids.splice(index, 0, draggedItem);

    // Renumber steps
    const renumberedGrids = updatedGrids.map((grid, i) => ({
      ...grid,
      step: i + 1,
    }));

    setGridLayouts(renumberedGrids);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = async () => {
    if (!editingPresetId) return;

    // Confirm deletion
    const confirmed = confirm("Weet je zeker dat je deze preset wilt verwijderen?");
    if (!confirmed) return;

    try {
      const api = (globalThis as any)?.electronAPI;
      if (!api) {
        showToast("Electron API niet beschikbaar", "error");
        return;
      }

      // Get all steps associated with this preset
      const steps = await api.getStepsByPreset(editingPresetId);

      // Delete all grid layouts associated with the steps
      for (const step of steps) {
        if (step.gridLayoutId) {
          await api.deleteGridLayout(step.gridLayoutId);
        }
        // Delete the step itself
        await api.deleteStep(step.stepId);
      }

      // Delete the preset
      await api.deletePreset(editingPresetId);

      showToast("Preset succesvol verwijderd!", "success");
      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      console.error("Error deleting preset:", error);
      showToast("Fout bij verwijderen preset: " + (error as Error).message, "error");
    }
  };

  const handleSave = async () => {
    if (!presetName.trim()) {
      showToast("Voer een preset naam in", "warning");
      return;
    }

    if (gridLayouts.length === 0) {
      showToast("Voeg minstens één grid toe", "warning");
      return;
    }

    try {
      const api = (globalThis as any)?.electronAPI;
      if (!api) {
        showToast("Electron API niet beschikbaar", "error");
        return;
      }

      let presetId: number;

      if (editingPresetId) {
        // Update existing preset
        await api.updatePreset({
          presetId: editingPresetId,
          name: presetName,
          description: presetDescription || "",
        });
        presetId = editingPresetId;

        // Delete existing steps for this preset
        const existingSteps = await api.getStepsByPreset(presetId);
        for (const step of existingSteps) {
          await api.deleteStep(step.stepId);
        }
      } else {
        // Create new preset
        const presetResult = await api.addPreset({
          name: presetName,
          description: presetDescription || "",
        });

        if (!presetResult || !presetResult.presetId) {
          throw new Error("Failed to create preset");
        }
        presetId = presetResult.presetId;
      }

      // Create each grid layout and its step
      for (const grid of gridLayouts) {
        // Create the grid layout
        const gridResult = await api.addGridLayout({
          amount: grid.amount,
          shape: grid.shape,
          size: grid.size,
        });

        if (!gridResult || !gridResult.gridLayoutId) {
          throw new Error("Failed to create grid layout");
        }

        const gridLayoutId = gridResult.gridLayoutId;

        // Create the step linking the grid to the preset
        await api.addStep({
          step: grid.step,
          imageId: null,
          gridLayoutId: gridLayoutId,
          presetId: presetId,
        });
      }

      showToast(editingPresetId ? "Preset succesvol bijgewerkt!" : "Preset succesvol opgeslagen!", "success");
      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      console.error("Error saving preset:", error);
      showToast("Fout bij opslaan preset: " + (error as Error).message, "error");
    }
  };

  return (
    <div className="h-screen bg-[var(--color-secondary)]/20 flex flex-col">
      <div className="p-4 pb-0 flex flex-col gap-4 w-full">
        <div className="mx-auto max-w rounded-2xl w-full shadow-md" style={{ backgroundColor: 'var(--color-white)', padding: '0.75rem' }}>
          <h1 className="text-center text-4xl px-6 py-3 font-semibold text-[var(--dark-text)]">
            {editingPresetId ? "Preset Bewerken" : "Preset Toevoegen"}
          </h1>
        </div>
        
        {/* Preset Name and Description - Fixed at top */}
        <div className="bg-white shadow-md px-6 py-6 rounded-2xl">
          <div className="flex flex-row gap-4">
            <InputField
              type="textField"
              label="Preset Naam"
              hint="Voer een naam in"
              value={presetName}
              onChange={setPresetName}
            />
            <InputField
              type="textField"
              label="Beschrijving"
              hint="Voer een beschrijving in (optioneel)"
              value={presetDescription}
              onChange={setPresetDescription}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <main className="bg-white shadow-md px-6 py-6 rounded-2xl mx-4 my-4 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
          <p className="text-xl text-[var(--color-text)]">Laden...</p>
        </main>
      ) : (
      <main className="bg-white shadow-md px-6 py-6 rounded-2xl mx-4 my-4 flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto">

        {/* Grid Layouts Section */}
        <div className="flex flex-col gap-4 w-full items-center">
          {/* Grid List */}
          <div className="flex flex-col gap-4 w-full">
            {gridLayouts.map((grid, index) => (
              <div
                key={grid.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-row items-center justify-between relative bg-[var(--color-popup)] p-6 rounded-2xl shadow-md cursor-move transition-opacity ${
                  draggedIndex === index ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <div className="flex flex-row gap-4 items-center justify-center">
                  {/* Grid Preview - Fixed Size */}
                  <div className="w-40 aspect-video bg-white p-4 rounded-lg flex items-center justify-center">
                    <GridPreset
                      shape={grid.shape}
                      size={grid.size}
                      scale={0.05}
                      total={grid.amount}
                      pagination={false}
                    />
                  </div>
                
                  {/* Grid Info - Closer together and centered */}
                  <div className="flex gap-8 text-center text-sm text-[var(--color-text)]">
                    <p><strong>Aantal:</strong> {grid.amount}</p>
                    <p><strong>Vorm:</strong> {grid.shape === "circle" ? "Cirkel" : "Rechthoek"}</p>
                    <p>
                      <strong>Grootte:</strong>{" "}
                      {grid.size === "small" ? "Klein" : grid.size === "medium" ? "Middelgroot" : "Groot"}
                    </p>
                  </div>
                </div>
              
                {/* Action Buttons */}
                <div className="flex gap-2 justify-center relative">
                  {/* Three-dot menu with dropdown (without copy button) */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                      className="p-2 text-black rounded-lg transition"
                      title="Meer opties"
                    >
                      <EllipsisVerticalIcon className="w-12 h-12" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {openMenuIndex === index && (
                      <>
                        {/* Overlay om menu te sluiten bij klikken buiten */}
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuIndex(null)}
                        />
                        
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
                          <button
                            onClick={() => {
                              handleEditGrid(index);
                              setOpenMenuIndex(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Opslaan
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteGrid(index);
                              setOpenMenuIndex(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg text-red-600 flex items-center gap-2"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Verwijderen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {gridLayouts.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xl">Geen grids toegevoegd</p>
              <p className="text-md mt-2">Klik op "Grid toevoegen" om te beginnen</p>
            </div>
          )}

          <ArrowDownIcon className="w-10 h-10"/>

          {/* Buttons - Centered with copy button next to add button */}
          <div className="grid grid-cols-3 w-full gap-4 justify-center items-center">
          <Button 
            type="lines" 
            text="Grid toevoegen" 
            onClick={() => setShowPopupGridToevoegen(true)} 
          />
          <Button 
            type="lines" 
            text="Kopie"
            bgColorClass="bg-[#FCFFE6]"
            onClick={() => {
              if (gridLayouts.length > 0) {
                handleCopyGrid(gridLayouts.length - 1);
              }
            }}
            disabled={gridLayouts.length === 0}
          />
          <Button 
            type="lines" 
            text="Foto toevoegen" 
          />
        </div>
        </div>
      </main>
      )}

      <div className="px-4 pb-4 pt-0 flex-shrink-0">
        <Footer>
          <Button onClick={() => router.push('/')} text="Terug" fullWidth={false} fixedWidth={true} />
          {editingPresetId && (
            <Button 
              type="secondary"
              text="Verwijderen" 
              onClick={handleDelete} 
              fullWidth={false} 
              fixedWidth={true}
            />
          )}
          <Button 
            type="primary" 
            text={editingPresetId ? "Bijwerken" : "Opslaan"} 
            onClick={handleSave} 
            fullWidth={false} 
            fixedWidth={true} 
          />
        </Footer>
      </div>

      {/* Add Grid Popup */}
      {showPopupGridToevoegen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <Popup
            popupType="gridPreset"
            onClose={() => setShowPopupGridToevoegen(false)}
            onSave={handleAddGrid}
          />
        </div>
      )}

      {/* Edit Grid Popup */}
      {showPopupGridEdit && editingGrid && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <Popup
            popupType="gridPreset"
            onClose={() => {
              setShowPopupGridEdit(false);
              setEditingGrid(null);
            }}
            onSave={handleUpdateGrid}
            initialValues={{
              amount: editingGrid.amount,
              shape: editingGrid.shape,
              size: editingGrid.size,
            }}
          />
        </div>
      )}

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
