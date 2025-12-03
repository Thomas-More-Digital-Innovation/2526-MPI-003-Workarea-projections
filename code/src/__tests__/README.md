# Integration Testing

This directory contains integration tests for the MPI Projection Tool application.

## Test Structure

```
src/
├── app/
│   └── __tests__/
│       └── page.test.tsx          # Home page integration tests
└── components/
    ├── grid/
    │   └── __tests__/
    │       └── GridPreset.test.tsx # Grid preset component tests
    └── ui/
        └── __tests__/
            ├── Button.test.tsx     # Button component tests
            ├── GridCard.test.tsx   # Grid card component tests
            └── Toast.test.tsx      # Toast notification tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- Button.test.tsx
```

## Test Coverage

Current test coverage includes:

### Home Page (`page.test.tsx`)
- ✅ Renders main page with title
- ✅ Displays empty state when no presets
- ✅ Loads and displays presets from API
- ✅ Preset selection functionality
- ✅ Warning when starting without selection
- ✅ Search/filter functionality
- ✅ Navigation to calibration page

### Button Component (`Button.test.tsx`)
- ✅ Primary and secondary button rendering
- ✅ Click handler functionality
- ✅ Full width styling
- ✅ Fixed width styling

### GridCard Component (`GridCard.test.tsx`)
- ✅ Card rendering with title and description
- ✅ Active state styling
- ✅ Selection handler
- ✅ Grid preset rendering
- ✅ Text truncation (title and description)

### GridPreset Component (`GridPreset.test.tsx`)
- ✅ Grid rendering with shapes
- ✅ MaxShapes limiter
- ✅ Pagination controls
- ✅ Scale-based pagination visibility
- ✅ Rectangle configuration
- ✅ Completed states handling

### Toast Component (`Toast.test.tsx`)
- ✅ Toast message rendering
- ✅ Different toast types (success, error, warning, info)
- ✅ Close button functionality
- ✅ Auto-close after 3 seconds

## Adding New Tests

1. Create a `__tests__` directory in the component folder
2. Create a test file with `.test.tsx` or `.test.ts` extension
3. Import necessary testing utilities from `@testing-library/react`
4. Write test cases using `describe` and `it` blocks

Example:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import YourComponent from '../YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Mocked Dependencies

The following are automatically mocked in `jest.setup.js`:
- Next.js navigation (`useRouter`, `usePathname`, `useSearchParams`)
- localStorage
- electronAPI
- navigator.mediaDevices
- window.confirm and window.alert

## Future Test Areas

Consider adding tests for:
- [ ] Calibration page functionality
- [ ] Projection page AR detection
- [ ] Image upload and management
- [ ] Preset creation and editing
- [ ] Step management
- [ ] Export/Import functionality
- [ ] Dropdown component
- [ ] InputField component
- [ ] Footer and Header components
