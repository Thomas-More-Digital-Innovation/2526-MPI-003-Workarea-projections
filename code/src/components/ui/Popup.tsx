"use client";

import React, { useRef, useState } from "react";
import Button from "./Button";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CloudArrowUpIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import InputField from "../forms/InputField";
import GridPreset from "../grid/GridPreset";

declare global {
  interface Window {
    electronAPI?: {
      addPreset: (preset: { shape: string; size: string; amount: number }) => Promise<unknown>;
      getPresets: () => Promise<Array<{ id: number; shape: string; size: string; amount: number }>>;
    };
  }
}

interface PopupProps {
  popupType: "imageUpload" | "exportImport" | "removeImage" | "gridPreset";
  onClose?: () => void;
}

const POPUP_TITLES = {
  imageUpload: "Foto Toevoegen",
  exportImport: "Importeer / Exporteer Presets",
  removeImage: "Foto Verwijderen",
  gridPreset: "Grid Toevoegen",
} as const;

const Popup = ({ popupType, onClose }: PopupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredBox, setHoveredBox] = React.useState<"export" | "import" | null>(null);

  const [amount, setAmount] = useState("");
  const [shape, setShape] = useState<"circle" | "rectangle">("circle");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");
  const [presets, setPresets] = useState<
    Array<{ id: number; shape: string; size: string; amount: number }>
  >([]);

  // Helper functions
  const handleShapeChange = (value: string) => {
    if (value === "circle" || value === "rectangle") setShape(value);
  };
  const handleSizeChange = (value: string) => {
    if (value === "small" || value === "medium" || value === "large") setSize(value);
  };

  // Fetch existing presets (optioneel)
  React.useEffect(() => {
    if (popupType === "gridPreset") {
      fetchPresets();
    }
  }, [popupType]);

  const fetchPresets = async () => {
    if (window.electronAPI?.getPresets) {
      const result = await window.electronAPI.getPresets();
      setPresets(result);
    }
  };

  const handleSavePreset = async () => {
    if (!amount || isNaN(parseInt(amount))) {
      alert("Geef een geldig aantal op.");
      return;
    }

    if (window.electronAPI?.addPreset) {
      await window.electronAPI.addPreset({
        shape,
        size,
        amount: parseInt(amount),
      });
      alert("Preset opgeslagen!");
      await fetchPresets();
      if (onClose) onClose();
    } else {
      alert("Electron API niet beschikbaar.");
    }
  };

  const title = POPUP_TITLES[popupType] || "Popup";

  return (
    <div className="p-4 bg-[var(--color-popup)] rounded-2xl shadow relative w-[50%]">
      <button className="absolute top-4 right-3" onClick={onClose}>
        <XMarkIcon className="h-6 w-6 text-[var(--dark-text)] cursor-pointer" />
      </button>

      <div>
        <h2 className="text-xl font-bold text-[var(--color-primary)] mb-4">{title}</h2>
        <hr className="w-full mb-4 border-1 rounded-2xl border-gray-400" />

        {popupType === "gridPreset" && (
          <>
            <div className="flex flex-row gap-6 mx-auto">
              <InputField type="textField" label="Aantal" hint="Aantal vormen" value={amount} onChange={setAmount} />
              <InputField type="shapeDropdown" label="Vorm" value={shape} onChange={handleShapeChange} />
              <InputField type="sizeDropdown" label="Grootte" value={size} onChange={handleSizeChange} />
            </div>

            <div className="mx-auto">
              <div className="my-2 flex flex-row gap-6 max-w-5xl mx-auto">
                <p className="text-sm font-bold text-[var(--color-primary)]">Voorbeeld:</p>
              </div>
              <div className="w-full h-65 border border-gray-300 rounded-lg bg-white flex items-center justify-center">
                <GridPreset shape={shape} size={size} scale={0.3} total={parseInt(amount)} />
              </div>
            </div>
          </>
        )}

        <div className="w-full mt-4 flex justify-between items-center gap-4">
          <div className="w-[282px]">
            <Button type="secondary" text="Annuleren" onClick={onClose} />
          </div>
          {popupType === "gridPreset" && (
            <div className="w-[282px]">
              <Button type="primary" text="Opslaan" onClick={handleSavePreset} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;
