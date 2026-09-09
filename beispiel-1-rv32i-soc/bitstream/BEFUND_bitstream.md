# BEFUND — Station 08: Flashbarer OSS-Bitstream RV32I für Nexys A7-100T

**Datum:** 2026-09-09 · **Zuarbeit für Roberto Adrian** · rein lokal, kein Web
**Werkzeugkette:** yosys → nextpnr-xilinx → prjxray (openXC7, Container `regymm/openxc7`, colima/Rosetta)
**KEIN Vivado, KEIN AMD-Login.**

Beweis-Ampel je Aussage — hart: SIM/SYNTH/PnR = 🟡, BOARD = 🟢 erst nach Robertos Saleae-Messung.

---

## 1. Ergebnis in einem Satz

Ein realer, nicht-leerer Bitstream `rv32i_nexys.bit` (3.825.911 Bytes) für
`xc7a100tcsg324-1` wurde OSS erzeugt. Der Board-Top instanziiert den
**unveränderten** `rv32i_core` und erzeugt einen echten, an die Kernlogik
gebundenen LED-Zeugen für das Programm-Ergebnis 55 (0x37). **[PnR/SYNTH 🟡]**

Nicht auf Hardware gemessen. Flash + Saleae bleiben Roberto. **[BOARD ⚪ offen]**

---

## 2. LED-Zeugenlogik (welche LED = was)

Das Testprogramm (`programm.hex`) rechnet Summe 1..10 = 55, legt sie in x2/x10,
speichert per `SW` nach `mem[0]` und lädt per `LW` zurück nach x12; danach hält
der Kern in `BEQ x0,x0,0` (Endlosschleife) → Zustand dauerhaft stabil, x2/x10/x12
halten 55.

| LED | Pin | Bedeutung |
|-----|-----|-----------|
| **led[0]** | H17 | **Ergebnis-Zeuge, GELATCHT.** Geht an, sobald der Beobachtungspfad ein Register mit Wert 55 (0x37) sieht, und bleibt an (bis Reset). |
| **led[1]** | K15 | **Heartbeat**, Takt-Teiler `hb[25]` (~1,5 Hz bei 100 MHz) → zeigt, dass der Chip konfiguriert ist und lebt. |

**Beobachtungskanal:** ausschließlich die Debug-Schnittstelle des Kerns
(`dbg_rs → dbg_rd`). Der Kern selbst ist unverändert.

**Wichtige Lehre aus dem ersten Bauversuch (dokumentiert, nicht kosmetisch):**
Ein *konstantes* `dbg_rs` (z.B. fest x12) ist tödlich — yosys extrahiert dann aus
dem Registerfile eine einzelne Speicherstelle und faltet den gesamten Datenpfad
zu einer Konstante weg. Kontrolliert nachgewiesen: erster Build kollabierte auf
**0 Distributed-RAM, nur Heartbeat-Zähler** → led[0] konstant → toter Zeuge.
**Fix:** `dbg_rs` wird von einem frei laufenden 5-bit-**Scan-Zähler** getrieben
(variable Leseadresse). Das hält das komplette Registerfile + Datenpfad erhalten
(identisch zum verifizierten OOC-Syntheselauf) und ist zugleich ein automatischer
Zeuge: der Scan überstreicht in 32 Takten alle Register; sobald eines 55 hält
(x2/x10/x12), latcht led[0]. **[SYNTH 🟡, per stat verifiziert]**

**Reset:** sauberer POR über 8-bit-Sättigungszähler (255 Takte aktiv nach
Konfiguration) plus roter Taster `CPU_RESETN` (aktiv-low, 2-FF synchronisiert).
`rst_core` aktiv-high (Konvention des Kerns).

---

## 3. Positiv-/Negativkontrolle des Zeugen (RTL-Sim des Board-Tops, iverilog 14.0)

| Kontrolle | Programm | led[0] | Urteil |
|-----------|----------|--------|--------|
| **Positiv** | `programm.hex` (Summe=55) | geht bei Takt **298** HIGH, bleibt | Zeuge OK **[SIM 🟡]** |
| **Negativ** | `programm_bad.hex` (add→sub, nie 55) | bleibt **0** | Zeuge bleibt korrekt aus **[SIM 🟡]** |

