"use client";
"use client";

import { Navbar, Button, Popup } from "@/components";
import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState} from "react";

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  function handleCalibration() {
    router.push("/calibration");
  }
  
  return (
    <div className="min-h-screen bg-[var(--color-secondary)]/20 pb-24">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Welkom bij MPI Projectie Tool</h1>
        <p className="mt-4">Kies een van de onderstaande opties om te beginnen:</p>
        
        <Button onClick={handleCalibration} text="Start Calibratie & Projectie Deze knop fixen!!!!!!!" />
            
        <Button text="Grid toevoegen (tijdelijke link)" onClick={() => setShowPopup(true)} />
      </main>

      {/* Popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <Popup popupType="gridPreset" onClose={() => setShowPopup(false)} />
        </div>
      )}

      {/* Footer onderaan */}
      <Footer
      />
    </div>
  );
}
