# 📋 CONTEXT MANIFEST - Single Source of Truth

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY THIS FILE  
**Last Updated:** 2024-01-10  
**Purpose:** Authoritative list of all documentation files and mandatory read order

---

## ⚠️ CRITICAL RULES (DO NOT VIOLATE)

1. **NO DELETION:** Documentation files listed here MUST NOT be deleted
2. **NO RENAMING:** File names MUST NOT be changed
3. **NO OVERWRITING:** Existing content MUST NOT be removed or rewritten
4. **APPEND-ONLY:** New content MUST be appended with clear markers: `## Added for context – YYYY-MM-DD`
5. **MANDATORY READ ORDER:** AI sessions MUST read files in the order specified below
6. **NO ASSUMPTIONS:** If context is incomplete → STOP and ASK (do NOT infer)

---

## 📚 MANDATORY READ ORDER

### Phase 1: Core Context (MUST READ FIRST)
1. `00_READ_THIS_FIRST.md` - Entry point, critical warnings
2. `00A_CONTEXT_MANIFEST.md` - Manifest (single source of truth)
3. `01_PROJECT_LOGIC.md` - Core logic and business rules
4. `02_MVP_BOUNDARIES.md` - Scope boundaries and limitations
5. `03_ARCHITECTURE_SKELETON.md` - System architecture overview
6. `04_DO_NOT_MODIFY.md` - Protected areas and constraints
7. `05_AI_OPERATING_RULES.md` - Rules for AI interactions
8. `05_CURRENT_STATUS.md` - Current project status (consolidated)
9. `06_DECISIONS_LOG.md` - Decisions and changes log
10. `07_PRODUCT_TRUTH.md` - Authoritative product definition and truth
11. `__CONTEXT_GATE__.md` - Final gate (stop sign)

### Phase 2: Status Documents (READ AFTER CORE - in repository root)
7. `../../../../DEX_PROJECT_COMPLETE_STATUS.md` - Complete project status
8. `../../../../DEX_STATUS_CURRENT.md` - Current status summary
9. `../../../../PROJECT_STATUS_REAL.md` - Real status (no false claims)

### Phase 3: Implementation Details (REFERENCE AS NEEDED - in repository root)
10. `../../../../DEX_BACKEND_API_PLAN.md` - Backend API plan
11. `../../../../DEX_WALLET_IMPROVEMENTS.md` - Wallet implementation
12. `../../../../CHARTS_TEST_SUCCESS.md` - Charts implementation status
13. `../../../../DOCUMENTATION_INDEX.md` - Documentation index

**Note:** Status documents are in repository root (`../../../../` from `__PROJECT_CONTEXT__/`). Paths are relative to this directory (`src/components/DEX/__PROJECT_CONTEXT__/`).

---

## 📁 DOCUMENTATION FILE INVENTORY

### Core Context Files (__PROJECT_CONTEXT__/)
- ✅ `00A_CONTEXT_MANIFEST.md` (THIS FILE - DO NOT DELETE)
- ⏳ `00_READ_THIS_FIRST.md`
- ⏳ `01_PROJECT_LOGIC.md`
- ⏳ `02_MVP_BOUNDARIES.md`
- ⏳ `03_ARCHITECTURE_SKELETON.md`
- ⏳ `04_DO_NOT_MODIFY.md`
- ⏳ `05_AI_OPERATING_RULES.md`
- ⏳ `07_PRODUCT_TRUTH.md`

### Status Documents (Root Directory)
- ✅ `DEX_PROJECT_COMPLETE_STATUS.md` - Complete status (NOU - 2024-01-10)
- ✅ `DEX_STATUS_CURRENT.md` - Status consolidat
- ✅ `PROJECT_STATUS_REAL.md` - Status real (corect)
- ✅ `DEX_BACKEND_API_PLAN.md` - Plan backend API
- ✅ `DEX_WALLET_IMPROVEMENTS.md` - Wallet improvements
- ✅ `CHARTS_TEST_SUCCESS.md` - Charts test results
- ✅ `CHARTS_IMPLEMENTATION_SUMMARY.md` - Charts implementation
- ✅ `FINETUNING_SUMMARY.md` - Fine-tuning summary
- ✅ `FINETUNING_COMPLETE.md` - Fine-tuning complete
- ✅ `DOCUMENTATION_INDEX.md` - Documentation index

### Archived Documentation (docs/_archive/)
Historical documentation files have been moved to `docs/_archive/` for reference:
- `README.md` (original project README)
- Additional historical files (preserved for reference)

**Note:** Archived files are preserved for historical reference but are not part of active context.

---

## 🔒 IMMUTABILITY RULES

### For AI Sessions:
1. **MUST READ** files in mandatory order before making changes
2. **MUST NOT** delete any documentation file
3. **MUST NOT** rename any documentation file
4. **MUST NOT** overwrite existing content
5. **MUST** append new content with clear date markers
6. **MUST** stop and ask if context is incomplete

### For Documentation Updates:
1. **APPEND-ONLY:** New sections must be added, not replace existing
2. **CLEAR MARKERS:** Use `## Added for context – YYYY-MM-DD` for new content
3. **PRESERVE INTENT:** Original intent and logic must be preserved
4. **NO INFERENCE:** Do not infer missing logic - document it as TODO

### For Code Changes:
1. **DOCUMENTATION FIRST:** Read documentation before code changes
2. **RESPECT BOUNDARIES:** Honor MVP boundaries and constraints
3. **NO REFACTORING:** Do not refactor without explicit permission
4. **PRESERVE LOGIC:** Do not change existing logic without documentation update

---

## ✅ VALIDATION CHECKLIST

Before any AI session proceeds:
- [ ] Has read `00_READ_THIS_FIRST.md`
- [ ] Has read `01_PROJECT_LOGIC.md`
- [ ] Has read `02_MVP_BOUNDARIES.md`
- [ ] Understands current status (DEVELOPMENT MODE, not production)
- [ ] Understands what is NOT implemented
- [ ] Has not deleted any documentation file
- [ ] Has not renamed any documentation file
- [ ] Has not overwritten existing content

---

## 🎯 PROJECT STATUS SUMMARY

**Current Status:** ⚠️ DEVELOPMENT MODE - NOT PRODUCTION READY

**Key Points:**
- DEX integration în frontend-edu: ✅ COMPLETE
- Charts integration: ✅ COMPLETE (uses Binance API - development mode)
- Wallet connection: ✅ COMPLETE
- Settings & Theme: ✅ COMPLETE
- Backend API: ❌ NOT DEPLOYED (uses Binance API for development)
- Production requirements: ❌ NOT MET

**For Full Status:** See `../DEX_PROJECT_COMPLETE_STATUS.md`

---

## 📝 CHANGE LOG

### 2024-01-10
- Created manifest file
- Established mandatory read order
- Documented immutability rules
- Listed all documentation files
- Set validation checklist
- Added `05_CURRENT_STATUS.md` (consolidated status)
- Added `06_DECISIONS_LOG.md` (decisions log)
- Added `07_PRODUCT_TRUTH.md` (authoritative product definition)
- Documented archived documentation location (`docs/_archive/`)
- Archived scattered .md files to `docs/_archive/` (see `docs/_archive/ARCHIVE_INDEX.md`)

---

**This manifest is IMMUTABLE. Do NOT delete or modify this file.**

**If you need to update documentation:**
1. Read this manifest first
2. Follow append-only rules
3. Mark new content with date
4. Do NOT remove existing content
