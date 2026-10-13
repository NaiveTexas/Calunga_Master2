"""Verify the complete XYZ package and draw independent graticule checks."""
import json,math,sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tmp/enrc-python'))
from PIL import Image,ImageDraw

catalog=json.loads((ROOT/'public/enrc-static/pdf-charts.json').read_text())['charts']
checks={entry['chart']:entry for entry in json.loads((ROOT/'tmp/pdfs/enrc-qa.json').read_text())}
sheet=Image.new('RGB',(1200,6*420),'white')
total=size=0
def verify_tile(path):
    with Image.open(path) as image:
        assert image.size==(512,512),str(path)
        image.verify()
    return path.stat().st_size

for i,entry in enumerate(catalog):
    base=ROOT/'public'/entry['url'].split('/{z}')[0].lstrip('/')
    tiles=list(base.glob('*/*/*.png'))
    assert len(tiles)==entry['tileCount'],entry['chart']
    with ThreadPoolExecutor(max_workers=8) as pool:
        count_bytes=sum(pool.map(verify_tile,tiles))
    assert count_bytes==entry['bytes'],entry['chart']
    total+=len(tiles);size+=count_bytes
    lon,lat=checks[entry['chart']]['checkPoint']
    gx=(lon+180)/360*1024*512
    gy=(1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*1024*512
    tx,ty=int(gx//512),int(gy//512)
    mosaic=Image.new('RGBA',(1536,1536),'white')
    for dx in [-1,0,1]:
        for dy in [-1,0,1]:
            path=base/'10'/str(tx+dx)/f'{ty+dy}.png'
            if path.exists(): mosaic.paste(Image.open(path),(512*(dx+1),512*(dy+1)))
    cx,cy=gx-(tx-1)*512,gy-(ty-1)*512
    crop=mosaic.crop((int(cx)-200,int(cy)-200,int(cx)+200,int(cy)+200)).convert('RGB')
    ImageDraw.Draw(crop).ellipse((192,192,208,208),outline='red',width=2)
    x,y=i%3*400,i//3*420
    sheet.paste(crop,(x,y+20));ImageDraw.Draw(sheet).text((x+5,y+3),f"{entry['chart']}: {lon}, {lat}",fill='black')
    print(entry['chart'],len(tiles),'verified',flush=True)
sheet.save(ROOT/'tmp/pdfs/enrc-all-tiles.png')
print(f'TOTAL: {total} tiles; {size} bytes',flush=True)
