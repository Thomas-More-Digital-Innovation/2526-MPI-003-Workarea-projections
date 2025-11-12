import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.presets) {
      const presets = await (globalThis as any).electronAPI.presets.getAll();
      return NextResponse.json(presets);
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.presets) {
      const result = await (globalThis as any).electronAPI.presets.add({ name, description });
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Electron API not available' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
  }
}
