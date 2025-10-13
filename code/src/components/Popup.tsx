"use client";

import React, { useRef } from "react";
import Button from "./Button";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { CloudArrowUpIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon } from "@heroicons/react/24/outline";

const Popup = ({ popupType }: { popupType: string }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hoveredBox, setHoveredBox] = React.useState<'export' | 'import' | null>(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

  const images = Array(3).fill("praline.jpeg");

  const title =
    popupType === "imageUpload" ? "Foto Toevoegen" : 
    popupType === "exportImport" ? "Importeren / Exporteren" : 
    popupType === "removeImage" ? "Afbeelding verwijderen": 
    "Popup";

  return (
    <div className="p-4 bg-[var(--color-popup)] rounded-2xl shadow relative max-h-[675px] w-[80%] md:w-[40%]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button className="absolute top-3 right-3">
        <XMarkIcon className="h-8 w-8 text-[var(--color-text)]" />
      </button>

      <div className="flex flex-col items-center">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">{title}</h2>
        <hr className="w-full mb-4 border-1 rounded-2xl border-gray-400" />

        {popupType === "imageUpload" && (
          <>
            <div
              onClick={handleDivClick}
              className="w-full h-60 mx-6 p-6 bg-[var(--color-white)] text-[var(--color-text)] rounded-2xl shadow cursor-pointer flex flex-col justify-center items-center"
            >
              <CloudArrowUpIcon className="h-15 w-15 text-[var(--color-primary)]" />
              <p className="text-[var(--color-text)] text-lg">Upload een bestand of sleep</p>
              <p className="text-gray-400">PNG, JPG, GIF tot 5MB</p>
            </div>

            <p className="my-3 text-xl text-[var(--color-text)]">Of kies uit eerdere foto's</p>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`doosje praline ${idx + 1}`}
                  className="w-full h-40 object-cover rounded-2xl shadow"
                />
              ))}
            </div>
          </>
        )}

        {popupType === "gridPreset" && (
          <div>{/* Hier komt code wat getoond moet worden */}</div>
        )}

        {popupType === "exportImport" && (
          <div className="w-full flex justify-center">
            <div 
              className="w-[95%] h-[25vw] m-2 flex justify-center items-center rounded-2xl shadow cursor-pointer transition-colors duration-200"
              style={{ backgroundColor: hoveredBox === 'export' ? 'var(--hover-white)' : 'var(--color-white)' }}
              onMouseEnter={() => setHoveredBox('export')}
              onMouseLeave={() => setHoveredBox(null)}
            >
              <div className="flex-col justify-center text-center">
                <ArrowUpOnSquareIcon className="h-30 w-30 text-[var(--color-primary)]"/>
                <p className="mt-4 text-4xl">Export</p>
              </div>
            </div>
            <div 
              className="w-[95%] h-[25vw] m-2 flex justify-center items-center rounded-2xl shadow cursor-pointer transition-colors duration-200"
              style={{ backgroundColor: hoveredBox === 'import' ? 'var(--hover-white)' : 'var(--color-white)' }}
              onMouseEnter={() => setHoveredBox('import')}
              onMouseLeave={() => setHoveredBox(null)}
            >
              <div className="flex-col justify-center text-center">
                <ArrowDownOnSquareIcon className="h-30 w-30 text-[var(--color-primary)]"/>
                <p className="mt-4 text-4xl">Import</p>
              </div>
            </div>
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
                <Button type="secondary" text="Terug" />
              </div>
              <div className="w-[282px]">
                <Button type="primary" text="Verwijderen" />
              </div>
            </div>
          )}

          {popupType === "exportImport" && (
            <div className="flex justify-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Terug" />
              </div>
            </div>
          )}

          {popupType === "imageUpload" && (
            <div className="flex justify-between items-center">
              <div className="w-[282px]">
                <Button type="secondary" text="Annuleren" />
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
