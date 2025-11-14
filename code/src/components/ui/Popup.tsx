"use client";

import React, { useRef, useState } from "react";
import Button from "./Button";
import Toast from "./Toast";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CloudArrowUpIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import InputField from "../forms/InputField";
import GridPreset from "../grid/GridPreset";

type PopupProps = {
  popupType: string;
  onClose?: () => void;
  onSave?: (amount: number, shape: "circle" | "rectangle", size: "small" | "medium" | "large") => void;
  initialValues?: {
    amount: number;
    shape: "circle" | "rectangle";
    size: "small" | "medium" | "large";
  };
  images?: { imageId: number; path: string }[];
  onImageSelect?: (imageId: number) => void;
};

const POPUP_TITLES: Record<string, string> = {
  imageUpload: "Foto Toevoegen",
  exportImport: "Importeer / Exporteer Presets",
  removeImage: "Foto Verwijderen",
  gridPreset: "Grid Toevoegen",
};

const Popup = ({ popupType, onClose, onSave, initialValues, images, onImageSelect }: PopupProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredBox, setHoveredBox] = React.useState<'export' | 'import' | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [exportImportMessage, setExportImportMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const imageIdMapRef = useRef<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const imagesPerPage = 3;
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "info") => {
    setToast({ message, type });
  };

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const uploadFile = async (file: File) => {
    if (!file) return;
    try {
      if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.addImage) {
        const arrayBuffer = await file.arrayBuffer();
        const fileData = { name: file.name, buffer: new Uint8Array(arrayBuffer) };
        await (globalThis as any).electronAPI.addImage(fileData, file.name);
        // cleanup any object URL used for preview
        if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
        setSelectedFile(null);
        onClose?.();
      } else {
        console.log('No electron API available - file ready for upload', file.name);
      }
    } catch (err) {
      console.error('Upload failed', err);
      setFileError('Upload is mislukt. Probeer opnieuw.');
    }
  };

  // Called when the hidden file input changes - set preview and selectedFile but do NOT upload yet
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Alleen afbeeldingsbestanden toegestaan (PNG, JPG, GIF).');
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError('Maximale bestandsgrootte is 5MB.');
      return;
    }
    setFileError(null);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('Alleen afbeeldingsbestanden toegestaan (PNG, JPG, GIF).');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError('Maximale bestandsgrootte is 5MB.');
      return;
    }
    setFileError(null);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setSelectedFile(file);
  };

  const handleRecentImageSelect = (src: string) => {
    const mappedId = imageIdMapRef.current[src];
    if (mappedId !== undefined && typeof onImageSelect === "function") {
      try {
        onImageSelect(mappedId);
      } catch (err) {
        console.error("onImageSelect threw:", err);
      }
      onClose?.();
      return;
    }

    setPreviewImage(src);
    setSelectedFile(null);
  };

  const handleSave = async () => {
    // If a file was selected, upload it. Otherwise just close.
    if (selectedFile) {
      try {
        await uploadFile(selectedFile);
      } catch (err) {
        console.error('Save/upload failed', err);
        setFileError('Opslaan mislukt. Probeer opnieuw.');
        return;
      } finally {
        if (previewImage && previewImage.startsWith('blob:')) URL.revokeObjectURL(previewImage);
      }
    }
    // Close popup in all cases
    setPreviewImage(null);
    setSelectedFile(null);
    onClose?.();
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
            globalThis.location.reload();
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
  const title = POPUP_TITLES[popupType] || "Popup";

  React.useEffect(() => {
    if (popupType !== 'imageUpload') return;

    (async () => {
      try {
        const idMap: Record<string, number> = {};

        // Prefer parent-supplied images when provided
        if (Array.isArray(images) && images.length > 0) {
          const sorted = images.slice().sort((a, b) => b.imageId - a.imageId);
          const paths = sorted.map((i) => {
            const p = i.path?.startsWith('/') ? i.path : '/' + i.path;
            idMap[p] = i.imageId;
            return p;
          });
          setRecentImages(paths);
          imageIdMapRef.current = idMap;
          setCurrentPage(0);
          return;
        }

        // Fallback: fetch recent images from electron API
        if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.getImages) {
          const imgs = await (globalThis as any).electronAPI.getImages();
          if (Array.isArray(imgs) && imgs.length > 0) {
            const sorted = imgs.slice().sort((a: any, b: any) => b.imageId - a.imageId);
            const paths = sorted.map((i: any) => {
              const p = i.path?.startsWith('/') ? i.path : '/' + i.path;
              idMap[p] = i.imageId;
              return p;
            });
            setRecentImages(paths);
            imageIdMapRef.current = idMap;
            setCurrentPage(0);
          } else {
            setRecentImages([]);
            imageIdMapRef.current = {};
          }
        }
      } catch (err) {
        console.error('Failed to load recent images', err);
        setRecentImages([]);
        imageIdMapRef.current = {};
      }
    })();
  }, [popupType, images]);

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
        onChange={handleFileSelect}
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
            <div className="flex justify-center">
              <div
                onClick={handleDivClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="h-60 w-full p-0 bg-[var(--color-white)] text-[var(--color-text)] rounded-2xl shadow cursor-pointer flex flex-col justify-center items-center border-2 border-dashed border-gray-300 hover:border-[var(--color-primary)] transition-colors overflow-hidden"
              >
                {previewImage ? (
                  <div className="relative h-full w-full flex items-center justify-center bg-[var(--color-white)]">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain object-center"
                    />
                  </div>
                ) : (
                  <div className="p-6 flex flex-col justify-center items-center">
                    <CloudArrowUpIcon className="h-15 w-15 text-[var(--color-primary)]" />
                    <p className="text-[var(--color-text)] text-lg">Upload een bestand of sleep</p>
                    <p className="text-gray-400">PNG, JPG, GIF tot 5MB</p>
                  </div>
                )}
              </div>
            </div>
            
            {fileError && (
              <p className="text-red-600 text-center my-3">{fileError}</p>
            )}

            <>
              <p className="my-6 text-2xl text-[var(--dark-text)] text-center">Of kies uit eerdere foto's</p>
              <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {recentImages.slice(currentPage * imagesPerPage, (currentPage + 1) * imagesPerPage).map((src, idx) => (
                  <button
                    key={`${src}-${idx}`}
                    type="button"
                    onClick={() => handleRecentImageSelect(src)}
                    className="rounded-2xl overflow-hidden shadow hover:shadow-lg transition-shadow h-[9vw] w-[9vw] mb-6 mx-3 p-0 bg-white"
                    aria-label={`Kies foto ${currentPage * imagesPerPage + idx + 1}`}
                  >
                    <img
                      src={src}
                      alt={`Recent ${currentPage * imagesPerPage + idx + 1}`}
                      className="w-full h-full object-contain object-center"
                    />
                  </button>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {recentImages.length > imagesPerPage && (
                <div className="flex justify-center items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary)]/80 transition-colors"
                    aria-label="Vorige pagina"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <span className="text-[var(--dark-text)]">
                    {currentPage + 1} / {Math.ceil(recentImages.length / imagesPerPage)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(recentImages.length / imagesPerPage) - 1, prev + 1))}
                    disabled={currentPage >= Math.ceil(recentImages.length / imagesPerPage) - 1}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-primary)]/80 transition-colors"
                    aria-label="Volgende pagina"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </>
          </>
        )}

        {popupType === "gridPreset" && (
          <div>
            <div className="space-y-6">
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

              <div className="mx-auto">
                <div className="my-2 flex flex-row gap-6 max-w-5xl mx-auto">
                  <p className="text-sm font-bold text-[var(--color-primary)]">Voorbeeld:</p>
                </div>
                <div className="w-full h-65 border border-gray-300 rounded-lg bg-white flex items-center justify-center">
                  <GridPreset 
                    shape={shape} 
                    size={size} 
                    scale={0.3} 
                    total={Number.parseInt(amount || '0', 10)} 
                    rowGapRem={0.5}
                    colGapRem={0.25}
                  />
                </div>
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

          {popupType === "gridPreset" && (
            <div className="flex justify-between space-x-6 items-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Terug" onClick={onClose} />
              </div>
              <div className="w-[282px]">
                <Button 
                  type="primary" 
                  text="Opslaan" 
                  onClick={() => {
                    const parsedAmount = parseInt(amount, 10);
                    if (!isNaN(parsedAmount) && parsedAmount > 0 && onSave) {
                      onSave(parsedAmount, shape, size);
                    } else if (isNaN(parsedAmount) || parsedAmount <= 0) {
                      showToast("Voer een geldig aantal in (groter dan 0)", "warning");
                    }
                  }}
                />
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
                <Button type="secondary" text="Terug" onClick={onClose} />
              </div>
              <div className="w-[282px]">
                <Button type="primary" text="Opslaan" onClick={handleSave} />
              </div>
            </div>
          )}
        </div>
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
};

export default Popup;
