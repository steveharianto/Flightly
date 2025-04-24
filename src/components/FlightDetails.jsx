import React, { useEffect, useState, useRef } from 'react';

// Flight number cache to maintain consistency
const flightNumberCache = new Map();
const flightDurationCache = new Map();

const FlightDetails = ({ formData }) => {
  const { from, to, date, time, name, passengers, class: travelClass, returnDate, returnTime } = formData;
  
  // Refs to store consistent flight data
  const flightDataRef = useRef({
    outboundFlightNumber: '',
    returnFlightNumber: '',
    outboundDuration: '',
    returnDuration: ''
  });

  // Helper function to determine if we have enough information to display
  const hasBasicFlightInfo = from && to && (date || time);
  const hasReturnInfo = returnDate || returnTime;
  
  // Helper to generate a consistent flight number based on from/to
  const getFlightNumber = (origin, destination) => {
    if (!origin || !destination) return '';
    
    const routeKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
    
    if (!flightNumberCache.has(routeKey)) {
      // Generate a flight number and cache it
      const newFlightNumber = `AC${Math.floor(Math.random() * 1000) + 100}`;
      flightNumberCache.set(routeKey, newFlightNumber);
    }
    
    return flightNumberCache.get(routeKey);
  };
  
  // Helper to get a consistent flight duration based on from/to
  const getFlightDuration = (origin, destination) => {
    if (!origin || !destination) return '2 hours 30 minutes';
    
    const routeKey = `${origin.toLowerCase()}-${destination.toLowerCase()}`;
    
    if (!flightDurationCache.has(routeKey)) {
      // Simulate different durations based on the route
      // Use the sum of char codes as a deterministic way to vary duration
      const originSum = origin.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const destSum = destination.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const totalSum = originSum + destSum;
      
      // Use the sum to determine a duration between 1h 15m and 4h 45m
      const hours = 1 + Math.floor((totalSum % 7) / 2);
      const minutes = (totalSum % 2 === 0) ? 30 : 45;
      
      const duration = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minutes`;
      flightDurationCache.set(routeKey, duration);
    }
    
    return flightDurationCache.get(routeKey);
  };

  // Update the flight data when inputs change
  useEffect(() => {
    if (hasBasicFlightInfo) {
      // Only update if we don't already have values (to maintain consistency)
      if (!flightDataRef.current.outboundFlightNumber) {
        flightDataRef.current.outboundFlightNumber = getFlightNumber(from, to);
      }
      
      if (!flightDataRef.current.outboundDuration) {
        flightDataRef.current.outboundDuration = getFlightDuration(from, to);
      }
    }
    
    if (hasReturnInfo) {
      // Only update if we don't already have values (to maintain consistency)
      if (!flightDataRef.current.returnFlightNumber) {
        flightDataRef.current.returnFlightNumber = getFlightNumber(to, from);
      }
      
      if (!flightDataRef.current.returnDuration) {
        flightDataRef.current.returnDuration = getFlightDuration(to, from);
      }
    }
  }, [from, to, hasBasicFlightInfo, hasReturnInfo]);

  // Format date for display with consistent European format (1 March 2023)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      // First, try to normalize the date format
      let dateObj;
      
      // Handle common date formats
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateString)) {
        // ISO format: YYYY-MM-DD
        dateObj = new Date(dateString);
      } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateString)) {
        // US format: MM/DD/YYYY or MM/DD/YY
        const parts = dateString.split('/');
        dateObj = new Date(
          parts[2].length === 2 ? `20${parts[2]}` : parts[2], 
          parseInt(parts[0]) - 1, 
          parts[1]
        );
      } else if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(dateString)) {
        // Another common format: DD-MM-YYYY or DD-MM-YY
        const parts = dateString.split('-');
        dateObj = new Date(
          parts[2].length === 2 ? `20${parts[2]}` : parts[2], 
          parseInt(parts[1]) - 1, 
          parts[0]
        );
      } else if (/[a-zA-Z]+\s+\d{1,2}/.test(dateString)) {
        // Text month format: "February 28" or "Feb 28th"
        // Remove any ordinal indicators (st, nd, rd, th)
        const normalized = dateString.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        
        // Handle year if present, otherwise use next occurrence of this date
        const hasYear = /\d{4}/.test(normalized);
        if (hasYear) {
          dateObj = new Date(normalized);
        } else {
          // Create date with the given month and day, but current year
          dateObj = new Date(normalized + `, ${new Date().getFullYear()}`);
          
          // If this date is in the past, use next year
          if (dateObj < new Date()) {
            dateObj.setFullYear(dateObj.getFullYear() + 1);
          }
        }
      } else {
        // Try generic parsing as last resort
        dateObj = new Date(dateString);
      }
      
      // Check if parsing was successful
      if (!isNaN(dateObj.getTime())) {
        // European format: day month year (1 March 2023)
        const day = dateObj.getDate();
        const month = dateObj.toLocaleString('en-GB', { month: 'long' });
        const year = dateObj.getFullYear();
        
        return `${day} ${month} ${year}`;
      } else {
        return dateString; // Fall back to original string if parsing failed
      }
    } catch (e) {
      console.log('Error formatting date:', e);
      return dateString; // Use as is on error
    }
  };

  // Format time to ensure 24-hour format
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      // If already in 24-hour format (13:45), return as is
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        // Ensure hours are padded with leading zero if needed
        const [hours, minutes] = timeString.split(':').map(Number);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // Handle AM/PM format
      if (/am|pm/i.test(timeString)) {
        const isPM = /pm/i.test(timeString);
        // Remove AM/PM and trim
        let time = timeString.replace(/am|pm/i, '').trim();
        
        // Handle hour only (no minutes)
        if (!time.includes(':')) {
          time = `${time}:00`;
        }
        
        let [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      
      // Handle hour only input
      if (/^\d{1,2}$/.test(timeString)) {
        const hour = parseInt(timeString);
        return `${hour.toString().padStart(2, '0')}:00`;
      }
      
      // Unknown format, return as is
      return timeString;
    } catch (e) {
      console.log('Error formatting time:', e);
      return timeString;
    }
  };

  // Normalize travel class to ensure consistent display
  const normalizeClass = (classString) => {
    if (!classString) return 'Economy';
    
    const lowerClass = classString.toLowerCase().trim();
    
    if (lowerClass.includes('business')) {
      return 'Business';
    } else if (lowerClass.includes('first')) {
      return 'First';
    } else if (lowerClass.includes('premium') || lowerClass.includes('econ+')) {
      return 'Premium Economy';
    } else {
      return 'Economy';
    }
  };

  // Generate estimated arrival time in 24-hour format
  const getArrivalTime = (departureTime, duration) => {
    if (!departureTime) return '';
    
    try {
      const formattedTime = formatTime(departureTime);
      
      // Parse the duration string to extract hours and minutes
      let durationHours = 2; // Default
      let durationMinutes = 30; // Default
      
      if (duration) {
        const hoursMatch = duration.match(/(\d+)\s*hours?/);
        const minutesMatch = duration.match(/(\d+)\s*minutes?/);
        
        if (hoursMatch) durationHours = parseInt(hoursMatch[1]);
        if (minutesMatch) durationMinutes = parseInt(minutesMatch[1]);
      }
      
      // Now we're sure it's in HH:MM format
      const [hours, minutes] = formattedTime.split(':').map(Number);
      
      let arrivalHours = hours + durationHours;
      let arrivalMinutes = minutes + durationMinutes;
      
      if (arrivalMinutes >= 60) {
        arrivalHours += 1;
        arrivalMinutes -= 60;
      }
      
      if (arrivalHours >= 24) {
        arrivalHours -= 24;
      }
      
      return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
    } catch (e) {
      console.log('Error calculating arrival time:', e);
      return '';
    }
  };

  // If we don't have the minimum info, show placeholder
  if (!hasBasicFlightInfo) {
    return (
      <div className="flight-details flight-details-placeholder">
        <div className="flight-details-header">
          <h3>Flight Preview</h3>
          <div className="airline-logo">FLIGHTLY</div>
        </div>
        <div className="booking-placeholder">
          <p>Your flight details will appear here as you speak or type your travel plans.</p>
          <p className="example">Example: "I want to fly from Vienna to Paris on June 15th at 2 PM"</p>
        </div>
      </div>
    );
  }

  // Normalize the travel class for display
  const displayClass = normalizeClass(travelClass);
  
  // Format times consistently
  const formattedDepartureTime = formatTime(time);
  const outboundDuration = flightDataRef.current.outboundDuration || getFlightDuration(from, to);
  const formattedArrivalTime = getArrivalTime(time, outboundDuration);
  
  const formattedReturnDepartureTime = returnTime ? formatTime(returnTime) : '';
  const returnDuration = flightDataRef.current.returnDuration || getFlightDuration(to, from);
  const formattedReturnArrivalTime = returnTime ? getArrivalTime(returnTime, returnDuration) : '';
  
  // Use cached flight numbers
  const outboundFlightNumber = flightDataRef.current.outboundFlightNumber || getFlightNumber(from, to);
  const returnFlightNumber = flightDataRef.current.returnFlightNumber || getFlightNumber(to, from);

  return (
    <div className="flight-details">
      <div className="flight-details-header">
        <h3>Flight Details</h3>
        <div className="airline-logo">FLIGHTLY</div>
      </div>
      
      {/* Outbound Flight */}
      <div className="flight-card">
        <div className="flight-badge-container">
          <div className="flight-badge">{outboundFlightNumber}</div>
          <div className="flight-class">{displayClass}</div>
        </div>
        
        <div className="flight-route">
          <div className="departure">
            <div className="city-code">{from && from.substring(0, 3).toUpperCase()}</div>
            <div className="city-name">{from}</div>
          </div>
          
          <div className="flight-path">
            <div className="airplane-icon">✈</div>
            <div className="flight-details-line"></div>
          </div>
          
          <div className="arrival">
            <div className="city-code">{to && to.substring(0, 3).toUpperCase()}</div>
            <div className="city-name">{to}</div>
          </div>
        </div>
        
        <div className="flight-info">
          <div className="flight-date">
            {formatDate(date)}
            <div className="flight-time">
              {formattedDepartureTime} - {formattedArrivalTime}
            </div>
          </div>
          
          <div className="flight-details-meta">
            <div className="passengers-info">
              <div className="info-icon">👤</div>
              {passengers} {parseInt(passengers) === 1 ? 'passenger' : 'passengers'}
              {name && ` (${name})`}
            </div>
            <div className="duration-info">
              <div className="info-icon">⏱</div>
              {outboundDuration}
            </div>
          </div>
        </div>
      </div>
      
      {/* Return Flight (if applicable) */}
      {hasReturnInfo && (
        <div className="flight-card return-flight">
          <div className="return-badge">Return</div>
          <div className="flight-badge-container">
            <div className="flight-badge">{returnFlightNumber}</div>
            <div className="flight-class">{displayClass}</div>
          </div>
          
          <div className="flight-route">
            <div className="departure">
              <div className="city-code">{to && to.substring(0, 3).toUpperCase()}</div>
              <div className="city-name">{to}</div>
            </div>
            
            <div className="flight-path">
              <div className="airplane-icon">✈</div>
              <div className="flight-details-line"></div>
            </div>
            
            <div className="arrival">
              <div className="city-code">{from && from.substring(0, 3).toUpperCase()}</div>
              <div className="city-name">{from}</div>
            </div>
          </div>
          
          <div className="flight-info">
            <div className="flight-date">
              {formatDate(returnDate)}
              <div className="flight-time">
                {formattedReturnDepartureTime} - {formattedReturnArrivalTime}
              </div>
            </div>
            
            <div className="flight-details-meta">
              <div className="passengers-info">
                <div className="info-icon">👤</div>
                {passengers} {parseInt(passengers) === 1 ? 'passenger' : 'passengers'}
                {name && ` (${name})`}
              </div>
              <div className="duration-info">
                <div className="info-icon">⏱</div>
                {returnDuration}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="booking-options">
        <button className="primary-button">Book Flight</button>
      </div>
    </div>
  );
};

export default FlightDetails; 