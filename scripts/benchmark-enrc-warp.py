import importlib.util,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('converter',root/'scripts/prepare-enrc-pdf.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
from PIL import Image
np=c.np
doc=c.pymupdf.open(root/'assets/charts/enrc-current/ENRC_L3.pdf')
affine,inverse,crs,residual=c.georeference(doc)
display=doc[0].get_displaylist();trans=c.Transformer.from_crs(3857,crs,always_xy=True)
def mapping(samples):
    span=2*c.WORLD/1024
    xx,yy=np.meshgrid(-c.WORLD+(412+samples/512)*span,c.WORLD-(535+samples/512)*span)
    nx,ny=trans.transform(xx,yy)
    return inverse[0,0]*nx+inverse[0,1]*ny+inverse[0,2],inverse[1,0]*nx+inverse[1,1]*ny+inverse[1,2]
for mode in ['dense','mesh']:
    start=time.monotonic();u,v=mapping(np.arange(512)+.5 if mode=='dense' else np.linspace(0,512,17));t1=time.monotonic()
    scale=1.25*512/max(float(np.ptp(u)),float(np.ptp(v)))
    pix=display.get_pixmap(matrix=c.pymupdf.Matrix(scale,scale),clip=c.pymupdf.Rect(u.min()-2,v.min()-2,u.max()+2,v.max()+2),alpha=False);t2=time.monotonic()
    src=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
    if mode=='mesh':
        sx=u*scale-pix.x;sy=v*scale-pix.y;mesh=[]
        for row in range(16):
            for col in range(16):
                quad=tuple(value for r,k in [(row,col),(row+1,col),(row+1,col+1),(row,col+1)] for value in (sx[r,k],sy[r,k]))
                mesh.append(((col*32,row*32,(col+1)*32,(row+1)*32),quad))
        result=src.transform((512,512),Image.Transform.MESH,mesh,Image.Resampling.BILINEAR)
    else:
        source=np.asarray(src);sx=np.clip(u*scale-pix.x-.5,0,pix.width-1);sy=np.clip(v*scale-pix.y-.5,0,pix.height-1)
        ix=sx.astype(int);iy=sy.astype(int);jx=np.minimum(ix+1,pix.width-1);jy=np.minimum(iy+1,pix.height-1)
        dx=(sx-ix)[...,None];dy=(sy-iy)[...,None]
        rgb=source[iy,ix]*(1-dx)*(1-dy)+source[iy,jx]*dx*(1-dy)+source[jy,ix]*(1-dx)*dy+source[jy,jx]*dx*dy
        result=Image.fromarray(rgb.astype(np.uint8))
    result.save(root/f'tmp/pdfs/warp-{mode}.png');t3=time.monotonic()
    print(mode,'projection',t1-start,'render',t2-t1,'sampling/save',t3-t2,flush=True)
a=np.asarray(Image.open(root/'tmp/pdfs/warp-dense.png'),dtype=float)
b=np.asarray(Image.open(root/'tmp/pdfs/warp-mesh.png'),dtype=float)
print('mean absolute pixel difference',np.abs(a-b).mean(),flush=True)
