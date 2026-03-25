---
trigger: always_on
---



# ANTIGRAVITY IDE — GLOBAL RULES
> Version 5.1.0 · Updated 2026-03-25
> Scope: ทุก Project · ทุก Workspace
> ภาษา: ตอบภาษาไทยเสมอ · Technical terms ไม่แปล

---

## ⚡ QUICK REFERENCE

| สถานการณ์ | ต้องทำ |
|-----------|--------|
| ก่อนทำงานทุกครั้ง | อ่าน `knowledge/index.md` → อ่าน project context |
| งานเกี่ยวกับ document/UI | อ่าน SKILL.md ก่อนเขียน code |
| ต้องรัน terminal / CMD | ใช้ **desktopcommander MCP** เท่านั้น |
| หลังแก้ปัญหาสำเร็จ | บันทึก solutions.md + lessons.md อัตโนมัติ |
| ส่งไฟล์ให้ user | ย้ายไป `/mnt/user-data/outputs/` + เรียก `present_files` |
| **ทุกครั้งที่ทำงานเสร็จ** | **เขียน changelog + version ลง `log_todo.md`** |

---

## 🤖 PART A — AI AGENT BEHAVIOR

### A1 · ภาษา [CRITICAL]

- ตอบเป็น**ภาษาไทย**เสมอ · Technical terms **ไม่แปล**
- User พิมพ์ภาษาไหน → ตอบภาษานั้น (default = ไทย)

### A2 · Terminal [CRITICAL]

- **ห้ามใช้ bash_tool** สำหรับเครื่อง user → ใช้ **desktopcommander MCP** เท่านั้น

### A3 · Auto-Read Knowledge Base [CRITICAL]

```
Step 1 → อ่าน index.md เสมอ
         C:\Users\chawa\.gemini\antigravity\.agent\knowledge\index.md
Step 2 → Smart Read ตามประเภทงาน
Step 3 → สรุปสั้นๆ ว่าอ่านอะไรบ้าง แล้วเริ่มทำงาน
```

**Smart Reading Map:**

| งานที่ทำ | อ่านเพิ่ม |
|---------|----------|
| TikTok Uploader | `projects/tiktok-uploader/context.md` + `rules.md` |
| PSI Engine | `projects/psi-engine/context.md` + `rules.md` |
| TitanMirror | `projects/titan-mirror/context.md` + `rules.md` |
| แก้ Bug | `knowledge/solutions.md` + `knowledge/lessons.md` |
| เขียน Code ใหม่ | `memory/patterns.md` + `memory/snippets.md` |
| ออกแบบ Architecture | `memory/decisions.md` |

### A4 · Auto-Read Skill [CRITICAL]

ก่อนทำงาน document/UI → อ่าน SKILL.md ก่อนเสมอ:

| งาน | SKILL.md |
|-----|----------|
| Word (.docx) | `/mnt/skills/public/docx/SKILL.md` |
| PowerPoint (.pptx) | `/mnt/skills/public/pptx/SKILL.md` |
| Excel (.xlsx) | `/mnt/skills/public/xlsx/SKILL.md` |
| PDF | `/mnt/skills/public/pdf/SKILL.md` |
| Web UI | `/mnt/skills/public/frontend-design/SKILL.md` |

### A5 · Auto-Save Knowledge [CRITICAL]

หลังแก้ปัญหาสำเร็จ → บันทึกอัตโนมัติ:

| เจอ... | บันทึกลง... | บังคับ? |
|--------|------------|---------|
| วิธีแก้ปัญหาใหม่ | `knowledge/solutions.md` | ✅ เสมอ |
| บทเรียน / ข้อผิดพลาด | `knowledge/lessons.md` | ✅ เสมอ |
| Pattern ที่ใช้ซ้ำได้ | `memory/patterns.md` | ถ้าเจอ |
| Code snippet ที่ดี | `memory/snippets.md` | ถ้าเจอ |
| Architecture decision | `memory/decisions.md` | ถ้าเจอ |

เพิ่ม date, project, tags · อัปเดต index.md ถ้าจำเป็น

### A6 · Deliver Output [CRITICAL]

ทุกไฟล์ที่ส่งให้ user → ย้ายไป `/mnt/user-data/outputs/` → เรียก `present_files(path)`

### A7 · Response Style [HIGH]

