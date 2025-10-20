"use client";

import React, { useState } from "react";

<<<<<<< Updated upstream:code/src/components/navbar.tsx
import { CheckIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
=======
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Dropdown from "../ui/Dropdown";
import Button from "../ui/Button";
import Popup from "../ui/Popup";
import { useRouter } from "next/navigation";
>>>>>>> Stashed changes:code/src/components/layout/Navbar.tsx

import Dropdown from "./Dropdown";
import Button from "./Button";
import Popup from "./Popup";
import { useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  // dropdownOpen state removed (unused)
  const [showPopup, setShowPopup] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  function handleFotoBeheer() {
    router.push("/foto-beheer");
  }

  function handlePresets() {
    setShowPopup(true);
  }

  function handleClosePopup() {
    setShowPopup(false);
  }

  return (
  <nav className={`bg-white shadow-md px-6 py-3 flex items-center justify-between m-2 relative ${mobileMenuOpen ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'}`}> 
      {/* Links: Titel */}
      <div className="text-4xl font-semibold text-[var(--dark-text)]">
        MPI Projectie Tool
      </div>

      {/* Midden: Zoekbalk (hidden on mobile, centered on desktop) */}
      <div className="hidden md:block absolute left-0 right-0 mx-auto" style={{maxWidth: '400px'}}>
        <input
          type="text"
          placeholder="Zoeken..."
          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        />
      </div>

      {/* Rechts: Knop en Dropdown (hidden on mobile) */}
      <div className="hidden md:flex items-center space-x-4 relative">
        <Button type="primary" text="Toevoegen" />
        <Dropdown>
          <Dropdown.Button>Extra</Dropdown.Button>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleFotoBeheer}>Foto Beheer</Dropdown.Item>
            <Dropdown.Item onClick={handlePresets}>Imp/Exp presets</Dropdown.Item> 
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Burger menu icon (visible on mobile only) */}
      <button
        className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        onClick={() => setMobileMenuOpen((open) => !open)}
        aria-label="Open menu"
      >
        {mobileMenuOpen ? (
          <XMarkIcon className="h-8 w-8 text-[var(--color-primary)]" />
        ) : (
          <Bars3Icon className="h-8 w-8 text-[var(--color-primary)]" />
        )}
      </button>

      {/* Mobile dropdown menu (not overlay) */}
      {mobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full py-4 bg-white rounded-b-2xl shadow-lg z-40 flex flex-col items-center md:hidden animate-fadeIn">
          <input
            type="text"
            placeholder="Zoeken..."
            className="w-11/12 mb-4 mt-4 px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
          <div className="w-11/12 mb-4">
            <Button type="primary" text="Toevoegen" />
          </div>
          <Dropdown>
            <Dropdown.Button>Extra</Dropdown.Button>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleFotoBeheer}>Foto Beheer</Dropdown.Item>
              <Dropdown.Item onClick={handlePresets}>Imp/Exp presets</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      )}

      {/* Popup overlay (always on top) */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 bg-opacity-40 z-50">
          <Popup popupType="exportImport" onClose={handleClosePopup} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
