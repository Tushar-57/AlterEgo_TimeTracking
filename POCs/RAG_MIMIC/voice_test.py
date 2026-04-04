#!/usr/bin/env python3
"""
Simple Voice RAG Test

A minimal version to test voice input and RAG response functionality.
"""

import speech_recognition as sr
from gtts import gTTS
import os
import tempfile
import subprocess
import sys
from rag_engine import RAGEngine

def test_microphone():
    """Test if microphone is working"""
    try:
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("🎤 Testing microphone... Say something!")
            recognizer.adjust_for_ambient_noise(source, duration=1)
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=3)
            
        text = recognizer.recognize_google(audio)
        print(f"✅ Microphone test successful! You said: '{text}'")
        return True
    except Exception as e:
        print(f"❌ Microphone test failed: {e}")
        return False

def test_text_to_speech():
    """Test if text-to-speech is working"""
    try:
        test_text = "Hello! This is a voice test."
        tts = gTTS(text=test_text, lang='en')
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
            audio_file = tmp_file.name
            tts.save(audio_file)
        
        print("🔊 Testing text-to-speech...")
        
        # Play using macOS afplay
        if sys.platform == 'darwin':
            subprocess.run(['afplay', audio_file])
        
        # Cleanup
        os.remove(audio_file)
        print("✅ Text-to-speech test successful!")
        return True
    except Exception as e:
        print(f"❌ Text-to-speech test failed: {e}")
        return False

def simple_voice_rag():
    """Simple voice RAG interaction"""
    print("🚀 Initializing Simple Voice RAG...")
    
    # Initialize RAG engine
    try:
        rag_engine = RAGEngine()
        print("✅ RAG Engine loaded")
    except Exception as e:
        print(f"❌ Failed to load RAG Engine: {e}")
        return
    
    # Initialize speech recognition
    recognizer = sr.Recognizer()
    
    print("🎙️ Simple Voice RAG is ready!")
    print("💡 Speak your question, or say 'quit' to exit")
    
    while True:
        try:
            with sr.Microphone() as source:
                print("\n🎤 Listening... (Speak now)")
                recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = recognizer.listen(source, timeout=10, phrase_time_limit=8)
            
            # Recognize speech
            try:
                query = recognizer.recognize_google(audio)
                print(f"🗣️ You asked: '{query}'")
                
                # Check for exit
                if 'quit' in query.lower() or 'exit' in query.lower():
                    print("👋 Goodbye!")
                    break
                
                # Process with RAG
                print("🔍 Searching your knowledge base...")
                result = rag_engine.query(query)
                response = result['response']
                
                print(f"🤖 Response: {response}")
                
                # Convert to speech (simplified format)
                speech_text = response
                
                # If response is too long, summarize for speech
                if len(speech_text) > 300:
                    # Extract key information
                    sentences = speech_text.split('. ')
                    if len(sentences) > 2:
                        speech_text = '. '.join(sentences[-2:])  # Last 2 sentences
                
                # Remove chain-of-thought formatting
                if 'Final Answer:' in speech_text:
                    speech_text = speech_text.split('Final Answer:')[-1].strip()
                
                # Clean up for speech
                speech_text = speech_text.replace('**', '').replace('*', '')
                
                # Convert to speech
                try:
                    tts = gTTS(text=speech_text, lang='en', slow=False)
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as tmp_file:
                        audio_file = tmp_file.name
                        tts.save(audio_file)
                    
                    print("🔊 Speaking response...")
                    if sys.platform == 'darwin':
                        subprocess.run(['afplay', audio_file])
                    
                    os.remove(audio_file)
                except Exception as e:
                    print(f"⚠️ Speech synthesis failed: {e}")
                
                print("\n" + "="*50)
                
            except sr.UnknownValueError:
                print("😕 Sorry, I didn't understand that. Please try again.")
            except sr.RequestError as e:
                print(f"⚠️ Speech recognition error: {e}")
                
        except sr.WaitTimeoutError:
            print("⏰ No speech detected. Try again...")
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    """Main function"""
    print("🎙️ VOICE RAG TEST SUITE")
    print("=" * 40)
    
    # Run tests
    print("\n1. Testing Microphone...")
    mic_ok = test_microphone()
    
    print("\n2. Testing Text-to-Speech...")
    tts_ok = test_text_to_speech()
    
    if mic_ok and tts_ok:
        print("\n✅ All tests passed! Starting Voice RAG...")
        input("\nPress Enter to continue...")
        simple_voice_rag()
    else:
        print("\n❌ Some tests failed. Please check your audio setup.")

if __name__ == "__main__":
    main()
