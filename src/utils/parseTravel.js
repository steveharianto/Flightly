import axios from 'axios';

// You should store your API key in an environment variable for production
const OPENROUTER_API_KEY = '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'; // Replace with your actual API key

// API timeout in milliseconds
const API_TIMEOUT = 10000; // 10 seconds

// Keep a cache of already parsed inputs to avoid redundant API calls
const parseCache = new Map();

// Format today's date
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// Basic rule-based fallback parser to use when API fails
const basicFallbackParser = (transcript) => {
  console.log('Using fallback parser for:', transcript);
  const result = {
    from: '',
    to: '',
    date: '',
    time: '',
    name: '',
    passengers: 1,
    class: 'Economy',
    returnDate: '',
    returnTime: ''
  };
  
  // Convert to lowercase for easier pattern matching
  const text = transcript.toLowerCase();
  
  // Look for origin (from)
  const fromPattern = /(?:from|departing from|leaving from|starting from|origin) ([a-z\s]+?)(?:to|and|on|at|tomorrow|next|in the|,|\.|$)/i;
  const fromMatch = text.match(fromPattern);
  if (fromMatch && fromMatch[1]) {
    result.from = fromMatch[1].trim().replace(/^(the|a) /, '');
    // Capitalize first letter of each word
    result.from = result.from.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Look for destination (to)
  const toPattern = /(?:to|destination|arriving at|going to) ([a-z\s]+?)(?:from|on|at|tomorrow|next|in the|,|\.|$)/i;
  const toMatch = text.match(toPattern);
  if (toMatch && toMatch[1]) {
    result.to = toMatch[1].trim().replace(/^(the|a) /, '');
    // Capitalize first letter of each word
    result.to = result.to.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Look for date
  // Common date formats like "June 15", "June 15th", "15th of June", "next Monday", etc.
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const monthPattern = new RegExp(`(${months.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i');
  const monthMatch = text.match(monthPattern);
  
  const dayMonthPattern = /(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const dayMonthMatch = text.match(dayMonthPattern);
  
  const tomorrow = /tomorrow/i.test(text);
  const nextWeek = /next week/i.test(text);
  
  if (monthMatch) {
    const month = monthMatch[1];
    const day = parseInt(monthMatch[2]);
    const year = new Date().getFullYear();
    const date = new Date(`${month} ${day}, ${year}`);
    
    // Format as "1 March 2025"
    result.date = `${day} ${date.toLocaleString('en-GB', { month: 'long' })} ${year}`;
  } else if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1]);
    const month = dayMonthMatch[2];
    const year = new Date().getFullYear();
    const date = new Date(`${month} ${day}, ${year}`);
    
    // Format as "1 March 2025"
    result.date = `${day} ${date.toLocaleString('en-GB', { month: 'long' })} ${year}`;
  } else if (tomorrow) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = tomorrow.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } else if (nextWeek) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    result.date = nextWeek.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  
  // Look for time
  const timePattern = /(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const timeMatch = text.match(timePattern);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] || '00';
    const meridiem = timeMatch[3]?.toLowerCase();
    
    // Convert to 24-hour format
    if (meridiem === 'pm' && hour < 12) {
      hour += 12;
    } else if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }
    
    result.time = `${hour.toString().padStart(2, '0')}:${minutes}`;
  }
  
  // Look for passenger name
  const namePatterns = [
    /(?:my name is|for) ([a-z\s]+?)(?:and|,|\.|$)/i,
    /(?:passenger|traveler|traveller|customer) name (?:is|:) ([a-z\s]+?)(?:and|,|\.|$)/i
  ];
  
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch && nameMatch[1]) {
      result.name = nameMatch[1].trim();
      // Capitalize first letter of each word
      result.name = result.name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      break;
    }
  }
  
  // Look for number of passengers
  const passengersPattern = /(\d+) (?:passenger|person|people|traveler|traveller)s?/i;
  const passengersMatch = text.match(passengersPattern);
  if (passengersMatch && passengersMatch[1]) {
    result.passengers = parseInt(passengersMatch[1]);
  }
  
  // Look for travel class
  if (/business class/i.test(text)) {
    result.class = 'Business';
  } else if (/first class/i.test(text)) {
    result.class = 'First';
  } else if (/premium economy|economy plus/i.test(text)) {
    result.class = 'Premium Economy';
  }
  
  // Add return date if mentioned
  if (/return(?:ing)? on/i.test(text)) {
    const returnDatePattern = /return(?:ing)? on ([a-z\s\d]+?)(?:at|from|and|,|\.|$)/i;
    const returnMatch = text.match(returnDatePattern);
    if (returnMatch && returnMatch[1]) {
      // For simplicity, just use the same date parsing logic as above
      const returnText = returnMatch[1].toLowerCase();
      const monthPattern = new RegExp(`(${months.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?`, 'i');
      const monthMatch = returnText.match(monthPattern);
      
      if (monthMatch) {
        const month = monthMatch[1];
        const day = parseInt(monthMatch[2]);
        const year = new Date().getFullYear();
        const date = new Date(`${month} ${day}, ${year}`);
        
        // Format as "1 March 2025"
        result.returnDate = `${day} ${date.toLocaleString('en-GB', { month: 'long' })} ${year}`;
      }
    }
  }
  
  console.log('Fallback parser result:', result);
  return result;
};

export const parseTravel = async (transcript) => {
  if (!transcript) {
    return null;
  }
  
  // Check if we've already parsed this exact transcript
  if (parseCache.has(transcript)) {
    console.log('Using cached result for:', transcript);
    return parseCache.get(transcript);
  }

  // For efficiency, we'll only parse when we have a reasonably complete sentence
  // This prevents making API calls for every keystroke
  if (transcript.length < 15 || !transcript.includes(' ')) {
    console.log('Transcript too short, skipping parse');
    return null;
  }

  try {
    console.log('Sending request to OpenRouter API...');
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo', // Using DeepSeek V3 free model instead of openai/gpt-3.5-turbo
        messages: [
          {
            role: 'system',
            content: `Extract detailed travel booking details from user input. Use the current date as context: ${getCurrentDate()}.

Return a JSON object with the following fields:
- from: Origin city or airport
- to: Destination city or airport
- date: Travel date in the format "1 March 2025"
- time: Departure time
- name: Passenger name
- passengers: Number of passengers (default to 1 if not specified)
- class: Class of travel (e.g., economy, business, first)
- returnDate: Return date, in the format "1 March 2025", if specified
- returnTime: Return departure time, if specified

If a field is not present in the input, use null or a reasonable default. Always format any date as "D Month YYYY". Respond ONLY with the JSON object, no explanations or additional text.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic responses
        max_tokens: 500  // Limit token usage
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-travel-assistant.app',
          'X-Title': 'AI Travel Assistant'
        },
        timeout: API_TIMEOUT // Use the API_TIMEOUT constant
      }
    );

    console.log('Response received:', JSON.stringify(response.data, null, 2));

    // Add defensive checks for the response structure
    if (!response.data || !response.data.choices || !response.data.choices.length) {
      console.error('Invalid API response structure:', response.data);
      // Use fallback parser as last resort
      const fallbackResult = basicFallbackParser(transcript);
      parseCache.set(transcript, fallbackResult);
      return fallbackResult;
    }

    // The structure might be different, sometimes it's in message.content, other times it might be directly in content
    let content = null;
    const choice = response.data.choices[0];
    
    if (choice.message && choice.message.content) {
      content = choice.message.content;
    } else if (choice.content) {
      content = choice.content;
    } else if (choice.delta && choice.delta.content) {
      content = choice.delta.content;
    }
    
    // Check if content exists
    if (!content) {
      console.error('No content in API response:', choice);
      // Use fallback parser as last resort
      const fallbackResult = basicFallbackParser(transcript);
      parseCache.set(transcript, fallbackResult);
      return fallbackResult;
    }
    
    console.log('Extracted content:', content);
    
    // Try to parse the JSON response
    try {
      // Handle cases where the model might wrap the JSON in markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                        content.match(/```\n([\s\S]*?)\n```/) || 
                        [null, content];
      
      const jsonString = jsonMatch[1] || content;
      console.log('Attempting to parse JSON:', jsonString);
      
      const parsedData = JSON.parse(jsonString);
      console.log('Successfully parsed JSON:', parsedData);
      
      // Ensure all expected fields exist
      const result = {
        from: parsedData.from || '',
        to: parsedData.to || '',
        date: parsedData.date || '',
        time: parsedData.time || '',
        name: parsedData.name || '',
        // Additional fields with defaults
        passengers: parsedData.passengers || 1,
        class: parsedData.class || 'Economy',
        returnDate: parsedData.returnDate || '',
        returnTime: parsedData.returnTime || ''
      };
      
      // Store in cache
      parseCache.set(transcript, result);
      
      // Limit cache size to prevent memory leaks (keep only most recent 50 entries)
      if (parseCache.size > 50) {
        const oldestKey = parseCache.keys().next().value;
        parseCache.delete(oldestKey);
      }
      
      return result;
    } catch (jsonError) {
      console.error('Failed to parse JSON from AI response:', jsonError);
      console.log('Raw AI response:', content);
      
      // Try to clean up the response if it's not valid JSON
      try {
        // Sometimes the response contains extra text around the JSON
        const jsonPattern = /\{[\s\S]*\}/;
        const match = content.match(jsonPattern);
        if (match) {
          const cleanedJson = match[0];
          console.log('Attempting to parse cleaned JSON:', cleanedJson);
          const parsedData = JSON.parse(cleanedJson);
          console.log('Successfully parsed cleaned JSON:', parsedData);
          
          // Ensure all expected fields exist
          const result = {
            from: parsedData.from || '',
            to: parsedData.to || '',
            date: parsedData.date || '',
            time: parsedData.time || '',
            name: parsedData.name || '',
            // Additional fields with defaults
            passengers: parsedData.passengers || 1,
            class: parsedData.class || 'Economy',
            returnDate: parsedData.returnDate || '',
            returnTime: parsedData.returnTime || ''
          };
          
          // Store in cache
          parseCache.set(transcript, result);
          
          return result;
        }
      } catch (secondError) {
        console.error('Failed second attempt to parse JSON:', secondError);
      }
      
      // Use fallback parser as last resort
      const fallbackResult = basicFallbackParser(transcript);
      parseCache.set(transcript, fallbackResult);
      return fallbackResult;
    }
  } catch (error) {
    console.error('API call failed:', error);
    // Log more details about the error
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    // Use fallback parser in case of API failure
    const fallbackResult = basicFallbackParser(transcript);
    parseCache.set(transcript, fallbackResult);
    return fallbackResult;
  }
}; 