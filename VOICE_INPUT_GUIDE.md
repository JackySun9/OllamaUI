# Voice Input Feature Guide

## Overview

Your Ollama Web UI now supports **voice input** functionality! This allows you to speak your messages instead of typing them, making the chat experience more accessible and convenient.

## Features

### 🎤 **Real-time Voice Recognition**
- Speak naturally and see your words appear in real-time
- Uses the browser's built-in Speech Recognition API
- Works completely offline (no external services required)

### 🌍 **Multi-language Support**
- Support for 25+ languages including:
  - English (US/UK)
  - Spanish (Spain/Mexico)
  - French (France/Canada)
  - German, Italian, Portuguese
  - Chinese (Simplified/Traditional)
  - Japanese, Korean, Arabic, Hindi
  - And many more!

### 🎯 **Smart Integration**
- Voice input integrates seamlessly with existing chat functionality
- Works alongside text input and image uploads
- Maintains focus and usability patterns

## How to Use

### 1. **Basic Voice Input**
1. Look for the microphone icon (🎤) next to the send button
2. Click the microphone button to start recording
3. Speak your message clearly
4. The button will show a red recording indicator with animation
5. Click the button again to stop recording
6. Your transcribed text will appear in the input field

### 2. **Language Selection**
1. Click "Voice Settings" below the input area
2. Select your preferred language from the dropdown
3. The voice input will now recognize speech in that language

### 3. **Visual Feedback**
- **Gray microphone**: Ready to record
- **Red pulsing microphone**: Currently recording
- **Spinning loader**: Processing your speech
- **Red dot**: Recording indicator

## Browser Compatibility

### ✅ **Fully Supported**
- **Chrome** (recommended)
- **Microsoft Edge**
- **Safari** (macOS/iOS)
- **Opera**

### ⚠️ **Limited Support**
- **Firefox**: Basic support (may require enabling in settings)

### ❌ **Not Supported**
- **Internet Explorer**
- **Older browser versions**

## Browser Permissions

When you first use voice input, your browser will ask for microphone permissions:

1. Click "Allow" when prompted
2. If you accidentally clicked "Block", you can re-enable by:
   - Clicking the 🔒 or 🎤 icon in your browser's address bar
   - Going to browser settings and allowing microphone access for this site

## Tips for Best Results

### 🎯 **Speaking Tips**
- Speak clearly and at a normal pace
- Avoid background noise when possible
- Use a good quality microphone if available
- Pause briefly between sentences for better recognition

### 🛠️ **Technical Tips**
- Ensure your microphone is working properly
- Close other applications that might be using your microphone
- Use a stable internet connection (though recognition works offline)
- If recognition seems off, try switching to a different language variant

## Troubleshooting

### **Voice input button doesn't appear**
- Your browser doesn't support speech recognition
- Try using Chrome, Edge, or Safari instead

### **"Microphone access denied" error**
1. Check browser permissions for microphone access
2. Click the 🔒 or 🎤 icon in the address bar
3. Set microphone permission to "Allow"
4. Refresh the page

### **Poor recognition accuracy**
1. Try speaking more clearly and slowly
2. Switch to a different language variant in Voice Settings
3. Check your microphone is working properly
4. Reduce background noise

### **Voice input stops working**
1. Refresh the page
2. Check microphone permissions
3. Try clicking the microphone button again
4. Close other applications using your microphone

## Privacy & Security

- **Local Processing**: Speech recognition happens in your browser locally
- **No External Services**: Your voice data is not sent to external servers
- **No Storage**: Voice data is not stored or logged
- **Real-time Only**: Transcription happens in real-time and is immediately discarded

## Advanced Usage

### **Keyboard Shortcuts**
- **Enter**: Send message (same as clicking send button)
- **Shift + Enter**: New line in text area
- All existing keyboard shortcuts continue to work

### **Combining Input Methods**
- You can mix voice input with typing
- Voice input replaces the current text field content
- You can edit voice-transcribed text before sending
- Image uploads work normally alongside voice input

## Technical Implementation

The voice input feature uses:
- **Web Speech API**: Browser's native speech recognition
- **React Hooks**: Custom `useVoiceInput` hook for state management
- **TypeScript**: Full type safety and better developer experience
- **Tailwind CSS**: Consistent styling with the existing UI

## Future Enhancements

Planned improvements include:
- Voice commands for chat actions
- Improved error handling and recovery
- Additional language support
- Voice activity detection improvements
- Custom wake words

## Support

If you encounter any issues with voice input:
1. Check this guide for troubleshooting steps
2. Ensure your browser is up to date
3. Try using a supported browser (Chrome recommended)
4. Check microphone permissions and hardware

---

**Enjoy using voice input with your Ollama Web UI! 🎤✨** 