"use client";

import Navbar from "@/components/navbar";
import Button from "@/components/Button";
import Popup from "@/components/Popup";
import { useState } from "react";



export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welkom bij MPI Projectie Tool</h1>
        <p className="mt-4">Hier komt de rest van je content...</p>

        <Button text="Grid toevoegen (tijdelijke link)" onClick={() => setShowPopup(true)} />

      </main>
      {showPopup && <Popup popupType="gridPreset" />}
    </div>
  );
}