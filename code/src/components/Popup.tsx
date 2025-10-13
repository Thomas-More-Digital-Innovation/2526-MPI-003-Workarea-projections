"use client";

import React, { useRef } from "react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { CloudArrowUpIcon } from "@heroicons/react/24/outline";

const Popup = ({ title, popupType }: { title: string; popupType: string }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
    }
  };

  // Example array for 3 images (could be replaced with dynamic data)
  const images = Array(3).fill("praline.jpeg");

  return (
    <div className="p-4 bg-[var(--color-popup)] rounded shadow relative w-[80%] md:w-[40%]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button className="absolute top-2 right-2">
        <XMarkIcon className="h-8 w-8 text-[var(--color-text)]" />
      </button>

      <div className="flex flex-col items-center">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">{title}</h2>
        <hr className="w-full mb-4 border-1 rounded border-[var(--color-secondary)]" />

        {popupType === "imageUpload" && (
          <>
            {/* Upload area */}
            <div
              onClick={handleDivClick}
              className="w-full mx-6 p-6 bg-[var(--color-white)] text-[var(--color-text)] rounded shadow cursor-pointer flex flex-col justify-center items-center"
            >
              <CloudArrowUpIcon className="h-15 w-15 text-[var(--color-primary)]" />
              <p className="text-[var(--color-text)] text-lg">Upload een bestand of sleep</p>
              <p className="text-gray-400">PNG, JPG, GIF tot 5MB</p>
            </div>

            {/* Image selection area */}
            <p className="my-3 text-xl text-[var(--color-text)]">Of kies uit eerdere foto's</p>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`doosje praline ${idx + 1}`}
                  className="w-full h-40 object-cover rounded shadow"
                />
              ))}
            </div>

            {/* Buttons aligned left & right */}
           <div className="w-full flex justify-between items-center mt-4">
            <div className="w-32">
                <SecondaryButton text="Annuleren" />
            </div>
            <div className="w-32">
                <PrimaryButton text="Opslaan" />
            </div>
            </div>
          </>
        )}
        {popupType === "gridPreset" && (
            {/*Hier komt code wat getoont moet worden*/}
        )}
      </div>
    </div>
  );
};

export default Popup;
