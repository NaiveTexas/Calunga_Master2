"""Prepare all ENRC L/H charts at zoom 5-10 from the public GeoAISWEB WMS.
Run with Python 3. Existing PNGs are reused; each chart is published in the manifest only when complete.
"""
import concurrent.futures, json, math, pathlib, time, urllib.request, urllib.parse

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERSION = '2026-09-22-z10'
URL = 'https://geoaisweb.decea.mil.br/geoserver/ICA/wms'
WORLD = 20037508.342789244

def tile_xy(lon, lat, z):
    return math.floor((lon + 180) / 360 * 2**z), math.floor((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**z)

def download(tile):
    chart, z, x, y = tile
    path = ROOT / 'public' / 'enrc-static' / VERSION / chart / str(z) / str(x) / f'{y}.png'
    if path.exists() and path.read_bytes()[:8] == b'\x89PNG\r\n\x1a\n': return path.stat().st_size
    span = 2 * WORLD / 2**z
    bbox = [-WORLD + x * span, WORLD - (y + 1) * span, -WORLD + (x + 1) * span, WORLD - y * span]
    params = dict(SERVICE='WMS', VERSION='1.1.1', REQUEST='GetMap', LAYERS=chart, STYLES='', SRS='EPSG:3857', BBOX=','.join(map(str,bbox)), WIDTH=512, HEIGHT=512, FORMAT='image/png', TRANSPARENT='true', FORMAT_OPTIONS='dpi:180')
    for attempt in range(3):
        try:
            with urllib.request.urlopen(URL + '?' + urllib.parse.urlencode(params), timeout=35) as response: data = response.read()
            if data[:8] != b'\x89PNG\r\n\x1a\n': raise ValueError('WMS returned a non-PNG response')
            path.parent.mkdir(parents=True, exist_ok=True)
            temporary = path.with_suffix('.part')
            temporary.write_bytes(data)
            temporary.replace(path)
            return len(data)
        except Exception:
            if attempt == 2: raise
            time.sleep(1)

if __name__ == '__main__':
    base = ROOT / 'public' / 'enrc-static'
    manifest_path = base / 'manifest.json'
    existing = json.loads(manifest_path.read_text(encoding='utf-8'))
    charts = existing.get('charts', [existing] if 'chart' in existing else [])
    features = []
    for kind in ['L', 'H']:
        params = dict(service='WFS', version='1.0.0', request='GetFeature',
            typeName=f'ICA:MAP_ENRC{kind}_OTHER', outputFormat='application/json', srsName='EPSG:4326')
        with urllib.request.urlopen(URL.replace('/wms','/ows')+'?'+urllib.parse.urlencode(params), timeout=35) as response:
            features.extend(json.load(response)['features'])
    for feature in sorted(features, key=lambda f: f['properties']['ident']):
        chart = feature['properties']['ident']
        extent = feature['bbox']
        tiles = []
        for z in range(5,11):
            x0,y0=tile_xy(extent[0],extent[3],z);x1,y1=tile_xy(extent[2],extent[1],z)
            tiles.extend((chart,z,x,y) for x in range(x0,x1+1) for y in range(y0,y1+1))
        print(f'{chart}: preparing {len(tiles)} tiles', flush=True)
        size=0
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            for i,count in enumerate(pool.map(download,tiles),1):
                size+=count
                if i%100==0: print(f'{chart}: {i}/{len(tiles)}; {size/1024/1024:.1f} MiB',flush=True)
        entry=dict(chart=chart,type='LOW' if chart.startswith('ENRC_L') else 'HIGH',snapshotDate=VERSION,
            extent=extent,minZoom=5,maxZoom=10,tilePixelRatio=2,tileCount=len(tiles),bytes=size,
            url=f'/enrc-static/{VERSION}/{chart}/{{z}}/{{x}}/{{y}}.png',source=URL)
        charts=[c for c in charts if c['chart'] != chart]+[entry]
        temporary=manifest_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(dict(charts=charts),indent=2),encoding='utf-8')
        temporary.replace(manifest_path)
        print(f'{chart}: complete',flush=True)
    print('All 18 charts complete', flush=True)
