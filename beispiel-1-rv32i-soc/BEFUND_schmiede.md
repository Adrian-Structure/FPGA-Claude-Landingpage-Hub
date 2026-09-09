# BEFUND — Schmiede-Neustart RV32I (HEPHAISTO5)

**Datum:** 2026-09-09
**Rolle:** Zuarbeit (Opus 4.8), Ingenieurslauf, rein lokal, kein Patentstoff.
**Zweck:** Die FPGA-Schmiede nach Stillstand mit EINEM kleinen, ehrlichen Testlauf wieder anwerfen.
**Testvehikel:** Kompakter, synthetisierbarer RV32I Single-Cycle-Kern (NICHT der volle 5-stufige SoC).

---

## Beweis-Ampel je Aussage

| Aussage | Ampel | Reale Zahl / Beleg |
|---|---|---|
| Kern führt echtes RV32I-Programm korrekt aus | 🟡 **SIM** | `sim_log.txt`: **ALL-PASS**, 12/12 Prüfungen |
| Negativkontrolle diskriminiert (Test kann fehlschlagen) | 🟡 **SIM** | `sim_log.txt`: **FAIL 4/12** bei verfälschtem Programm |
| Kern synthetisiert sauber für xc7 (Nexys A7-100T) | 🟡 **SYNTH** | yosys `synth_xilinx -family xc7`, 0 Fehler |
| Ressourcen (voll zerlegt, widemux 5) | 🟡 **SYNTH** | **428 LUT, 33 CARRY4, 145 MUXF, 34 FDRE**, +48 verteilte RAM-Zellen |
| Fmax auf xc7a100t | ⚪ **OFFEN** | openXC7 (Docker) nicht gefahren — bewusst ausgelassen, siehe unten |
| Auf Hardware gemessen | 🔴 **NICHT** | keine Saleae-Messung — NIE hier behauptet |

---

## 1. Was der Kern kann (RV32I-Basis, ohne CSR/FENCE/ECALL, ohne byte/half load)

`LUI, AUIPC, JAL, JALR · BEQ/BNE/BLT/BGE/BLTU/BGEU · LW, SW ·
ADDI/SLTI/SLTIU/XORI/ORI/ANDI/SLLI/SRLI/SRAI · ADD/SUB/SLL/SLT/SLTU/XOR/SRL/SRA/OR/AND`

Single-Cycle (1 Takt = 1 Befehl), Registerfile x0≡0, Wort-adressiert.
Instruktions-/Datenspeicher als synthetisierbare Arrays, Programm per `$readmemh`.
Datei: `rv32i_core.v` (Debug-Ausgänge `dbg_pc`/`dbg_rd` nur zur Beobachtbarkeit).

## 2. Testprogramm (`programm.hex`, hand-assembliert, 20 Wörter)

