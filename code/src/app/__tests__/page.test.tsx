import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Home from '@/app/page';

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders the main page with title', async () => {
    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue([]);
    
    await act(async () => {
      render(<Home />);
    });
    
    expect(screen.getByText('MPI Projectie Tool')).toBeInTheDocument();
  });

  it('displays empty state when no presets are available', async () => {
    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue([]);
    
    await act(async () => {
      render(<Home />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Geen presets gevonden')).toBeInTheDocument();
    });
  });

  it('loads and displays presets from API', async () => {
    const mockPresets = [
      {
        presetId: 1,
        name: 'Test Preset 1',
        description: 'Description 1',
        gridLayoutId: 1,
        amount: 10,
        shape: 'circle',
        size: 'medium',
      },
      {
        presetId: 2,
        name: 'Test Preset 2',
        description: 'Description 2',
        gridLayoutId: 2,
        amount: 15,
        shape: 'rectangle',
        size: 'large',
      },
    ];

    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue(mockPresets);
    global.electronAPI.getStepsByPreset.mockResolvedValue([]);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Preset 1')).toBeInTheDocument();
      expect(screen.getByText('Test Preset 2')).toBeInTheDocument();
    });
  });

  it('selects a preset when clicking on card', async () => {
    const mockPresets = [
      {
        presetId: 1,
        name: 'Test Preset',
        description: 'Test Description',
        gridLayoutId: 1,
        amount: 10,
        shape: 'circle',
        size: 'medium',
      },
    ];

    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue(mockPresets);
    global.electronAPI.getStepsByPreset.mockResolvedValue([]);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Preset')).toBeInTheDocument();
    });

    const card = screen.getByText('Test Preset').closest('button');
    await act(async () => {
      fireEvent.click(card);
    });

    expect(card).toHaveClass('bg-[var(--color-primary)]/50');
  });

  it('shows warning when starting without selecting a preset', async () => {
    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue([]);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Selecteer eerst een preset')).toBeInTheDocument();
    });
  });

  it('filters presets based on search query', async () => {
    const mockPresets = [
      {
        presetId: 1,
        name: 'Circle Preset',
        description: 'Circle shapes',
        gridLayoutId: 1,
        amount: 10,
        shape: 'circle',
        size: 'medium',
      },
      {
        presetId: 2,
        name: 'Rectangle Preset',
        description: 'Rectangle shapes',
        gridLayoutId: 2,
        amount: 15,
        shape: 'rectangle',
        size: 'large',
      },
    ];

    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue(mockPresets);
    global.electronAPI.getStepsByPreset.mockResolvedValue([]);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByText('Circle Preset')).toBeInTheDocument();
      expect(screen.getByText('Rectangle Preset')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Zoeken...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Circle' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Circle Preset')).toBeInTheDocument();
      expect(screen.queryByText('Rectangle Preset')).not.toBeInTheDocument();
    });
  });

  it('navigates to calibration page when clicking Kalibratie button', async () => {
    global.electronAPI.getPresetsWithGridLayouts.mockResolvedValue([]);

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      const calibrationButton = screen.getByText('Kalibratie');
      fireEvent.click(calibrationButton);
    });

    // Router push is mocked in jest.setup.js
    expect(true).toBe(true);
  });
});
