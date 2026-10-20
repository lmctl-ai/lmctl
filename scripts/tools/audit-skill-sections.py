#!/usr/bin/env python3
"""Read-only comparison of every legacy skill against its pre-migration source.
Uses the pinned lmhtml parser for old Markdown; HTMLParser only measures output.
No content or Markdown skill artefacts are generated in the repository.
"""
import argparse, html, json, re, subprocess, tempfile
from html.parser import HTMLParser
from pathlib import Path
class Content(HTMLParser):
 def __init__(self):
  super().__init__();self.depth=0;self.text=[];self.headings=[];self.heading=None
 def handle_starttag(self,tag,attrs):
  if tag=='main':self.depth+=1
  if self.depth and tag in ('h2','h3','h4'):self.heading=[]
 def handle_endtag(self,tag):
  if tag in ('h2','h3','h4') and self.heading is not None:self.headings.append(''.join(self.heading));self.heading=None
  if tag=='main':self.depth-=1
 def handle_data(self,text):
  if self.depth:self.text.append(text)
  if self.heading is not None:self.heading.append(text)
def parsed(text):
 p=Content();p.feed(text);return p
p=argparse.ArgumentParser();p.add_argument('--base',default='1fe5971');p.add_argument('--host');args=p.parse_args()
host=args.host or subprocess.check_output(['bash','scripts/tools/run.sh','host-path'],text=True).strip()
results=[]
with tempfile.TemporaryDirectory(dir='build',prefix='skill-audit-') as tmp:
 for page in sorted(Path('skills').glob('*.html')):
  if page.stem=='index':continue
  r=subprocess.run(['git','show',args.base+':skills/'+page.stem+'.md'],capture_output=True,text=True)
  if r.returncode:raise SystemExit('missing old skill: '+str(page))
  old=Path(tmp)/'old.md';old.write_text(r.stdout)
  before=parsed(subprocess.check_output([host,'md2html',str(old)],text=True));current=page.read_text();after=parsed(current)
  key=lambda s:re.sub('[^a-z0-9]','',s.lower())
  missing=[h for h in before.headings if key(h) not in {key(h) for h in after.headings}]
  results.append(dict(file=str(page),old_bytes=len(r.stdout.encode()),html_bytes=len(current.encode()),old_estimated_tokens=(len(r.stdout.encode())+3)//4,html_estimated_tokens=(len(current.encode())+3)//4,old_words=len(''.join(before.text).split()),html_words=len(''.join(after.text).split()),removed_or_renamed_sections=missing,old_sections=before.headings,new_sections=after.headings))
print(json.dumps({'base':args.base,'token_estimate':'UTF-8 bytes / 4, rounded up; not a model tokenizer','files':results},indent=2))
