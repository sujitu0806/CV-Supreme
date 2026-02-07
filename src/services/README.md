# VoiceService

Production-ready text-to-speech service for the CV-Supreme app. Supports both native Web Speech API and ElevenLabs for high-quality voice synthesis.

## Quick Start

```javascript
import voiceService from './services/VoiceService.js';

// Basic usage (uses native provider by default)
await voiceService.speak('Your opponent is favoring their backhand.');

// Configure for ElevenLabs (better quality, requires API key)
voiceService.configure({
  provider: 'elevenlabs',
  elevenlabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
});

// Stop current speech (important for fast-paced updates)
voiceService.stop();

// Check if currently speaking
if (voiceService.isSpeaking) {
  voiceService.stop(); // Interrupt for urgent message
}
```

## Configuration

Add to your `.env` file:
```
VITE_ELEVENLABS_API_KEY=your_key_here
```

## Features

- ✅ Singleton pattern (one instance app-wide)
- ✅ Two providers: Native (Web Speech API) and ElevenLabs
- ✅ Automatic voice selection (prefers natural-sounding voices)
- ✅ Promise-based API
- ✅ Interrupt capability (`stop()`)
- ✅ State tracking (`isSpeaking`)
- ✅ Error handling
- ✅ Low latency (ElevenLabs streaming)

## Use Cases

- **Sports tips**: Real-time tactical advice during matches
- **System alerts**: Camera errors, connection issues
- **Rally summaries**: Shot counts, point winners
- **Training feedback**: Technique corrections

See `VoiceService.example.js` for detailed usage examples.
