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

## Was diese Icons sind

Die von der **Europäischen Kommission** bereitgestellten EU-Icons zur Kennzeichnung
KI-erzeugter Inhalte. Ihre Verwendung ist **freiwillig** — die Kennzeichnungspflicht
nach Art. 50 der Verordnung (EU) 2024/1689 ist es **nicht**. Das Icon ersetzt also
keine Pflicht, es erfüllt sie sichtbar.

Die Kommission stellt sie jedem frei zur Verfügung; eine Namensnennung der Kommission
oder des Büros für Künstliche Intelligenz ist nicht erforderlich.

Vorgaben der Kommission zur Darstellung:

- spätestens bei der ersten Wahrnehmung klar erkennbar und unterscheidbar
- an einer Stelle ohne überlagernde Elemente
- unmittelbar in den Inhalt eingebettet (Ausnahme: Werke der Kunst)
- auch nach Weitergabe oder Herunterladen noch sichtbar
- in klar sichtbarer Größe
- barrierefrei: Alternativtext beziehungsweise ARIA-Beschriftung, verständliche
  Sprache, ausreichende Sichtbarkeitsdauer

Wer den Verhaltenskodex zur Kennzeichnung KI-erzeugter Inhalte unterzeichnet hat, muss
die dortigen Platzierungsvorgaben einhalten. Wer ihn nicht unterzeichnet hat, darf durch
die Verwendung der Icons nicht den Eindruck erwecken, er halte sich daran.

Die Kennzeichnungspflicht für täuschend echte Darstellungen betrifft lebensechte
Abbildungen von Menschen; stilisierte Illustrationen fallen nicht darunter.

## Wo sie auf dieser Website verwendet werden

- `/ki-kennzeichnung.html` — die Übersichtsseite mit allen zwölf Dateien zum Ansehen und Herunterladen
- `/impressum.html` — unter dem Bildnachweis
- `/website/*/` — auf den KI-erzeugten Bildern der acht Vorlagenseiten
