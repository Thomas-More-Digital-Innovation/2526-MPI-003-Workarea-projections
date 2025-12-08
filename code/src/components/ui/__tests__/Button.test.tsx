import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  // Test: Primary button renders with the provided text
  it('renders primary button with text', () => {
    render(<Button type="primary" text="Click Me" onClick={() => {}} />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  // Test: Secondary button has correct border and text color styling
  it('renders secondary button with correct styling', () => {
    render(<Button type="secondary" text="Secondary" onClick={() => {}} />);
    const button = screen.getByText('Secondary');
    expect(button).toHaveClass('border-[var(--color-primary)]');
    expect(button).toHaveClass('text-[var(--color-primary)]');
  });

  // Test: onClick handler is called when button is clicked
  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button type="primary" text="Click" onClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test: Button takes full width when fullWidth prop is true
  it('renders with full width when fullWidth prop is true', () => {
    render(<Button type="primary" text="Full" onClick={() => {}} fullWidth={true} />);
    const button = screen.getByText('Full');
    expect(button).toHaveClass('w-full');
  });

  // Test: Button has fixed width (282px) when fixedWidth prop is true
  it('renders with fixed width when fixedWidth prop is true', () => {
    render(<Button type="primary" text="Fixed" onClick={() => {}} fixedWidth={true} />);
    const button = screen.getByText('Fixed');
    expect(button).toHaveClass('w-75');
  });
});
