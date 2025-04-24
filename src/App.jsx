import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import VoiceInput from './components/VoiceInput';
import TranscriptDisplay from './components/TranscriptDisplay';
import FlightDetails from './components/FlightDetails';
import { parseTravel } from './utils/parseTravel';
import './App.css';

function App() {
  const [transcript, setTranscript] = useState('');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    name: '',
    passengers: 1,
    class: 'Economy',
    returnDate: '',
    returnTime: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lastParsedTranscript, setLastParsedTranscript] = useState('');
  
  // Refs for debouncing and state tracking
  const parseTimeoutRef = useRef(null);
  const isParsingRef = useRef(false);
  const transcriptRef = useRef(transcript);
  
  // Update the ref whenever transcript changes
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Debounced parsing function to avoid rapid state changes
  const debouncedParse = useCallback((text) => {
    // Clear any existing timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }
    
    // Set a new timeout for parsing
    parseTimeoutRef.current = setTimeout(() => {
      if (!isParsingRef.current && text && text !== lastParsedTranscript) {
        handleParseClick(text);
      }
    }, 800); // 800ms debounce delay
  }, [lastParsedTranscript]);

  // Auto-parse when transcript changes significantly
  useEffect(() => {
    if (!transcript || transcript === lastParsedTranscript) {
      return;
    }

    // Only parse if transcript is significantly different
    const isSignificantChange = !lastParsedTranscript || 
      (transcript.length - lastParsedTranscript.length > 5);

    if (isSignificantChange) {
      debouncedParse(transcript);
    }
  }, [transcript, lastParsedTranscript, debouncedParse]);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, []);

  const handleParseClick = async (textToProcess = transcript) => {
    if (!textToProcess) return;
    
    // Prevent multiple simultaneous parsing operations
    if (isParsingRef.current) return;
    
    isParsingRef.current = true;
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Attempting to parse transcript:', textToProcess);
      const parsedData = await parseTravel(textToProcess);
      
      if (parsedData) {
        console.log('Successfully parsed data:', parsedData);
        
        // Merge the parsed data with existing formData to avoid overwriting
        // data that wasn't included in this particular utterance
        setFormData(prevData => {
          const newData = { ...prevData };
          
          // Only update fields that have values in the new data
          Object.keys(parsedData).forEach(key => {
            if (parsedData[key]) {
              newData[key] = parsedData[key];
            }
          });
          
          return newData;
        });
        
        setLastParsedTranscript(textToProcess);
      } else {
        console.error('No data returned from parseTravel');
        setError('Unable to understand travel request. Please try different wording or check network connection.');
      }
    } catch (err) {
      console.error('Parsing error:', err);
      let errorMessage = 'An error occurred while processing your request.';
      
      // Provide more specific error messages based on the error type
      if (err.message && err.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.response && err.response.status === 401) {
        errorMessage = 'API authentication error. Please contact support.';
      } else if (err.response && err.response.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      isParsingRef.current = false;
    }
  };

  const handleTranscriptChange = useCallback((newTranscript) => {
    setTranscript(newTranscript);
  }, []);

  return (
    <Layout>
      <div className="app-content">
        <div className="left-panel">
          <VoiceInput onTranscriptChange={handleTranscriptChange} />
          <TranscriptDisplay 
            transcript={transcript} 
            onParseClick={() => handleParseClick(transcript)}
            isProcessing={isProcessing}
            onTranscriptChange={handleTranscriptChange}
          />
          {error && <div className="error-message">{error}</div>}
        </div>
        <div className="right-panel">
          <FlightDetails formData={formData} />
        </div>
      </div>
    </Layout>
  );
}

export default App; 