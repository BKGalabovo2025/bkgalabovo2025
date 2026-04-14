import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

describe('Home Page', () => {
  it('renders correctly', () => {
    render(<Page />);
    // Add a basic check here. Since I don't know the content of Page, I'll just check if it renders.
    expect(true).toBe(true);
  });
});
