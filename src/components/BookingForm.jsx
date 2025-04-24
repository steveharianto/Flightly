import React, { useEffect, useState, useRef } from 'react';

const BookingForm = ({ formData, setFormData }) => {
  const [highlightedFields, setHighlightedFields] = useState({});
  const previousFormDataRef = useRef({...formData});
  const highlightTimeoutsRef = useRef({});

  // Handle highlighting of fields that have been auto-filled
  useEffect(() => {
    const newHighlights = {};
    const changedFields = [];
    
    // Check which fields have changed from the previous state
    Object.keys(formData).forEach(key => {
      if (formData[key] !== previousFormDataRef.current[key] && formData[key]) {
        newHighlights[key] = true;
        changedFields.push(key);
        
        // Clear any existing timeout for this field
        if (highlightTimeoutsRef.current[key]) {
          clearTimeout(highlightTimeoutsRef.current[key]);
        }
        
        // Remove highlight after 2 seconds
        highlightTimeoutsRef.current[key] = setTimeout(() => {
          setHighlightedFields(prev => ({
            ...prev,
            [key]: false
          }));
          
          // Clean up timeout reference
          delete highlightTimeoutsRef.current[key];
        }, 2000);
      }
    });
    
    // Only update if there are actual changes
    if (changedFields.length > 0) {
      setHighlightedFields(prev => ({
        ...prev,
        ...newHighlights
      }));
      previousFormDataRef.current = {...formData};
      
      console.log('Fields updated:', changedFields.join(', '));
    }
  }, [formData]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      // Clear all highlight timeouts
      Object.values(highlightTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="booking-form">
      <h3>Booking Details</h3>
      {Object.values(formData).some(val => val) ? (
        <div className="real-time-status">Updates appear as you speak</div>
      ) : null}
      <form>
        <div className="form-group">
          <label htmlFor="from">From:</label>
          <input
            type="text"
            id="from"
            name="from"
            value={formData.from}
            onChange={handleChange}
            className={highlightedFields.from ? 'highlight' : ''}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="to">To:</label>
          <input
            type="text"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            className={highlightedFields.to ? 'highlight' : ''}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="text"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={highlightedFields.date ? 'highlight' : ''}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="time">Time:</label>
          <input
            type="text"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className={highlightedFields.time ? 'highlight' : ''}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={highlightedFields.name ? 'highlight' : ''}
          />
        </div>
        
        <button type="button" className="book-button">Book Flight</button>
      </form>
    </div>
  );
};

export default BookingForm; 