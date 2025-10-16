"use client";

import { Navbar, Button, Popup } from "@/components";
import { Link } from "lucide-react";
import { useState} from "react";



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

        <a href="/calibration" className="text-blue-500 underline">
          Go to Calibration System
        </a>
      </main>
      {showPopup && <Popup popupType="gridPreset" />}
    </div>
  );
}
