// ============================================================================
// rv32i_nexys_top.v  -  Duenner Board-Top fuer Nexys A7-100T (xc7a100tcsg324-1)
// HEPHAISTO5 Schmiede-Neustart, Station 08 (OSS-Bitstream, openXC7).
// Zuarbeit fuer Roberto Adrian. Rein lokal.
//
// Zweck: instanziiert den unveraenderten rv32i_core und erzeugt einen ECHTEN,
//        sichtbaren LED-Zeugen fuer das erwartete Programm-Ergebnis 55 (0x37).
//
//   Das Testprogramm (programm.hex) rechnet Summe 1..10 = 55, legt sie in
//   x2/x10, speichert sie per SW nach mem[0] und laedt sie per LW zurueck nach
//   x12. Danach haelt der Kern in BEQ x0,x0,0 (Endlosschleife) -> Zustand stabil,
//   die Register x2, x10 und x12 halten dauerhaft 55.
//
//   Beobachtungskanal ist ausschliesslich die Debug-Schnittstelle des Kerns
//   (dbg_rs -> dbg_rd), der Kern selbst bleibt UNVERAENDERT.
//
//   WICHTIG (Lehre aus dem ersten Build): dbg_rs darf NICHT auf eine Konstante
//   gelegt werden. Sonst extrahiert yosys aus dem Registerfile eine einzelne
//   Speicherstelle und faltet den gesamten Datenpfad zu einer Konstante weg
//   -> der Zeuge waere tot (LED konstant aus). Wir treiben dbg_rs deshalb mit
//   einem frei laufenden Scan-Zaehler (variable Leseadresse). Das haelt das
//   komplette Registerfile + Datenpfad erhalten (identisch zum verifizierten
//   OOC-Syntheselauf) und ist zugleich ein automatischer Zeuge: der Scan
//   ueberstreicht in 32 Takten alle Register; sobald eines 55 haelt (x2/x10/x12),
//   latcht der Zeuge.
//
//   LED-Zeugenschema:
//     led[0] = RESULT-OK, GELATCHT: geht an, sobald der Scan ein Register mit
//              Wert 55 (0x37) sieht, und bleibt an (bis Reset). Der Zeuge.
//     led[1] = HEARTBEAT: Takt-Teiler (~1.5 Hz bei 100 MHz) -> Chip lebt.
//
//   Reset: sauberer POR (Saettigungszaehler nach Konfiguration) plus roter
//          CPU_RESETN-Taster (aktiv-low, 2-FF synchronisiert). rst_core ist
//          aktiv-high (Konvention des Kerns).
// ============================================================================
`timescale 1ns/1ps

module rv32i_nexys_top (
    input  wire       clk,          // 100 MHz Systemtakt  (Pin E3)
    input  wire       cpu_resetn,   // roter Reset-Taster, aktiv-low (Pin C12)
    output wire [1:0] led,
    output wire [3:0] ja
);
    // ------------------------------------------------------------------
    // Reset-Taster synchronisieren (mechanisch/asynchron -> 2-FF)
    // ------------------------------------------------------------------
    reg [1:0] resetn_sync = 2'b00;
    always @(posedge clk) resetn_sync <= {resetn_sync[0], cpu_resetn};
    wire resetn_clean = resetn_sync[1];

    // ------------------------------------------------------------------
    // Power-On-Reset: haelt rst_core aktiv, bis der Zaehler saettigt.
    // FF-Init per initial (yosys/openXC7 setzt INIT auf Xilinx-Flops).
    // ------------------------------------------------------------------
    reg [7:0] por_cnt = 8'd0;
    wire      por_done = &por_cnt;      // alle Bits 1 -> POR fertig
    always @(posedge clk)
        if (!por_done) por_cnt <= por_cnt + 8'd1;

    wire rst_core = (~por_done) | (~resetn_clean);   // aktiv-high

    // ------------------------------------------------------------------
    // Scan-Zaehler ueber die Registeradressen (variable Leseadresse!).
    // Laeuft immer, wenn der Kern nicht im Reset ist. Haelt Datenpfad erhalten.
    // ------------------------------------------------------------------
    reg [4:0] scan = 5'd0;
    always @(posedge clk)
        if (rst_core) scan <= 5'd0;
        else          scan <= scan + 5'd1;

    // ------------------------------------------------------------------
    // RV32I-Kern (unveraendert). Debug-Port liest das per scan gewaehlte Reg.
    // ------------------------------------------------------------------
    wire [31:0] dbg_val;
    wire [31:0] dbg_pc_unused;

    rv32i_core core (
        .clk    (clk),
        .rst    (rst_core),
        .dbg_rs (scan),           // variable Adresse -> Regfile bleibt erhalten
        .dbg_rd (dbg_val),
        .dbg_pc (dbg_pc_unused)
    );

    // ------------------------------------------------------------------
    // Zeuge: latcht, sobald der Scan ein Register mit Wert 55 (0x37) sieht.
    // Nach dem Halt halten x2/x10/x12 dauerhaft 55 -> Scan trifft sicher.
    // ------------------------------------------------------------------
    reg result_ok = 1'b0;
    always @(posedge clk) begin
        if (rst_core)
            result_ok <= 1'b0;
        else if (dbg_val == 32'd55)
            result_ok <= 1'b1;    // latch: bleibt an
    end

    // ------------------------------------------------------------------
    // Heartbeat: sichtbares Lebenszeichen (~1.5 Hz bei 100 MHz)
    // ------------------------------------------------------------------
    reg [25:0] hb = 26'd0;
    always @(posedge clk) hb <= hb + 26'd1;

    assign led[0] = result_ok;
    assign led[1] = hb[25];

    // Saleae-Zeugen auf Pmod JA (nur Spiegel, keine Logikaenderung)
    assign ja[0] = result_ok;      // JA1 C17: gelatchter Ergebnis-Zeuge (55)
    assign ja[1] = hb[25];         // JA2 D18: Heartbeat ~1,5 Hz
    assign ja[2] = hb[19];         // JA3 E18: schneller Takt-Zeuge ~95 Hz
    assign ja[3] = rst_core;       // JA4 G17: Reset-Fenster

endmodule
