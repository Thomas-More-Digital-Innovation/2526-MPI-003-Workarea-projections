"use client";

import React, { useRef, useState } from "react";
import Button from "./Button";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CloudArrowUpIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";
import InputField from "../forms/InputField";
import GridPreset from "../grid/GridPreset";

type PopupProps = {
  popupType: string;
  onClose?: () => void;
};

const POPUP_TITLES: Record<string, string> = {
  imageUpload: "Foto Toevoegen",
  exportImport: "Importeer / Exporteer Presets",
  removeImage: "Foto Verwijderen",
  gridPreset: "Grid Toevoegen",
};

const Popup = ({ popupType, onClose }: PopupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredBox, setHoveredBox] = React.useState<'export' | 'import' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [exportImportMessage, setExportImportMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Alleen afbeeldingsbestanden toegestaan (PNG, JPG, GIF).");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError("Maximale bestandsgrootte is 5MB.");
      return;
    }
    setFileError(null);
    console.log("Selected file:", file.name);

    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.addImage) {
        const arrayBuffer = await file.arrayBuffer();
        const fileData = { name: file.name, buffer: new Uint8Array(arrayBuffer) };
        await (globalThis as any).electronAPI.addImage(fileData, file.name);
        onClose?.();
      } else {
        console.log('No electron API available - file ready for upload', file.name);
      }
    } catch (err) {
      console.error('Upload failed', err);
      setFileError('Upload is mislukt. Probeer opnieuw.');
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    setExportImportMessage(null);
    
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.exportData) {
        const result = await (globalThis as any).electronAPI.exportData();
        
        if (result.success) {
          setExportImportMessage('✅ Export succesvol!');
          setTimeout(() => {
            onClose?.();
          }, 1500);
        } else if (result.canceled) {
          setExportImportMessage('Export geannuleerd');
        } else {
          setExportImportMessage(`❌ Export mislukt: ${result.error || 'Onbekende fout'}`);
        }
      } else {
        setExportImportMessage('❌ Electron API niet beschikbaar');
      }
    } catch (err) {
      console.error('Export error:', err);
      setExportImportMessage('❌ Export mislukt. Probeer opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setExportImportMessage(null);
    
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.importData) {
        const result = await (globalThis as any).electronAPI.importData();
        
        if (result.success) {
          const stats = result.stats;
          setExportImportMessage(
            `✅ Import succesvol!\n${stats.images} afbeeldingen, ${stats.gridLayouts} grids, ${stats.presets} presets, ${stats.steps} stappen`
          );
          setTimeout(() => {
            onClose?.();
            // Reload the page to reflect imported data
            window.location.reload();
          }, 2000);
        } else if (result.canceled) {
          setExportImportMessage('Import geannuleerd');
        } else {
          setExportImportMessage(`❌ Import mislukt: ${result.error || 'Onbekende fout'}`);
        }
      } else {
        setExportImportMessage('❌ Electron API niet beschikbaar');
      }
    } catch (err) {
      console.error('Import error:', err);
      setExportImportMessage('❌ Import mislukt. Probeer opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  const images = new Array(3).fill("praline.jpeg");
  const title = POPUP_TITLES[popupType] || "Popup";

  const [amount, setAmount] = useState("");
  const [shape, setShape] = useState<"circle" | "rectangle">("circle");
  const [size, setSize] = useState<"small" | "medium" | "large">("medium");

  const handleShapeChange = (value: string) => {
    if (value === "circle" || value === "rectangle") {
      setShape(value);
    }
  };

  const handleSizeChange = (value: string) => {
    if (value === "small" || value === "medium" || value === "large") {
      setSize(value);
    }
  };

  return (
    <div className="p-4 bg-[var(--color-popup)] rounded-2xl shadow relative max-w-[609px] w-[80%] md:w-[40%]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button className="absolute top-4 right-3" onClick={onClose}>
        <XMarkIcon className="h-8 w-8 text-[var(--dark-text)] cursor-pointer" />
      </button>
      <div>
        <h2 className="text-3xl font-bold text-center text-[var(--dark-text)] mb-4">{title}</h2>
        <hr className="w-full mb-4 border-1 rounded-2xl border-[#004248]/20" />

        {popupType === "imageUpload" && (
          <>
            <button
              type="button"
              onClick={handleDivClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDivClick(); } }}
              aria-label="Upload afbeelding"
              className="h-60 p-6 bg-[var(--color-white)] text-[var(--color-text)] rounded-2xl shadow cursor-pointer flex flex-col justify-center items-center"
            >
              <CloudArrowUpIcon className="h-15 w-15 text-[var(--color-primary)]" />
              <p className="text-[var(--color-text)] text-lg">Upload een bestand of sleep</p>
              <p className="text-gray-400">PNG, JPG, GIF tot 5MB</p>
            </button>
            {fileError && (
              <p className="text-red-600 text-center my-3">{fileError}</p>
            )}

            <p className="my-3 text-xl text-[var(--dark-text)] text-center">Of kies uit eerdere foto's</p>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {images.map((src, idx) => (
                <img
                  key={`${src}-${idx}`}
                  src={src}
                  alt={`doosje praline ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-2xl shadow"
                />
              ))}
            </div>
          </>
        )}

        {popupType === "gridPreset" && (
          <div>
            <div>
              <div className="flex flex-row gap-6 mx-auto">
                <InputField
                  type="textField"
                  label="Aantal"
                  hint="Aantal vormen"
                  value={amount}
                  onChange={setAmount}
                />

                <InputField
                  type="shapeDropdown"
                  label="Vorm"
                  value={shape}
                  onChange={handleShapeChange}
                />

                <InputField
                  type="sizeDropdown"
                  label="Grootte"
                  value={size}
                  onChange={handleSizeChange}
                />
              </div>

            </div>
            <div className="mx-auto">
              <div className="my-2 flex flex-row gap-6 max-w-5xl mx-auto">
                <p className="text-sm font-bold text-[var(--color-primary)]">Voorbeeld:</p>
              </div>
              <div className="w-full h-65 border border-gray-300 rounded-lg bg-white flex items-center justify-center">
                <GridPreset shape={shape} size={size} scale={0.3} total={Number.parseInt(amount || '0', 10)} />
              </div>
            </div>

          </div>
        )}

        {popupType === "exportImport" && (
          <div>
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={handleImport}
                onMouseEnter={() => setHoveredBox('import')}
                onMouseLeave={() => setHoveredBox(null)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleImport(); } }}
                disabled={isProcessing}
                className="w-[95%] h-[25vw] m-2 flex justify-center items-center rounded-2xl shadow cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: hoveredBox === 'import' ? 'var(--hover-white)' : 'var(--color-white)' }}
              >
                <div className="flex-col justify-center text-center">
                  <ArrowDownOnSquareIcon className="h-30 w-30 text-[var(--color-primary)]"/>
                  <p className="mt-4 text-4xl font-semibold">Import</p>
                </div>
              </button>
              <button
                type="button"
                onClick={handleExport}
                onMouseEnter={() => setHoveredBox('export')}
                onMouseLeave={() => setHoveredBox(null)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleExport(); } }}
                disabled={isProcessing}
                className="w-[95%] h-[25vw] m-2 flex justify-center items-center rounded-2xl shadow cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: hoveredBox === 'export' ? 'var(--hover-white)' : 'var(--color-white)' }}
              >
                <div className="flex-col justify-center text-center">
                  <ArrowUpOnSquareIcon className="h-30 w-30 text-[var(--color-primary)]"/>
                  <p className="mt-4 text-4xl font-semibold">Export</p>
                </div>
              </button>
            </div>
            
            {exportImportMessage && (
              <div className="mt-4 p-3 bg-white rounded-lg text-center whitespace-pre-line">
                <p className="text-[var(--dark-text)]">{exportImportMessage}</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="mt-4 text-center">
                <p className="text-[var(--dark-text)]">Verwerken...</p>
              </div>
            )}
          </div>
        )}

        {popupType === "removeImage" && (
            <div className="flex-col">
               <div className="flex justify-center">
                 <img
                  src="praline.jpeg"
                  alt="doosje praline"
                  className="w-70 h-70 object-cover rounded-2xl shadow"
                    />
                </div>
            <p className="mt-8 mb-8 text-3xl">    
              Ben je zeker dat je dit wilt verwijderen?
            </p>

            </div>
        )}

        <div className="w-full mt-4">
          {popupType === "removeImage" && (
            <div className="flex justify-between items-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Terug" onClick={onClose} />
              </div>
              <div className="w-[282px]">
                <Button type="primary" text="Verwijderen" />
              </div>
            </div>
          )}

          {popupType === "exportImport" && (
            <div className="flex justify-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Terug" onClick={onClose} />
              </div>
            </div>
          )}

          {popupType === "imageUpload" && (
            <div className="flex justify-between items-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Annuleren" onClick={onClose} />
              </div>
              <div className="w-[282px]">
                <Button type="primary" text="Opslaan" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;