# 🔧 Maintenance Workflow

This document describes the branching strategy and maintenance workflow for the Gemini Rubik's Tutor project.

## Branch Strategy

```
main (stable core)
  ↓
contest/live-agent (contest submission - frozen)
  ↓
feature/* (new features)
```

### Branch Descriptions

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Stable core codebase | Active development |
| `contest/live-agent` | Gemini Live Agent Challenge submission | Frozen for judging |
| `feature/*` | New feature development | Ongoing |

---

## Current Status

### `contest/live-agent` Branch (ACTIVE CONTEST SUBMISSION)
- **Status**: ✅ Ready for judging
- **Frozen**: No new features, only critical bug fixes
- **Deployment**: Configured for Google Cloud Run
- **Documentation**: CONTEST.md, README.md

### `main` Branch (CORE DEVELOPMENT)
- **Status**: 🔄 Active development
- **Purpose**: Long-term project maintenance
- **Features**: Future enhancements beyond contest scope

---

## Workflow for Core Development

### 1. Making Changes to Core Codebase

```bash
# Switch to main branch for core development
git checkout main

# Create feature branch
git checkout -b feature/new-enhancement

# Make changes, commit
git add .
git commit -m "feat: new enhancement"

# Merge back to main
git checkout main
git merge feature/new-enhancement
```

### 2. Cherry-Picking to Contest Branch (if needed)

If a critical bug fix needs to go to the contest branch:

```bash
# Get commit hash from main
git log main --oneline -5

# Cherry-pick to contest branch
git checkout contest/live-agent
git cherry-pick <commit-hash>

# Test thoroughly before pushing
git push origin contest/live-agent
```

### 3. Post-Contest: Merging Contest Back to Main

After the contest ends:

```bash
# Merge contest features back to main
git checkout main
git merge contest/live-agent --no-ff

# Continue development on main
git push origin main
```

---

## File Organization

### Contest-Specific Files
These files are only relevant for contest submission:
- `CONTEST.md` - Contest-specific documentation
- `cloudbuild.yaml` - Google Cloud Build config
- `deploy.sh` - Deployment script
- `terraform/` - Infrastructure as code

### Core Application Files
These files are part of the main application:
- `backend/src/` - Server code
- `frontend/src/` - React app
- `README.md` - Main documentation

---

## Deployment Workflows

### Development (Local)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Open http://localhost:5173
```

### Staging (Cloud Run)
```bash
# Deploy to staging environment
./deploy.sh PROJECT_ID_STAGING
```

### Production (Contest)
```bash
# Deploy to production (contest)
./deploy.sh PROJECT_ID_PRODUCTION

# Or use Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## Testing Checklist

### Before Committing to `contest/live-agent`
- [ ] Backend starts without errors
- [ ] Frontend loads correctly
- [ ] WebSocket connection works
- [ ] Camera/mic permissions work
- [ ] AI responses are received
- [ ] 3D cube renders properly
- [ ] Challenge mode functions
- [ ] Demo mode works (if applicable)

### Before Merging to `main`
- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)

---

## Version Management

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

### Current Versions
- Contest Submission: `1.0.0-contest`
- Core Development: `1.1.0-dev`

---

## Environment Variables

### Development (.env)
```env
PORT=8080
GEMINI_API_KEY=dev_key
DEMO_MODE=false
```

### Production (.env.production)
```env
PORT=8080
GEMINI_API_KEY=${SECRET_MANAGER}
DEMO_MODE=false
CORS_ORIGIN=https://your-domain.com
```

---

## Rollback Procedure

If a deployment fails:

```bash
# Rollback Cloud Run to previous revision
gcloud run services update-traffic gemini-rubiks-tutor \
  --to-revisions LATEST=0,PREVIOUS=100 \
  --region us-central1

# Or rollback to specific revision
gcloud run deploy gemini-rubiks-tutor \
  --image gcr.io/PROJECT_ID/gemini-rubiks-tutor:PREVIOUS_TAG \
  --region us-central1
```

---

## Security Considerations

### Never Commit
- `.env` files with real API keys
- `local-cache/` directories
- `node_modules/` directories
- Service account keys

### Always Use
- Secret Manager for API keys in production
- Environment variables for configuration
- `.gitignore` for sensitive files

---

## Support

For questions about:
- **Contest submission**: See CONTEST.md
- **Deployment**: See README.md Deployment section
- **Architecture**: See docs/architecture-diagram.md
- **API**: See README.md API Reference section

---

**Last Updated**: March 1, 2026
**Maintained by**: Contest Team
