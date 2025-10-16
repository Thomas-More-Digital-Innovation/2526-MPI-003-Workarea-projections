"use client";

import { Navbar, Button, Popup } from "@/components";
import { useState } from "react";



export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  
  return (
    <div className="min-h-screen bg-[var(--color-secondary)]/20">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welkom bij MPI Projectie Tool</h1>
        <p className="mt-4">Hier komt de rest van je content...</p>

        <Button text="Grid toevoegen (tijdelijke link)" onClick={() => setShowPopup(true)} />

       
       {/* <Button type="primary" text="hello" onClick={() => setShowPopup(true)} />
        {showPopup && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            <Popup  popupType="imageUpload" />
            <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setShowPopup(false)}>&times;</button>
          </div>
        )} */}
      </main>
      {showPopup && <Popup popupType="gridPreset" />}
    </div>
  );
}
