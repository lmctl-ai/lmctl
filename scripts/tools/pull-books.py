#!/usr/bin/env python3
"""Pull typed book content from a pinned public source; render only with lmhtml."""
import argparse
import hashlib
import importlib.util
import json
import math
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import struct
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('tool_policy', Path(__file__).with_name('pull-tools.py'))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)
SCHEMA = Path(__file__).with_name('content-book-v1.schema.json')
BOOKS = {'getting-started', 'examples', 'showcase', 'cycles'}


def sha(data): return hashlib.sha256(data).hexdigest()


def safe_path(path):
    if not isinstance(path, str) or not path or any(ord(c) < 32 for c in path): return False
    rel = PurePosixPath(path)
    return not rel.is_absolute() and '..' not in rel.parts and str(rel) == path and '\\' not in path


def blob(repo, commit, path):
    rel = PurePosixPath(path)
    if not safe_path(path):
        raise ValueError(f'unsafe content path {path}')
    mode = subprocess.check_output(['git', '-C', str(repo), 'ls-tree', commit, '--', path], text=True)
    if not mode.startswith(('100644 blob ', '100755 blob ')):
        raise ValueError(f'not a regular committed blob: {path}')
    size = int(subprocess.check_output(['git', '-C', str(repo), 'cat-file', '-s', f'{commit}:{path}']))
    if size > 2*1024*1024: raise ValueError(f'content exceeds 2 MiB: {path}')
    return subprocess.check_output(['git', '-C', str(repo), 'show', f'{commit}:{path}'])


def validate(content, origin):
    schema = json.loads(SCHEMA.read_text())
    errors = policy.schema_errors(content, schema, schema)
    if errors: raise ValueError(origin + ': ' + '; '.join(errors))
    mids = {m['id']: m for m in content['media']}
    if len(mids) != len(content['media']): raise ValueError(origin + ': duplicate media id')
    for e in content['evidence']:
        if not safe_path(e['file']): raise ValueError(origin + ': unsafe evidence file ' + e['file'])
    filenames = set()
    for m in content['media']:
        if not safe_path(m['file']) or '/' in m['file'] or m['file'] in filenames: raise ValueError(origin + ': unsafe/duplicate media file')
        filenames.add(m['file'])
        if m['width'] <= 0 or m['height'] <= 0 or m['width']*m['height'] > 64000000 or not 0 < m['bytes'] <= 50*1024*1024: raise ValueError(origin + ': media dimensions/bytes outside bounds')
        if m['kind'] != 'png' and (not isinstance(m.get('duration_seconds'),(int,float)) or not math.isfinite(m['duration_seconds']) or m['duration_seconds'] <= 0 or m.get('no_audio') is not True): raise ValueError(origin + ': invalid silent media duration')
    seen = set()
    fields = {'text': {'kind','text'}, 'code': {'kind','script','script_sha256','commands','stdout'}, 'image': {'kind','media','alt','caption'}, 'video': {'kind','media','poster','caption','duration_seconds','no_audio'}}
    for group in content['groups']:
        if group['id'] not in BOOKS or group['id'] in seen: raise ValueError(origin + ': invalid/duplicate book id')
        seen.add(group['id']); chapters = set()
        if not group['chapters']: raise ValueError(origin + ': empty book')
        for chapter in group['chapters']:
            if chapter['id'] == 'index' or chapter['id'] in chapters: raise ValueError(origin + ': duplicate/reserved chapter id')
            chapters.add(chapter['id'])
            for i, b in enumerate(chapter['blocks']):
                label = f'{origin}: {group["id"]}/{chapter["id"]}.blocks[{i}]'
                if set(b) != fields[b['kind']]: raise ValueError(label + ': wrong fields for block kind')
                if b['kind'] == 'code':
                    if not safe_path(b['script']) or not b['script'].endswith('.lms') or not b['commands'] or any(not cmd for cmd in b['commands']): raise ValueError(label + ': unsafe source or empty commands')
                if b['kind'] == 'image' and (not isinstance(b['media'],str) or b['media'] not in mids or mids[b['media']]['kind'] != 'png'): raise ValueError(label + ': image reference must be a PNG')
                if b['kind'] == 'video':
                    if not isinstance(b['media'],list) or not 1 <= len(b['media']) <= 2 or b['poster'] not in mids or mids[b['poster']]['kind'] != 'png' or b['no_audio'] is not True: raise ValueError(label + ': video needs sources, poster and explicit silent declaration')
                    if not isinstance(b['duration_seconds'], (float,int)) or not math.isfinite(b['duration_seconds']) or b['duration_seconds'] <= 0: raise ValueError(label + ': invalid duration')
                    for mid in b['media']:
                        if not isinstance(mid,str) or mid not in mids or mids[mid]['kind'] not in ('mp4','webm'): raise ValueError(label + ': invalid video source')
                    sizes = {(mids[mid]['width'], mids[mid]['height']) for mid in b['media']}
                    poster = (mids[b['poster']]['width'], mids[b['poster']]['height'])
                    if len(sizes) != 1 or poster not in sizes: raise ValueError(label + f': poster {poster[0]}x{poster[1]} must match the video size ' + ' / '.join(f'{w}x{h}' for w, h in sorted(sizes)) + ' (otherwise the player letterboxes before playback)')
        for row in group.get('scoreboard',[]):
            if row['chapter'] not in chapters or row['tier'] not in (1,2,3) or not isinstance(row['seconds'],(float,int)) or not math.isfinite(row['seconds']) or row['seconds'] <= 0: raise ValueError(origin + ': invalid scoreboard row')
    if not content['groups']: raise ValueError(origin + ': empty books')
    return mids


