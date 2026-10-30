#!/usr/bin/env python3
"""Rebuilds public/tools/agent-kit/business-card/index.html: the designer's studio (studio/, built
exactly as its own studio/build.py does) plus embed.js as one extra <script>. Usage: python3 build.py"""
import os
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'studio')
rd = lambda *p: open(os.path.join(*p), encoding='utf-8').read()
s = rd(src, 'shell.html')
app = ''.join(rd(src, f) + '\n' for f in ['a_core.js', 'b_model.js', 'c_export.js', 'd_ui.js', 'e_panels.js', 'f_main.js'])
for k, f in [('/*OT*/', 'ot.js'), ('/*FONTS*/', 'fonts.js'), ('/*DATA*/', 'data.js'), ('/*LOGOS*/', 'logos.js')]:
    s = s.replace(k, rd(src, f).replace('</script', '<\\/script'))
s = s.replace('/*APP*/', app.replace('</script', '<\\/script'))
embed = '<script>' + rd(here, 'embed.js').replace('</script', '<\\/script') + '</script>\n'
assert s.count('</body>') == 1
s = s.replace('</body>', embed + '</body>')
out = os.path.normpath(os.path.join(here, '..', '..', '..', '..', 'public', 'tools', 'agent-kit', 'business-card', 'index.html'))
open(out, 'w', encoding='utf-8').write(s)
print('wrote', out, len(s), 'bytes')
