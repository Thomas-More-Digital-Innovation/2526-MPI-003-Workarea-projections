"use client";

import React, { useState } from "react";

import Link from "next/link";
import { CheckIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/solid";
import Dropdown from "../ui/Dropdown";
import Button from "../ui/Button";
import Popup from "../ui/Popup";
import { useRouter } from "next/navigation";


interface NavbarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ searchQuery = "", onSearchChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  <nav className={`bg-white shadow-md px-3 py-3 flex items-center justify-between relative ${mobileMenuOpen ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'}`}> 
      {/* Links: Titel */}
      <div className="text-4xl font-semibold text-[var(--dark-text)]">
        MPI Projectie Tool
      </div>

      {/* Midden: Zoekbalk (hidden on mobile, centered on desktop) */}
      <div className="hidden md:block absolute left-0 right-0 mx-auto" style={{maxWidth: '400px'}}>
        <input
          type="text"
          placeholder="Zoeken..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
        />
      </div>

      {/* Rechts: Knop en Dropdown (hidden on mobile) */}
      <div className="hidden md:flex items-center space-x-4 relative">
        <Button type="primary" onClick={() => router.push('/preset')} text="Toevoegen" />
        <Dropdown>
          <Dropdown.Button>Extra</Dropdown.Button>
          <Dropdown.Menu>
            <Dropdown.Item onClick={handleFotoBeheer}>Foto Beheer</Dropdown.Item>
            <Dropdown.Item onClick={handlePresets}>Imp/Exp presets</Dropdown.Item> 
          </Dropdown.Menu>
        </Dropdown>
      </div>
      {/* Popup overlay (always on top) */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 bg-opacity-40">
          <Popup popupType="exportImport" onClose={handleClosePopup} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