def media_info(path, m):
    if path.is_symlink() or not path.is_file(): raise ValueError(f'missing regular media: {path.name}')
    data = path.read_bytes()
    if len(data) != m['bytes'] or sha(data) != m['sha256']: raise ValueError(f'media hash/size mismatch: {path.name}')
    if len(data) > 50*1024*1024: raise ValueError('media exceeds 50 MiB')
    if m['kind'] == 'png':
        if data[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', data[16:24]) != (m['width'],m['height']): raise ValueError(f'PNG dimensions differ: {path.name}')
    else:
        probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)],timeout=30))
        videos = [x for x in probe['streams'] if x['codec_type']=='video']
        if len(videos)!=1 or any(x['codec_type']=='audio' for x in probe['streams']): raise ValueError('silent video profile violated')
        if (videos[0]['width'],videos[0]['height']) != (m['width'],m['height']) or abs(float(probe['format']['duration'])-m['duration_seconds']) > .05: raise ValueError('video metadata differs')


def install_books(out, target, book_ids, lock):
    # Stage every replacement under the destination filesystem, then install
    # with rollback. Never remove authored content without a prior ownership lock.
    owned = target/'books-lock.json'
    if owned.exists():
        old_books = set(json.loads(owned.read_text())['books'])
    else:
        old_books = {'examples'} if (target/'examples/source-lock.json').is_file() else set()
    if not old_books <= BOOKS: raise ValueError('invalid existing book ownership lock')
    staging = target/'.books-import-new'
    backup = target/'.books-import-old'
    if staging.exists() or backup.exists(): raise ValueError('unfinished book import; inspect staging before retrying')
    for bid in book_ids:
        if (target/bid).is_symlink(): raise ValueError('refuse symlink book')
        if (target/bid).exists() and bid not in old_books: raise ValueError('refuse unowned book '+bid)
    shutil.copytree(out,staging)
    backup.mkdir()
    installed=[]; moved=[]; installed_ok=False; rolled_back=False
    old_lock = owned.read_bytes() if owned.exists() else None
    try:
        for bid in sorted(old_books | set(book_ids)):
            dest=target/bid
            if dest.exists(): dest.rename(backup/bid); moved.append(bid)
            if (staging/bid).exists(): (staging/bid).rename(dest); installed.append(bid)
        owned.write_text(json.dumps(lock,indent=2)+'\n')
        installed_ok=True
    except OSError:
        for bid in installed: shutil.rmtree(target/bid)
        for bid in moved: (backup/bid).rename(target/bid)
        if old_lock is not None: owned.write_bytes(old_lock)
        elif owned.exists(): owned.unlink()
        rolled_back=True
        raise
    finally:
        shutil.rmtree(staging,ignore_errors=True)
        if installed_ok or rolled_back: shutil.rmtree(backup)


