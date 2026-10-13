"""Estimate full rectangular XYZ coverage without downloading chart images."""
import json
import math
import urllib.parse
import urllib.request


def tile_xy(lon, lat, zoom):
    return (math.floor((lon + 180) / 360 * 2**zoom),
            math.floor((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2**zoom))


def count_tiles(features, zoom):
    total = 0
    for feature in features:
        bounds = feature['bbox']
        x0, y0 = tile_xy(bounds[0], bounds[3], zoom)
        x1, y1 = tile_xy(bounds[2], bounds[1], zoom)
        total += (x1 - x0 + 1) * (y1 - y0 + 1)
    return total


if __name__ == '__main__':
    features = []
    for kind in ['L', 'H']:
        query = urllib.parse.urlencode(dict(service='WFS', version='1.0.0', request='GetFeature',
            typeName=f'ICA:MAP_ENRC{kind}_OTHER', outputFormat='application/json', srsName='EPSG:4326'))
        with urllib.request.urlopen('https://geoaisweb.decea.mil.br/geoserver/ICA/ows?' + query, timeout=35) as response:
            collection = json.load(response)
        print(f"ENRC {kind}: {len(collection['features'])} charts", flush=True)
        features.extend(collection['features'])
    for maximum in [8, 9, 10, 11, 12, 21]:
        count = sum(count_tiles(features, zoom) for zoom in range(5, maximum + 1))
        # Extrapolation only: actual PNG sizes vary with zoom and chart content.
        gb = count * (6284508 / 149) / 1e9
        print(f'Zoom 5-{maximum}: {count:,} tiles; extrapolated {gb:,.2f} GB', flush=True)
