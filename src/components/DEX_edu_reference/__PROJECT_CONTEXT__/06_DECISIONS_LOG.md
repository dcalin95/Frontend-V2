# Decisions Log

**Purpose:** Record significant decisions, changes, and rationale for the DEX project.

---

## 2024-01-10: Documentation Consolidation

### Decision
Consolidated scattered markdown documentation files into a structured system:
- Moved non-essential documentation to `docs/_archive/`
- Created consolidated status file (`05_CURRENT_STATUS.md`)
- Created decisions log (`06_DECISIONS_LOG.md`)
- Updated manifest to reflect new structure

### Rationale
- Too many scattered .md files created over time
- Need single source of truth for project status
- Need clear documentation hierarchy
- Preserve historical docs without cluttering active context

### Actions Taken
1. Created `docs/_archive/` for historical documentation
2. Moved non-core documentation files to archive
3. Created `05_CURRENT_STATUS.md` with consolidated, factual status
4. Created `06_DECISIONS_LOG.md` for tracking decisions
5. Updated manifest to include new files and archive location

### Files Archived
- `README.md` (main project README)
- `Trade/README.md`
- `Trade/IMPLEMENTATION_STATUS.md`
- `Trade/ADDITIONAL_FEATURES_TODO.md`
- `Trade/OXIUM_FEATURES_ANALYSIS.md`
- `TODO_COMPARATIV_BITSWAPDEX_VS_OXIUM.md`
- `CHART_FEATURES.md`
- `EXPLICATIE_CONTRACT_WRAPPER.md`
- `RAPORT_EVALUARE_DEX_BITCOIN_EXCHANGE.md`

### Notes
- No files were deleted, only moved to archive
- No code was modified
- Archive preserves full documentation history
- Active context files remain in `__PROJECT_CONTEXT__/`

---

## Future Entries

New decisions should be added here in reverse chronological order (newest first).

Format:
```
## YYYY-MM-DD: [Decision Title]

### Decision
[What was decided]

### Rationale
[Why this decision was made]

### Actions Taken
[What was done]

### Notes
[Additional context]
```
