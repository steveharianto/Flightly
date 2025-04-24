import React, { useState, useEffect, useRef } from 'react';

const TranscriptDisplay = ({ transcript, onParseClick, isProcessing, onTranscriptChange }) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const typingTimeoutRef = useRef(null);

  // Handle real-time parsing as user types
  useEffect(() => {
    if (manualText.trim()) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set a new timeout to parse after user stops typing for 500ms
      typingTimeoutRef.current = setTimeout(() => {
        onTranscriptChange(manualText);
      }, 500);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [manualText, onTranscriptChange]);

  const handleManualSubmit = () => {
    if (manualText.trim()) {
      onTranscriptChange(manualText);
      setManualText('');
      setShowManualInput(false);
    }
  };

  const handleInputChange = (e) => {
    setManualText(e.target.value);
  };

  return (
    <div className="transcript-display">
      <h3>Your Request</h3>
      <div className="transcript-content">
        {transcript ? transcript : <em>Your voice input will appear here</em>}
      </div>
      
      {showManualInput ? (
        <div className="manual-input">
          <textarea
            value={manualText}
            onChange={handleInputChange}
            placeholder="Type your travel request here..."
            rows={3}
            autoFocus
          />
          <div className="manual-input-buttons">
            <button onClick={handleManualSubmit}>Submit</button>
            <button onClick={() => setShowManualInput(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="transcript-actions">
          {transcript && (
            <button 
              onClick={onParseClick} 
              disabled={!transcript || isProcessing}
              className="parse-button"
            >
              {isProcessing ? 'Processing...' : 'Find Flights'}
            </button>
          )}
          {!transcript && (
            <button 
              className="text-input-button" 
              onClick={() => setShowManualInput(true)}
            >
              Type Instead
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptDisplay; 