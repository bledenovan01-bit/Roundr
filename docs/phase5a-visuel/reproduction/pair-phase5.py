from pathlib import Path
from PIL import Image,ImageDraw
r=Path('outputs/phase5a/raw');out=Path('outputs/phase5a/pairs');out.mkdir(exist_ok=True)
for a in r.glob('*-lovable.jpg'):
 key=a.name[:-12];b=r/(key+'-expo.jpg');
 if not b.exists():continue
 x,y=Image.open(a).convert('RGB'),Image.open(b).convert('RGB');assert x.size==y.size,(key,x.size,y.size);w,h=x.size;assert(w,h)==((390,844) if '-P' in key else (844,390)),(key,w,h)
 im=Image.new('RGB',(2*w,h+32),'#142223');im.paste(x,(0,32));im.paste(y,(w,32));ImageDraw.Draw(im).text((10,8),'LOVABLE',fill='white');ImageDraw.Draw(im).text((w+10,8),'EXPO',fill='white');im.save(out/(key+'.jpg'),quality=92)

