"use client";

import { Navbar } from "@/components";

export default function FotoBeheer() {
  return (
    <div className="min-h-screen bg-[var(--color-secondary)]/20">
      {/* Navbar bovenaan */}
      <Navbar />

      {/* Content van de pagina */}
      <main className="p-6">
        <h1 className="text-2xl font-bold">Foto Beheer</h1>
        <p className="mt-4">Beheer hier al je geüploade foto&#39;s en projecties.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder voor foto items */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">Foto preview</span>
            </div>
            <h3 className="font-semibold">Projectie 1</h3>
            <p className="text-sm text-gray-600">Laatst gewijzigd: 16/10/2025</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">Foto preview</span>
            </div>
            <h3 className="font-semibold">Projectie 2</h3>
            <p className="text-sm text-gray-600">Laatst gewijzigd: 15/10/2025</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-gray-500">Foto preview</span>
            </div>
            <h3 className="font-semibold">Projectie 3</h3>
            <p className="text-sm text-gray-600">Laatst gewijzigd: 14/10/2025</p>
          </div>
        </div>
      </main>
    </div>
  );
}
