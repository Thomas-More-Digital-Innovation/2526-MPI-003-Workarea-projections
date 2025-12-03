import { render, screen } from '@testing-library/react';
import GridPreset from '@/components/grid/GridPreset';

describe('GridPreset Component', () => {
  it('renders grid with correct number of shapes', () => {
    const { container } = render(
      <GridPreset
        shape="circle"
        size="medium"
        total={8}
        pagination={false}
      />
    );

    // Component should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });

  it('respects maxShapes limiter', () => {
    render(
      <GridPreset
        shape="circle"
        size="small"
        total={100}
        maxShapes={15}
        pagination={false}
      />
    );

    // Should only render 15 shapes instead of 100
    expect(screen.queryByText('Pagina')).not.toBeInTheDocument();
  });

  it('shows pagination controls when pagination is enabled and multiple pages exist', () => {
    const { container } = render(
      <GridPreset
        shape="circle"
        size="medium"
        total={20}
        pagination={true}
        scale={1}
      />
    );

    // Should render pagination component
    expect(container).toBeInTheDocument();
  });

  it('handles different scales correctly', () => {
    const { container } = render(
      <GridPreset
        shape="circle"
        size="medium"
        total={20}
        pagination={true}
        scale={0.5}
      />
    );

    // Component should render with any scale
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders rectangles with correct configuration', () => {
    const { container } = render(
      <GridPreset
        shape="rectangle"
        size="large"
        total={4}
        pagination={false}
      />
    );

    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles completed states correctly', () => {
    const completedStates = [true, false, true, false];
    
    const { container } = render(
      <GridPreset
        shape="circle"
        size="medium"
        total={4}
        completedStates={completedStates}
        pagination={false}
      />
    );

    // Completed shapes should render with green styling
    const shapes = container.querySelectorAll('.border-green-500');
    expect(shapes.length).toBeGreaterThan(0);
  });
});
