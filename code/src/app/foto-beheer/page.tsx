'use client';

import React, { useState } from 'react';
import { Plus, Upload, X } from 'lucide-react';
import { Button, Footer } from '@/components';
import Toast from '@/components/ui/Toast';

export default function FotosBeheren() {
  const [images, setImages] = useState<Array<{ imageId: number; path: string; description: string }>>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<{ imageId: number; path: string; description: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "error") => {
    setToast({ message, type });
  };

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
    const description = 'Geüploade afbeelding';
    if (window.electronAPI && window.electronAPI.addImage) {
      await window.electronAPI.addImage(fileData, description);
    } else {
      showToast('Electron API niet beschikbaar.', 'error');
    }
    // Cleanup
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowUploadModal(false);
    fetchImages();
  };

  const handleTerug = () => {
    console.log('Terug navigeren');
    window.history.back();
  };

  const handleOpslaan = () => {
    console.log('Opslaan');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-secondary)]/20">
      {/* Header - centered card */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w rounded-2xl shadow-md" style={{ backgroundColor: 'var(--color-white)', padding: '0.75rem' }}>
          <h1 className="text-center text-4xl px-6 py-3 font-semibold text-[var(--dark-text)]">Foto&apos;s Beheren</h1>
        </div>
      </div>

      {/* Content area - over volle breedte met padding aan zijkanten */}
      <div className="flex-1 px-4">
  <div className="rounded-2xl p-6 min-h-[38.7vw] overflow-y-auto shadow-sm" style={{ backgroundColor: 'var(--color-white)' }}>
          <div className="grid grid-cols-8 gap-4 w-full scrollable">
            {/* Add Button as first grid cell */}
            <div className="w-full aspect-square rounded-2xl border border-dashed flex items-center justify-center hover:bg-white/60 transition-all bg-[var(--color-white)]">
              <button
                onClick={handleAddImage}
                aria-label="Voeg afbeelding toe"
                className="w-full h-full flex items-center justify-center"
              >
                <Plus className="w-12 h-12 text-[var(--color-primary)]" strokeWidth={1} />
              </button>
            </div>

            {/* Image Previews from DB (limit to 18 = 6x3) */}
            {images.map((img) => (
              <div
                key={img.imageId}
                className="w-full aspect-square rounded-2xl overflow-hidden shadow-lg bg-[var(--color-white)] cursor-pointer"
                onClick={() => {
                  setImageToDelete(img);
                  setShowDeleteModal(true);
                }}
              >
                <img
                  src={`/${img.path}`}
                  alt={img.description || 'Preview'}
                  className="w-full h-full object-contain object-center"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Buttons - over volle breedte */}
      <div className="p-4">
        <div className="w-full rounded-2xl shadow-md" style={{ backgroundColor: 'var(--color-white)' }}>
          <Footer>
            <Button text="Terug" type="primary" onClick={handleTerug} fullWidth={false} fixedWidth={true} />
          </Footer>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && imageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-2">
          <div className="rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden" style={{ backgroundColor: 'var(--color-white)' }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setImageToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div style={{ background: 'var(--color-popup)' }} className="px-6 py-4">
              <div className='pb-3'>
                <h2 className="text-xl font-semibold text-[var(--dark-text)] text-center">Foto verwijderen</h2>
              </div>

              <div className='border border-gray-400'></div>

              {/* Content */}
              <div className="pt-12">
                <div className="flex justify-center mb-6">
                    <div className="w-40 sm:w-48 md:w-56 aspect-square rounded-2xl overflow-hidden shadow-md bg-[var(--color-white)]">
                      <img
                        src={`/${imageToDelete.path}`}
                        alt={imageToDelete.description || 'Preview'}
                        className="w-full h-full object-contain object-center"
                      />
                    </div>
                  </div>
                <p className="text-center text-xl text-gray-700 mb-6">
                  Weet je zeker dat je deze afbeelding wilt verwijderen?
                </p>
                <div className="flex w-full pt-6">
                    <div style={{paddingRight: '0.25rem', borderRadius: '0.75rem' }} className="flex-1">
                    <Button text="Terug" type="secondary" onClick={() => { setShowDeleteModal(false); setImageToDelete(null); }} />
                  </div>
                  <div style={{paddingLeft: '0.25rem', borderRadius: '0.75rem' }} className="flex-1">
                    <Button text="Verwijderen" type="primary" onClick={async () => {
                      if (window.electronAPI && window.electronAPI.deleteImage) {
                        await window.electronAPI.deleteImage(imageToDelete.imageId);
                        setShowDeleteModal(false);
                        setImageToDelete(null);
                        fetchImages();
                      }
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal - same layout as Delete Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden" style={{ backgroundColor: 'var(--color-white)' }}>
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
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div style={{ background: 'var(--color-popup)' }} className="px-6 py-4">
              <div className='pb-3'>
                <h2 className="text-xl font-semibold text-[var(--dark-text)] text-center">Foto Toevoegen</h2>
              </div>

              <div className='border border-gray-400'></div>

              {/* Content */}
              <div className="pt-12">
                <div className="flex justify-center mb-6">
                  {previewUrl ? (
                    <div className="w-40 sm:w-48 md:w-56 aspect-square rounded-lg overflow-hidden shadow-md bg-[var(--color-white)]">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain object-center"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-lg bg-gray-200 shadow"></div>
                      <div className="w-20 h-20 rounded-lg bg-gray-200 shadow"></div>
                      <div className="w-20 h-20 rounded-lg bg-gray-200 shadow"></div>
                    </div>
                  )}
                </div>

                <p className="text-center text-xl text-gray-700 mb-6">
                  klik op opslaan om de afbeelding toe te voegen.
                </p>

                <div className="flex w-full pt-6">
                  <div style={{padding: '0.25rem', borderRadius: '0.75rem' }} className="flex-1">
                    <Button text="Terug" type="secondary" onClick={() => { if (previewUrl !== null) { URL.revokeObjectURL(previewUrl); } setPreviewUrl(null); setSelectedFile(null); setShowUploadModal(false); }} />
                  </div>
                  <div style={{padding: '0.25rem', borderRadius: '0.75rem' }} className="flex-1">
                    <Button text="Opslaan" type="primary" onClick={handleUploadFromLocal} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}