- กระชับ ตรงประเด็น · ใช้ table/bullet · Code block มี syntax highlight
- ไม่แน่ใจ → ถามก่อน · บอก trade-off ตรงไปตรงมา · ไม่ทำเกินที่ขอโดยไม่บอก

### A8 · Auto-Write log_todo.md [CRITICAL]

**Path:** `C:\Users\chawa\.gemini\antigravity\.agent\log_todo.md`

**Format:**
```markdown
---
## [v{version}] - {YYYY-MM-DD HH:MM}

**Project:** {project_name}
**Session:** {สรุป 1 บรรทัด}

### ✅ สิ่งที่ทำ
- {รายการ}

### 📝 Changelog
- {feat|fix|refactor|docs|chore}: {รายละเอียด}

### 🔜 TODO ที่เหลือ (ถ้ามี)
- [ ] {งานที่ยังค้าง}
```

**กฎ:** อ่าน version ล่าสุด → +1 patch (ถ้าไม่มี → v0.1.0) · append entry ใหม่**บนสุด** · ใช้ desktopcommander · ห้ามข้ามแม้งานเล็ก

---

## 💻 PART B — CODE RULES

### B1 · Code Style [HIGH]

```
ภาษา:        TypeScript ก่อนเสมอ
Paradigm:    Functional > OOP
Variables:   camelCase · Constants: UPPER_SNAKE_CASE
Indentation: 2 spaces · Strings: single quotes
```

- ชื่อ function: `verb + noun` → `getUserById`, `validateEmail`
- สูงสุด: **50 lines / function** · **3 params** (เกิน → options object)
- Comments: `// TODO:` · `// FIXME:` · `// NOTE:` · JSDoc สำหรับ public functions

### B2 · Type Safety [CRITICAL]

- ห้าม implicit `any` · ทุก function ต้องมี return type · ใช้ `unknown` แทน `any` · `strict: true` เสมอ

### B3 · Error Handling [HIGH]

