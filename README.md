# ÖRKEN — MVP единого портала поддержки бизнеса

Demo-ready frontend prototype based on the supplied competition specification.

## Run

```bash
npm install
npm run dev
```

Production check: `npm run build`.

## Demo routes

- `/#home` — portal landing page and AI selection entry point
- `/#catalog` — support-measure catalog and filters
- `/#service-wagons` — complex service card
- `/#apply` — four-step branching application with mock eGov/EDS/BPM behavior
- `/#cabinet` — applications, statuses, notifications and documents
- `/#map` — interactive financed-project map and filters
- `/#reports` — reports, dashboards and embedded-resource catalog
- `/#tools` — calculators, templates and business materials
- `/#admin` — no-code service/form constructor, rules, calculations, preview and publish

## Architecture approach

The MVP models the portal as a presentation/orchestration layer. Service definitions, steps, fields, conditions and calculations belong to a configurable service schema; the constructor represents the authoring surface for that schema, while the application renderer represents the client surface. Mock integrations stand in for eGov IDP, EDS, the Holding integration bus and subsidiary BPM systems. In production these boundaries would be backed by versioned APIs and events, allowing 70+ services to reuse the same renderer, rules engine and integration adapters without hard-coded forms.

The current build is intentionally a self-contained frontend prototype: demo state is in memory and no personal information is transmitted.
