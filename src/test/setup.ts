import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock crypto.randomUUID for tests
Object.defineProperty(global.crypto, 'randomUUID', {
  value: () => Math.random().toString(36).substring(2),
  writable: true,
  configurable: true,
});