- `try-catch` ทุก async operation · ห้าม swallow errors · ไม่ expose stack trace

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "อีเมลไม่ถูกต้อง",
    details: { field: "email" }
  }
}
```

### B4 · Complexity [HIGH]

| Metric | Limit |
|--------|-------|
| Cyclomatic complexity | ≤ 10 |
| Cognitive complexity | ≤ 15 |
| Function lines | ≤ 50 |
| Parameters | ≤ 3 |

### B5 · Test Coverage [CRITICAL]

Unit ≥ 80% · Integration ≥ 60% · E2E ≥ 40% — ไม่ผ่าน → ห้าม merge

---

## 🔒 PART C — SECURITY RULES

### C1 · No Hardcoded Secrets [CRITICAL]

ห้ามเด็ดขาด: hardcode API keys, passwords, secrets → ใช้ `process.env` + `.env` + `.gitignore`

### C2 · Input Validation [CRITICAL]

- Validate ทุก input ด้วย schema (**Zod** / **Pydantic** / **Joi**)
- Rate limiting บน public endpoints
- ห้าม `eval()`, `new Function()`, dynamic `setTimeout(string)`

### C3 · Injection Prevention [CRITICAL]

| Attack | Prevention |
|--------|-----------|
| SQL Injection | Parameterized queries / ORM |
| XSS | Sanitize output · DOMPurify · ห้าม innerHTML |
| Command Injection | ห้าม exec(user_input) |

### C4 · Auth & Session [CRITICAL]

- Password: **bcrypt** (cost ≥ 12) หรือ **Argon2id**
- JWT: verify signature + expiry เสมอ
- Cookie: `HttpOnly` + `Secure` + `SameSite=Strict`
- Admin: ต้องมี MFA

### C5 · Dependencies [HIGH]

`npm audit` / `pip-audit` ก่อน deploy · CRITICAL/HIGH → BLOCK · scan ทุกสัปดาห์

---

## 🏗️ PART D — ARCHITECTURE RULES

### D1 · SOLID Principles [HIGH]

| Principle | สรุป |
|-----------|------|
| **S**RP | 1 class = 1 หน้าที่ |
| **O**CP | ขยายได้โดยไม่แก้ของเดิม |
| **L**SP | subtype ใช้แทน parent ได้ |
| **I**SP | ไม่บังคับ implement สิ่งที่ไม่ใช้ |
| **D**IP | depend on abstraction |

### D2 · Clean Architecture [HIGH]

```
Presentation → Application → Domain ← Infrastructure
```

- Domain layer: **ห้าม import** จาก layer อื่น · ห้าม circular dependencies

### D3 · API Design [HIGH]

- URL มี version: `/api/v1/` · ห้าม CORS wildcard `*` กับ credentials
- Security headers: HSTS · CSP · X-Frame-Options · nosniff

### D4 · N+1 Prevention [HIGH]

- ห้าม ORM query ในวง loop → ใช้ `select_related` / `include` / `DataLoader` / batch query

---

## ⚡ PART E — PERFORMANCE

### E1 · Web Vitals Budget [MEDIUM]

| Metric | Target |
|--------|--------|
| FCP | < 1.8s |
| LCP | < 2.5s |
| TTI | < 3.8s |
| CLS | < 0.1 |
| API Response | < 200ms |
| Bundle (gzip) | < 250kb |

### E2 · Frontend Rules [MEDIUM]

| ✅ ทำ | ❌ ห้าม |
|------|--------|
| Lazy loading + code splitting | Load ทุกอย่างพร้อมกัน |
| Virtualize list > 100 items | Render 1000+ items |
| WebP/AVIF images | PNG/JPEG ไม่ compress |
| Debounce search (300ms+) | Fire API ทุก keystroke |
| Pagination / infinite scroll | Return ข้อมูลทั้งหมด |

---

## 🔀 PART F — GIT & COLLABORATION

### F1 · Commit Message [HIGH]

Format: `type(scope): description`

Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `chore` · `ci` · `build` · `revert`

### F2 · Branch Naming [MEDIUM]

`feature/`, `fix/`, `hotfix/`, `release/`, `chore/` + descriptive name

### F3 · Code Review [HIGH]

**2 approvals** สำหรับ `main`/`production`/`staging` · Stale reviews invalidate เมื่อ commit ใหม่

---

## 🌐 PART G — MCP SERVERS

| Server | หน้าที่ |
|--------|--------|
| **desktopcommander** ⭐ | terminal · CMD · PowerShell บนเครื่อง user |
| filesystem | อ่าน/เขียนไฟล์ local |
| github | clone · push · PR |
| google-drive | เข้าถึงไฟล์ใน Drive |
| slack | ส่ง message · อ่าน channel |
| database | query databases |
| browser | automation · scraping |

ใช้ MCP เมื่อต้องทำงานบนเครื่อง user · ไม่ต้องใช้ถ้า built-in tool ทำได้

---

## 📖 PART H — DOCUMENTATION

- ทุก public function/API → ต้องมี JSDoc / docstring / OpenAPI
- README: ให้ dev ใหม่ setup ได้ใน 15 นาที
- CHANGELOG: [Keep a Changelog](https://keepachangelog.com) + SemVer

---

## ♿ PART I — ACCESSIBILITY & I18N

- WCAG 2.1 AA: `alt` text · `aria-label` · keyboard nav · contrast ≥ 4.5:1
- i18n: ห้าม hardcode UI strings · locale-aware date/number · รองรับ RTL

---

## 🗂️ KNOWLEDGE BASE STRUCTURE

```
.agent/
├── knowledge/
│   ├── index.md       ← อ่านก่อนเสมอ
│   ├── solutions.md   ← วิธีแก้ปัญหา
│   ├── lessons.md     ← บทเรียน
│   └── problems.md    ← โจทย์ฝึก
├── memory/
│   ├── patterns.md    ├── snippets.md    └── decisions.md
├── projects/
│   ├── tiktok-uploader/  ├── psi-engine/  └── titan-mirror/
├── workflows/
│   ├── startup.md     └── solve-all.md
└── log_todo.md        ← บันทึกทุก session
```

| Command | Action |
|---------|--------|
| `/startup` | โหลด context ทั้งหมดตาม Smart Reading |
| `/solve-all` | แก้โจทย์ใน problems.md + บันทึก memory |

---

```yaml
version: "5.1.0"
updated: "2026-03-25"
language: Thai
terminal: desktopcommander MCP
kb_path: C:\Users\chawa\.gemini\antigravity\.agent\knowledge\
philosophy: "Plan like an architect. Code like an artist. Test like an adversary. Deploy like a surgeon."
```

---
