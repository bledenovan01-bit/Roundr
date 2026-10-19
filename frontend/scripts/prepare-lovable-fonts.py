"""Generate the frozen reference's 400/600/800 weights from the bundled Manrope.

Developer-only: requires FontTools. Existing 500/700 aliases are left untouched.
No font is downloaded or generated at application runtime.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

fonts = Path(__file__).resolve().parents[1] / "assets" / "fonts"
for weight, style in ((400, "Regular"), (600, "SemiBold"), (800, "ExtraBold")):
    font = instantiateVariableFont(TTFont(fonts / "Manrope-Medium.ttf"), {"wght": weight}, inplace=True)
    family = f"Manrope Refined {style}"
    postscript = f"ManropeRefined-{style}"
    names = {1: family, 2: "Regular", 3: postscript, 4: family, 6: postscript, 16: "Manrope Refined", 17: style}
    for record in font["name"].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    font.save(fonts / f"{postscript}.ttf")
