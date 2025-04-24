import { useState, useEffect, useCallback } from 'react';

// Get the SpeechRecognition constructor
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);
  const [isMicrophoneChecked, setIsMicrophoneChecked] = useState(false);

  // Function to check if the microphone is working
  const checkMicrophone = async () => {
    try {
      // Request access to the microphone to see if it exists and is accessible
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If we get here, microphone access was granted
      console.log('Microphone access granted');
      
      // Check if the microphone is actually capturing audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);
      
      scriptProcessor.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const arraySum = array.reduce((a, value) => a + value, 0);
        const average = arraySum / array.length;
        
        console.log('Microphone audio level:', average);
        
        // If we detect sound, we can assume the microphone is working
        if (average > 5) {
          setIsMicrophoneChecked(true);
          
          // Clean up listeners once we've confirmed the microphone works
          microphone.disconnect();
          analyser.disconnect();
          scriptProcessor.disconnect();
          
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      // Set a timeout to clean up if we don't detect sound
      setTimeout(() => {
        microphone.disconnect();
        analyser.disconnect();
        scriptProcessor.disconnect();
        
        stream.getTracks().forEach(track => track.stop());
        
        if (!isMicrophoneChecked) {
          setError('Microphone exists but no audio detected. Please check if your microphone is muted or try using the "Type Instead" option.');
        }
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone detected. Please connect a microphone or use the "Type Instead" option.');
      } else {
        setError(`Microphone error: ${err.message}. Try using the "Type Instead" option.`);
      }
      
      return false;
    }
  };

  useEffect(() => {
    // Check if speech recognition is supported
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    
    // Configure recognition
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    // Allow more alternatives for better recognition
    recognitionInstance.maxAlternatives = 3;
    
    // Set proper timeout values - Edge/Chrome behavior
    try {
      // These are non-standard but might work in some browsers
      recognitionInstance.grammars = new (window.SpeechGrammarList || window.webkitSpeechGrammarList)();
    } catch (err) {
      console.log('SpeechGrammarList not supported');
    }

    recognitionInstance.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ');
      setTranscript(currentTranscript);
      setError(null); // Clear any previous errors on successful speech
      setIsMicrophoneChecked(true); // We got a result, so mic is working
    };

    recognitionInstance.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      
      // Handle specific error types differently
      if (event.error === 'no-speech') {
        // This is a common error - check if we've already verified the microphone
        if (!isMicrophoneChecked) {
          // Only check microphone the first time we get this error
          checkMicrophone();
        } else {
          setError('No speech detected. Please speak louder or check your microphone.');
        }
      } else if (event.error === 'audio-capture') {
        setError('Microphone error. Please check your microphone connection.');
        checkMicrophone();
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'network') {
        setError('Network error occurred. Please check your internet connection.');
      } else if (event.error === 'aborted') {
        // This is normal when stopping, don't show an error
        console.log('Speech recognition aborted');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      
      // Don't automatically stop listening on no-speech errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended');
      
      // If we're supposed to be listening but recognition stopped,
      // restart it (handles auto-timeout in Chrome/Edge)
      if (isListening) {
        setTimeout(() => {
          try {
            recognitionInstance.start();
            console.log('Recognition restarted');
          } catch (err) {
            console.log('Error restarting recognition:', err);
            setIsListening(false);
          }
        }, 300); // Small delay to prevent rapid restarts
      }
    };

    recognitionInstance.onstart = () => {
      console.log('Speech recognition started successfully');
    };

    recognitionInstance.onnomatch = () => {
      console.log('Speech not recognized');
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [isListening, isMicrophoneChecked]); // Add dependencies

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    // Check microphone first (if not already checked)
    if (!isMicrophoneChecked) {
      checkMicrophone().then(microphoneWorks => {
        if (microphoneWorks) {
          // Clear previous errors when starting new session
          setError(null);
          setIsListening(true);
          
          try {
            recognition.start();
            console.log('Speech recognition started after mic check');
          } catch (err) {
            // Handle the case where recognition is already started
            console.error('Recognition already started:', err);
          }
        }
      });
    } else {
      // Microphone already checked before, just start listening
      setError(null);
      setIsListening(true);
      
      try {
        recognition.start();
        console.log('Speech recognition started');
      } catch (err) {
        // Handle the case where recognition is already started
        console.error('Recognition already started:', err);
      }
    }
  }, [recognition, isMicrophoneChecked]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    setIsListening(false);
    try {
      recognition.stop();
      console.log('Speech recognition stopped');
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    error,
    isMicrophoneChecked
  };
};

export default useSpeechRecognition; 