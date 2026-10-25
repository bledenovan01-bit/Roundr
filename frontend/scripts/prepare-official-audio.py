"""Rebuild approved extracts from the five original Freesound WAV downloads.
Usage: Python 3.12 prepare-official-audio.py <downloads-directory>
Uses only the Python standard library; audioop is available through Python 3.12.
"""
import audioop
import hashlib
import json
import pathlib
import sys
import wave
import array

source = pathlib.Path(sys.argv[1])
dest = pathlib.Path(__file__).resolve().parents[1] / 'assets/sounds'
manifest = {'sampleRate': 44100, 'channels': 2, 'bits': 16, 'sources': [], 'outputs': []}

def read(sound_id):
    files = list(source.glob(f'{sound_id}__*.wav'))
    if len(files) != 1:
        raise ValueError(f'Expected exactly one original WAV for {sound_id}')
    p = files[0]
    with wave.open(str(p), 'rb') as w:
        params = w.getparams()
        raw = w.readframes(w.getnframes())
    manifest['sources'].append({'id': sound_id, 'file': p.name, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest(),
        'seconds': params.nframes / params.framerate, 'sampleRate': params.framerate, 'bits': params.sampwidth * 8})
    raw = audioop.lin2lin(raw, params.sampwidth, 2)
    if params.nchannels != 2:
        raise ValueError('Expected stereo source')
    if params.framerate != 44100:
        raw, _ = audioop.ratecv(raw, 2, 2, params.framerate, 44100, None)
    return raw

def clip(raw, start, end, fade=0.01):
    data = array.array('h', raw[round(start * 44100) * 4:round(end * 44100) * 4])
    frames = len(data) // 2
    fade_frames = round(fade * 44100)
    for i in range(frames):
        gain = min(1, i / max(1, fade_frames), (frames - 1 - i) / max(1, fade_frames))
        data[i*2] = round(data[i*2] * gain)
        data[i*2+1] = round(data[i*2+1] * gain)
    return data.tobytes()

def write(name, raw, edit):
    with wave.open(str(dest / name), 'wb') as w:
        w.setparams((2, 2, 44100, 0, 'NONE', 'not compressed'))
        w.writeframes(raw)
    manifest['outputs'].append({'file': name, 'seconds': len(raw) / 176400, 'edit': edit,
        'sha256': hashlib.sha256((dest/name).read_bytes()).hexdigest()})

whistle = read(568995)
goal = read(829455)
temporal = read(815943)
hint = read(320181)
click = read(171697)
write('whistle.wav', clip(whistle, 0.65, 1.45), 'A2: 0.65–1.45 s, 10 ms edge fades')
write('final.wav', clip(whistle, 0.65, 1.45), 'A2: same selected whistle, match end')
write('alert.wav', clip(goal, 0.35, 4.35, 0.15), 'B1: 0.35–4.35 s, 150 ms edge fades')
write('gong.wav', temporal, 'C1: complete source, PCM16/44.1 kHz conversion')
write('prep.wav', hint, 'D1-A: complete unchanged PCM source')
write('free-final.wav', hint + bytes(round(0.08 * 44100) * 4) + hint, 'D2: Hint + 80 ms silence + identical Hint')
write('confirmation.wav', click, 'E1: complete source, PCM16 conversion; no new event wired')
(dest/'official-manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False)+'\n', encoding='utf8')
print(json.dumps(manifest, indent=2, ensure_ascii=False))
