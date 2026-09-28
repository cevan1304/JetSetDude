JET SET DUDE — R01–R33 — GitHub v20

NAHRATIE NA GITHUB PAGES
1. Rozbaľte ZIP.
2. Nahrajte celý obsah (index.html, JS súbory, manifest.json, assets a rooms)
   do jedného priečinka repozitára. Zachovajte názvy a štruktúru.
3. V Settings > Pages vyberte príslušnú vetvu a priečinok.
4. Hru otvorte cez adresu GitHub Pages.

NAČÍTAVANIE
Úvodná obrazovka a intro sa načítajú ako prvé. Po stlačení START sa počas
intra pripravuje hlavná hra. Ďalšie bloky obrázkov sa načítavajú na pozadí.
Hudba sa sťahuje pri použití. Pri rýchlom preskočení intra môže byť potrebné
krátko počkať; hra ukáže priebeh. Pri chybe spojenia je dostupné opakovanie.
Menu na výber miestností je z tejto verzie odstránené.

LOKÁLNY TEST
Táto verzia potrebuje HTTP server, nestačí dvojklik na index.html.
V rozbalenom priečinku spustite: python -m http.server 8000
Potom otvorte http://localhost:8000

R26: tabuľka s návodom je odstránená; postup stručne vysvetlí Dude.
Pohyb, schválená náročnosť, hudba, intro a outro ostávajú zachované.
Každý súbor má menej než 24 MB; celý balík obsahuje najviac 99 súborov.
