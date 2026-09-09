# ============================================================================
# nexys_a7.xdc  -  Constraints Nexys A7-100T (xc7a100tcsg324-1)
# Board-Top: rv32i_nexys_top.  Nur die WIRKLICH genutzten Ports.
# Pin-Namen aus dem Digilent Nexys-A7-100T Master-XDC.
# ============================================================================

# --- 100 MHz Systemtakt (Pin E3) -------------------------------------------
set_property -dict { PACKAGE_PIN E3  IOSTANDARD LVCMOS33 } [get_ports { clk }]
create_clock -period 10.000 -name sys_clk_100 [get_ports { clk }]

# --- Roter Reset-Taster CPU_RESETN (Pin C12, aktiv-low) --------------------
set_property -dict { PACKAGE_PIN C12 IOSTANDARD LVCMOS33 } [get_ports { cpu_resetn }]

# --- LEDs ------------------------------------------------------------------
# led[0] = Ergebnis-Zeuge (gelatcht: an == x12/mem[0] == 55 gesehen)
# led[1] = Heartbeat (~1.5 Hz)
set_property -dict { PACKAGE_PIN H17 IOSTANDARD LVCMOS33 } [get_ports { led[0] }]
set_property -dict { PACKAGE_PIN K15 IOSTANDARD LVCMOS33 } [get_ports { led[1] }]