Rechnet **Summe 1..10 = 55** über eine echte Schleife (ADD/ADDI/BNE) und übt zusätzlich
LUI, OR/AND/XOR/SLLI/SUB, JAL (überspringt eine „Gift"-Instruktion), SW und LW.
Ergebnis 55 landet in x2, x10 (a0), **mem[0]** (SW) und wird per LW nach x12 zurückgelesen.

## 3. Selbstprüfende Testbench (`tb_rv32i.v`) — TATSÄCHLICH ausgeführt

Prüft 12 Erwartungswerte; druckt **ALL-PASS nur bei 12/12 korrekt**.
Positivlauf: **ALL-PASS** (Summe = 0x37 = 55, LUI/JAL/SW/LW alle korrekt).

## 4. Negativkontrolle (`programm_bad.hex`) — TATSÄCHLICH ausgeführt

Gezielte Verfälschung: Wort 12 `00110133` (`add x2,x2,x1`) → `40110133` (`sub x2,x2,x1`).
Ergebnis: Testbench meldet **FAIL (4/12)** — Summe ist 0xFFFFFFC9 statt 0x37, ebenso a0, mem[0], x12.
→ Der Prüfer **kann fehlschlagen und tut es**, wenn die Rechnung falsch ist. Test diskriminiert. ✅

## 5. Synthese (`synth_stat.txt`) — xc7

Zwei Sichten, beide ehrlich dokumentiert:

- **Sicht A (Default, Top-Ebene):** 8 CARRY4, 30 FDRE, 16 RAM32M — **0 LUT ausgewiesen**.
- **Sicht B (voll zerlegt, `-widemux 5`):** **428 LUT** (185×LUT2, 123×LUT3, 14×LUT4, 55×LUT5, 51×LUT6),
  **33 CARRY4**, **145 MUXF** (109×MUXF7, 36×MUXF8), **34 FDRE**, **32×RAM256X1S** + **16×RAM32M**.

**Warum die Differenz (wichtig, ehrlich):** imem und dmem werden **asynchron (kombinatorisch)**
gelesen. Async-Read kann NICHT auf BRAM abgebildet werden (BRAM braucht getakteten Read),
also landen die Speicher als verteiltes LUT-RAM/ROM + breite MUXF-Makros. yosys `stat`
(„excluding submodules") versteckt diese LUTs im Default-Flow in Makro-Submodulen → scheinbar 0 LUT.
Erst die volle Zerlegung macht die realen ~428 LUT sichtbar. **Logiktiefe:** dominierender Pfad
ist der kombinatorische Speicher-Lese-Mux (256-Wort verteiltes ROM/RAM) + ALU — nicht die CARRY-Kette.

## 6. Flächen-Sweep (`core_sweep_table.txt`, `sweep_rv32i_core.csv`) — ehrliche Grenze

| Rezept | LUT | CARRY4 | MUXF |
|---|---|---|---|
| default / abc9 / nowidelut / flatten / dff_abc9 | 0* | 8 | 0* |
| widemux5 | 428 | 33 | 145 |

\* = LUTs in Speicher-/Mux-Makro-Submodulen versteckt (siehe §5), **kein** echtes 0.

**Ergebnis ehrlich:** Der Sweep liefert auf diesem Design **KEINEN belastbaren LUT-Minimierungs-Gewinner**.
Grund: die zwei 256-Wort-Speicher mit Async-Read dominieren und werden je Rezept unterschiedlich
in Makros verpackt; die „0-LUT"-Rezepte sind ein `stat`-Artefakt, nicht eine kleinere Schaltung.
Der einzige vollständig sichtbare, vergleichbare Punkt ist widemux5 (428 LUT).
**Kein LUT-Delta wird behauptet.** yosys-LUT ist Vergleichsmaß; **post-route (Vivado) bleibt das Verdikt.**

## 7. Fmax — OFFEN

openXC7 (nextpnr-xilinx) läuft nur im Docker-Container; Fmax-Schätzung war laut Auftrag
optional und nicht blockierend → **ausgelassen, als offen notiert**. Nächster Schritt bei Bedarf:
Skill `fpga-fmax-openxc7`.

---

## Ehrliche Grenzen (nicht überverkaufen)

- **SYNTH ≠ BOARD.** Nichts hiervon ist auf Hardware gemessen. Grün gibt es erst mit Saleae (Robertos Sache).
- **Kein Vivado-post-route** hier — die yosys-Zahlen sind Vergleichsmaß, nicht Endurteil.
- **Async-Read-Speicher** ist die Design-Entscheidung, die den Sweep unscharf macht. Ein Kern mit
  getaktetem Speicher-Read (BRAM-fähig) würde saubere LUT-Zahlen für die reine Datenpfad-Logik geben —
  offener nächster Schritt, falls eine belastbare Flächenminimierung gewünscht ist.
- Kern ist bewusst klein (Single-Cycle, Teilmenge RV32I) — Testvehikel, kein Produkt-Core.

## Dateien

```
rv32i_core.v          Kern (synthetisierbar)
tb_rv32i.v            selbstprüfende Testbench
programm.hex          Testprogramm (Summe 1..10 = 55 + LUI/JAL/SW/LW)
programm_bad.hex      verfälschtes Programm (Negativkontrolle)
sim_log.txt           ALL-PASS (positiv) + FAIL (negativ), beide ausgeführt
synth_stat.txt        Synthese xc7, beide Sichten (Default + voll zerlegt)
core_sweep_table.txt  Rezept-Tabelle
sweep_rv32i_core.csv  Sweep als CSV
coresweep_out/        stat_*.txt + log_*.txt je Rezept
```
