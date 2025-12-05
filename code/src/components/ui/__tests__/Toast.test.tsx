import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '@/components/ui/Toast';

describe('Toast Component', () => {
  // Test: Toast notification displays the provided message
  it('renders toast with message', () => {
    render(<Toast message="Test message" type="info" onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  // Test: Success toast has green border styling
  it('renders success toast with correct styling', () => {
    const { container } = render(<Toast message="Success!" type="success" onClose={() => {}} />);
    const toast = container.querySelector('.border-green-500');
    expect(toast).toBeInTheDocument();
  });

  // Test: Error toast has red border styling
  it('renders error toast with correct styling', () => {
    const { container } = render(<Toast message="Error!" type="error" onClose={() => {}} />);
    const toast = container.querySelector('.border-red-500');
    expect(toast).toBeInTheDocument();
  });

  // Test: Warning toast has yellow border styling
  it('renders warning toast with correct styling', () => {
    const { container } = render(<Toast message="Warning!" type="warning" onClose={() => {}} />);
    const toast = container.querySelector('.border-yellow-500');
    expect(toast).toBeInTheDocument();
  });

  // Test: Info toast has blue border styling
  it('renders info toast with correct styling', () => {
    const { container } = render(<Toast message="Info" type="info" onClose={() => {}} />);
    const toast = container.querySelector('.border-blue-500');
    expect(toast).toBeInTheDocument();
  });

  // Test: Clicking the close button triggers onClose handler
  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Toast message="Test" type="info" onClose={handleClose} />);
    
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // Test: Toast automatically dismisses after 3 seconds
  it('auto-closes after 3 seconds by default', () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();
    
    render(<Toast message="Auto close" type="info" onClose={handleClose} />);
    
    expect(handleClose).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(3000);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });
});
