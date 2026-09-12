open_hw_manager
connect_hw_server -allow_non_jtag
open_hw_target
set dev [lindex [get_hw_devices] 0]
puts "DEVICE: $dev"
current_hw_device $dev
refresh_hw_device -update_hw_probes false $dev
set_property PROGRAM.FILE {/home/radrian/work/rv32i_board/rv32i_ja.bit} $dev
program_hw_devices $dev
puts "FLASH-OK"
close_hw_manager
