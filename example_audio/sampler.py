import argparse
from pydub import AudioSegment

parser = argparse.ArgumentParser(description='Take an mp3 audio file in and reduce it to a 10 second snippet.')
parser.add_argument('input', help='Input audio file')
parser.add_argument('output', help='Output name for the audio snippet file.')

args = parser.parse_args()

filename = args.input
outname = args.output

print(filename)
print(outname)

sound = AudioSegment.from_mp3(filename)
# Slicing is in milliseconds
fortySeconds = 10 * 1000
sample = sound[:fortySeconds]

sample.export(outname, format="mp3")
