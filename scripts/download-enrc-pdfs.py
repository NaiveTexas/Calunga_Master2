"""Download the PDFs linked by the official ENRC index, preserving old assets."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
INDEX = 'https://aisweb.decea.mil.br/inc/cartas/enrc/index.cfm'
OUT = ROOT / 'assets/charts/enrc-current'

def download(entry):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(entry['url'], timeout=90) as response:
                data = response.read()
            if not data.startswith(b'%PDF-'): raise ValueError('Response is not a PDF')
            path = OUT / (entry['chart'] + '.pdf')
            path.write_bytes(data)
            entry['sha256'] = hashlib.sha256(data).hexdigest()
            print(entry['chart'], len(data), entry['edition'], flush=True)
            return entry
        except Exception:
            if attempt == 2: raise
            time.sleep(2)

if __name__ == '__main__':
    with urllib.request.urlopen(INDEX, timeout=35) as response:
        html = response.read().decode('utf-8')
    entries = []
    for link, chart, edition in re.findall(r'href="([^"<>]+&nome=ENRC ([LH][1-9]))" title="AMDT ([^"]+)"', html):
        entries.append(dict(chart='ENRC_'+chart, edition=edition,
                            url=urllib.parse.urljoin(INDEX, link).replace(' ', '%20')))
    if len(entries) != 18: raise ValueError(f'Expected 18 charts, found {len(entries)}')
    OUT.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(download, entries))
    (OUT/'sources.json').write_text(json.dumps(dict(index=INDEX,charts=results),indent=2),encoding='utf-8')
