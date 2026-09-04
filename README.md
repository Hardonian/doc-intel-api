# doc-intel-api — Deployment

<!-- BEGIN: REPO HERO -->
![doc-intel-api — hero generated locally on the GPU stack](assets/repo-hero.png)
<!-- END: REPO HERO -->

Deployment wrapper for the document-intelligence API. This repository contains **deploy configuration only** (no application source — the API runs from the EPYC lab's local services).

## Contents
```
deploy/
  d1/           # primary deploy target (wrangler.toml, schema.sql, src/)
  frontend/     # edge/frontend config
  workers/      # worker definitions
.github/        # CI / deploy workflows
```

## What it deploys
- A Cloudflare Workers front end (`wrangler.toml`) routing to the local doc-intel API.
- Schema/init SQL for the backing store.
- Worker scripts that proxy/secure the local endpoint.

## Notes
- The runtime service + model assets live on the EPYC lab, not in this repo.
- See the Hardonia AI lab command center for live service status.
