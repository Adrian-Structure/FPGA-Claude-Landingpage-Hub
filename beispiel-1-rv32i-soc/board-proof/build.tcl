read_verilog rv32i_core.v
read_verilog rv32i_nexys_top.v
read_xdc nexys_a7.xdc
synth_design -top rv32i_nexys_top -part xc7a100tcsg324-1
opt_design
place_design
route_design
report_utilization -file util.rpt
report_timing_summary -file timing.rpt
write_bitstream -force rv32i_ja.bit
puts "BUILD-OK"
