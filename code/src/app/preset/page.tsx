"use client";

import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer, Toast } from "@/components";
import { InputField } from "@/components";
import { useRouter } from "next/navigation";
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import GridPreset from "@/components/grid/GridPreset";
import { PencilIcon, TrashIcon, ArrowDownIcon, DocumentDuplicateIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface GridLayoutData {
  id: string;
  amount: number;
  shape: "circle" | "rectangle";
  size: "small" | "medium" | "large";
  step: number;
}

interface ImageData {
  id: string;
  imageId: number;
  path: string;
  description: string;
  step: number;
}

type StepItem = 
  | { type: 'grid'; data: GridLayoutData }
  | { type: 'image'; data: ImageData };

export default function PresetToevoegen() {
  const [showPopupGridToevoegen, setShowPopupGridToevoegen] = useState(false);
  const [showPopupGridEdit, setShowPopupGridEdit] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [editingGrid, setEditingGrid] = useState<GridLayoutData | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [showPopupImage, setShowPopupImage] = useState(false);
  const [availableImages, setAvailableImages] = useState<Array<{ imageId: number; path: string; description: string }>>([]);
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
        const stepsData = await api.getStepsByPreset(preset.presetId);
        
        // Load grid layouts and images for each step
        const stepItems: StepItem[] = [];
        for (const step of stepsData) {
          if (step.gridLayoutId) {
            const gridLayouts = await api.getGridLayouts();
            const gridLayout = gridLayouts.find((gl: any) => gl.gridLayoutId === step.gridLayoutId);
            
            if (gridLayout) {
              stepItems.push({
                type: 'grid',
                data: {
                  id: `grid-${step.stepId}`,
                  amount: gridLayout.amount,
                  shape: gridLayout.shape,
                  size: gridLayout.size,
                  step: step.step,
                }
              });
            }
          } else if (step.imageId) {
            const images = await api.getImages();
            const image = images.find((img: any) => img.imageId === step.imageId);
            
            if (image) {
              stepItems.push({
                type: 'image',
                data: {
                  id: `image-${step.stepId}`,
                  imageId: image.imageId,
                  path: image.path,
                  description: image.description,
                  step: step.step,
                }
              });
            }
          }
        }

        // Sort by step number
        stepItems.sort((a, b) => a.data.step - b.data.step);
        setSteps(stepItems);
      } catch (error) {
        console.error("Error loading preset:", error);
        showToast("Fout bij laden preset", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadPresetData();
  }, [router]);

  // Load available images
  useEffect(() => {
    const loadImages = async () => {
      try {
        const api = (globalThis as any)?.electronAPI;
        if (!api) return;
        
        const images = await api.getImages();
        setAvailableImages(images || []);
      } catch (error) {
        console.error("Error loading images:", error);
      }
    };
    
    loadImages();
  }, [showPopupImage]);

  const handleAddGrid = (amount: number, shape: "circle" | "rectangle", size: "small" | "medium" | "large") => {
    const newGrid: GridLayoutData = {
      id: `grid-${Date.now()}`,
      amount,
      shape,
      size,
      step: steps.length + 1,
    };
    setSteps([...steps, { type: 'grid', data: newGrid }]);
    setShowPopupGridToevoegen(false);
  };

  const handleAddImage = (imageId: number) => {
    const selectedImage = availableImages.find(img => img.imageId === imageId);
    if (!selectedImage) return;

    const newImage: ImageData = {
      id: `image-${Date.now()}`,
      imageId: selectedImage.imageId,
      path: selectedImage.path,
      description: selectedImage.description,
      step: steps.length + 1,
    };
    setSteps([...steps, { type: 'image', data: newImage }]);
    setShowPopupImage(false);
  };

  const handleCopy = (index: number) => {
    const itemToCopy = steps[index];
    if (itemToCopy.type === 'grid') {
      const copiedGrid: GridLayoutData = {
        ...itemToCopy.data,
        id: `grid-${Date.now()}`,
        step: steps.length + 1,
      };
      setSteps([...steps, { type: 'grid', data: copiedGrid }]);
    } else {
      const copiedImage: ImageData = {
        ...itemToCopy.data,
        id: `image-${Date.now()}`,
        step: steps.length + 1,
      };
      setSteps([...steps, { type: 'image', data: copiedImage }]);
    }
  };

  const handleEdit = (index: number) => {
    const item = steps[index];
    if (item.type === 'grid') {
      setEditingGrid({ ...item.data, step: index });
      setShowPopupGridEdit(true);
    }
    // Images cannot be edited, only replaced
  };

  const handleUpdateGrid = (amount: number, shape: "circle" | "rectangle", size: "small" | "medium" | "large") => {
    if (editingGrid) {
      const updatedSteps = [...steps];
      updatedSteps[editingGrid.step] = {
        type: 'grid',
        data: {
          ...updatedSteps[editingGrid.step].data as GridLayoutData,
          amount,
          shape,
          size,
        }
      };
      setSteps(updatedSteps);
      setShowPopupGridEdit(false);
      setEditingGrid(null);
    }
  };

  const handleDelete = (index: number) => {
    const updatedSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    const renumberedSteps = updatedSteps.map((item, i): StepItem => {
      if (item.type === 'grid') {
        return {
          type: 'grid',
          data: {
            ...item.data,
            step: i + 1,
          }
        };
      } else {
        return {
          type: 'image',
          data: {
            ...item.data,
            step: i + 1,
          }
        };
      }
    });
    setSteps(renumberedSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const updatedSteps = [...steps];
    const draggedItem = updatedSteps[draggedIndex];
    updatedSteps.splice(draggedIndex, 1);
    updatedSteps.splice(index, 0, draggedItem);

    // Renumber steps
    const renumberedSteps = updatedSteps.map((item, i): StepItem => {
      if (item.type === 'grid') {
        return {
          type: 'grid',
          data: {
            ...item.data,
            step: i + 1,
          }
        };
      } else {
        return {
          type: 'image',
          data: {
            ...item.data,
            step: i + 1,
          }
        };
      }
    });

    setSteps(renumberedSteps);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDeletePreset = async () => {
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

    if (steps.length === 0) {
      showToast("Voeg minstens één grid of foto toe", "warning");
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

      // Create each step (grid or image)
      for (const item of steps) {
        if (item.type === 'grid') {
          // Create the grid layout
          const gridResult = await api.addGridLayout({
            amount: item.data.amount,
            shape: item.data.shape,
            size: item.data.size,
          });

          if (!gridResult || !gridResult.gridLayoutId) {
            throw new Error("Failed to create grid layout");
          }

          const gridLayoutId = gridResult.gridLayoutId;

          // Create the step linking the grid to the preset
          await api.addStep({
            step: item.data.step,
            imageId: null,
            gridLayoutId: gridLayoutId,
            presetId: presetId,
          });
        } else {
          // Create the step linking the image to the preset
          await api.addStep({
            step: item.data.step,
            imageId: item.data.imageId,
            gridLayoutId: null,
            presetId: presetId,
          });
        }
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

        {/* Steps Section */}
        <div className="flex flex-col gap-4 w-full items-center">
          {/* Steps List */}
          <div className="flex flex-col gap-4 w-full">
            {steps.map((item, index) => (
              <div
                key={item.data.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex flex-row items-center justify-between relative bg-[var(--color-popup)] p-6 rounded-2xl shadow-md cursor-move transition-opacity ${
                  draggedIndex === index ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <div className="flex flex-row gap-4 items-center justify-center">
                  {/* Preview - Fixed Size */}
                  <div className="w-40 aspect-video bg-white p-4 rounded-lg flex items-center justify-center">
                    {item.type === 'grid' ? (
                      <GridPreset
                        shape={item.data.shape}
                        size={item.data.size}
                        scale={0.05}
                        total={item.data.amount}
                        pagination={false}
                      />
                    ) : (
                      <img
                        src={`/${item.data.path}`}
                        alt={item.data.description || 'Image'}
                        className="w-full h-full object-contain object-center"
                      />
                    )}
                  </div>
                
                  {/* Info - Closer together and centered */}
                  <div className="flex gap-8 text-center text-sm text-[var(--color-text)]">
                    {item.type === 'grid' ? (
                      <>
                        <p><strong>Type:</strong> Grid</p>
                        <p><strong>Aantal:</strong> {item.data.amount}</p>
                        <p><strong>Vorm:</strong> {item.data.shape === "circle" ? "Cirkel" : "Rechthoek"}</p>
                        <p>
                          <strong>Grootte:</strong>{" "}
                          {item.data.size === "small" ? "Klein" : item.data.size === "medium" ? "Middelgroot" : "Groot"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p><strong>Type:</strong> Foto</p>
                        <p><strong>Beschrijving:</strong> {item.data.description || 'Geen beschrijving'}</p>
                      </>
                    )}
                  </div>
                </div>
              
                {/* Action Buttons */}
                <div className="flex gap-2 justify-center relative">
                  {/* Three-dot menu with dropdown */}
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
                          {item.type === 'grid' && (
                            <button
                              onClick={() => {
                                handleEdit(index);
                                setOpenMenuIndex(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg flex items-center gap-2"
                            >
                              <PencilIcon className="w-4 h-4" />
                              Bewerken
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(index);
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

          {steps.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xl">Geen stappen toegevoegd</p>
              <p className="text-md mt-2">Klik op \"Grid toevoegen\" of \"Foto toevoegen\" om te beginnen</p>
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
              if (steps.length > 0) {
                handleCopy(steps.length - 1);
              }
            }}
            disabled={steps.length === 0}
          />
          <Button 
            type="lines" 
            text="Foto toevoegen" 
            onClick={() => setShowPopupImage(true)}
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
              onClick={handleDeletePreset} 
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

      {showPopupImage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="p-4 bg-[var(--color-popup)] rounded-2xl shadow relative max-w-[609px] w-[80%] md:w-[40%]">
            <button className="absolute top-4 right-3" onClick={() => setShowPopupImage(false)}>
              <XMarkIcon className="h-8 w-8 text-[var(--dark-text)] cursor-pointer" />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-center text-[var(--dark-text)] mb-4">Selecteer een foto</h2>
              <hr className="w-full mb-4 border-1 rounded-2xl border-[#004248]/20" />
              
              <div className="grid gap-4 grid-cols-3 max-h-[60vh] overflow-y-auto p-2">
                {availableImages.map((img) => (
                  <div
                    key={img.imageId}
                    onClick={() => handleAddImage(img.imageId)}
                    className="cursor-pointer rounded-2xl overflow-hidden shadow hover:shadow-lg transition-shadow aspect-square bg-white"
                  >
                    <img
                      src={`/${img.path}`}
                      alt={img.description || 'Image'}
                      className="w-full h-full object-contain object-center"
                    />
                  </div>
                ))}
              </div>
              
              {availableImages.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg">Geen foto's beschikbaar</p>
                  <p className="text-sm mt-2">Ga naar Foto Beheer om foto's toe te voegen</p>
                </div>
              )}
              
              <div className="w-full mt-4">
                <Button type="secondary" text="Terug" onClick={() => setShowPopupImage(false)} />
              </div>
            </div>
          </div>
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
