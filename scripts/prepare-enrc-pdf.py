"""Vector GeoPDF -> georeferenced retina XYZ tiles, no WMS.
Dependencies: pymupdf, numpy, pillow, pyproj (optional local tmp/enrc-python).
--all prepares the 18 official PDFs and publishes the catalog atomically.
Without --all, prepares the historical L3 pilot only.
"""
import argparse
import concurrent.futures
import os
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tmp/enrc-python'))
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import numpy as np
from PIL import Image
from pyproj import CRS, Transformer
import pymupdf

WORLD = 20037508.342789244
SIZE = 512
PDF = ROOT / 'assets/charts/enrc/ENRC_L3.pdf'
# Coordinates in PDF points, origin at upper left; excludes the legend/margins.
FRAME = (355.74, 44.16, 2734.02, 1657.08)


def array(doc, ref, key):
    return np.array([float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', doc.xref_get_key(ref, key)[1])])


def georeference(doc):
    page = doc[0]
    viewport = int(re.search(r'(\d+) 0 R', doc.xref_get_key(page.xref, 'VP')[1])[1])
    measure = int(doc.xref_get_key(viewport, 'Measure')[1].split()[0])
    gcs = int(doc.xref_get_key(measure, 'GCS')[1].split()[0])
    crs = CRS.from_wkt(doc.xref_get_key(gcs, 'WKT')[1])
    gps = array(doc, measure, 'GPTS').reshape(-1, 2)
    local = array(doc, measure, 'LPTS').reshape(-1, 2)
    box = array(doc, viewport, 'BBox')
    points = np.column_stack((box[0] + local[:, 0] * (box[2]-box[0]),
                            page.rect.height - box[1] - local[:, 1] * (box[3]-box[1]), np.ones(len(local))))
    to_native = Transformer.from_crs(4326, crs, always_xy=True)
    native = np.column_stack(to_native.transform(gps[:, 1], gps[:, 0]))
    affine, *_ = np.linalg.lstsq(points, native, rcond=None)
    residual = float(np.max(np.linalg.norm(points @ affine - native, axis=1)))
    if residual > 2:
        raise ValueError(f'Georeference residual too large: {residual} m')
    inverse = np.linalg.inv(np.vstack((affine.T, [0, 0, 1])))
    return affine, inverse, crs, residual


def tile_xy(lon, lat, z):
    return math.floor((lon+180)/360*2**z), math.floor((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*2**z)


def detect_frame(page):
    candidates = []
    for drawing in page.get_drawings():
        rect = drawing['rect']
        if (drawing['type'] == 's' and page.rect.contains(rect)
                and .84 < rect.width / page.rect.width < .88
                and rect.height > page.rect.height * .9
                and rect.y0 < page.rect.height * .04):
            frame = tuple(round(value, 2) for value in rect)
            if frame not in candidates: candidates.append(frame)
    if len(candidates) != 1:
        raise ValueError(f'Expected one map neatline, got {candidates}')
    return candidates[0]


def render_tile(display, transform, inverse, frame, z, x, y):
    # A 16-pixel mesh avoids projecting every pixel. Check its center error
    # against the exact projection before accepting each tile.
    cells=32
    span=WORLD*2/2**z
    def map_points(samples):
        xx,yy=np.meshgrid(-WORLD+(x+samples/SIZE)*span,WORLD-(y+samples/SIZE)*span)
        nx,ny=transform.transform(xx,yy)
        return inverse[0,0]*nx+inverse[0,1]*ny+inverse[0,2], inverse[1,0]*nx+inverse[1,1]*ny+inverse[1,2]
    u,v=map_points(np.linspace(0,SIZE,cells+1))
    scale=1.25*SIZE/max(float(np.ptp(u)),float(np.ptp(v)))
    uc,vc=map_points((np.arange(cells)+.5)*SIZE/cells)
    ui=(u[:-1,:-1]+u[1:,:-1]+u[:-1,1:]+u[1:,1:])/4
    vi=(v[:-1,:-1]+v[1:,:-1]+v[:-1,1:]+v[1:,1:])/4
    error=float(np.max(np.hypot(uc-ui,vc-vi)))*scale/1.25
    if error > .1: raise ValueError(f'Warp error {error} pixels at {z}/{x}/{y}')
    left,top,right,bottom=frame
    clip=pymupdf.Rect(max(left,float(u.min())-2),max(top,float(v.min())-2),
                      min(right,float(u.max())+2),min(bottom,float(v.max())+2))
    if clip.is_empty: return Image.new('RGBA',(SIZE,SIZE)),error
    pix=display.get_pixmap(matrix=pymupdf.Matrix(scale,scale),clip=clip,alpha=False)
    source=Image.frombytes('RGB',(pix.width,pix.height),pix.samples).convert('RGBA')
    # Remove pixels outside the neatline, including raster rounding at edges.
    px=(np.arange(pix.width)+pix.x+.5)/scale
    py=(np.arange(pix.height)+pix.y+.5)/scale
    alpha=np.outer((py>=top)&(py<=bottom),(px>=left)&(px<=right)).astype(np.uint8)*255
    source.putalpha(Image.fromarray(alpha))
    sx=u*scale-pix.x;sy=v*scale-pix.y
    mesh=[];step=SIZE//cells
    for row in range(cells):
        for col in range(cells):
            quad=tuple(value for r,k in [(row,col),(row+1,col),(row+1,col+1),(row,col+1)] for value in (sx[r,k],sy[r,k]))
            mesh.append(((col*step,row*step,(col+1)*step,(row+1)*step),quad))
    return source.transform((SIZE,SIZE),Image.Transform.MESH,mesh,Image.Resampling.BILINEAR),error


def prepare(pdf=PDF, edition='06 AGO 2026', pilot=True):
    pdf = Path(pdf)
    chart = pdf.stem
    started = time.monotonic()
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    version = 'pdf-' + chart.removeprefix('ENRC_').lower() + '-' + digest[:12] + '-v3'
    base = ROOT / 'public/enrc-static' / version / chart
    doc = pymupdf.open(pdf)
    affine, inverse, crs, residual = georeference(doc)
    display = doc[0].get_displaylist()
    to_native = Transformer.from_crs(3857, crs, always_xy=True)
    to_lonlat = Transformer.from_crs(crs, 4326, always_xy=True)
    # Densify all frame edges to include curved edges after reprojection.
    t = np.linspace(0, 1, 101)
    left, top, right, bottom = FRAME if pilot else detect_frame(doc[0])
    px = np.concatenate((left+t*(right-left), left+t*(right-left), t*0+left, t*0+right))
    py = np.concatenate((t*0+top, t*0+bottom, top+t*(bottom-top), top+t*(bottom-top)))
    xy = np.column_stack((px, py, np.ones(len(px)))) @ affine
    lon, lat = to_lonlat.transform(xy[:, 0], xy[:, 1])
    extent = [float(min(lon)), float(min(lat)), float(max(lon)), float(max(lat))]
    total = size = 0
    max_warp_error = 0
    for z in range(5, 11):
        x0,y0 = tile_xy(extent[0],extent[3],z)
        x1,y1 = tile_xy(extent[2],extent[1],z)
        span = WORLD*2/2**z
        for x in range(x0,x1+1):
            for y in range(y0,y1+1):
                path = base / str(z) / str(x) / f'{y}.png'
                if path.exists():
                    with Image.open(path) as image:
                        image.verify()
                    size += path.stat().st_size; total += 1
                    continue
                tile_image, warp_error = render_tile(display, to_native, inverse, (left,top,right,bottom), z,x,y)
                max_warp_error=max(max_warp_error,warp_error)
                path.parent.mkdir(parents=True,exist_ok=True)
                temporary=path.with_suffix('.part')
                tile_image.save(temporary,format='PNG')
                temporary.replace(path)
                size+=path.stat().st_size; total+=1
                if total%100==0: print(f'{chart}: {total} tiles; {size/1024/1024:.1f} MiB; {time.monotonic()-started:.0f}s',flush=True)
        print(f'{chart}: zoom {z} complete',flush=True)
    manifest=dict(chart=chart,type='LOW' if chart.startswith('ENRC_L') else 'HIGH',extent=extent,minZoom=5,maxZoom=10,tilePixelRatio=2,
        tileCount=total,bytes=size,url=f'/enrc-static/{version}/{chart}/{{z}}/{{x}}/{{y}}.png',
        source=pdf.relative_to(ROOT).as_posix(),sourceSha256=digest,edition=edition,frame=[left,top,right,bottom],
        georeferenceResidualMeters=residual,maxWarpErrorPixels=max_warp_error,preparationSeconds=round(time.monotonic()-started,1))
    path=ROOT/'public/enrc-static/pdf-pilot.json' if pilot else base/'metadata.json'
    temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(manifest,indent=2),encoding='utf-8');temporary.replace(path)
    print(f"{chart}: COMPLETE, {total} tiles",flush=True)
    doc.close()
    return manifest


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--all',action='store_true')
    parser.add_argument('--workers',type=int,default=8)
    args=parser.parse_args()
    if not args.all:
        prepare()
    else:
        catalog=json.loads((ROOT/'assets/charts/enrc-current/sources.json').read_text(encoding='utf-8'))
        results=[]
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
            jobs={pool.submit(prepare,ROOT/'assets/charts/enrc-current'/ (entry['chart']+'.pdf'),entry['edition'],False):entry for entry in catalog['charts']}
            for job in concurrent.futures.as_completed(jobs):
                result=job.result()
                if result['sourceSha256'] != jobs[job]['sha256']:
                    raise ValueError('PDF changed after source catalog was downloaded')
                result['sourceUrl']=jobs[job]['url']
                results.append(result)
                (ROOT/'tmp/enrc-pdf-progress.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
        if len(results)!=18: raise ValueError('Incomplete chart catalog')
        path=ROOT/'public/enrc-static/pdf-charts.json'
        temporary=path.with_suffix('.tmp')
        temporary.write_text(json.dumps(dict(charts=sorted(results,key=lambda c:c['chart'])),indent=2),encoding='utf-8')
        temporary.replace(path)
        print('ALL 18 CHARTS COMPLETE',flush=True)