Der Zeuge ist damit echt UND diskriminierend: er leuchtet nur bei korrektem
Ergebnis. Zusätzlich synthese-seitig belegt: nach `synth_xilinx` bleiben im
Kern **30 FDRE + 16 RAM32M** (pc-Register + Registerfile); das Registerfile
überlebt nur, weil `result_ok` seinen Lesewert beobachtet → led[0] hängt
nachweislich an echter Kernlogik, nicht an einer Konstante. **[SYNTH 🟡]**

---

## 4. Pin-Zuordnung (nexys_a7.xdc, nur genutzte Ports, Digilent-Master-XDC)

| Port | Pin | IOSTANDARD | Funktion |
|------|-----|-----------|----------|
| `clk` | E3 | LVCMOS33 | 100-MHz-Systemtakt, `create_clock -period 10.000` |
| `cpu_resetn` | C12 | LVCMOS33 | roter Reset-Taster, aktiv-low |
| `led[0]` | H17 | LVCMOS33 | Ergebnis-Zeuge (gelatcht) |
| `led[1]` | K15 | LVCMOS33 | Heartbeat |

---

## 5. PnR-Fläche und Fmax (openXC7-Schätzung, board-top)

**[PnR 🟡 — OSS-STA (nextpnr), NICHT Vivado]**

- **Fmax (routed/final):** **242,31 MHz** — PASS at 100 MHz (post-place: 161,60 MHz)
- Ziel-Takt: 100 MHz (10 ns) → deutlich erfüllt, Faktor ~2,4×
- Fläche (nextpnr Device utilisation):
  - SLICE_LUTX: **231** / 126800 (0 %)  ← enthält das Distributed-RAM (Regfile RAM32M, imem/dmem RAM256X1S; async-read ⇒ kein BRAM)
  - SLICE_FFX: **42** / 126800 (0 %)
  - CARRY4: **11** / 15850
  - IOB (in/out): 2 + 2
  - BUFGCTRL: 1 / 32
  - BRAM/DSP: 0 (erwartet — Single-Cycle-Kern liest Speicher kombinatorisch)

Rohdaten: `pnr_utilisation_fmax.log`, `build.log`.

---

## 6. Ehrliche Grenze

- Alles hier ist **OSS/prjxray (openXC7)**, **NICHT Vivado**. Groessenordnung
  Timing/Fläche: belastbar. Patent-genaues Timing-Verdikt: bleibt Vivado (Team 1).
- **Nicht auf Board gemessen.** led[0]/led[1] sind bisher nur simuliert (RTL) und
  synthese-strukturell belegt — **grün (BOARD 🟢) gibt es erst nach Robertos
  Saleae-Messung.**
- Der Flash-Schritt bleibt Roberto: **openFPGALoader NATIV** (nicht im Container),
  z.B. `openFPGALoader -b nexys_a7_100 rv32i_nexys.bit`. Danach led[0] am Board
  ablesen und mit dem Logic-Analyzer (Saleae) die LED-Flanke gegen den Reset
  aufnehmen.

---

## 7. Dateien in diesem Ordner

| Datei | Inhalt |
|-------|--------|
| `rv32i_nexys.bit` | der flashbare Bitstream (3.825.911 B, md5 1a25108371ef67990f3f6e9361b59ad1) |
| `rv32i_nexys_top.v` | Board-Top (Quelle, nur Top-Modul) |
| `rv32i_nexys_top_combined.v` | exakt gebaute Quelle: `define PROG` + Top + Kern (Reproduzierbarkeit) |
| `nexys_a7.xdc` | Constraints (Pins + create_clock) |
| `rv32i_nexys.fasm` | prjxray-FASM (Zwischenstufe) |
| `pnr_utilisation_fmax.log` | nextpnr-Rohlog: Utilisation + Fmax |
| `build.log` | Build-Rohlog der openXC7-Kette |
| `BEFUND_bitstream.md` | dieser Befund |
