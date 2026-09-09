// ============================================================================
// tb_rv32i.v  -  Selbstpruefende Testbench fuer rv32i_core
// Faehrt das Programm, prueft 12 Erwartungswerte, druckt ALL-PASS nur bei
// vollstaendiger Korrektheit, sonst FAIL mit Ist/Soll pro Pruefung.
// ============================================================================
`timescale 1ns/1ps

module tb_rv32i;
    reg clk = 0;
    reg rst = 1;

    rv32i_core dut (.clk(clk), .rst(rst));

    always #5 clk = ~clk;   // 100 MHz Sim-Takt

    integer errors = 0;

    task check32;
        input [255:0] name;
        input [31:0]  got;
        input [31:0]  exp;
        begin
            if (got === exp)
                $display("  PASS  %0s  = 0x%08h", name, got);
            else begin
                $display("  FAIL  %0s  ist=0x%08h  soll=0x%08h", name, got, exp);
                errors = errors + 1;
            end
        end
    endtask

    initial begin
        // Reset 2 Takte, dann laufen lassen
        rst = 1;
        @(posedge clk);
        @(posedge clk);
        rst = 0;

        // Programm hat < 20 aktive Befehle inkl. Schleife 1..10 (~40 Takte).
        // Grosszuegig 300 Takte laufen lassen, dann Endzustand pruefen.
        repeat (300) @(posedge clk);

        $display("==== RV32I Selbstpruefung ====");
        check32("x5  LUI  0x12345000", dut.regs[5],  32'h12345000);
        check32("x30 OR   0xF0|0x0F ", dut.regs[30], 32'h000000FF);
        check32("x31 AND  0xF0&0x0F ", dut.regs[31], 32'h00000000);
        check32("x27 XOR  0xF0^0x0F ", dut.regs[27], 32'h000000FF);
        check32("x26 SLLI 0x0F<<4   ", dut.regs[26], 32'h000000F0);
        check32("x25 SUB  0xF0-0x0F ", dut.regs[25], 32'h000000E1);
        check32("x2  SUMME 1..10    ", dut.regs[2],  32'd55);
        check32("x10 a0 = Summe     ", dut.regs[10], 32'd55);
        check32("x6  JAL-Skip (0)   ", dut.regs[6],  32'h00000000);
        check32("x7  JAL-Link 0x40  ", dut.regs[7],  32'h00000040);
        check32("mem[0] SW  = 55    ", dut.dmem[0],  32'd55);
        check32("x12 LW mem[0]      ", dut.regs[12], 32'd55);

        $display("==============================");
        if (errors == 0)
            $display("ALL-PASS");
        else
            $display("FAIL  (%0d von 12 Pruefungen fehlgeschlagen)", errors);
        $display("==============================");
        $finish;
    end
endmodule
