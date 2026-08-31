# Required Repository Settings

The files in this repository automate code-level controls. The following GitHub repository settings complete the protection boundary and should be treated as the source-of-truth configuration.

## About panel

Use these values under **About → Edit repository details**:

- **Description:** `Doug Cashio’s public sovereign AI and cybersecurity portfolio — ZeusApollo, multi-model orchestration, autonomous operations, and AI readiness.`
- **Website:** `https://cashio.us`
- **Topics:** `artificial-intelligence`, `cybersecurity`, `homelab`, `llm`, `proxmox`, `sovereign-ai`, `ai-agents`, `automation`, `github-pages`, `portfolio`

## Main branch protection

Under **Settings → Rules → Rulesets**, create an active branch ruleset named **Protect main** targeting the default branch.

Recommended rules:

- Restrict deletions.
- Block force pushes.
- Require a pull request before merging.
- Require at least one approval when another trusted reviewer is available; for a single-owner repository, allow the owner to merge after required checks pass.
- Dismiss stale approvals when new commits are pushed.
- Require review from Code Owners.
- Require conversation resolution before merging.
- Require the **Public Site Safety / public-safety** status check.
- Require branches to be up to date before merging.
- Require linear history.
- Do not allow bypass except for emergency repository recovery.

## Merge settings

Under **Settings → General → Pull Requests**:

- Enable **Automatically delete head branches**.
- Enable **Allow squash merging**.
- Disable merge commits unless a multi-parent merge is specifically required.
- Keep rebase merging optional.
- Enable auto-merge only after branch protection is active.

## GitHub Pages

- Source: **GitHub Actions** only. Branch-root and Jekyll publishing are not supported.
- Before a release can deploy, an authorized repository owner must manually set
  **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.
  This is a separate action-time prerequisite: the workflow verifies the live
  `build_type=workflow` setting and fails closed, but it never changes that
  repository setting.
- The Pages workflow uploads only the validated `dist` artifact after all local
  gates, source verification, and Pages configuration complete.
- Enforce HTTPS.
- Preserve the `CNAME` file for `cashio.us`.

## Security and analysis

Enable every option available for the plan, especially:

- Secret scanning and push protection.
- Dependabot alerts and security updates.
- Private vulnerability reporting.
- Code scanning when a supported analysis workflow is introduced.

## Operational review

Review these settings quarterly and after ownership, domain, deployment, or workflow changes. The public repository must remain a presentation layer; detailed topology, deployment procedures, credentials, incident records, and live telemetry belong in private storage.
