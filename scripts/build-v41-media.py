import concurrent.futures, hashlib, json, pathlib, subprocess
root=pathlib.Path(__file__).resolve().parents[1]
base=root/'artifacts'/'v41-media'
base.mkdir(parents=True,exist_ok=True)
assets=root/'public/assets'
out=assets/'hero'
shots=['ringed-horizon','starship-blue-hour','starship-dockside','starship-flyby','orbital-instrument','ringed-horizon']
master=base/'eagle-silent-master.mp4'
args=['ffmpeg','-y','-hide_banner','-loglevel','error']
for shot in shots: args += ['-stream_loop','-1','-i',str(assets/'zenith'/f'{shot}.mp4')]
filters=[f'[{i}:v]fps=24,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,trim=duration=7,setpts=PTS-STARTPTS,format=yuv420p[v{i}]' for i in range(6)]
previous='v0'
for i in range(1,6):
    filters.append(f'[{previous}][v{i}]xfade=transition=fade:duration=1:offset={i*6}[f{i}]')
    previous=f'f{i}'
args+=['-filter_complex_threads','2','-filter_complex',';'.join(filters),'-map',f'[{previous}]','-an','-t','36','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-movflags','+faststart',str(master)]
subprocess.run(args,check=True)
print('Silent 36 second source film rendered.',flush=True)
audio=base/'eagle-effects.m4a'
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(root/'public/sfx/fold.wav'),'-i',str(root/'public/sfx/warp.wav'),'-i',str(root/'public/sfx/epstein.wav'),'-filter_complex','[0:a]adelay=800|800,volume=0.24[a];[1:a]adelay=18000|18000,volume=0.20[b];[2:a]adelay=30000|30000,volume=0.20[c];[a][b][c]amix=inputs=3:normalize=0,apad,atrim=duration=36[out]','-map','[out]','-c:a','aac','-b:a','64k',str(audio)],check=True)
def encode(item):
    label,w,h,rate,codec=item
    filename=f'cashio-v41-eagle-arrival-{label}-{codec}.mp4'; dest=out/filename
    args=['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(master),'-vf',f'scale={w}:{h}:flags=lanczos','-an','-c:v','libsvtav1' if codec=='av1' else 'libx264','-threads','4','-preset','8' if codec=='av1' else 'slow','-crf','36' if codec=='av1' else '28']
    if codec=='av1':args+=['-svtav1-params','lp=4','-b:v','0']
    else:args+=['-maxrate',f'{rate}k','-bufsize',f'{rate*2}k']
    args+=['-pix_fmt','yuv420p','-movflags','+faststart',str(dest)]
    subprocess.run(args,check=True)
    replay=out/filename.replace('arrival','replay')
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(dest),'-i',str(audio),'-map','0:v','-map','1:a','-c','copy','-movflags','+faststart',str(replay)],check=True)
    records=[{'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'width':w,'height':h,'durationSeconds':36} for p in [dest,replay]]
    print(json.dumps(records),flush=True); return records
items=[(label,w,h,rate,codec) for label,w,h,rate in [('1080p',1920,1080,850),('720p',1280,720,430),('480p',854,480,220)] for codec in ['av1','h264']]
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool: records=sum(pool.map(encode,items),[])
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss','1.0','-i',str(master),'-frames:v','1','-vf','scale=1280:720','-c:v','libwebp','-quality','82',str(out/'cashio-v41-eagle-poster.webp')],check=True)
manifest=out/'cashio-v41-eagle-manifest.json'
metadata=json.loads(manifest.read_text())
metadata['variants']=records
manifest.write_text(json.dumps(metadata,indent=2)+'\n')
(out/'cashio-v41-eagle-text.vtt').write_text('WEBVTT\n\n00:00.000 --> 00:06.000\nA ringed planet fills the horizon.\n\n00:06.000 --> 00:12.000\nA ship above a lamplit workshop in the blue evening.\n\n00:12.000 --> 00:18.000\nThe ship rests beside the workshop.\n\n00:18.000 --> 00:24.000\nA slow departure toward the stars.\n\n00:24.000 --> 00:30.000\nA brass orbital instrument turns in gold light.\n\n00:30.000 --> 00:36.000\nReturn to the planet. The machines can think. You still decide.\n')
print('All media encoded; effect track contains three original site cues and silence.',flush=True)
