"""Visual QA: neatlines and independent integer-degree graticule crossings."""
import importlib.util
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('converter',ROOT/'scripts/prepare-enrc-pdf.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
from PIL import Image,ImageDraw

out=ROOT/'tmp/pdfs';out.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1500,6*340),'white')
details=Image.new('RGB',(1200,6*420),'white')
report=[]
for i,pdf in enumerate(sorted((ROOT/'assets/charts/enrc-current').glob('*.pdf'))):
    doc=c.pymupdf.open(pdf);page=doc[0]
    frame=c.detect_frame(page)
    affine,inverse,crs,residual=c.georeference(doc)
    pix=page.get_pixmap(matrix=c.pymupdf.Matrix(.18,.18),alpha=False)
    thumb=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    draw=ImageDraw.Draw(thumb);draw.rectangle(tuple(v*.18 for v in frame),outline='red',width=2)
    x=(i%3)*500;y=(i//3)*340
    sheet.paste(thumb,(x,y+20));ImageDraw.Draw(sheet).text((x+5,y+3),pdf.stem,fill='black')
    center=c.np.array([(frame[0]+frame[2])/2,(frame[1]+frame[3])/2,1])@affine
    lon,lat=c.Transformer.from_crs(crs,4326,always_xy=True).transform(*center)
    lon,lat=round(lon),round(lat)
    native=c.Transformer.from_crs(4326,crs,always_xy=True).transform(lon,lat)
    px,py,_=inverse@c.np.array([*native,1])
    clip=c.pymupdf.Rect(px-50,py-50,px+50,py+50)
    pix=page.get_pixmap(matrix=c.pymupdf.Matrix(4,4),clip=clip,alpha=False)
    crop=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    draw=ImageDraw.Draw(crop);cx,cy=px*4-pix.x,py*4-pix.y
    draw.ellipse((cx-8,cy-8,cx+8,cy+8),outline='red',width=2)
    x=(i%3)*400;y=(i//3)*420
    details.paste(crop,(x,y+20));ImageDraw.Draw(details).text((x+5,y+3),f'{pdf.stem}: {lon}, {lat}',fill='black')
    report.append(dict(chart=pdf.stem,frame=frame,residualMeters=residual,checkPoint=[lon,lat]))
    doc.close()
    print(pdf.stem,frame,residual,flush=True)
sheet.save(out/'enrc-all-frames.png');details.save(out/'enrc-all-graticules.png')
(out/'enrc-qa.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
