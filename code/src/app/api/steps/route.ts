import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('presetId');
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.steps) {
      const steps = presetId 
        ? await (globalThis as any).electronAPI.steps.getByPreset(parseInt(presetId))
        : await (globalThis as any).electronAPI.steps.getAll();
      return NextResponse.json(steps);
    }
    return NextResponse.json([]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { step, imageId, gridLayoutId, presetId } = await request.json();
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.steps) {
      const result = await (globalThis as any).electronAPI.steps.add({ 
        step, 
        imageId, 
        gridLayoutId, 
        presetId 
      });
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Electron API not available' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { stepId, step, imageId, gridLayoutId } = await request.json();
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.steps) {
      const result = await (globalThis as any).electronAPI.steps.update({ 
        stepId, 
        step, 
        imageId, 
        gridLayoutId 
      });
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Electron API not available' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { stepId } = await request.json();
    
    if (typeof globalThis !== 'undefined' && (globalThis as any).electronAPI?.steps) {
      const result = await (globalThis as any).electronAPI.steps.delete(stepId);
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Electron API not available' }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 });
  }
}
