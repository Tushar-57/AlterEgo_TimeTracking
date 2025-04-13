import speech_recognition as sr
from gtts import gTTS
import sounddevice as sd
import soundfile as sf
from io import BytesIO
from datetime import datetime

recognizer = sr.Recognizer()
is_active = True  # Global state variable

def listen_command():
    with sr.Microphone() as source:
        print("🎤 Listening...")
        recognizer.adjust_for_ambient_noise(source)
        try:
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=8)
        except sr.WaitTimeoutError:
            print("🕒 No speech detected.")
            return ""

    try:
        command = recognizer.recognize_google(audio)
        print(f"🗣️ You said: {command}")
        return command.lower()
    except sr.UnknownValueError:
        print("😕 Didn't catch that.")
        return ""
    except sr.RequestError:
        print("⚠️ Could not reach STT service.")
        return ""

def respond(text):
    if not text:
        return
    print(f"🤖 Assistant: {text}")
    tts = gTTS(text=text, lang='en')
    
    buffer = BytesIO()
    tts.write_to_fp(buffer)
    buffer.seek(0)
    
    data, samplerate = sf.read(buffer)
    sd.play(data, samplerate)
    sd.wait()

def process_command(command):
    global is_active

    if not command:
        return "I didn't hear anything. Try again?" if is_active else ""

    command = command.lower()

    if is_active:
        # Stop commands
        if any(word in command for word in ["stop", "pause", "sleep"]):
            is_active = False
            return "Going to sleep. Say 'start' to wake me up."
        
        # Normal commands
        if "hello" in command or "hi" in command:
            return "Hey there! How can I help you today?"
        elif "time" in command:
            return f"It's currently {datetime.now().strftime('%I:%M %p')}."
        elif "date" in command:
            return f"Today is {datetime.now().strftime('%A, %B %d')}."
        elif "joke" in command:
            return "Why don’t scientists trust atoms? Because they make up everything."
        elif "bye" in command or "exit" in command or "quit" in command:
            respond("Goodbye! Have a great day.")
            exit()
        else:
            return "I'm still learning. Try asking about time or date."
    else:
        # Wake commands
        if any(word in command for word in ["start", "wake", "resume"]):
            is_active = True
            return "I'm back! How can I help you?"
        return ""

if __name__ == "__main__":
    respond("Voice assistant is ready. Say 'stop' to pause or 'start' to resume.")
    while True:
        command = listen_command()
        response = process_command(command)
        if response:
            respond(response)