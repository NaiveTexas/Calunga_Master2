"""Lossless migration of all PDF charts with full tile verification."""
import hashlib
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tmp/pmtiles-python'))
from pmtiles.writer import write
from pmtiles.tile import zxy_to_tileid, Compression, TileType
from pmtiles.reader import Reader

catalog=json.loads((ROOT/'public/enrc-static/pdf-charts.json').read_text())
charts=[]
for entry in catalog['charts']:
    base=ROOT/'public'/entry.get('pngUrl',entry['url']).split('/{z}')[0].lstrip('/')
    if not base.exists():
        base=ROOT/'tmp/enrc-png-backup'/base.relative_to(ROOT/'public/enrc-static')
    tiles=[]
    for path in base.glob('*/*/*.png'):
        z,x,y=int(path.parent.parent.name),int(path.parent.name),int(path.stem)
        tiles.append((zxy_to_tileid(z,x,y),z,x,y,path))
    assert len(tiles)==entry['tileCount']
    out=ROOT/'public/enrc-static/pmtiles';out.mkdir(exist_ok=True)
    temporary=out/(entry['chart']+'.part')
    with write(temporary) as writer:
        for tileid,z,x,y,path in sorted(tiles):
            writer.write_tile(tileid,path.read_bytes())
        bounds=entry['extent']
        writer.finalize(dict(tile_compression=Compression.NONE,tile_type=TileType.PNG,
            min_lon_e7=round(bounds[0]*1e7),min_lat_e7=round(bounds[1]*1e7),
            max_lon_e7=round(bounds[2]*1e7),max_lat_e7=round(bounds[3]*1e7)),
            dict(name=entry['chart'],format='png',tile_size=512,edition=entry['edition'],sourceSha256=entry['sourceSha256']))
    # Verify every archived tile against its original before publishing.
    with temporary.open('rb') as stream:
        def read_at(offset, length):
            stream.seek(offset)
            return stream.read(length)
        reader=Reader(read_at)
        for _,z,x,y,path in tiles:
            assert reader.get(z,x,y)==path.read_bytes(),str(path)
    with temporary.open('rb') as stream:
        digest=hashlib.file_digest(stream,'sha256').hexdigest()
    target=out/f"{entry['chart']}-{digest[:16]}.pmtiles"
    temporary.replace(target)
    manifest={**entry,'pngUrl':entry.get('pngUrl',entry['url']),'url':'/enrc-static/pmtiles/'+target.name,
              'format':'pmtiles','archiveBytes':target.stat().st_size,'archiveSha256':digest}
    charts.append(manifest)
    print(json.dumps(dict(chart=entry['chart'],tiles=len(tiles),archiveBytes=target.stat().st_size,verifiedIdentical=True)),flush=True)

catalog['charts']=charts
manifest_path=ROOT/'public/enrc-static/pdf-charts.json'
temp_manifest=manifest_path.with_suffix('.tmp')
temp_manifest.write_text(json.dumps(catalog,indent=2),encoding='utf-8')
temp_manifest.replace(manifest_path)
(ROOT/'public/enrc-static/pmtiles-pilot.json').write_text(json.dumps(next(c for c in charts if c['chart']=='ENRC_L3'),indent=2),encoding='utf-8')
