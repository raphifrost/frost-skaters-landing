from pathlib import Path
import re
from zipfile import ZipFile, ZIP_DEFLATED
base=Path(__file__).resolve().parent
html=(base/'index.html').read_text()
css=(base/'styles.css').read_text()
html=re.sub(r'<link\b[^>]*href="styles\.css"[^>]*>',lambda _: '<style>\n'+css+'\n</style>',html)
for name in ('storage.js','memory.js','app.js'):
    script=(base/name).read_text().replace('</script','<\\/script')
    html=re.sub(r'<script\s+src="'+re.escape(name)+r'"></script>',lambda _,script=script:'<script>\n'+script+'\n</script>',html)
html=re.sub(r'\s*<link\b[^>]*(?:rel="manifest"|rel="apple-touch-icon")[^>]*>', '', html)
(base/'Mein-Space.html').write_text(html)
with ZipFile(base/'Mein-Space-PC.zip','w',ZIP_DEFLATED) as archive:
    archive.write(base/'Mein-Space.html','Mein-Space.html')
    archive.write(base/'So-startest-du.txt','So-startest-du.txt')
print('Standalone PC HTML and ZIP built without private conversations')
