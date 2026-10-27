"""Install exact, approved WAV bytes from the two validated listening ZIPs.
Usage: python scripts/prepare-official-audio.py <pack-directory> [--check]
No synthesis, trimming, gain or resampling is performed. All inputs are
verified before any destination is written. --check is read-only.
"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("pack_directory", type=Path)
parser.add_argument("--check", action="store_true")
args = parser.parse_args()
dest = Path(__file__).resolve().parents[1] / "assets/sounds"
manifest = json.loads((dest / "official-manifest.json").read_text(encoding="utf8"))
archives = {}
for pack in manifest["validatedPacks"]:
    path = args.pack_directory / pack["file"]
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest != pack["sha256"]:
        raise ValueError(f"Unexpected listening pack: {path.name}")
    archives[pack["file"]] = zipfile.ZipFile(path)
verified = {}
try:
    for entry in manifest["outputs"]:
        data = archives[entry["validatedPack"]].read(entry["validatedMember"])
        if hashlib.sha256(data).hexdigest() != entry["sha256"]:
            raise ValueError(f"Unapproved variant: {entry['file']}")
        verified[entry["file"]] = data
    for filename, data in verified.items():
        if args.check:
            if (dest / filename).read_bytes() != data:
                raise ValueError(f"Installed bytes differ: {filename}")
        else:
            (dest / filename).write_bytes(data)
    print(f"Seven exact approved WAVs {'verified' if args.check else 'installed'}")
finally:
    for archive in archives.values():
        archive.close()
