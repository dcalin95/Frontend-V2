import React from 'react';
import '../../styles/components/ui/slider.css';

const Slider = ({ value, onChange, min = 0, max = 100, step = 1, className = '', ...props }) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`ui-slider-container ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ui-slider-input"
        style={{
          background: `linear-gradient(to right, var(--token-color-primary) 0%, var(--token-color-primary) ${percentage}%, var(--token-bg-surface) ${percentage}%, var(--token-bg-surface) 100%)`
        }}
        {...props}
      />
      <div className="ui-slider-marks">
        <span className={`ui-slider-mark ${value >= 0 ? 'active' : ''}`} onClick={() => onChange(0)}>0%</span>
        <span className={`ui-slider-mark ${value >= 25 ? 'active' : ''}`} onClick={() => onChange(25)}>25%</span>
        <span className={`ui-slider-mark ${value >= 50 ? 'active' : ''}`} onClick={() => onChange(50)}>50%</span>
        <span className={`ui-slider-mark ${value >= 75 ? 'active' : ''}`} onClick={() => onChange(75)}>75%</span>
        <span className={`ui-slider-mark ${value >= 100 ? 'active' : ''}`} onClick={() => onChange(100)}>100%</span>
      </div>
    </div>
  );
};

export default Slider;
