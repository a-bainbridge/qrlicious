#!/bin/python
import argparse
import base64
import configparser
import urllib.parse
from io import SEEK_END, SEEK_SET

parser = argparse.ArgumentParser(description='Generate offline site QR code')

parser.add_argument('--skip-code', action='store_true',
                    help='Don\'t generate a QR code')
                    
parser.add_argument('--safe', action='store_true',
                    help='Limit the generation')
args = parser.parse_args()

config = configparser.ConfigParser()
config.read('config.ini')

html_source = config['Input']['page']
js_sources = list(config['Scripts'].keys())

text_buffer = []

with open(html_source, 'rb') as page_file:
  length = page_file.seek(0, SEEK_END)
  page_file.seek(0, SEEK_SET)
  # todo: minifier?
  text_buffer.append(str(page_file.read(length), 'utf-8'))

# a = ''
# with open('index.html.gz', 'rb') as gzipped_file:
#   length = gzipped_file.seek(0, SEEK_END)
#   gzipped_file.seek(0, SEEK_SET)
#   a = gzipped_file.read(length)
# gzipped_b64 = base64.b64encode(a)
# print(gzipped_b64)

for js_source in js_sources:
  with open(js_source, 'rb') as js_file:
    length = js_file.seek(0, SEEK_END)
    js_file.seek(0, SEEK_SET)
    contents = str(js_file.read(length), 'utf-8')
    text_buffer.append(f"<script>{contents}</script>")
final = bytes(''.join(text_buffer), 'utf-8')
with open('output.html', 'wb') as output_file:
  output_file.write(final)
prefix_text = 'http://data:text/html,'
prefix_b64  = 'http://data:text/html;base64,'
data_text = urllib.parse.quote(final, ':/<>\"\'?[]@!$&()*+,;= ' if not args.safe else '')
data_b64  = base64.b64encode(final)
text_len = len(prefix_text) + len(data_text)
b64_len = len(prefix_b64) + len(data_b64)
if text_len > b64_len:
  print('Using base64')
  final = bytes(prefix_b64, 'utf-8') + data_b64
else:
  print('Using text')
  final = bytes(prefix_text + data_text, 'utf-8')
with open('link', 'wb') as link_file:
  link_file.write(final)
  link_file.flush()
print('=== Statistics ===')
print(f' Output size: {len(final)}')

if args.skip_code:
  exit(0)

try:
  import qrcode
except:
  print('Cannot generate qrcode without installing qrcode. Please run `pip install qrcode[pil]`')
  exit(0)
import qrcode

qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_L,
    box_size=10,
    border=4,
)
qr.add_data(final)
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save('qrcode.png')
print(f' QR Version:  {qr.version}')