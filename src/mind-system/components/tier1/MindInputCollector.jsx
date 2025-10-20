import React, { useState } from 'react';
import './MindInputCollector.css';

const MindInputCollector = ({ onInput }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onInput(text);
  };

  return (
    <div className="mind-input">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your thoughts..."
        className="mind-textarea"
      />
      <button onClick={handleSubmit} className="mind-submit">
        Process Thoughts
      </button>
    </div>
  );
};

export default MindInputCollector;











