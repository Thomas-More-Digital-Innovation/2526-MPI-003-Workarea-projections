import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  it('renders primary button with text', () => {
    render(<Button type="primary" text="Click Me" onClick={() => {}} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('renders secondary button with correct styling', () => {
    render(<Button type="secondary" text="Secondary" onClick={() => {}} />);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('border-[var(--color-primary)]');
    expect(button).toHaveClass('text-[var(--color-primary)]');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button type="primary" text="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with full width when fullWidth prop is true', () => {
    render(<Button type="primary" text="Full" onClick={() => {}} fullWidth={true} />);
    const button = screen.getByText('Full');
    expect(button).toHaveClass('w-full');
  });

  it('renders with fixed width when fixedWidth prop is true', () => {
    render(<Button type="primary" text="Fixed" onClick={() => {}} fixedWidth={true} />);
    const button = screen.getByText('Fixed');
    expect(button).toHaveClass('w-75');
  });
});
