from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1] / 'outputs' / 'phase3a-finalisation'
scenarios = ['mara-winner-stays','mara-draw-one','mara-draw-both']
for orientation in ['landscape','portrait']:
    thumbs=[]
    for scenario in scenarios:
        imgs=[Image.open(root / f'{scenario}-{side}-{orientation}.jpg').convert('RGB') for side in ['lovable','expo']]
        w,h=imgs[0].size
        assert (w,h)==((844,390) if orientation=='landscape' else (390,844))
        pair=Image.new('RGB',(w*2+24,h+48),'#102020')
        draw=ImageDraw.Draw(pair)
        draw.text((8,8),f'{scenario} — Lovable | Expo',fill='white')
        pair.paste(imgs[0],(0,40));pair.paste(imgs[1],(w+24,40))
        pair.save(root / f'{scenario}-{orientation}-comparaison.jpg',quality=93)
        pair.thumbnail((1000,1100));thumbs.append(pair)
    sheet=Image.new('RGB',(max(x.width for x in thumbs),sum(x.height for x in thumbs)+24),'#102020')
    y=0
    for pic in thumbs:sheet.paste(pic,(0,y));y+=pic.height
    sheet.save(root / f'planche-{orientation}.jpg',quality=93)
html='''<!doctype html><meta charset="utf-8"><title>Roundr — Finalisation 3A</title><style>body{background:#102020;color:white;font:16px system-ui;margin:24px}img{max-width:100%}a{color:#69df82}section{margin:30px 0}</style><h1>Phase 3A — Retouches de rotation</h1><p>Référence Lovable à gauche, Expo à droite. Trois cas, deux orientations. Les captures figées ne valident pas les confirmations ou les animations.</p><a href="rapport.md">Bilan et limites des contrôles</a>'''
for scenario in scenarios:
    for orientation in ['landscape','portrait']:
        f=f'{scenario}-{orientation}-comparaison.jpg'
        html+=f'<section><h2>{scenario} — {orientation}</h2><a href="{f}"><img src="{f}" alt="Lovable à gauche, Expo à droite"></a></section>'
(root/'index.html').write_text(html,encoding='utf8')
print('12 captures, 6 paires et 2 planches produites, dimensions contrôlées.')
