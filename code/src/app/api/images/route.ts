import { NextResponse } from 'next/server';
import { ipcRenderer } from 'electron';

export async function GET() {
  // Haal alle foto's op via Electron IPC
  const images = await ipcRenderer.invoke('images:getAll');
  return NextResponse.json(images);
}

export async function POST(request: Request) {
  const { path, description } = await request.json();
  const result = await ipcRenderer.invoke('images:add', { path, description });
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const { imageId } = await request.json();
  const result = await ipcRenderer.invoke('images:delete', imageId);
  return NextResponse.json(result);
}
