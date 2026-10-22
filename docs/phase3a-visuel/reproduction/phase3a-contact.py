from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
root=Path(__file__).resolve().parents[1]/'outputs/phase3a'
cases=json.loads((root/'scenarios.json').read_text())
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
for orient in ['portrait','landscape']:
    for batch in range(5):
        ids=[c['id'] for c in cases[batch*6:batch*6+6]]
        w,h=(390,844) if orient=='portrait' else (844,390)
        cw,ch=w,h//2+28
        cols=3 if orient=='portrait' else 2
        sheet=Image.new('RGB',(cw*cols,ch*((len(ids)+cols-1)//cols)), '#e7eef0')
        d=ImageDraw.Draw(sheet)
        for i,id in enumerate(ids):
            x,y=(i%cols)*cw,(i//cols)*ch
            d.text((x+4,y+3),id+' | Lovable / Expo',font=font,fill='black')
            for j,app in enumerate(['lovable','expo']):
                im=Image.open(root/f'{id}-{app}-{orient}.jpg').convert('RGB')
                assert im.size==(w,h),(id,app,orient,im.size)
                sheet.paste(im.resize((w//2,h//2)),(x+j*w//2,y+24))
        sheet.save(root/f'contact-{orient}-{batch+1}.jpg',quality=93)
print('10 contact sheets; all 120 main screenshots have the exact requested dimensions.')
