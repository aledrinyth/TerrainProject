import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App'; // adjust if your path differs

describe('App', () => {
  it('renders the placeholder heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /App Container/i })).toBeInTheDocument();
  });

  it('renders the container element', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });
});