from pathlib import Path
import json,hashlib,shutil,html
r=Path('outputs/phase4b');d=Path('work/Roundr/docs/phase4b-visuel');states=json.loads((r/'capture-states.json').read_text(encoding='utf8'));images=[];parts=[]
titles={'sw-ready':'Chronomètre prêt','sw-running':'Chronomètre en cours','sw-analog':'Chronomètre analogique','sw-ring':'Chronomètre circulaire en pause','sw-laps':'Tours et deux équipes','sw-eight':'Huit équipes et scores','sw-no-scores':'Trois équipes sans scores','sw-hours':'Chronomètre après une heure','cd-ready':'Compte à rebours prêt','cd-running':'Compte à rebours analogique en cours','cd-pause':'Compte à rebours circulaire en pause','cd-ended':'Compte à rebours terminé','cd-notice':'Annonce d’une minute','cd-elapsed':'Bascule vers le temps écoulé','iv-ready':'Intervalles prêts','iv-work':'Période de travail en cours','iv-rest':'Repos en cours','iv-wait':'Attente du lancement manuel','iv-ended':'Programme terminé','iv-no-scores':'Intervalles sans scores','confirm-reset':'Confirmation Réinitialiser','confirm-restart':'Confirmation Recommencer','confirm-end':'Confirmation Terminer'}
for name in ['raw','pairs','interactions']: (d/name).mkdir(exist_ok=True)
for item in states:
 key=item[0];figures=[]
 for o,size in [('P',(390,844)),('L',(844,390))]:
  pair=r/'pairs'/f'{key}-{o}.jpg';assert pair.exists();shutil.copy2(pair,d/'pairs'/pair.name)
  for platform in ['lovable','expo']:
   f=r/'raw'/f'{key}-{o}-{platform}.jpg';from PIL import Image
   assert Image.open(f).size==size,(f,Image.open(f).size)
   shutil.copy2(f,d/'raw'/f.name);shutil.copy2(f.with_suffix('.txt'),d/'raw'/f.with_suffix('.txt').name)
   images.append({'path':'raw/'+f.name,'width':size[0],'height':size[1],'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
  figures.append(f'<figure><figcaption>{o} — {size[0]} × {size[1]}, Lovable à gauche, Expo à droite</figcaption><a href="pairs/{key}-{o}.jpg"><img loading="lazy" src="pairs/{key}-{o}.jpg" alt="{key} {o}"></a></figure>')
 parts.append(f'<section id="{key}"><h2>{titles[key]}</h2><details><summary>Paramètres de comparaison</summary><code>{html.escape(item[1])}</code></details>'+''.join(figures)+'</section>')
for f in (r/'interactions').iterdir():shutil.copy2(f,d/'interactions'/f.name)
for file in ['tests.txt','typescript.txt','eslint.txt','syntax.txt','exports.txt']:shutil.copy2(r/file,d/'controles'/file)
(d/'manifest.json').write_text(json.dumps({'lovable':'1c59720dc5b180d5b1bacfaf935902b4053895fa','expoBase':'1c9e30b22c52caf8b620b83fd00966d1d50102da','pairs':46,'states':states,'images':images},indent=2,ensure_ascii=False),encoding='utf8')
(d/'index.html').write_text('<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roundr — Phase 4B</title><style>body{background:#071112;color:#edf3f0;font:16px system-ui;max-width:1200px;margin:auto;padding:24px}a{color:#6ce182}img{max-width:100%;height:auto;display:block}figure{margin:20px 0}figcaption,p{color:#b1c0bc}section{border-top:1px solid #314341;margin:24px 0}nav{display:flex;gap:12px;flex-wrap:wrap}h1{font-size:28px}</style><h1>Roundr — Phase 4B</h1><p>46 comparaisons web réelles · 23 états · mêmes dimensions et paramètres. Les essais sur téléphone restent distincts.</p><nav><a href="rapport.md">Rapport</a><a href="recette-mobile.md">Recette iPhone/Android</a><a href="musique-native.md">Musique native : étude restante</a><a href="manifest.json">Dimensions et empreintes</a></nav><nav>'+''.join(f'<a href="#{x[0]}">{titles[x[0]]}</a>'for x in states)+'</nav>'+''.join(parts)+'</html>',encoding='utf8')
root=Path('work/Roundr/frontend');files=[]
for folder in ['app','src']:
 for f in (root/folder).rglob('*'):
  if not f.is_file():continue
  rel=f.relative_to(root);data=f.read_bytes()
  for mirror in ['work/phase1-validation/frontend','work/phase4b-native-render']:assert (Path(mirror)/rel).read_bytes()==data,(mirror,str(rel))
  files.append({'path':str(rel).replace('\\','/'),'sha256':hashlib.sha256(data).hexdigest()})
(d/'validation.json').write_text(json.dumps({'base':'1c9e30b22c52caf8b620b83fd00966d1d50102da','sourceMirrorsIdentical':True,'sources':files,'domainSuites':21,'syntaxFiles':109,'typeScriptExit':0,'eslintExit':0,'exports':['android','ios','web'],'physicalDevicesTested':False},indent=2),encoding='utf8')
print('46 pairs / 92 originals /',len(files),'identical app/src files')
