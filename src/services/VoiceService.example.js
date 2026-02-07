/**
 * VoiceService Usage Examples
 * 
 * This file demonstrates how to use the VoiceService in your application.
 */

import voiceService from './VoiceService.js';

// ============================================
// Example 1: Basic Usage (Native Provider)
// ============================================

async function basicExample() {
  // Native provider works out of the box (no API key needed)
  await voiceService.speak('Hello, this is a test message.');
}

// ============================================
// Example 2: Configure for ElevenLabs
// ============================================

function configureElevenLabs() {
  voiceService.configure({
    provider: 'elevenlabs',
    elevenlabsApiKey: 'your_elevenlabs_api_key_here',
    elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Optional: change voice
  });
}

// ============================================
// Example 3: Sports Tips / Tactical Advice
// ============================================

async function announceSportsTip() {
  // Stop any current speech first (important for fast-paced updates)
  voiceService.stop();
  
  // Speak the new tip
  await voiceService.speak('Your opponent is favoring their backhand. Try a cross-court shot to their forehand.');
}

// ============================================
// Example 4: System Alerts
// ============================================

async function systemAlert() {
  if (voiceService.isSpeaking) {
    // Interrupt current speech for important alerts
    voiceService.stop();
  }
  
  await voiceService.speak('Camera connection lost. Please check your camera settings.');
}

// ============================================
// Example 5: Rally Summary
// ============================================

async function announceRallySummary(shotCount, winner) {
  const summary = `Rally complete. ${shotCount} shots exchanged. ${winner} wins the point.`;
  
  // Use native provider with custom rate for faster announcements
  await voiceService.speak(summary, {
    rate: 1.2, // Slightly faster for summaries
  });
}

// ============================================
// Example 6: Check if Speaking Before Announcing
// ============================================

async function smartAnnouncement(message, priority = 'normal') {
  if (voiceService.isSpeaking && priority === 'normal') {
    // Queue or skip non-urgent messages
    console.log('Voice service busy, skipping announcement');
    return;
  }
  
  if (priority === 'urgent') {
    voiceService.stop();
  }
  
  await voiceService.speak(message);
}

// ============================================
// Example 7: Integration in Main App
// ============================================

// In your main.js or component:
/*
import voiceService from './services/VoiceService.js';

// Configure at app startup
voiceService.configure({
  provider: 'native', // or 'elevenlabs'
  // elevenlabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
});

// Use throughout your app
async function onShotDetected(shotData) {
  const tip = analyzeShot(shotData);
  await voiceService.speak(tip);
}

async function onError(error) {
  await voiceService.speak(`Error: ${error.message}`);
}
*/

// ============================================
// Example 8: Dynamic Provider Switching
// ============================================

async function switchProvider() {
  // Check current provider
  const config = voiceService.getConfig();
  console.log('Current provider:', config.provider);
  
  // Switch to ElevenLabs if API key is available
  if (import.meta.env.VITE_ELEVENLABS_API_KEY) {
    voiceService.configure({
      provider: 'elevenlabs',
      elevenlabsApiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    });
  }
}

// ============================================
// Example 9: List Available Voices (Native)
// ============================================

function listVoices() {
  const voices = voiceService.getAvailableVoices();
  console.log('Available voices:');
  voices.forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name} (${voice.lang})`);
  });
}

// ============================================
// Example 10: Error Handling
// ============================================

async function speakWithErrorHandling(text) {
  try {
    await voiceService.speak(text);
  } catch (error) {
    console.error('Voice service error:', error);
    // Fallback: show text notification or use alternative method
    alert(text);
  }
}
