/**
 * 🔤 FONT TEST COMPONENT
 * 
 * Testează fontul ROG Fonts (Crystal/Kristal) găsit pe sistem
 */

import React, { useState } from "react";
import "./FontTest.css";

export default function FontTest() {
  const [showFontTest, setShowFontTest] = useState(false);

  const testTexts = [
    "🎁 Your AI Rewards Hub",
    "💰 Total Unclaimed Rewards",
    "1350.00 $BITS",
    "🔍 Telegram Activity Investigation",
    "CRYSTAL CLEAR LASER CUT FONT",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789 !@#$%^&*()"
  ];

  return (
    <div className="font-test-container">
      <button 
        className="font-test-toggle"
        onClick={() => setShowFontTest(!showFontTest)}
      >
        {showFontTest ? "🔤 Hide Font Test" : "🔤 Test ROG Crystal Font"}
      </button>

      {showFontTest && (
        <div className="font-test-panel">
          <h2 className="font-test-title">🔤 ROG Fonts (Crystal/Kristal) Test</h2>
          
          <div className="font-samples">
            {testTexts.map((text, index) => (
              <div key={index} className="font-sample-row">
                <div className="font-label">ROG Font:</div>
                <div className="font-sample rog-font">{text}</div>
                
                <div className="font-label">Default Font:</div>
                <div className="font-sample default-font">{text}</div>
              </div>
            ))}
          </div>

          <div className="font-info">
            <h3>📋 Font Information</h3>
            <ul>
              <li><strong>Font Name:</strong> ROG Fonts</li>
              <li><strong>File:</strong> ROGFonts-Regular.otf</li>
              <li><strong>Location:</strong> C:\Windows\Fonts\</li>
              <li><strong>Style:</strong> Gaming/Futuristic/Crystal-cut</li>
              <li><strong>Description:</strong> Font cu aspect tăiat cu laserul, crystal-clear</li>
            </ul>
          </div>

          <div className="font-usage">
            <h3>🎨 Usage in CSS</h3>
            <div className="code-block">
              <code>
                font-family: 'ROG Fonts', 'Arial Black', sans-serif;<br/>
                /* Fallback pentru compatibilitate */
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
