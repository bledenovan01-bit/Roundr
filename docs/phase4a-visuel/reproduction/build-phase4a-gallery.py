from PIL import Image, ImageDraw
from pathlib import Path
import hashlib,json,html,shutil
r=Path('outputs/phase4a'); dest=Path('work/Roundr/docs/phase4a-visuel'); dest.mkdir(parents=True,exist_ok=True)
for name in ['raw','pairs','interactions','controles','reproduction']: (dest/name).mkdir(exist_ok=True)
manifest=[];pairs=[]
for ref in sorted((r/'raw-final').glob('*-lovable.jpg')):
 key=ref.name[:-len('-lovable.jpg')];nat=r/'raw-final'/f'{key}-expo.jpg';a,b=Image.open(ref).convert('RGB'),Image.open(nat).convert('RGB');assert a.size==b.size
 w,h=a.size;assert (w,h)==((390,844) if key.endswith('-P') else (844,390))
 out=Image.new('RGB',(w*2,h+34),'#142223');out.paste(a,(0,34));out.paste(b,(w,34));d=ImageDraw.Draw(out);d.text((12,10),'LOVABLE - '+key,fill='white');d.text((w+12,10),'EXPO - '+key,fill='white');out.save(dest/'pairs'/f'{key}.jpg',quality=92);pairs.append((key,out))
 for f in [ref,nat]:
  shutil.copy2(f,dest/'raw'/f.name);txt=f.with_suffix('.txt');shutil.copy2(txt,dest/'raw'/txt.name)
  manifest.append({'path':'raw/'+f.name,'width':w,'height':h,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
for start in range(0,len(pairs),8):
 sheet=Image.new('RGB',(1680,960),'#223030')
 for j,(key,img) in enumerate(pairs[start:start+8]):
  img=img.copy();img.thumbnail((412,454));x=j%4*420;y=j//4*480;sheet.paste(img,(x,y+22));ImageDraw.Draw(sheet).text((x+5,y+5),key,fill='white')
 sheet.save(r/f'final-contact-{start//8+1}.jpg',quality=92)
for f in (r/'interactions').iterdir():shutil.copy2(f,dest/'interactions'/f.name)
for f in ['tests-final.txt','syntax.txt','typescript.txt','eslint.txt','exports.txt','expo-lint.txt','before-preset-ack.txt','before-variable-periods.txt']:shutil.copy2(r/f,dest/'controles'/f)
(dest/'manifest.json').write_text(json.dumps({'lovable':'1c59720dc5b180d5b1bacfaf935902b4053895fa','nativeBase':'9461e2fcb0855c469993b6bce07c0187959cc5cc','pairs':len(pairs),'images':manifest},indent=2),encoding='utf8')
labels={'hub':'Hub Chrono libre','stopwatch':'Chronomètre — configuration','countdown':'Compte à rebours — 10 minutes','countdown-zero':'Durée nulle — erreur et lancement désactivé','interval-default':'Intervalles — programme initial','interval-four':'Programme 4 × 10 minutes','interval-manual-bottom':'Passage manuel, total et signaux','interval-twelve':'Douze périodes — haut de page','interval-twelve-bottom':'Douze périodes — résumé de 1 h 32 min','teams-two':'Deux équipes et scores activés','teams-eight':'Huit équipes, scores désactivés','teams-palette':'Palette ouverte — Les Renards','teams-import':'Import d’une composition de trois équipes','save-empty':'Enregistrement — nom vide','saved-list':'Mes chronos — deux configurations','saved-empty':'Mes chronos — état vide','saved-edit':'Modification — périodes de 30 / 45 / 60 secondes','saved-update':'Mettre à jour ou enregistrer comme nouveau','saved-delete':'Confirmation de suppression'}
order=list(labels);sections=[]
for id in order:
 imgs=''.join(f'<figure><figcaption>{"Portrait 390 × 844" if o=="P" else "Paysage 844 × 390"} — Lovable à gauche, Expo à droite</figcaption><a href="pairs/{id}-{o}.jpg"><img loading="lazy" src="pairs/{id}-{o}.jpg" alt="{html.escape(labels[id])} {o}"></a></figure>' for o in ['P','L'])
 sections.append(f'<section id="{id}"><h2>{html.escape(labels[id])}</h2>{imgs}</section>')
(dest/'index.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roundr — Phase 4A</title><style>body{background:#071112;color:#edf3f0;font:16px system-ui;margin:auto;max-width:1200px;padding:24px}a{color:#6ce182}section{border-top:1px solid #314341;padding:20px 0}img{display:block;max-width:100%;height:auto}figure{margin:20px 0}figcaption{margin-bottom:8px;color:#b1c0bc}nav{display:flex;gap:12px;flex-wrap:wrap}h1{font-size:28px}</style><h1>Roundr — Phase 4A</h1><p>38 paires · 19 états · captures web réelles aux dimensions identiques. Lovable 1c59720 est la référence. Les images ne valident pas le fonctionnement sur téléphone.</p><p><a href="rapport.md">Rapport et limites de validation</a> · <a href="manifest.json">Dimensions et empreintes des originaux</a></p><nav>'+''.join(f'<a href="#{id}">{html.escape(label)}</a>' for id,label in labels.items())+'</nav>'+''.join(sections)+'</html>',encoding='utf8')
print('Gallery:',len(pairs),'pairs;',len(manifest),'verified originals')
