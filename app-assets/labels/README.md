# KI-Kennzeichnungs-Labels

Zwölf SVG-Dateien zur sichtbaren Kennzeichnung KI-erzeugter oder KI-bearbeiteter
Inhalte. Sie liegen hier, damit niemand sie noch einmal suchen muss.

Von Roberto beschafft und am 02.10.2026 ins Repository übernommen. Quelle und
Lizenzbedingungen des Label-Satzes liegen bei Roberto — **vor einer Weitergabe an
Dritte dort nachsehen.** Dieses Verzeichnis dokumentiert nur, welche Datei wofür da
ist, es trifft keine Aussage über die Herkunft.

## Welches Label wofür

| Variante | Bedeutung | Einsatz |
|---|---|---|
| `label-ai-*` | **AI** — allgemeiner Hinweis auf KI-Beteiligung | wenn offen bleiben soll, ob erzeugt oder bearbeitet; kleinste Darstellung, quadratisch |
| `label-ai-generated-*` | **AI GENERATED** — vollständig von KI erzeugt | unsere Bildmotive: HEPHAISTOS-Illustrationen, Vorlagen-Bilder, Produktbilder |
| `label-ai-modified-*` | **AI MODIFIED** — vorhandenes Material mit KI bearbeitet | Fotos, die nachträglich mit KI verändert wurden |

## Farbvarianten

| Endung | Aussehen | Einsatz |
|---|---|---|
| `-white` | weiße Fläche, dunkle Schrift, deckend | auf dunklem Hintergrund |
| `-black` | schwarze Fläche, weiße Schrift, deckend | auf hellem Hintergrund |
| `-white-transparent` | weiße Fläche mit 50 % Deckkraft | über Bildern, wenn das Motiv durchscheinen soll |
| `-black-transparent` | schwarze Fläche mit 50 % Deckkraft | dasselbe auf hellen Bildern |

Die deckenden Varianten sind die sichere Wahl. Halbtransparent sieht über
unruhigen Bildern schnell unlesbar aus — und ein Hinweis, den man nicht lesen
kann, erfüllt Art. 50 Abs. 5 nicht („klar und eindeutig").

## Seitenverhältnisse

- `label-ai-*` — 566,93 × 566,93 (quadratisch)
- `label-ai-modified-*` — 1700,79 × 566,93 (3 : 1)
- `label-ai-generated-*` — 1789,84 × 566,93 (3,16 : 1)

Die Dateien sind Vektoren und skalieren verlustfrei. Breite setzen, Höhe auf
`auto` lassen.

## Einbau — die Regel, die zählt

Ein Label ist eine **Grafik**. Eine Grafik allein ist nach Art. 50 Abs. 5
VO (EU) 2024/1689 nicht genug, denn die Information muss auch barrierefrei sein.
Deshalb bekommt jedes Label ein sprechendes `alt`:

```html
<img src="/app-assets/labels/label-ai-generated-black.svg"
     alt="KI-generiert — dieses Bild wurde mit Künstlicher Intelligenz erzeugt"
     width="150" height="48" loading="lazy">
```

Nie `alt=""` und nie als CSS-Hintergrundbild einbinden — beides macht den
Hinweis für Screenreader unsichtbar.

## Was diese Labels NICHT sind

Kein amtliches Symbol der Europäischen Union. Ein solches gibt es nicht: Art. 50
schreibt kein Zeichen vor, sondern eine klare, eindeutige und barrierefreie
Information. Die Praxisleitfäden zur Kennzeichnung nach Art. 50 Abs. 7 werden vom
Büro für Künstliche Intelligenz erst erarbeitet. Die Labels sind also eine
freiwillige Kennzeichnung durch den Betreiber — gut und üblich, aber nicht
vorgeschrieben, und sie dürfen nicht als behördliches Siegel dargestellt werden.

## Wo sie auf dieser Website verwendet werden

- `/ki-kennzeichnung.html` — die Übersichtsseite mit allen zwölf Dateien zum Ansehen und Herunterladen
- `/impressum.html` — unter dem Bildnachweis
- `/website/*/` — auf den KI-erzeugten Bildern der acht Vorlagenseiten
