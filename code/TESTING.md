# Testing Setup Guide

## Installation

Install the testing dependencies:

```bash
npm install
```

This will install:
- **Jest**: Testing framework
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers
- **@swc/jest**: Fast TypeScript/JSX transformer
- **jest-environment-jsdom**: DOM environment for tests

## Quick Start

### 1. Run all tests
```bash
npm test
```

### 2. Run tests in watch mode (recommended for development)
```bash
npm run test:watch
```

### 3. Generate coverage report
```bash
npm run test:coverage
```

## Configuration Files

### `jest.config.js`
Main Jest configuration with:
- jsdom test environment for React components
- Path aliases (@/ mapping to src/)
- CSS module mocking
- SWC transformer for fast builds

### `jest.setup.js`
Global test setup with:
- @testing-library/jest-dom matchers
- Next.js router mocks
- localStorage mocks
- electronAPI mocks
- MediaDevices mocks

## Writing Your First Test

Create a new test file in `__tests__` folder:

```typescript
// src/components/MyComponent/__tests__/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders the component', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles button click', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Testing Best Practices

### 1. **Test behavior, not implementation**
```typescript
// ❌ Bad: Testing implementation details
expect(component.state.counter).toBe(5);

// ✅ Good: Testing user-visible behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. **Use accessible queries**
Prefer queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - For form elements
3. `getByPlaceholderText` - For inputs
4. `getByText` - For non-interactive content
5. `getByTestId` - Last resort

### 3. **Clean up after tests**
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});
```

### 4. **Use async utilities for async operations**
```typescript
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

## Common Testing Patterns

### Testing user interactions
```typescript
fireEvent.click(screen.getByRole('button'));
fireEvent.change(input, { target: { value: 'new value' } });
```

### Testing async data loading
```typescript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Testing with mocked API calls
```typescript
global.electronAPI.getPresets.mockResolvedValue([
  { id: 1, name: 'Test' }
]);
```

## Coverage Goals

Aim for:
- **80%+ overall coverage**
- **90%+ for critical paths** (AR detection, calibration)
- **100% for utility functions**

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Troubleshooting

### "Cannot find module '@/...'"
Check that `jest.config.js` has correct moduleNameMapper:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### "document is not defined"
Ensure `testEnvironment: 'jsdom'` in `jest.config.js`

### "useRouter is not a function"
The mock is set up in `jest.setup.js`. If issues persist, check the import:
```typescript
import { useRouter } from 'next/navigation';
```

## Next Steps

1. Run `npm test` to verify setup
2. Check test results
3. Add tests for your components
4. Run `npm run test:coverage` to see coverage
5. Iterate and improve!

Happy testing! 🧪
