# 🚫 DO NOT MODIFY - Protected Areas and Constraints

**Status:** 🔒 IMMUTABLE - DO NOT DELETE OR MODIFY  
**Purpose:** List protected areas that MUST NOT be modified  
**Last Updated:** 2024-01-10

---

## ⚠️ CRITICAL: DO NOT MODIFY THESE AREAS

### 1. Documentation Files (ABSOLUTE)
**DO NOT:**
- ❌ Delete any `.md` file
- ❌ Rename any `.md` file
- ❌ Overwrite existing content in `.md` files
- ❌ Remove existing sections
- ❌ Modify this file

**ALLOWED:**
- ✅ Append new content (with date markers)
- ✅ Add new documentation files
- ✅ Update status information (append-only)

**Protected Files:**
- All files in `__PROJECT_CONTEXT__/` directory
- All status documents in root directory
- All documentation in `src/components/DEX/` directory

### 2. Integration Points (CRITICAL)
**DO NOT:**
- ❌ Modify routing structure (`/dex/*` routes)
- ❌ Change `DEXPage.js` integration
- ❌ Modify `WalletContext` integration
- ❌ Change `UnifiedWalletModal` usage
- ❌ Break isolation from main app

**Protected Files:**
- `src/pages/DEXPage.js` - Entry point
- `src/components/DEX/DEXApp.jsx` - Main app
- `src/components/DEX/common/Layout.jsx` - Layout integration
- Wallet integration points

### 3. Core Hooks (IMPORTANT)
**DO NOT:**
- ❌ Delete or rename core hooks
- ❌ Remove existing hook functionality
- ❌ Break hook interfaces
- ❌ Remove error handling

**Protected Hooks:**
- `src/hooks/DEX/useDEXWallet.js` - Wallet connection
- `src/hooks/DEX/useDEXSettings.js` - Settings management
- `src/hooks/DEX/usePerformance.js` - Performance data

**ALLOWED:**
- ✅ Bug fixes (with documentation)
- ✅ Performance improvements (with documentation)
- ✅ Adding new features (append-only, with documentation)

### 4. API Integration Logic (CURRENT STATE)
**DO NOT:**
- ❌ Remove fallback logic (Backend → Binance → Mock)
- ❌ Remove Binance API integration (needed for development)
- ❌ Break error handling
- ❌ Remove mock data fallback

**Protected Files:**
- `src/utils/DEX/binanceApi.js` - Binance API helper
- `src/utils/DEX/mockData.js` - Nu folosi în DEX UI/flux (doar teste). DEX = date reale.
- `src/hooks/DEX/usePerformance.js` - Charts data logic
- `src/components/DEX/frontend/hooks/usePerformance.js` - Local hook

**ALLOWED:**
- ✅ Adding new API endpoints
- ✅ Improving error handling
- ✅ Adding new fallback options

### 5. Settings & Theme System (PRESERVE)
**DO NOT:**
- ❌ Remove localStorage persistence
- ❌ Break theme application logic
- ❌ Remove layout settings
- ❌ Break SettingsModal functionality

**Protected Files:**
- `src/hooks/DEX/useDEXSettings.js` - Settings hook
- `src/components/DEX/common/SettingsModal/` - Settings modal
- `src/styles/DEX/layout-settings.css` - Layout CSS
- Theme application logic

**ALLOWED:**
- ✅ Adding new settings options
- ✅ Improving UI/UX
- ✅ Adding new themes

### 6. Build Configuration (CRITICAL)
**DO NOT:**
- ❌ Modify build configuration without testing
- ❌ Break build process
- ❌ Remove dependencies
- ❌ Break routing

**Protected Areas:**
- `package.json` - Dependencies
- Build scripts
- Routing configuration
- Webpack configuration (if exists)

---

## 🎯 PROTECTION RULES

### For Code Changes:
1. **READ FIRST** - Read documentation before changes
2. **TEST** - Test changes thoroughly
3. **DOCUMENT** - Document any changes
4. **PRESERVE** - Preserve existing functionality
5. **ASK** - Ask if unsure

### For Documentation Changes:
1. **APPEND-ONLY** - Only append new content
2. **DATE MARKERS** - Mark new content with dates
3. **PRESERVE** - Preserve original intent
4. **NO DELETION** - Do NOT delete existing content
5. **NO RENAMING** - Do NOT rename files

### For Architecture Changes:
1. **DOCUMENT FIRST** - Document proposed changes
2. **REVIEW** - Review impact on integration
3. **TEST** - Test thoroughly
4. **UPDATE** - Update architecture documentation
5. **PRESERVE** - Preserve integration points

---

## 📋 PROTECTED FILE CATEGORIES

### Category 1: Core Integration Files
- `src/pages/DEXPage.js`
- `src/components/DEX/DEXApp.jsx`
- `src/components/DEX/common/Layout.jsx`
- Routing configuration

### Category 2: Core Hooks
- `src/hooks/DEX/useDEXWallet.js`
- `src/hooks/DEX/useDEXSettings.js`
- `src/hooks/DEX/usePerformance.js`

### Category 3: API Integration
- `src/utils/DEX/binanceApi.js`
- API service files
- (mockData.js: doar pentru teste jest, nu în flux DEX)

### Category 4: Settings System
- `src/hooks/DEX/useDEXSettings.js`
- `src/components/DEX/common/SettingsModal/`
- `src/styles/DEX/layout-settings.css`

### Category 5: Documentation
- All `.md` files in `__PROJECT_CONTEXT__/`
- All status documents
- All documentation in `src/components/DEX/`

---

## 🔒 IMMUTABILITY RULES

### Absolute Rules (NO EXCEPTIONS):
1. ❌ **NO DELETION** - Do NOT delete documentation files
2. ❌ **NO RENAMING** - Do NOT rename documentation files
3. ❌ **NO OVERWRITING** - Do NOT overwrite existing content
4. ❌ **NO ASSUMPTIONS** - Do NOT infer missing logic

### Conditional Rules (WITH PERMISSION):
1. ⚠️ Code changes - Only with documentation update
2. ⚠️ Architecture changes - Only with documentation update
3. ⚠️ API changes - Only with fallback preservation
4. ⚠️ Settings changes - Only with backward compatibility

### Allowed Actions:
1. ✅ Append new documentation (with date markers)
2. ✅ Add new files (with documentation)
3. ✅ Bug fixes (with documentation)
4. ✅ Performance improvements (with documentation)
5. ✅ New features (append-only, with documentation)

---

## 🚨 ENFORCEMENT MECHANISMS

### For AI Sessions:
1. **CHECKLIST** - Must complete validation checklist
2. **DOCUMENTATION** - Must read mandatory documentation
3. **VERIFICATION** - Must verify no deletion/renaming
4. **ASK** - Must ask if unclear
5. **STOP** - Must stop if constraints violated

### For Manual Changes:
1. **REVIEW** - Review protected areas list
2. **DOCUMENT** - Document proposed changes
3. **TEST** - Test changes thoroughly
4. **VERIFY** - Verify no protected areas modified
5. **UPDATE** - Update documentation if needed

---

## 📝 REFERENCE

For context on protected areas:
- `01_PROJECT_LOGIC.md` - Core logic to preserve
- `02_MVP_BOUNDARIES.md` - Scope boundaries
- `03_ARCHITECTURE_SKELETON.md` - Architecture to preserve
- `../DEX_PROJECT_COMPLETE_STATUS.md` - Current state

---

**This file is IMMUTABLE. Do NOT delete or modify.**

**Last Updated:** 2024-01-10  
**Next File to Read:** `05_AI_OPERATING_RULES.md`
