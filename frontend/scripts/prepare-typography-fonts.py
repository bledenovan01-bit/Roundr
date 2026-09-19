"""Generate scoped static weights from the bundled Manrope variable font.

Developer-only tool: run with fonttools installed, never at app runtime.
Original font assets/aliases remain unchanged for screens outside this pass.
"""
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main():
    fonts = Path(__file__).resolve().parents[1] / "assets" / "fonts"
    for weight, style in ((500, "Medium"), (700, "Bold")):
        font = instantiateVariableFont(
            TTFont(fonts / "Manrope-Medium.ttf"), {"wght": weight}, inplace=True
        )
        family = f"Manrope Refined {style}"
        postscript = f"ManropeRefined-{style}"
        names = {
            1: family, 2: "Regular", 3: postscript, 4: family,
            6: postscript, 16: "Manrope Refined", 17: style,
        }
        for record in font["name"].names:
            if record.nameID in names:
                record.string = names[record.nameID].encode(record.getEncoding())
        target = fonts / f"{postscript}.ttf"
        font.save(target)
        print(f"Generated {target.name}: static weight {weight}")


if __name__ == "__main__":
    main()