import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner with text', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('INITIALIZING AI PROTOCOL')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const loadingContainer = container.querySelector('.dex-cinematic-loader-overlay-v2');
    const loadingSpinner = container.querySelector('.dex-reactor-container');
    const spinnerRings = container.querySelectorAll('.reactor-ring');
    const loadingText = container.querySelector('.dex-loader-text');
    
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingSpinner).toBeInTheDocument();
    expect(spinnerRings).toHaveLength(4);
    expect(loadingText).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<LoadingSpinner />);
    
    // Check if the loading text is accessible
    expect(screen.getByText('INITIALIZING AI PROTOCOL')).toBeInTheDocument();
    
    // Check if the component has proper structure
    const loadingContainer = screen.getByText('INITIALIZING AI PROTOCOL').closest('.dex-cinematic-loader-overlay-v2');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });

  it('should have proper styling structure', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check the overall structure
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveClass('dex-cinematic-loader-overlay-v2');
    
    // Check spinner structure
    const spinner = loadingContainer.querySelector('.dex-reactor-container');
    expect(spinner).toBeInTheDocument();
    
    // Check rings structure
    const rings = spinner.querySelectorAll('.reactor-ring');
    expect(rings).toHaveLength(4);
    
    // Check text structure
    const text = loadingContainer.querySelector('.dex-loader-text');
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent('INITIALIZING NEURAL LINK');
  });
}); 
