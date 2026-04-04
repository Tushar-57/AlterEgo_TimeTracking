import speech_recognition as sr
from gtts import gTTS
import os
from playsound import playsound
from rag_engine import RAGEngine

class VoiceRAGApplication:
    def __init__(self):
        # Initialize RAG engine
        self.rag_engine = RAGEngine()
        
    def recognize_speech(self):
        # Initialize recognizer
        recognizer = sr.Recognizer()
        
        with sr.Microphone() as source:
            print("🎤 Listening...")
            recognizer.adjust_for_ambient_noise(source)
            audio = recognizer.listen(source)
            
            try:
                query = recognizer.recognize_google(audio)
                print(f"🗣️ You said: {query}")
                return query
            except sr.UnknownValueError:
                print("😕 Could not understand audio")
                return None
            except sr.RequestError as e:
                print(f"⚠️ Could not request results; {e}")
                return None

    def format_for_speech(self, text):
        """Format Chain-of-Thought response for more natural speech"""
        # Remove numbered steps and make it more conversational
        lines = text.split('\n')
        formatted_lines = []
        
        for line in lines:
            line = line.strip()
            if line:
                # Remove step numbers like "1. ", "2. ", etc.
                if line[0:3].replace('.', '').replace(' ', '').isdigit():
                    line = line[3:].strip()
                
                # Skip meta-commentary about thinking process
                if any(phrase in line.lower() for phrase in ['what is the user asking', 'what relevant information', 'how can i best use', 'what would be the most helpful']):
                    continue
                
                # Clean up formatting
                line = line.replace('**', '')
                formatted_lines.append(line)
        
        # Join and clean up
        result = ' '.join(formatted_lines)
        
        # If the response is too long, get the main answer part
        if 'Final Answer:' in result:
            result = result.split('Final Answer:')[-1].strip()
        elif len(result) > 500:  # If too long, get the last substantial paragraph
            sentences = result.split('. ')
            if len(sentences) > 3:
                result = '. '.join(sentences[-3:])  # Get last 3 sentences
        
        return result
    
    def text_to_speech(self, text):
        """Convert text to speech and play it"""
        try:
            tts = gTTS(text=text, lang='en', slow=False)
            audio_file = "response.mp3"
            tts.save(audio_file)
            
            print("🔊 Playing response...")
            playsound(audio_file)
            
            # Clean up
            if os.path.exists(audio_file):
                os.remove(audio_file)
                
        except Exception as e:
            print(f"⚠️ Text-to-speech error: {e}")
            print("📝 Fallback: Response displayed in text only")

    def run(self):
        print("🎙️ Voice-activated RAG System initialized!")
        print("💡 Say 'quit' or 'exit' to stop the application.")
        print("🔊 Speak your query to begin...")
        
        while True:
            try:
                query = self.recognize_speech()
                if query:
                    # Check for exit commands
                    if query.lower() in ['quit', 'exit', 'stop', 'goodbye']:
                        print("👋 Goodbye!")
                        self.text_to_speech("Goodbye! Have a great day!")
                        break
                    
                    # Process the query with RAG
                    print("🔍 Processing your query...")
                    result = self.rag_engine.query(query)
                    response = result['response']
                    
                    # Display context information
                    if result.get('contexts'):
                        print(f"📚 Found {len(result['contexts'])} relevant sources")
                    
                    # Respond with text-to-speech
                    print(f"🤖 Response: {response}")
                    
                    # Convert Chain-of-Thought response to a more natural speech format
                    speech_response = self.format_for_speech(response)
                    self.text_to_speech(speech_response)
                    
                    print("\n" + "="*50 + "\n")
                    
                else:
                    print("🔄 Please try speaking again...")
                    
            except KeyboardInterrupt:
                print("\n👋 Application interrupted. Goodbye!")
                break
            except Exception as e:
                print(f"❌ An error occurred: {e}")
                self.text_to_speech("Sorry, I encountered an error. Please try again.")

if __name__ == "__main__":
    app = VoiceRAGApplication()
    app.run()
