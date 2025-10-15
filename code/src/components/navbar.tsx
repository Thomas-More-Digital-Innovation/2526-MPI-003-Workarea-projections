"use client";

import React, { useState } from "react";
import { CheckIcon } from "@heroicons/react/24/solid"; // alleen als nodig

const Navbar: React.FC = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between">
      {/* Links: Titel */}
      <div className="text-xl font-bold text-gray-800">MPI Projectie Tool</div>

      {/* Midden: Zoekbalk */}
      <div className="flex-1 mx-6">
        <input
          type="text"
          placeholder="Zoeken..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Rechts: Knop en Dropdown */}
      <div className="flex items-center space-x-4 relative">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Toevoegen
        </button>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center space-x-1"
          >
            <span>Extra</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                Foto beheer
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                Imp/Exp Presets
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
