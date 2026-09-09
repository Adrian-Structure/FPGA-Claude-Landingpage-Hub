// ============================================================================
// rv32i_core.v  -  Kompakter, synthetisierbarer RV32I Single-Cycle Kern
// HEPHAISTO5 Schmiede-Neustart, Testvehikel (kein voller SoC).
// Zuarbeit fuer Roberto Adrian. Rein lokal.
//
// Umfang (RV32I Basis, ohne CSR/FENCE/ECALL, ohne byte/half load-store):
//   LUI, AUIPC, JAL, JALR
//   BEQ, BNE, BLT, BGE, BLTU, BGEU
//   LW, SW
//   ADDI, SLTI, SLTIU, XORI, ORI, ANDI, SLLI, SRLI, SRAI
//   ADD, SUB, SLL, SLT, SLTU, XOR, SRL, SRA, OR, AND
//
// Ein Takt = ein Befehl. Registerfile x0 fest 0. Wort-adressiert intern.
// Instruktions- und Datenspeicher als synthetisierbare Arrays (BRAM/LUT-RAM).
// Programm wird per $readmemh geladen (Datei via `PROG ueberschreibbar).
// ============================================================================
`ifndef PROG
  `define PROG "programm.hex"
`endif

module rv32i_core #(
    parameter IMEM_WORDS = 256,
    parameter DMEM_WORDS = 256
)(
    input  wire        clk,
    input  wire        rst,       // synchron, aktiv high
    // Debug-/Beobachtungs-Schnittstelle (haelt Datenpfad bei Synthese sichtbar;
    // Simulation greift ohnehin hierarchisch auf regs/dmem zu).
    input  wire [4:0]  dbg_rs,    // Registeradresse zum Auslesen
    output wire [31:0] dbg_rd,    // gelesener Registerwert
    output wire [31:0] dbg_pc     // aktueller Programmzaehler
);
    // ------------------------------------------------------------------
    // Speicher
    // ------------------------------------------------------------------
    reg [31:0] imem [0:IMEM_WORDS-1];
    reg [31:0] dmem [0:DMEM_WORDS-1];
    reg [31:0] regs [0:31];

    integer i;
    initial begin
        for (i = 0; i < IMEM_WORDS; i = i + 1) imem[i] = 32'h0000_0013; // NOP (addi x0,x0,0)
        for (i = 0; i < DMEM_WORDS; i = i + 1) dmem[i] = 32'h0000_0000;
        for (i = 0; i < 32;         i = i + 1) regs[i] = 32'h0000_0000;
        $readmemh(`PROG, imem);
    end

    // ------------------------------------------------------------------
    // Programmzaehler + Fetch (kombinatorisch aus imem)
    // ------------------------------------------------------------------
    reg  [31:0] pc;
    wire [31:0] instr = imem[pc[31:2]];   // wort-adressiert

    // ------------------------------------------------------------------
    // Dekodierung
    // ------------------------------------------------------------------
    wire [6:0]  opcode = instr[6:0];
    wire [4:0]  rd     = instr[11:7];
    wire [2:0]  funct3 = instr[14:12];
    wire [4:0]  rs1    = instr[19:15];
    wire [4:0]  rs2    = instr[24:20];
    wire [6:0]  funct7 = instr[31:25];

    // Immediates
    wire [31:0] imm_i = {{20{instr[31]}}, instr[31:20]};
    wire [31:0] imm_s = {{20{instr[31]}}, instr[31:25], instr[11:7]};
    wire [31:0] imm_b = {{19{instr[31]}}, instr[31], instr[7], instr[30:25], instr[11:8], 1'b0};
    wire [31:0] imm_u = {instr[31:12], 12'b0};
    wire [31:0] imm_j = {{11{instr[31]}}, instr[31], instr[19:12], instr[20], instr[30:21], 1'b0};

    // Register lesen (x0 -> 0)
    wire [31:0] rv1 = (rs1 == 5'd0) ? 32'b0 : regs[rs1];
    wire [31:0] rv2 = (rs2 == 5'd0) ? 32'b0 : regs[rs2];

    // Opcode-Konstanten
    localparam OP_LUI    = 7'b0110111;
    localparam OP_AUIPC  = 7'b0010111;
    localparam OP_JAL    = 7'b1101111;
    localparam OP_JALR   = 7'b1100111;
    localparam OP_BRANCH = 7'b1100011;
    localparam OP_LOAD   = 7'b0000011;
    localparam OP_STORE  = 7'b0100011;
    localparam OP_IMM    = 7'b0010011;
    localparam OP_REG    = 7'b0110011;

    // ------------------------------------------------------------------
    // ALU
    // ------------------------------------------------------------------
    wire        alu_use_imm = (opcode == OP_IMM);
    wire [31:0] alu_b       = alu_use_imm ? imm_i : rv2;
    wire [4:0]  shamt       = alu_use_imm ? instr[24:20] : rv2[4:0];
    // SUB nur bei R-Typ ADD/SUB mit funct7[5]; bei I-Typ nie SUB.
    wire        alt_op      = funct7[5] & (opcode == OP_REG);

    reg [31:0] alu_y;
    always @* begin
        case (funct3)
            3'b000: alu_y = alt_op ? (rv1 - alu_b) : (rv1 + alu_b);          // ADD/SUB/ADDI
            3'b001: alu_y = rv1 << shamt;                                     // SLL/SLLI
            3'b010: alu_y = ($signed(rv1) < $signed(alu_b)) ? 32'd1 : 32'd0;  // SLT/SLTI
            3'b011: alu_y = (rv1 < alu_b) ? 32'd1 : 32'd0;                    // SLTU/SLTIU
            3'b100: alu_y = rv1 ^ alu_b;                                      // XOR/XORI
            3'b101: alu_y = alt_op ? ($signed(rv1) >>> shamt)                 // SRA/SRAI
                                   : (rv1 >> shamt);                          // SRL/SRLI
            3'b110: alu_y = rv1 | alu_b;                                      // OR/ORI
            3'b111: alu_y = rv1 & alu_b;                                      // AND/ANDI
            default: alu_y = 32'b0;
        endcase
    end

    // ------------------------------------------------------------------
    // Branch-Bedingung
    // ------------------------------------------------------------------
    reg branch_taken;
    always @* begin
        case (funct3)
            3'b000:  branch_taken = (rv1 == rv2);                    // BEQ
            3'b001:  branch_taken = (rv1 != rv2);                    // BNE
            3'b100:  branch_taken = ($signed(rv1) <  $signed(rv2));  // BLT
            3'b101:  branch_taken = ($signed(rv1) >= $signed(rv2));  // BGE
            3'b110:  branch_taken = (rv1 <  rv2);                    // BLTU
            3'b111:  branch_taken = (rv1 >= rv2);                    // BGEU
            default: branch_taken = 1'b0;
        endcase
    end

    // ------------------------------------------------------------------
    // Datenspeicher-Adresse
    // ------------------------------------------------------------------
    wire [31:0] mem_addr  = rv1 + (opcode == OP_STORE ? imm_s : imm_i);
    wire [31:0] load_data = dmem[mem_addr[31:2]];

    // ------------------------------------------------------------------
    // Naechster PC
    // ------------------------------------------------------------------
    wire [31:0] pc4    = pc + 32'd4;
    reg  [31:0] pc_next;
    always @* begin
        case (opcode)
            OP_JAL:    pc_next = pc + imm_j;
            OP_JALR:   pc_next = (rv1 + imm_i) & 32'hFFFF_FFFE;
            OP_BRANCH: pc_next = branch_taken ? (pc + imm_b) : pc4;
            default:   pc_next = pc4;
        endcase
    end

    // ------------------------------------------------------------------
    // Ergebnis-Wert fuer Registerfile
    // ------------------------------------------------------------------
    reg [31:0] wb_data;
    always @* begin
        case (opcode)
            OP_LUI:   wb_data = imm_u;
            OP_AUIPC: wb_data = pc + imm_u;
            OP_JAL:   wb_data = pc4;
            OP_JALR:  wb_data = pc4;
            OP_LOAD:  wb_data = load_data;
            default:  wb_data = alu_y;   // OP_IMM, OP_REG
        endcase
    end

    wire reg_write = (opcode == OP_LUI)  || (opcode == OP_AUIPC) ||
                     (opcode == OP_JAL)  || (opcode == OP_JALR)  ||
                     (opcode == OP_LOAD) || (opcode == OP_IMM)   ||
                     (opcode == OP_REG);

    wire mem_write = (opcode == OP_STORE);

    // ------------------------------------------------------------------
    // Getakteter Zustand
    // ------------------------------------------------------------------
    always @(posedge clk) begin
        if (rst) begin
            pc <= 32'b0;
        end else begin
            pc <= pc_next;
            if (reg_write && (rd != 5'd0))
                regs[rd] <= wb_data;
            if (mem_write)
                dmem[mem_addr[31:2]] <= rv2;
        end
    end

    // Debug-Ausgaenge
    assign dbg_rd = regs[dbg_rs];
    assign dbg_pc = pc;

endmodule