def pull(tool, ref, source, store):
    if ref.startswith('-') or not re.fullmatch(r'[a-zA-Z0-9_./-]+',ref): raise ValueError('invalid Git ref')
    if tool != 'lmvideo': raise ValueError('book pilot currently supports lmvideo')
    with tempfile.TemporaryDirectory(prefix='lmtools-books-') as td:
        work = Path(td)
        if source: repo = Path(source).resolve()
        else:
            repo = work/'repo'; policy.run('git','init','-q',str(repo));policy.run('git','-C',str(repo),'fetch','--depth=1',f'https://github.com/lmctl-ai/{tool}.git',ref);ref='FETCH_HEAD'
        commit = subprocess.check_output(['git','-C',str(repo),'rev-parse','--verify',f'{ref}^{{commit}}'],text=True).strip()
        origin = f'lmctl-ai/{tool}@{commit}:examples/books.json'
        # Preserve the established examples contract; a book is a distinct typed content profile.
        policy.validate(policy.parse_manifest(blob(repo,commit,'examples/manifest.json'),origin.replace('books.json','manifest.json')),tool)
        raw=blob(repo,commit,'examples/books.json'); content=policy.parse_manifest(raw,origin); mids=validate(content,origin)
        inputs={'examples/books.json':sha(raw)}
        for e in content['evidence']:
            data=blob(repo,commit,e['file'])
            if sha(data)!=e['sha256']: raise ValueError(origin+': evidence digest mismatch '+e['file'])
            inputs[e['file']]=sha(data)
        cache=ROOT/'build/tools-media'/tool;cache.mkdir(parents=True,exist_ok=True)
        urls={};locked=[]
        for mid,m in mids.items():
            name=m['file']
            if not re.fullmatch(r'[a-z0-9][a-z0-9.-]*-'+m['sha256']+r'\.'+m['kind'],name): raise ValueError(origin+': media filename must contain full digest')
            src=Path(store)/name;media_info(src,m);dest=cache/name
            if src.resolve()!=dest.resolve(): shutil.copyfile(src,dest)
            url=f'/tools/{tool}/media/{name}';urls[mid]=url;locked.append(dict(m,url=url))
        compiler='lmscript'; host=subprocess.check_output(['bash',str(ROOT/'scripts/tools/run.sh'),'host-path'],cwd=ROOT,text=True).strip()
        template=ROOT/'scripts/tools/book-page.lms';out=work/'pages';out.mkdir()
        def render(path,kind,title='',intro='',script='',command='',expected='',image='',alt='',caption='',mp4='',webm='',poster='',duration='',prev='',nxt='',contents='',width='',height=''):
            args=[str(work/'page.dslb'),str(path),title,intro,kind,script,command,expected,image,alt,caption,mp4,webm,poster,str(duration),prev,nxt,contents,str(width),str(height)]
            policy.run(compiler,str(template),*args,cwd=ROOT,stdout=subprocess.DEVNULL)
            resolved=Path(args[0]+'.host').read_text().strip()
            policy.run(resolved,'--dsl',args[0],cwd=work,stdout=subprocess.PIPE)
        for group in content['groups']:
            folder=out/group['id'];folder.mkdir();base=f'/tools/{tool}/{group["id"]}/';chapters=group['chapters'];index=folder/'index.html'
            render(index,'init',group['title'],group['summary'])
            if group.get('scoreboard'):
                render(index,'text',intro='All 32 targets are locally VERIFIED in the locked capture ledger. These measurements are not fresh website render timings, and publication is a separate owner step.')
                for row in group['scoreboard']: render(index,'row',row['id']+' '+row['title'],f'Tier {row["tier"]} / {row["status"]}',duration=str(round(row['seconds'],3))+' s',nxt=base+row['chapter']+'.html')
            else:
                for c in chapters: render(index,'link',c['title'],nxt=base+c['id']+'.html')
            render(index,'finish')
            for n,c in enumerate(chapters):
                path=folder/(c['id']+'.html');prev=base+chapters[n-1]['id']+'.html' if n else '';nxt=base+chapters[n+1]['id']+'.html' if n+1<len(chapters) else ''
                render(path,'init',c['title'],prev=prev,nxt=nxt,contents=base)
                for b in c['blocks']:
                    if b['kind']=='text': render(path,'text',intro=b['text'])
                    elif b['kind']=='code':
                        data=blob(repo,commit,b['script'])
                        if sha(data)!=b['script_sha256']: raise ValueError(origin+': source hash mismatch '+b['script'])
                        inputs[b['script']]=sha(data);tmp=work/'source.lms';tmp.write_bytes(data)
                        rawurl=f'https://raw.githubusercontent.com/lmctl-ai/{tool}/{commit}/{b["script"]}'
                        commands=[' '.join(shlex.quote(rawurl if token==b['script'] and command[:2]==['lmctl','autorun'] else token) for token in command) for command in b['commands']]
                        render(path,'code',script=str(tmp),command='\n'.join(commands),expected=b['stdout'])
                        render(path,'link','Raw LMScript source (candidate must be published first)',nxt=rawurl)
                    elif b['kind']=='image': render(path,'image',image=urls[b['media']],alt=b['alt'],caption=b['caption'],width=mids[b['media']]['width'],height=mids[b['media']]['height'])
                    else:
                        sources={mids[x]['kind']:urls[x] for x in b['media']}
                        render(path,'video',caption=b['caption'],mp4=sources.get('mp4',''),webm=sources.get('webm',''),poster=urls[b['poster']],duration=str(b['duration_seconds'])+' seconds',width=mids[b['media'][0]]['width'],height=mids[b['media'][0]]['height'])
                render(path,'finish')
        page_host=Path(str(work/'page.dslb')+'.host').read_text().strip()
        lock={'version':1,'compiler':subprocess.check_output([compiler,'--version'],text=True).strip(),'page_renderer':{'version':subprocess.check_output([page_host,'--version'],text=True).strip(),'sha256':sha(Path(page_host).read_bytes())},'repository':content['repository'],'commit':commit,'content_sha256':sha(raw),'schema_sha256':sha(SCHEMA.read_bytes()),'template_sha256':sha(template.read_bytes()),'books':[g['id'] for g in content['groups']],'media':locked,'inputs':dict(sorted(inputs.items())),'publication_status':content['publication_status']}
        target=ROOT/'tools'/tool
        install_books(out,target,[g['id'] for g in content['groups']],lock)
        print(f'{tool}: rendered {len(content["groups"])} books, {sum(len(g["chapters"]) for g in content["groups"])} chapters; {len(locked)} media / {sum(m["bytes"] for m in locked)} bytes')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('tool');p.add_argument('--source');p.add_argument('--ref',default='main');p.add_argument('--media-store',required=True);a=p.parse_args()
    try: pull(a.tool,a.ref,a.source,a.media_store)
    except (ValueError,KeyError) as e: p.exit(2,f'pull:books: {e}\n')

if __name__=='__main__':main()
