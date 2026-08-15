# Frontend Architecture (V2)

This project is being modularized toward a clean, scalable structure.

## Target Structure

src/
├── app/                  # Application shell
│   ├── providers/        # Global providers
│   ├── router/           # Route definitions
│   └── layouts/          # Main layouts
│
├── shared/               # Truly shared code
│   ├── ui/
│   ├── lib/
│   ├── hooks/
│   ├── config/
│   └── types/
│
├── features/             # Business domains
├── widgets/              # Composite components
└── components/           # legacy - being migrated

## Rules

1. Features must not import from other features.
2. App.js / app/ should only compose features.
3. Business logic lives inside its feature.
4. Shared code must be free of feature-specific knowledge.

## Migration Status

- [x] Folder scaffolding created
- [x] Basic cleanup
- [ ] Extract app shell from App.js
- [ ] Move shared utilities
- [ ] Extract first features
- [ ] Isolate DEX_edu_reference
