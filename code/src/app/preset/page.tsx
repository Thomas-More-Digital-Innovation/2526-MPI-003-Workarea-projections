"use client";
"use client";


import React, { useState, useEffect } from "react";
import { Navbar, Button, Popup, GridCard, Footer } from "@/components";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";

interface CardData {
  id: number;
  title: string;
  description: string;
}

export default function preset() {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();


  return (
    <div className="p-4 min-h-screen bg-[var(--color-secondary)]/20 flex flex-col justify-between gap-4">

      <div className="">
        <div className="mx-auto max-w rounded-2xl shadow-md" style={{ backgroundColor: 'var(--color-white)', padding: '0.75rem' }}>
          <h1 className="text-center text-4xl px-6 py-3 font-semibold text-[var(--dark-text)]">Preset Toevoegen</h1>
        </div>
      </div>

      <main id="Presets" className="bg-white shadow-md px-3 py-3 flex justify-between rounded-2xl w-full flex-1">
        <div className="flex flex-row w-screen">
          <Button text="Grid toevoegen" onClick={() => setShowPopup(true)} />
          <Button text="Foto Toevoegen"  />
        </div>
        
      </main>

      <Footer>
        <Button onClick={() => router.push('/')} text="Terug" fullWidth={false} fixedWidth={true} />
        <Button type="primary" text="Opslaan" onClick={() => {}} fullWidth={false} fixedWidth={true} />
      </Footer>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <Popup popupType="gridPreset" onClose={() => setShowPopup(false)} />
          <button
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setShowPopup(false)}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
