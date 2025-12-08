import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock electron API
global.electronAPI = {
  getPresets: jest.fn(),
  getPresetsWithGridLayouts: jest.fn(),
  getGridLayouts: jest.fn(),
  getImages: jest.fn(),
  getStepsByPreset: jest.fn(),
  addImage: jest.fn(),
};

// Mock MediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(),
  },
});

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock window.alert
global.alert = jest.fn();
