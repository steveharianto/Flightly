import { useEffect } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const VoiceInput = ({ onTranscriptChange }) => {
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error
  } = useSpeechRecognition();

  // Update parent component when transcript changes
  useEffect(() => {
    onTranscriptChange(transcript);
  }, [transcript, onTranscriptChange]);

  return (
    <div className="voice-input">
      <h3>Voice Input</h3>
      
      <div className="controls">
        <button 
          onClick={isListening ? stopListening : startListening}
          className={`mic-button ${isListening ? 'listening' : ''}`}
        >
          {isListening ? 'Stop' : 'Start'} Listening
        </button>
        {transcript && (
          <button 
            onClick={resetTranscript} 
            className="clear-button"
          >
            Clear
          </button>
        )}
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="status">
        {isListening ? (
          <span className="listening-indicator">Listening <span className="pulse-dot"></span></span>
        ) : 'Press Start to speak your travel plans'}
      </div>
    </div>
  );
};

export default VoiceInput; 