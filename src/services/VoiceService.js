/**
 * VoiceService - Production-ready text-to-speech service
 * Supports 'native' (Web Speech API) and 'elevenlabs' providers
 * Singleton pattern for app-wide usage
 */

class VoiceService {
  constructor() {
    if (VoiceService.instance) {
      return VoiceService.instance;
    }

    // Configuration
    this.config = {
      provider: 'native', // 'native' | 'elevenlabs'
      elevenlabsApiKey: '',
      elevenlabsVoiceId: '21m00Tcm4TlvDq8ikWAM', // Default: Rachel (neutral, clear)
      nativeVoicePreference: ['Google US English', 'Samantha', 'Alex', 'Karen'], // Preferred voices in order
      nativeRate: 1.0,
      nativePitch: 1.0,
      nativeVolume: 1.0,
    };

    // State
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.currentAudioContext = null;
    this.currentAudioSource = null;
    this.availableVoices = [];
    this.selectedVoice = null;

    // Native provider setup
    this.setupNativeProvider();

    // Make singleton
    VoiceService.instance = this;
  }

  /**
   * Setup native Web Speech API provider
   */
  setupNativeProvider() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('[VoiceService] Web Speech API not available');
      return;
    }

    // Load voices immediately if available
    this.loadVoices();

    // Listen for voices to be loaded (some browsers load them asynchronously)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  /**
   * Load and select the best available voice
   */
  loadVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    this.availableVoices = window.speechSynthesis.getVoices();
    
    // Select preferred voice
    for (const preferredName of this.config.nativeVoicePreference) {
      const voice = this.availableVoices.find(
        (v) => v.name.includes(preferredName) || v.name === preferredName
      );
      if (voice) {
        this.selectedVoice = voice;
        console.log(`[VoiceService] Selected voice: ${voice.name}`);
        return;
      }
    }

    // Fallback to first English voice
    const englishVoice = this.availableVoices.find(
      (v) => v.lang.startsWith('en')
    );
    if (englishVoice) {
      this.selectedVoice = englishVoice;
      console.log(`[VoiceService] Selected fallback voice: ${englishVoice.name}`);
      return;
    }

    // Last resort: first available voice
    if (this.availableVoices.length > 0) {
      this.selectedVoice = this.availableVoices[0];
      console.log(`[VoiceService] Selected default voice: ${this.selectedVoice.name}`);
    }
  }

  /**
   * Configure the service
   * @param {Object} config - Configuration options
   */
  configure(config) {
    this.config = { ...this.config, ...config };
    
    // Reload voices if native provider is being used
    if (this.config.provider === 'native') {
      this.loadVoices();
    }
  }

  /**
   * Speak text using the configured provider
   * @param {string} text - Text to speak
   * @param {Object} options - Optional overrides (rate, pitch, volume for native)
   * @returns {Promise<void>} Resolves when speech starts (native) or finishes (elevenlabs)
   */
  async speak(text, options = {}) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return Promise.resolve();
    }

    // Stop any current speech
    this.stop();

    if (this.config.provider === 'native') {
      return this.speakNative(text, options);
    } else if (this.config.provider === 'elevenlabs') {
      return this.speakElevenLabs(text);
    } else {
      throw new Error(`[VoiceService] Unknown provider: ${this.config.provider}`);
    }
  }

  /**
   * Speak using native Web Speech API
   * @param {string} text - Text to speak
   * @param {Object} options - Optional overrides
   * @returns {Promise<void>} Resolves when speech starts
   */
  speakNative(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        reject(new Error('[VoiceService] Web Speech API not available'));
        return;
      }

      // Ensure voices are loaded
      if (this.availableVoices.length === 0) {
        this.loadVoices();
      }

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Set properties
      utterance.rate = options.rate ?? this.config.nativeRate;
      utterance.pitch = options.pitch ?? this.config.nativePitch;
      utterance.volume = options.volume ?? this.config.nativeVolume;

      // Event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
        resolve();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`[VoiceService] Speech synthesis error: ${event.error}`));
      };

      // Start speaking
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Speak using ElevenLabs API (streaming for lowest latency)
   * @param {string} text - Text to speak
   * @returns {Promise<void>} Resolves when speech finishes
   */
  async speakElevenLabs(text) {
    if (!this.config.elevenlabsApiKey) {
      throw new Error('[VoiceService] ElevenLabs API key not configured');
    }

    try {
      // Stop any current audio
      this.stop();

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.currentAudioContext = audioContext;

      // Fetch audio stream from ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.config.elevenlabsVoiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.config.elevenlabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[VoiceService] ElevenLabs API error: ${response.status} ${errorText}`);
      }

      // Get audio data
      const arrayBuffer = await response.arrayBuffer();
      
      // Decode audio
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create source and play
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      this.currentAudioSource = source;
      this.isSpeaking = true;

      // Play audio
      source.start(0);

      // Wait for audio to finish
      return new Promise((resolve, reject) => {
        source.onended = () => {
          this.isSpeaking = false;
          this.currentAudioSource = null;
          this.currentAudioContext = null;
          resolve();
        };

        source.onerror = (error) => {
          this.isSpeaking = false;
          this.currentAudioSource = null;
          this.currentAudioContext = null;
          reject(new Error(`[VoiceService] Audio playback error: ${error.message}`));
        };
      });
    } catch (error) {
      this.isSpeaking = false;
      this.currentAudioContext = null;
      this.currentAudioSource = null;
      throw error;
    }
  }

  /**
   * Stop current speech immediately
   */
  stop() {
    if (this.config.provider === 'native') {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.currentUtterance = null;
    } else if (this.config.provider === 'elevenlabs') {
      if (this.currentAudioSource) {
        try {
          this.currentAudioSource.stop();
        } catch (e) {
          // Source may already be stopped
        }
        this.currentAudioSource = null;
      }
      if (this.currentAudioContext) {
        this.currentAudioContext.close().catch(() => {});
        this.currentAudioContext = null;
      }
    }
    this.isSpeaking = false;
  }

  /**
   * Get available voices (native provider only)
   * @returns {Array<SpeechSynthesisVoice>}
   */
  getAvailableVoices() {
    if (this.config.provider !== 'native') {
      return [];
    }
    if (this.availableVoices.length === 0) {
      this.loadVoices();
    }
    return [...this.availableVoices];
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.config };
  }
}

// Export singleton instance
export default new VoiceService();
