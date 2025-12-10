import "@testing-library/jest-dom";

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }) => children,
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    custom: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock USA Map
jest.mock("@mirawision/usa-map-react", () => ({
  USAMap: () => <div data-testid="usa-map">USA Map</div>,
}));
