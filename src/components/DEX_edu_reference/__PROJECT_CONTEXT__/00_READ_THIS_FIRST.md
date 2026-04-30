# 🚨 READ THIS FIRST - Critical Context Entry Point

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY  
**Purpose:** Mandatory entry point for all AI sessions  
**Last Updated:** 2024-01-10

---

## ⚠️ CRITICAL WARNINGS

### BEFORE YOU START:
1. **STOP** - Do NOT make any code changes
2. **READ** - Complete the mandatory read order (see `00A_CONTEXT_MANIFEST.md`)
3. **UNDERSTAND** - Data policy: **ONLY REAL DATA.** No fake, mock, demo, hardcoded (fake) data. See `docs/DATA_POLICY.md`. "Development" does NOT justify fake data.
4. **ASK** - If context is incomplete, STOP and ASK (do NOT infer)

---

## 🎯 PROJECT OVERVIEW

**Project Name:** BitSwapDEX AI Trading - Integration în frontend-edu  
**Current Status:** ⚠️ NOT PRODUCTION READY (some features not deployed).  
**Data policy:** **ONLY REAL DATA** – no fake, mock, demo, hardcoded (fake) data. `docs/DATA_POLICY.md`  
**Location:** `src/components/DEX/` (integrated from `src/components/DEX/Proiect/`)

### What This Project Is:
- DEX (Decentralized Exchange) interface for AI Trading
- Integrated în frontend-edu as a separate route (`/dex/*`)
- Uses real APIs (e.g. Binance for charts where configured) – no mock/demo data in UI
- Has wallet connection, settings, theme support
- Charts: real data or error/empty only

### What This Project Is NOT:
- ❌ NOT production ready (backend/features may not be fully deployed)
- ❌ NO fake/mock/demo data – only real data or error/empty
- ❌ NOT fully tested
- ❌ NOT deployed backend (when backend is missing: error/empty, not fake data)

---

## 📋 MANDATORY READ ORDER

**You MUST read these files IN ORDER before making any changes:**

1. ✅ `00A_CONTEXT_MANIFEST.md` (you are here, but read the manifest)
2. ⏳ `01_PROJECT_LOGIC.md` - Core logic and business rules
3. ⏳ `02_MVP_BOUNDARIES.md` - Scope boundaries
4. ⏳ `03_ARCHITECTURE_SKELETON.md` - Architecture overview
5. ⏳ `04_DO_NOT_MODIFY.md` - Protected areas
6. ⏳ `05_AI_OPERATING_RULES.md` - AI interaction rules

**Then read status documents:**
7. `../DEX_PROJECT_COMPLETE_STATUS.md` - Complete status
8. `../DEX_STATUS_CURRENT.md` - Current status
9. `../PROJECT_STATUS_REAL.md` - Real status (no false claims)

---

## 🔒 ABSOLUTE RULES (DO NOT VIOLATE)

### Documentation Rules:
- ❌ **NO DELETION** - Do NOT delete any documentation file
- ❌ **NO RENAMING** - Do NOT rename any documentation file
- ❌ **NO OVERWRITING** - Do NOT overwrite existing content
- ✅ **APPEND-ONLY** - Only append new content with date markers
- ✅ **PRESERVE INTENT** - Original intent must be preserved

### Code Rules:
- ❌ **NO MODIFICATIONS** - Do NOT modify code without reading context
- ❌ **NO REFACTORING** - Do NOT refactor without permission
- ❌ **NO ASSUMPTIONS** - Do NOT infer missing logic
- ✅ **DOCUMENT FIRST** - Read documentation before changes
- ✅ **ASK IF UNCLEAR** - Stop and ask if context is incomplete

---

## 📊 CURRENT STATUS (Quick Reference)

### ✅ What Is Implemented:
- DEX integration în frontend-edu
- Routing `/dex/*` works
- Wallet connection (MetaMask, Trust Wallet, Coinbase, WalletConnect)
- Settings modal (theme, layout, language)
- Charts: real data (e.g. Binance API where configured) or error/empty – no demo data
- Dark theme support
- Layout settings (Trade Panel/Orderbook Position)

### ❌ What Is NOT Implemented:
- Backend API (when not deployed: error/empty only, no fake data)
- Production backend endpoints
- Full testing
- Trade Page UI (inspirat de Oxium)
- Production requirements

### ⚠️ Important Notes:
- **DATA POLICY:** Only real data. No fake, mock, demo, hardcoded (fake) data. See `docs/DATA_POLICY.md`.
- **NOT PRODUCTION READY:** Backend may not be deployed, not fully tested.
- **DO NOT:** Use or add mock/demo/fake data in UI or flows.

---

## 🎯 NEXT STEPS FOR AI SESSIONS

1. **READ** all files in mandatory order (see `00A_CONTEXT_MANIFEST.md`)
2. **UNDERSTAND** current status (DEVELOPMENT MODE)
3. **RESPECT** boundaries and constraints
4. **ASK** if unclear - do NOT infer
5. **DOCUMENT** any changes (append-only)

---

## 📁 KEY DOCUMENTATION FILES

### Core Context (This Directory):
- `00A_CONTEXT_MANIFEST.md` - Manifest (read this next)
- `00_READ_THIS_FIRST.md` - This file
- `01_PROJECT_LOGIC.md` - Project logic
- `02_MVP_BOUNDARIES.md` - Boundaries
- `03_ARCHITECTURE_SKELETON.md` - Architecture
- `04_DO_NOT_MODIFY.md` - Protected areas
- `05_AI_OPERATING_RULES.md` - AI rules

### Status Documents (Root Directory):
- `../../../../DEX_PROJECT_COMPLETE_STATUS.md` - Complete status ⭐
- `../../../../DEX_STATUS_CURRENT.md` - Current status
- `../../../../PROJECT_STATUS_REAL.md` - Real status
- `../../../../DOCUMENTATION_INDEX.md` - Documentation index

### Implementation Details:
- `../../../../DEX_BACKEND_API_PLAN.md` - Backend API plan
- `../../../../DEX_WALLET_IMPROVEMENTS.md` - Wallet implementation
- `../../../../CHARTS_TEST_SUCCESS.md` - Charts status

---

## ⚠️ FINAL WARNING

**DO NOT PROCEED WITHOUT READING:**
1. `00A_CONTEXT_MANIFEST.md` - Full manifest
2. `01_PROJECT_LOGIC.md` - Project logic
3. Status documents - Current state

**DO NOT:**
- Delete documentation files
- Rename documentation files
- Overwrite existing content
- Claim project is "production ready" (it's NOT)
- Make code changes without reading context

**IF UNCLEAR:** STOP and ASK - do NOT infer or assume

---

**This file is IMMUTABLE. Do NOT delete or modify.**

**Last Updated:** 2024-01-10  
**Next File to Read:** `00A_CONTEXT_MANIFEST.md`
