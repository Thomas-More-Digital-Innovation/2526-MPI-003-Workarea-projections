import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.gridLayouts) {
      const gridLayouts = await (globalThis as any).electronAPI.gridLayouts.getAll();
      return NextResponse.json(gridLayouts);
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch grid layouts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { amount, shape, size } = await request.json();
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.gridLayouts) {
      const result = await (globalThis as any).electronAPI.gridLayouts.add({ amount, shape, size });
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Electron API not available' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create grid layout' }, { status: 500 });
  }
}
