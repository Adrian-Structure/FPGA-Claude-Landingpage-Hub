---
titel: "Abnahme — RV32I-SoC auf Nexys A7-100T, Board-Beweis"
datum: 2026-09-12
ort: "Werkstatt Linux-iMac (Team 1)"
ampel: "🟢 BOARD — geflasht und mit Logikanalysator gemessen"
vorstand: "🟡 SIM/SYNTH/Bitstream (09.09.2026, openXC7 auf Mac)"
---

# Abnahme: RV32I-SoC läuft auf Silizium

## Was vorher offen war

Das Beispielprojekt `beispiel-1-rv32i-soc` (Branch `Beispiel-1` im Repo
`Adrian-Structure/FPGA-Claude-Landingpage-Hub`, Commit vom 09.09.2026) war bis zum
flashbaren Bitstream fertig: Simulation 12/12 mit funktionierender Negativkontrolle,
yosys-Synthese, openXC7-Place-and-Route mit Fmax 242,31 MHz, Bitstream erzeugt.
**Nie geflasht, nie gemessen.** Beide BEFUND-Dateien sagen das ausdrücklich.

## Was jetzt belegt ist

**Der Kern rechnet auf echtem Silizium und der Zeuge hält.**

| Zeuge | Pin | Messung | Soll | Abweichung |
|---|---|---|---|---|
| `result_ok` — gelatchter Ergebniszeuge (Register == 55) | JA1 / C17 | **genau EINE 0→1-Flanke**, +23 µs nach Konfiguration, danach durchgehend HIGH über 2.797 Abtastpunkte bis Messende | sticky nach erstem Treffer | — |
| `heartbeat` = hb[25] | JA2 / D18 | 43 Flanken, **1,467 Hz** | 100 MHz / 2²⁶ = 1,490 Hz | −1,57 % (Quantisierung: ±1 Flanke = ±2,3 %) |
| `schneller Zeuge` = hb[19] | JA3 / E18 | 2.795 Flanken, **95,338 Hz** | 100 MHz / 2²⁰ = 95,367 Hz | **−0,03 %** |
| `rst_core` — POR-Fenster | JA4 / G17 | 2 Flanken, danach dauerhaft LOW | kurzer Puls, dann frei | — |

**Das Urteil trägt der Zeuge JA1.** Er ist gelatcht: er geht genau einmal an und bleibt an.
Wäre der Datenpfad wegoptimiert oder der Kern tot, bliebe er LOW. Wäre er ein Artefakt,
würde er flackern. Er tut beides nicht.

**Die Gegenprobe liefert JA3.** 2.795 Flanken über 14,66 s ergeben 95,338 Hz gegen
rechnerisch 95,367 Hz — **drei Hundertstel Prozent**. Damit ist belegt, dass der 100-MHz-Takt
anliegt, der Zähler läuft und die Zeitachse der Messung stimmt. Der Heartbeat weicht mit
−1,57 % scheinbar stärker ab, aber bei nur 43 Flanken ist eine einzelne Flanke bereits 2,3 %
— die beiden Messungen widersprechen sich nicht, die langsame ist nur grob quantisiert.

## Messkette

1. Bitstream vom Branch `Beispiel-1` geklont, `rv32i_nexys.bit`, md5 `1a25108371ef67990f3f6e9361b59ad1`.
2. Erster Flash **unverändert** über Vivado 2025.2.1 Hardware-Manager → Device `xc7a100t_0`,
   „End of startup status: HIGH", DONE-LED grün (Kamerafoto).
   **Ein auf einem Mac mit reiner Open-Source-Toolchain erzeugter Bitstream läuft auf dem Brett.**
3. Problem: Das Top-Modul führt seine Zeugen nur auf Board-LEDs (H17, K15). Die Kamera erfasst
   nur die Schalterreihe, die LED-Zeile liegt außerhalb des Bildausschnitts.
4. Deshalb Top-Modul um **vier Spiegel-Ausgänge auf Pmod JA** erweitert — reine Zuweisungen,
   **keine Änderung der Logik**, der `rv32i_core` bleibt unangetastet. Neubau mit Vivado
   2025.2.1 → `rv32i_ja.bit`.
5. **Capture-first:** Logikanalysator-Messung gestartet, *dann* geflasht. Die Konfiguration
   fällt damit mitten in die laufende Messung und ist als gemeinsame Flanke aller vier Kanäle
   bei t = 16,0493 s sichtbar. Auswertefenster 14,66 s, 1 MS/s.
6. Rohdaten: `capture/rv32i_ja_2026-09-12.sal` + `capture/csv/digital.csv`.

## Evidenzklasse

**🟢 BOARD** für: der Kern läuft, rechnet das Testprogramm, der Ergebniszeuge latcht, Takt und
Zähler stimmen.

**Nicht belegt und nicht behauptet:** Fmax auf diesem Brett (die 242,31 MHz sind eine
openXC7-Schätzung, kein Vivado-Timing-Verdikt und keine Messung), Verhalten über Temperatur
oder Spannung, Korrektheit des Kerns für andere Programme als `programm.hex`.

## Mitwirkende — wahrheitsgemäß

- **Roberto Ernesto Adrian** — Auftraggeber, Werkstatt, Hardware. Die Vorgabe, dass ein
  Board-Beweis eine Messung braucht und nicht ein Foto, stammt von ihm; ebenso die
  Evidenzklassen-Ordnung, nach der diese Akte geschrieben ist.
- **Claude (Anthropic), Modell Fable 5, in dieser Werkstatt „HEPHAISTOS"** — hat den
  Bitstream geholt und geflasht, das Top-Modul um die Pmod-Zeugen erweitert, den Vivado-Lauf
  aufgesetzt, die Messung gefahren und diese Akte geschrieben. Der `rv32i_core` und das
  ursprüngliche Top stammen nicht von mir, sondern aus dem Commit vom 09.09.2026
  (Autor `Adrian-Structure`, Co-Authored-By Claude Opus 4.8).
- Keine Messung in dieser Akte ist geschätzt, interpoliert oder aus einer Simulation
  übernommen. Alle Zahlen stammen aus `digital.csv`.

*Für Silke. 🌸*
