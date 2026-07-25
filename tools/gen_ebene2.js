#!/usr/bin/env node
// Generator: erzeugt die 12 Ebene-2-Seiten (fpga/schritt-NN.html) aus /tmp/pruefaufgaben.json.
// Bilder der Unter-Kacheln erben vorerst das Bild der Eltern-Kachel (eigene Bilder folgen).
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/tmp/pruefaufgaben.json', 'utf8'));

const IMAGES = [
  '../app-assets/images/01_Python%20Code.png',
  '../app-assets/images/02_Golden%20Python.png',
  '../app-assets/images/03_Testbench',
  '../app-assets/images/04_Verilog.png',
  '../app-assets/images/05_RTL.png',
  '../app-assets/images/06_Vivado.png',
  '../app-assets/images/07_Timing.png',
  '../app-assets/images/08_Bitstream.png',
  '../app-assets/images/09_Flash.png',
  '../app-assets/images/10_Saleae.png',
  '../app-assets/images/11_Dokumentation.png',
  '../app-assets/images/12_Deployment.png'
];

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nn = i => String(i + 1).padStart(2, '0');

data.forEach((step, i) => {
  const img = IMAGES[i];
  const prev = i > 0 ? `schritt-${nn(i - 1)}.html` : null;
  const next = i < data.length - 1 ? `schritt-${nn(i + 1)}.html` : null;
  const cards = step.subs.map(s => `
<div class="card sub">
  <img src="${img}" alt="${esc(s[0])} ${esc(s[1])}" loading="lazy">
  <div class="body">
    <h2>${esc(s[0])} · ${esc(s[1])}</h2>
    <span class="beweis">Beweis-Artefakt: ${esc(s[2])}</span>
    <p class="essenz">${esc(s[3])}</p>
  </div>
</div>`).join('\n');

  const nav = `
<nav class="stepnav">
  ${prev ? `<a href="${prev}">&larr; Schritt ${nn(i - 1)}</a>` : '<span></span>'}
  <a href="index.html">Alle 12 Schritte</a>
  ${next ? `<a href="${next}">Schritt ${nn(i + 1)} &rarr;</a>` : '<span></span>'}
</nav>`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(step.step)} — die 5 Prüfaufgaben · FPGA-Prozess-Werkstatt</title>
<style>
body { font-family: Arial, Helvetica, sans-serif; background: #0d1117; color: #f0f0f0; margin: 0; padding: 40px 20px; }
h1 { text-align: center; margin: 0 0 6px 0; }
p.subtitle { text-align: center; color: #9aa4b2; margin: 0 0 28px 0; }
.hero { display: flex; justify-content: center; margin-bottom: 28px; }
.hero img { max-width: 340px; width: 100%; border: 1px solid #30363d; border-radius: 10px; background: #0d1117; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
.card.sub { background: #161b22; border: 1px solid #30363d; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; text-align: left; }
.card.sub img { width: 100%; height: 150px; object-fit: contain; background: #0d1117; display: block; }
.card.sub .body { padding: 14px 14px 16px 14px; display: flex; flex-direction: column; gap: 9px; }
.card.sub h2 { font-size: 15px; margin: 0; color: #f0f6fc; line-height: 1.35; }
.beweis { align-self: flex-start; font-size: 12px; color: #9ae6c3; background: #12261c; border: 1px solid #2fd67b55; border-radius: 6px; padding: 3px 9px; }
.essenz { font-size: 13px; color: #9aa4b2; margin: 0; line-height: 1.5; }
.stepnav { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 30px auto 0 auto; gap: 12px; }
.stepnav a { color: #f0f0f0; background: #21262d; border: 1px solid #484f58; border-radius: 8px; padding: 9px 16px; text-decoration: none; font-size: 14px; }
.stepnav a:hover { background: #30363d; border-color: #6e7681; }
footer { text-align: center; margin-top: 44px; padding: 24px 0 0 0; font-size: 13px; color: #8b949e; border-top: 1px solid #30363d; }
footer a { color: #8b949e; }
</style>
</head>
<body>
<h1>${esc(step.step)}</h1>
<p class="subtitle">Ebene 2 · die 5 Prüfaufgaben dieses Schritts · FPGA-Prozess-Werkstatt</p>
<div class="hero"><img src="${img}" alt="${esc(step.step)}"></div>
<div class="grid">${cards}
</div>
${nav}
<footer>
  <a href="index.html">&larr; FPGA-Prozess-Werkstatt</a> &middot;
  <a href="../index.html">Adrian-Structure</a> &middot;
  <a href="../impressum.html">Impressum</a> &middot;
  <a href="../datenschutz.html">Datenschutz</a>
</footer>
</body>
</html>
`;
  fs.writeFileSync(`fpga/schritt-${nn(i)}.html`, html);
  console.log(`fpga/schritt-${nn(i)}.html geschrieben (${step.subs.length} Prüfaufgaben)`);
});
