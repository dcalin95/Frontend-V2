import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render loading spinner with text', () => {
    render(<LoadingSpinner />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(<LoadingSpinner />);
    
    const loadingContainer = container.querySelector('.loading-container');
    const loadingSpinner = container.querySelector('.loading-spinner');
    const spinnerRings = container.querySelectorAll('.spinner-ring');
    const loadingText = container.querySelector('.loading-text');
    
    expect(loadingContainer).toBeInTheDocument();
    expect(loadingSpinner).toBeInTheDocument();
    expect(spinnerRings).toHaveLength(3);
    expect(loadingText).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<LoadingSpinner />);
    
    // Check if the loading text is accessible
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check if the component has proper structure
    const loadingContainer = screen.getByText('Loading...').closest('.loading-container');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });

  it('should have proper styling structure', () => {
    const { container } = render(<LoadingSpinner />);
    
    // Check the overall structure
    const loadingContainer = container.firstChild;
    expect(loadingContainer).toHaveClass('loading-container');
    
    // Check spinner structure
    const spinner = loadingContainer.querySelector('.loading-spinner');
    expect(spinner).toBeInTheDocument();
    
    // Check rings structure
    const rings = spinner.querySelectorAll('.spinner-ring');
    expect(rings).toHaveLength(3);
    
    // Check text structure
    const text = spinner.querySelector('.loading-text');
    expect(text).toBeInTheDocument();
    expect(text).toHaveTextContent('Loading...');
  });
}); 