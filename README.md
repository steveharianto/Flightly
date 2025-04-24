# AI Travel Assistant

A simple voice-controlled travel booking assistant that uses Web Speech API for transcription and OpenRouter AI for parsing travel details.

## Features

- **Voice Recognition**: Use your voice to describe your travel plans
- **Real-time Transcription**: See your speech converted to text instantly
- **AI Parsing**: Extract structured travel data using AI
- **Auto-filling Forms**: Automatically populate booking form fields

## Technologies Used

- React + Vite
- Web Speech API
- OpenRouter API (AI/NLP)
- CSS for styling

## Quick Start

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Add your OpenRouter API key:
   - Open `src/utils/parseTravel.js`
   - Replace `YOUR_OPENROUTER_API_KEY` with your actual API key

4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`

## How to Use

1. Click "Start Listening" and speak your travel plans
   - Example: "I want to fly from New York to Los Angeles on May 15th at 2 PM"
2. Click "Stop" when you're done speaking
3. Click "Parse & Autofill" to analyze your request
4. Watch as the booking form fills automatically with your travel details

## Browser Support

This application uses the Web Speech API, which has varying levels of support across browsers:
- Chrome: Full support
- Edge: Full support
- Firefox: Partial support
- Safari: Partial support

## License

MIT
