# Traceability và release gates

## 1. Ma trận P0 tối thiểu

| Control | Rule chính | Owner | Chứng cứ chặn release |
|---|---|---|---|
| Red-flag triage trước AI | REQ-010..014 | Clinical + BE | catalog/version, clinical sign-off, unit/integration/E2E |
| Không chẩn đoán/kê đơn | REQ-020, REQ-033, BR-011 | Clinical + AI | prompt/output policy tests, harmful-output eval |
| Không hiển thị xác suất giả | REQ-021, CV-003 | Clinical + FE/AI | UI/API assertion, validation report nếu ngoại lệ |
| Ownership/object auth | REQ-040..042, CON-021 | Security + BE | anonymous/wrong-role/wrong-owner tests |
| Upload tài liệu y tế | REQ-044, CON-013 | Security + Privacy | private storage, signature/scan/type/size tests |
| OCR/range provenance | REQ-030..031, BR-022..023 | Clinical + Data | unit/range/source tests, confirmation UX |
| Thuốc và lịch nhắc | REQ-032..033, BR-024 | Clinical + Product | copy/API tests, no generated dose test |
| Publish recovery plan | REQ-034, BR-025 | Clinical + BE | state-machine/auth/audit tests |
| Emergency không paywall | REQ-011..012, BR-033 | Product + FE/BE | guest/quota/payment failure E2E |
| PHI không vào telemetry | CON-010, POL-PRIVACY | Privacy + Security | telemetry review, redaction tests, sample audit |
| AI model/prompt change | REQ-024..025, STD-AI-002..004 | AI + Clinical | model card, eval report, approval, rollback |

## 2. Release gate

### Gate A — Scope

- [ ] PR nêu capability, actor, data, intended/prohibited use và rule IDs bị tác động.
- [ ] Không biến demo/mock thành production truth.
- [ ] Breaking contract có migration/version/coordination hai repo.

### Gate B — Safety, privacy, security

- [ ] Clinical review cho mọi thay đổi red flag, wording/logic y khoa, prompt/output P0.
- [ ] Threat/privacy assessment được cập nhật nếu có data flow/vendor/permission mới.
- [ ] Object authorization và unsafe-output negative tests đã chạy.
- [ ] Không có PHI/secret trong diff, fixture, log, screenshot hoặc artifact CI.

### Gate C — Quality

- [ ] FE: lint + build + targeted unit/component/E2E + a11y theo scope.
- [ ] BE: restore/build + unit/integration + auth + contract + migration test theo scope.
- [ ] Critical flow kiểm tra mobile/keyboard/error/offline/provider failure.
- [ ] Evidence gắn vào PR; “tested manually” phải ghi ai, môi trường, case và kết quả.

### Gate D — Operations

- [ ] Metrics/alerts không thu PHI; runbook và owner đã cập nhật.
- [ ] Có feature flag/kill switch/rollback cho thay đổi P0.
- [ ] Migration, backup/restore và vendor outage path đã được cân nhắc.

## 3. Mẫu ghi trong PR

```md
Rules: REQ-021, BR-011, STD-AI-003
Risk: P0 — clinical safety
Evidence:
- unit/integration/E2E: ...
- clinical review: ...
- AI eval report: ...
Rollback/kill switch: ...
Exceptions (owner + expiry): none
```

## 4. Debt và ngoại lệ

Mỗi ngoại lệ bắt buộc có: rule ID, risk, lý do, control bù, owner chấp nhận, ngày hết hạn và issue.
Ngoại lệ hết hạn tự động chặn release tiếp theo. Không cho ngoại lệ đối với yêu cầu pháp luật hoặc
nguy cơ gây hại nghiêm trọng chưa được kiểm soát.
