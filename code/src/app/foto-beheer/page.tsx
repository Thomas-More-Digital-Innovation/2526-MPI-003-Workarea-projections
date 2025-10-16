'use client';

import React, { useState } from 'react';
import Image from 'next/image';

declare global {
  interface Window {
    electronAPI?: {
      addImage: (file: { name: string; buffer: Uint8Array }, description: string) => Promise<unknown>;
      getImages: () => Promise<unknown>;
      deleteImage: (imageId: number) => Promise<unknown>;
    };
  }
}
import { Plus, Upload, X } from 'lucide-react';

export default function FotosBeheren() {
  const [images, setImages] = useState<Array<{ imageId: number; path: string; description: string }>>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ imageId: number; path: string; description: string } | null>(null);

  // Fetch images from database on mount
  const fetchImages = async () => {
    if (window.electronAPI && window.electronAPI.getImages) {
      const dbImages = await window.electronAPI.getImages();
      setImages(dbImages as Array<{ imageId: number; path: string; description: string }>);
    }
  };
  React.useEffect(() => {
    fetchImages();
  }, []);

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setShowUploadModal(true);
    };
    input.click();
  };

  const handleUploadFromLocal = async () => {
    if (!selectedFile) return;
    const arrayBuffer = await selectedFile.arrayBuffer();
    const fileData = {
      name: selectedFile.name,
      buffer: new Uint8Array(arrayBuffer),
    };
    const description = 'Geüploade afbeelding'; // Hardcoded description
    if (window.electronAPI && window.electronAPI.addImage) {
      await window.electronAPI.addImage(fileData, description);
      alert('Afbeelding opgeslagen in database!');
    } else {
      alert('Electron API niet beschikbaar.');
    }
    // Cleanup
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowUploadModal(false);
  };

  const handleUploadFromOnline = () => {
    console.log('Upload van internet');
    setShowUploadModal(false);
  };

  const handleTerug = () => {
    console.log('Terug navigeren');
    window.history.back();
  };

  const handleOpslaan = () => {
    console.log('Opslaan');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-100 to-cyan-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4 shadow">
        <h1 className="text-xl font-semibold text-white">Foto&apos;s Beheren 2</h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto">
  <div className="grid grid-cols-6 grid-rows-3 gap-3 justify-center items-center">
          {/* Add Button */}
          <button
            onClick={handleAddImage}
            className="w-56 h-56 border-2 border-dashed border-teal-400 rounded-lg flex items-center justify-center hover:border-teal-500 hover:bg-white/60 transition-colors bg-white/40"
          >
            <Plus className="w-16 h-16 text-teal-600" />
          </button>

          {/* Image Previews from DB */}
          {images.length > 0
            ? images.map((img) => (
                <div
                  key={img.imageId}
                  className="w-56 h-56 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer flex items-center justify-center bg-white"
                  onClick={() => {
                    setImageToDelete(img);
                    setShowDeleteModal(true);
                  }}
                >
                  <Image
                    src={`/${img.path}`}
                    alt={img.description || 'Preview'}
                    width={224}
                    height={224}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ))
            : <div className="col-span-6 row-span-3 flex items-center justify-center min-w-full">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium mb-2">
                    Nog geen foto&apos;s toegevoegd
                  </p>
                  <p className="text-gray-400 text-sm">
                    Klik op de + knop om foto&apos;s toe te voegen
                  </p>
                </div>
              </div>
          }
      {/* Delete Modal (outside grid) */}
      {showDeleteModal && imageToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setImageToDelete(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-2xl px-6 py-4">
              <h2 className="text-lg font-semibold text-white text-center">Afbeelding verwijderen</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <Image
                  src={`/${imageToDelete.path}`}
                  alt={imageToDelete.description || 'Preview'}
                  width={224}
                  height={224}
                  className="rounded-lg shadow"
                  unoptimized
                />
              </div>
              <p className="text-center text-gray-700 font-medium mb-6">
                Weet je zeker dat je deze afbeelding wilt verwijderen?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setImageToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors font-medium shadow"
                >
                  Annuleren
                </button>
                <button
                  onClick={async () => {
                    if (window.electronAPI && window.electronAPI.deleteImage) {
                      await window.electronAPI.deleteImage(imageToDelete.imageId);
                      setShowDeleteModal(false);
                      setImageToDelete(null);
                      fetchImages();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium shadow"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        </div>
    )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between shadow">
        <button
          onClick={handleTerug}
          className="px-8 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors font-medium shadow"
        >
          Terug
        </button>
        <button
          onClick={handleOpslaan}
          className="px-8 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors font-medium shadow"
        >
          Opslaan
        </button>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative">
            {/* Close Button */}
            <button
              onClick={() => {
                if (previewUrl !== null) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                setSelectedFile(null);
                setShowUploadModal(false);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-t-2xl px-6 py-4">
              <h2 className="text-lg font-semibold text-white text-center">Foto Toevoegen 2</h2>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Upload Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-teal-600" />
                </div>
              </div>


              {/* Images Preview */}
              <div className="flex justify-center gap-3 mb-6">
                {previewUrl ? (
                  <Image 
                    src={previewUrl} 
                    alt="Preview" 
                    width={256}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg shadow"
                    unoptimized
                  />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-lg bg-gray-300 shadow"></div>
                    <div className="w-16 h-16 rounded-lg bg-gray-300 shadow"></div>
                    <div className="w-16 h-16 rounded-lg bg-gray-300 shadow"></div>
                  </>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (previewUrl !== null) {
                      URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(null);
                    setSelectedFile(null);
                    setShowUploadModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors font-medium shadow"
                >
                  Terug
                </button>
                <button
                  onClick={handleUploadFromLocal}
                  className="flex-1 px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors font-medium shadow"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
