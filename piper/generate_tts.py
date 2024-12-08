import sys
import os
import wave
from piper.voice import PiperVoice


def generate_tts(input_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        text = file.read()

    # Where onnx model files are stored on my machine
    voicedir = os.path.expanduser('~/code/simpleAudioStream/piper/models/')
    model = voicedir+"en_US-amy-medium.onnx"
    voice = PiperVoice.load(model)
    wav_file = wave.open('piperOutput.mp3', 'w')
    audio = voice.synthesize(text, wav_file)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python generate_tts.py <input_file> <output_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    generate_tts(input_file)
