---
name: fpga-golden-model
description: >
How to build a GOLDEN MODEL for FPGA development, a deterministic, independent software reference (Python) that the Verilog/bitstream is built from and checked against, tick by tick. Use this skill for "build a golden model", "reference model vs. RTL", "deterministic test vectors", "self-checking testbench", "tick-by-tick compare", "verify an operator before hardware", "is the RTL wrong or the testbench?". Core idea: the golden model is the checkable PREDICTION (software); the board + logic analyzer are the MEASUREMENT (hardware). A passing simulation is never "it works".
license: MIT
---

# fpga-golden-model - Build a golden model for FPGA designs

Creed: A golden model is not code that "also runs" - it is the independent oracle. Software predicts; the board + logic analyzer measure. Done is only what ran on hardware and is measurable. A passing sim is never "it works." Sim != board.

Naming rule: name each golden model golden_BLOCK.py (e.g. golden_crc32.py, golden_fir.py) so it is findable. One consistent scheme for the whole project.

## What a golden model IS (and is not)

- IS: a standalone Python reference for one block that (a) computes the truth from the authoritative source, (b) checks itself, (c) generates deterministic test vectors, (d) compares against the Verilog trace tick by tick.
- - IS NOT: derived from the RTL (then it can't catch the RTL's bugs), random-only instead of edge-case-driven, or a measurement (the board measures, not the script).
 
  - ## Division of labour (non-negotiable)
 
  - - Software side: writes the golden model, vectors, self-checking testbench; runs iverilog/vvp + yosys locally; PREDICTS LUTs/latency/behavior; writes the report.
    - - Hardware side: vendor synthesis, bitstream, flash the board, logic analyzer measures. Only here does the word "hardware-verified" apply.
      - - yosys/iverilog numbers are ESTIMATES until the vendor build log exists. Keep the responsibility boundary clean.
       
        - ## THE 10 PHASES (end to end)
       
        - ### Phase 0 - Anchor the specification and provenance
       
        - Before the first line of code: quote the block's definition from the authoritative source (a standard, a datasheet, a reference implementation) into SPEC_BLOCK_v1.md. Pin the protocol exactly: reset, start/started, valid, latency, parameters (WIDTH/N). Why: the golden model is only as good as its definition. Off-by-one and wrong preconditions come from a fuzzy spec. Provenance is mandatory, otherwise the "truth" is invented.
       
        - ### Phase 1 - Write the golden model (pure software)
       
        - The block as Python with NO Verilog dependency: a scalar kernel (e.g. crc_step) plus an algorithm layer. Add a self_check() against a truth table OR an algebraic invariant (e.g. a permutation must be a pure cycle; a divide must satisfy q*d + r == n). The run MUST give EXIT=0 and "0 errors". Why: pure software catches bug classes that RTL inspection misses. The oracle must be consistent with itself before it may judge hardware.
       
        - ### Phase 2 - Deterministic test vectors (golden to JSON)
       
        - The full truth table plus edge cases (all-0, all-1, 0xAA/0x55, all single-bit patterns, one-bit-per-class, real corner inputs, invalid preconditions) plus seed-driven random cases (fixed SEED, e.g. 0xC0FFEE). One JSON record per case: name, parameters, inputs, expected_output, expected_valid, protocol flags. Why: a fixed seed gives bit-identical runs and debuggable mismatches. Random cases complement, never replace, the deterministic table and edge cases.
       
        - ### Phase 3 - Convert vectors to HW form (JSON to hex / flat bus)
       
        - A Python converter produces readmemh-style hex files (tb/BLOCK_in.hex, _out.hex) or a flat input bus. Width discipline: exactly ONE consistent width per hex set. Mixed widths in a single-width testbench produce false mismatches. Why: the testbench reads hex, not JSON. This is the most common sloppiness point (missing converter or placeholder instead of a real file). Width-mixing is a documented mismatch trap.
       
        - ### Phase 4 - Self-checking Verilog testbench
       
        - The testbench reads the golden vectors, drives the DUT with the full protocol (clk, rst_n, start pulse, valid), compares output and valid field-by-field against expected, writes an ASCII trace per tick (vec_idx, input_hex, output_hex, valid_flag), counts errors, has a timeout watchdog. CRITICAL: the stimulus must be stable BEFORE the active clock edge, set inputs/start on the negative edge or with a delay offset, NOT blocking in the same timestep as the positive edge. A classic false failure is a testbench that shows errors purely from a stimulus-vs-clock race while the RTL is correct. That race is REAL on hardware too (a button press is not edge-synchronous).
       
        - ### Phase 5 - RTL functional simulation (iverilog/vvp)
       
        - Add the oss-cad-suite bin directory to PATH. iverilog with -g2012 gives a clean compile, vvp produces tb_BLOCK.trace (plus optional .vcd for GTKWave). Run inside the block's own directory so the hex-read finds the hex. Timing is ignored here (that belongs to the vendor build). RTL_WRITTEN is not the same as TB_PASS - the run must ACTUALLY happen.
       
        - ### Phase 6 - Tick-by-tick compare (compare_traces.py)
       
        - An orchestrator verification/compare_traces.py: gen mode (seed vectors), then check mode (reads tb_BLOCK.trace, calls the golden model with identical inputs, compares output hex and valid field-by-field per tick), then report. Goal: zero bad ticks. Honest tolerance only when justified: for algorithms with multiple valid answers, a weaker criterion may apply, but any reported factor MUST be a real divisor of n, not 1, not n itself; a hardware iteration cap means a golden-only find is a WARN, never a silent red.
       
        - ### Phase 7 - Synthesis gate (yosys locally, vendor tool for the real build)
       
        - yosys synth_xilinx on the top module, then stat, should show zero problems (latch-free), and count FDRE/LUT/carry to estimate logic cells. Do not confuse generic latch library lines with inferred latches. The vendor synthesis (with the official board master constraints) is the authoritative resource/timing build.
       
        - ### Phase 8 - Report and status honesty
       
        - VALIDATION_BLOCK.md: a PASS/FAIL table (OK-count, first twenty or fewer mismatches), separate status tiers (RTL_COMPILES, TB_PASS, SYNTH_CLEAN, VENDOR_SYNTH open, BOARD_TESTED open). Finding classification: (a) harness/converter artifact, (b) RTL defect, (c) spec gap. A quarantine section for open edges. A golden model that can't tell (a) from (b) lies about the cause.
       
        - ### Phase 9 - Hardware-humility lens and handover
       
        - Before the board, document what the sim hides: async inputs (start/rst_n) need a two-flop synchronizer plus debounce; a logic analyzer must resolve one-clock latency (10 ns at 100 MHz), so sample at 400 MS/s or more, not 100; F_max and combinational depth are estimated, not measured. Write concrete recommendations for the hardware step.
       
        - ## CORE PRINCIPLES (iron)
       
        - 1. Sim is not the board. Golden equals prediction (software); board plus logic analyzer equals measurement (hardware).
          2. 2. Determinism and bit-exactness. Fixed seed gives reproducibility. For math blocks: fixed-point (e.g. Q0.16 integers), shifts instead of multipliers, no float drift.
             3. 3. Independence. Do NOT derive the golden model from the RTL, otherwise it can't catch its bugs.
                4. 4. Completeness-preserving. Edge cases are mandatory, not just random. self_check() must show zero errors before the golden model judges hardware.
                   5. 5. Harness is not RTL. On a red vvp run, first classify the cause (a/b/c). A testbench timing race is NOT an RTL bug, prove it minimally, don't guess.
                      6. 6. Provenance is mandatory. Every definition carries its source. Gaps stay open as OPEN/ESTIMATED.
                         7. 7. Never delete. Even "red" artifacts (hex, traces, quarantine notes) are evidence.
                            8. 8. Tick equivalence with honest tolerance. Default is a field-wise 100% match; weaker criteria only when justified and marked WARN.
                              
                               9. ## ACCEPTANCE CHECKLIST (a golden model is done when)
                              
                               10. - [ ] SPEC_BLOCK_v1.md exists with a source citation, protocol, parameters.
                                   - [ ] - [ ] python3 golden_BLOCK.py gives EXIT=0, self_check zero errors.
                                   - [ ] - [ ] Vectors are deterministic (seed documented), JSON with expected plus edge cases plus random.
                                   - [ ] - [ ] Converter ACTUALLY produces hex/flat bus (no placeholder), width-consistent.
                                   - [ ] - [ ] Testbench self-checking, stimulus edge-stable (negedge or delay offset, no posedge race).
                                   - [ ] - [ ] iverilog -g2012 compiles cleanly.
                                   - [ ] - [ ] vvp ran, tb_BLOCK.trace exists (TB_PASS, not just RTL_WRITTEN).
                                   - [ ] - [ ] compare_traces.py check mode shows zero bad ticks (or documented WARN tolerance).
                                   - [ ] - [ ] yosys shows zero problems, zero latches, resources counted; vendor build marked open.
                                   - [ ] - [ ] Report with separate status tiers plus finding classification (a/b/c).
                                   - [ ] - [ ] Hardware-humility lens written (synchronizer/debounce, logic analyzer 400 MS/s or more, F_max estimated).
                                   - [ ] - [ ] Nothing deleted, open edges quarantined.
                                  
                                   - [ ] ## TOOLS AND PATHS
                                  
                                   - [ ] - Tick compare: verification/compare_traces.py (three-phase gen/check/report, fixed seed, first twenty mismatches).
                                   - [ ] - Block tree: blocks/BLOCK/ with golden/ vectors/ tb/ rtl/ synth/ docs/.
                                   - [ ] - Toolchain: the oss-cad-suite bin directory (iverilog, vvp, yosys) for the open-source flow; the vendor tool (e.g. Vivado) for the authoritative synthesis/timing build.
                                  
                                   - [ ] ## Book foundation (Kilts 2007 / Chu 2008)
                                  
                                   - [ ] Every phase has a citable source, so it is not house opinion. Books correct naive assumptions, those corrections are the real value.
                                  
                                   - [ ] Sources: Steve Kilts, Advanced FPGA Design: Architecture, Implementation, Optimization, Wiley 2007. Pong P. Chu, FPGA Prototyping by Verilog Examples (Spartan-3), Wiley 2008.
                                  
                                   - [ ] ### What the books establish for the golden model
                                  
                                   - [ ] - Self-checking testbench is mandatory. Stimulus generator and monitor are SEPARATE task blocks; the monitor computes the golden expected value independently, compares field-wise, accumulates errors in a counter (Kilts section 11.1; Chu section 7.5).
                                   - [ ] - Determinism over randomness. Vectors come from the mathematical spec, not from the RTL (Kilts section 11.2; Chu section 11.3).
                                   - [ ] - Nonblocking discipline is the compare precondition. Registers use nonblocking assignment, combinational logic uses blocking assignment. Only nonblocking gives the clock-atomic update without which a tick-by-tick compare is not reproducible (Chu section 7.1; Kilts section 11.1).
                                   - [ ] - The algorithm IS the golden logic, with an invariant. Long division and Goldschmidt-style algorithms are their own spec; check against the invariant, not against float (Chu section 6.3.2; Kilts section 8.1.3).
                                   - [ ] - Timing is PREDICTION, not measurement. Real timing verification needs gate-level SDF under worst case conditions plus black-box annotation (Kilts sections 11.4, 14.5, 18.1).
                                  
                                   - [ ] ### Delta - where the books correct the naive assumption (humility before the board)
                                  
                                   - [ ] - Metastability is INVISIBLE in RTL sim. Simulators don't detect it reliably, it lives outside the golden model, belongs on hardware (double-flop, Gray-code FIFO, synchronizers as their own modules) (Kilts section 6.1).
                                   - [ ] - Async reset is NOT "just safe". Async deassertion without setup/hold causes unrepeatable metastability. Hybrid async-assert / sync-deassert is standard (Kilts section 10.1).
                                   - [ ] - Swapping two registers with blocking assignment in the wrong order is NOT a safe swap, only nonblocking fixes it (Chu section 7.1).
                                   - [ ] - ASMD decision-box trap: a register still holds its OLD value INSIDE the box, use the next-state signal, not the registered one, in conditions (Chu section 6.2.5).
                                   - [ ] - An FSM cannot control finer than its clock period; naive half-cycle pulse tricks glitch, use a DCM plus DDR register instead (Chu section 11.5.5).
                                   - [ ] - Implicit description shares NO resources across separate multiply expressions; only explicit isolation plus state routing shares one multiplier (Chu section 6.2.4).
                                   - [ ] - Synthesis without black-box annotation can mis-estimate frequency by roughly 2x (Kilts section 14.5).
                                   - [ ] - Simulation-only display/monitor statements do NOT run in hardware; a real built-in self test needs a HW comparator, not a procedural task (Chu section 7.5).
                                   - [ ] - BRAM synchronous read has 1 clock latency, the golden trace must reproduce it, else pseudo-mismatches appear (Chu sections 12.3-12.4).
                                   - [ ] - Gated clocks never belong on the clock tree, move the gating into the datapath instead (Kilts section 6.3).
                                   - [ ] - Floorplanning is not monotonic, a bad floorplan can make performance WORSE (Kilts section 15.2).
                                   - [ ] - PCB power is the most common non-reproducible fault source (supply sequencing core-before-I/O, decoupling near power pins), a class that sim and golden models NEVER see (Kilts sections 19.1-19.2.3).
                                  
                                   - [ ] Takeaway (book-backed, not just a slogan): the golden model verifies function deterministically (tick by tick, nonblocking, invariant). It does NOT verify metastability, reset deassertion, real timing, or power - those four classes are, chapter by chapter, the job of design and board. Sim is not the board, and that is grounded page by page.
                                   - [ ] 
