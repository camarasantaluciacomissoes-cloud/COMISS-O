# Security Specification & Threat Model
## Sistema de Controle Legislativo - Comissões da Câmara Municipal

### 1. Data Invariants
1. **Councilor Integrity**: Councilor documents must have valid IDs, non-empty names, recognized parties, and bounded string sizes.
2. **Committee Integrity**: Every committee must belong to a valid legislature, contain a list of 3 members with specific legislative roles (Presidente, Relator, Membro).
3. **Meeting Integrity**: A meeting cannot be created without a valid committee reference, valid date format, and predefined status ('agendada', 'realizada', 'cancelada').
4. **Attendance Rigor**: Attendance records within meetings must only reference legitimate statuses ('presente', 'ausente_justificado', 'ausente_injustificado'). Justifications must include document details and signature validation flag.
5. **No Anonymous Sabotage**: Writes must be strictly governed to prevent unauthorized deletion or falsification of legislative minutes and frequency records.
6. **Denial of Wallet Protection**: All string fields and payload sizes must be strictly bounded with `.size() <= MAX` rules.

### 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Payload 1 (Ghost Field Injection in Councilor)**: Injecting unrecognized administrative override flag `{ "name": "Vereador", "isAdmin": true }`.
2. **Payload 2 (Unbounded String Attack)**: Overloading the meeting minutes with a 10MB malicious payload.
3. **Payload 3 (Invalid Committee Member Structure)**: Providing committee without 3 members or with invalid member roles.
4. **Payload 4 (Orphaned Meeting)**: Creating a meeting referencing non-existent committee ID.
5. **Payload 5 (Status Bypass in Meeting)**: Setting meeting status to invalid string `approved_without_quorum`.
6. **Payload 6 (Unauthorized Deletion)**: Attempting to delete councilor records without authenticated admin clearance.
7. **Payload 7 (ID Poisoning)**: Creating documents with malicious IDs containing slashes or control characters.
8. **Payload 8 (Falsifying Attendance Status)**: Setting attendance status to `forged_presence`.
9. **Payload 9 (Forged Justification Signature)**: Marking signature without required reason string.
10. **Payload 10 (Settings Tampering)**: Modifying chamber name to empty string.
11. **Payload 11 (Timestamp Replay)**: Submitting future or spoofed server creation timestamps.
12. **Payload 12 (Recursive List Bombing)**: Submitting meeting with 10,000 artificial attendance entries.
