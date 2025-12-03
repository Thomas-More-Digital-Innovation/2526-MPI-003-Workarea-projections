import { render, screen, fireEvent } from '@testing-library/react';
import GridCard from '@/components/ui/GridCard';

describe('GridCard Component', () => {
  const mockPreset = {
    gridLayoutId: 1,
    amount: 10,
    shape: 'circle',
    size: 'medium',
  };

  it('renders card with title and description', () => {
    render(
      <GridCard
        id={1}
        title="Test Card"
        description="Test Description"
      />
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('applies active styling when active prop is true', () => {
    render(
      <GridCard
        id={1}
        title="Active Card"
        description="Description"
        active={true}
      />
    );

    const button = screen.getByText('Active Card').closest('button');
    expect(button).toHaveClass('bg-[var(--color-primary)]/50');
  });

  it('calls onSelect handler with correct id when clicked', () => {
    const handleSelect = jest.fn();
    render(
      <GridCard
        id={42}
        title="Clickable Card"
        description="Description"
        onSelect={handleSelect}
      />
    );

    const button = screen.getByText('Clickable Card').closest('button');
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith(42);
  });

  it('renders GridPreset with correct props when preset is provided', () => {
    render(
      <GridCard
        id={1}
        title="Card with Preset"
        description="Description"
        preset={mockPreset}
      />
    );

    // Card should render without errors
    expect(screen.getByText('Card with Preset')).toBeInTheDocument();
  });

  it('truncates long title text', () => {
    const longTitle = 'This is a very long title that should be truncated to fit within the card boundaries';
    render(
      <GridCard
        id={1}
        title={longTitle}
        description="Description"
      />
    );

    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('truncates long description text', () => {
    const longDescription = 'This is a very long description that should be truncated to fit within the card boundaries and not overflow';
    render(
      <GridCard
        id={1}
        title="Title"
        description={longDescription}
      />
    );

    const descriptionElement = screen.getByText(longDescription);
    expect(descriptionElement).toHaveClass('line-clamp-3');
  });
});
