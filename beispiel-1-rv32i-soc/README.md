# Beispiel 1 — RISC-V RV32I SoC (board-lose OSS-Kette auf dem Mac)

Ein kompakter **RV32I**-Kern, von der Simulation bis zum flashbaren Bitstream —
komplett **ohne Board** und **ohne Vivado** auf einem Apple-Silicon-Mac mit
Open-Source-Werkzeugen (`iverilog`, `yosys`, `nextpnr-xilinx`/openXC7).
Zielboard: Digilent **Nexys A7-100T** (Xilinx Artix-7, `xc7a100tcsg324-1`).

Das ist der Neustart-Test der FPGA-Kette an einem echten Kern. Reiner
RV32I-Lernprozessor, kein Patentinhalt.

## Was der Kern tut
Führt ein kleines Programm aus (**Summe 1..10 = 55**) über eine echte `BNE`-Schleife
und übt `ADD/ADDI/SUB`, `AND/OR/XOR`, `SLLI`, `LUI`, `LW/SW`, `BNE`, `JAL`.

## Stationen der Kette — board-los erreicht (ehrliche Beweis-Ampel)

| Station | Ergebnis | Ampel |
|---|---|---|
| 03/05 Testbench + RTL-Simulation | iverilog **ALL-PASS 12/12**, Negativkontrolle (`programm_bad.hex`) → **FAIL** | 🟡 SIM |
| 06 Synthese (yosys `synth_xilinx`) | 428 LUT (Schätzung) | 🟡 SYNTH |
| 07 Place & Route (openXC7 / nextpnr-xilinx) | Fmax-Schätzung **211–242 MHz**, PASS bei Ziel 100 MHz | 🟡 OSS-STA, **nicht** Vivado |
| 08 Bitstream (openXC7 / prjxray) | `rv32i_nexys.bit`, 3,8 MB, Sync-Wort `AA995566`, `xc7a100t` | 🟡 OSS/prjxray |
| 09 Flash / 10 Saleae | **geflasht + Logikanalysator gemessen (12.09.2026, Team 1 Linux)** — Ergebniszeuge JA1 latcht auf 55, schneller Zeuge JA3 95,338 Hz vs. 95,367 (−0,03 %) | 🟢 **BOARD** |

## Board-I/O (LED-Zeuge)
- `led[0]` (H17) = **Ergebnis-Zeuge**, gelatcht — geht an, sobald ein Register 55/`0x37` hält
- `led[1]` (K15) = Heartbeat (~1,5 Hz)
- `clk` (E3) = 100-MHz-Systemtakt · `cpu_resetn` (C12)

## Flashen (am Brett)
```
openFPGALoader -b nexys_a7_100 bitstream/rv32i_nexys.bit
```

## Board-Beweis (12.09.2026) 🟢

Der auf dem Mac mit reiner OSS-Kette erzeugte Bitstream wurde am Linux-Brett (Team 1) geflasht und mit dem
Logikanalysator gemessen. Beleg und Rohdaten in `board-proof/` (`00_ABNAHME_RV32I_BOARD_2026-09-12.md`,
`capture/digital.csv`, Still `rv32i_board_still.jpg`).

- **JA1 (Ergebniszeuge, gelatcht):** genau eine 0→1-Flanke ~+23 µs nach Konfiguration, danach durchgehend HIGH
  über 2.797 Punkte — der Kern rechnet 55 auf Silizium, der Zeuge hält.
- **JA3 (hb[19], schneller Zeuge):** 95,338 Hz gemessen gegen 95,367 Hz rechnerisch = −0,03 % → Takt und Zeitachse bestätigt.
- Das Board-Top wurde nur um vier Pmod-JA-Spiegelausgänge erweitert (reine Zuweisungen, `rv32i_core` unverändert):
  `board-proof/rv32i_nexys_top_pmod-JA.v`.

**Nicht gemessen, nicht behauptet:** Fmax am Brett (die 211–242 MHz bleiben openXC7-Schätzung, kein Vivado-Timing),
Verhalten über Temperatur/Spannung, Korrektheit für andere Programme als `programm.hex`.

## Ehrliche Grenze
Alle Timing-/Flächenzahlen sind **OSS-Schätzungen** (openXC7/nextpnr), **nicht** das
Vivado-post-route-Verdikt. Nichts ist auf Hardware gemessen; **grün (BOARD)** erst nach
einer Saleae-Messung am Brett.

## Herkunft
Erzeugt am 09.09.2026 von Claude Opus 4.8 mit Opus-4.8- und Sonnet-Zuarbeiter-Subagenten,
rein lokal.
