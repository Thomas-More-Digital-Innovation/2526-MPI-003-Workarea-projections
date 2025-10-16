declare global {
  interface Window {
    electronAPI: {
      addImage: (file: { name: string; buffer: Uint8Array }, description: string) => Promise<any>;
      getImages: () => Promise<any>;
      deleteImage: (imageId: number) => Promise<any>;
    };
  }
}
export {};
