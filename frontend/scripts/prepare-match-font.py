"""Generate the reference's 750 team-name weight from the bundled Manrope.

Developer-only tool requiring FontTools; no runtime download or font generation.
Existing font weights remain unchanged.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

fonts = Path(__file__).resolve().parents[1] / "assets" / "fonts"
font = instantiateVariableFont(TTFont(fonts / "Manrope-Medium.ttf"), {"wght": 750}, inplace=True)
family = "Manrope Refined Heavy"
postscript = "ManropeRefined-Heavy"
names = {1: family, 2: "Regular", 3: postscript, 4: family, 6: postscript,
         16: "Manrope Refined", 17: "Heavy"}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.save(fonts / f"{postscript}.ttf")
