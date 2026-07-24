# Public Site Protection Guide

This guide keeps **cashio.us** useful as a public portfolio while separating presentation from private operations.

## 1. Publish the story, not the coordinates

Safe public content:

- architecture roles and design patterns;
- approximate fleet and automation counts;
- generalized model-routing lanes;
- screenshots or diagrams with sensitive fields removed;
- professional profile links; and
- a domain-based contact alias.

Keep private:

- addresses, ports, hostnames, container or virtual-machine identifiers;
- VPN, firewall, DNS, storage, and backup details;
- filesystem paths and deployment commands;
- credentials, tokens, private keys, account balances, quotas, and provider billing data;
- exact performance, load, capacity, retention, and vulnerability details;
- employer, customer, household, family, or financial information.

## 2. Use separate repositories

Recommended split:

- **Public repository:** GitHub Pages content, sanitized examples, coarse telemetry, public documentation.
- **Private operations repository:** deployment scripts, live configuration, topology, incident notes, security journals, detailed telemetry, backup procedures, and infrastructure source of truth.

Public reference code should use environment variables and generic names rather than real endpoints.

## 3. Use professional aliases

Prefer domain aliases such as `admin@cashio.us` for public contact and security reporting. Do not publish personal Gmail addresses or phone numbers in source, metadata, images, commit messages, or documents.

## 4. Sanitize telemetry before publication

The public `status.json` should contain only stable presentation fields. Do not publish balances, utilization, swap, storage pressure, internal latency, incident notes, detailed node inventories, or maintenance conditions.

A safe pattern is:

```json
{
  "version": "v28",
  "cluster_status": "MAX WARP",
  "fleet_nodes": 19,
  "crons_active": 31,
  "daily_burn": 0.26,
  "note": "Privacy-preserving public telemetry"
}
```

## 5. Protect secrets

- Store secrets in environment variables or a dedicated secret manager.
- Refuse to start services when required authentication values are absent.
- Use constant-time comparison for API keys.
- Never place secrets in browser-delivered JavaScript, HTML, JSON, screenshots, or workflow logs.
- Rotate any credential that was ever committed, even if it was later removed.

Deleting a secret from the latest commit does not remove it from Git history.

## 6. Review images and documents

Before publishing:

- remove EXIF location and device metadata;
- crop browser tabs, bookmarks, notifications, account names, and local paths;
- inspect QR codes and links;
- redact addresses, invoice numbers, serial numbers, and customer names;
- confirm screenshots do not reveal dashboards, browser autofill, or terminal history.

## 7. Use a release gate

Every pull request should pass an automated public-safety scan that checks for:

- private-network addresses;
- common secret formats;
- personal email domains;
- backup HTML files;
- internal configuration paths; and
- prohibited operational artifacts.

A human review should still confirm that the content makes sense in context.

## 8. Quarterly review

Once per quarter:

1. Review the production site and repository as a stranger would.
2. Search the repository and commit history for sensitive strings.
3. Review public releases, pull-request comments, workflow logs, and uploaded artifacts.
4. Confirm `SECURITY.md`, `PRIVACY.md`, and `security.txt` are current.
5. Verify that public contact aliases still work.
6. Rotate credentials connected to any accidental disclosure.
7. Confirm detailed operational content remains in private storage.

## 9. Emergency response

When sensitive information is discovered:

1. Remove public access to the affected page or file.
2. Rotate the exposed credential or identifier immediately.
3. Preserve a private incident record.
4. Remove the material from the active branch.
5. Rewrite Git history when the information is sensitive enough to justify it.
6. Revoke or delete cached artifacts and releases when possible.
7. Re-run the public-safety scan and verify the production deployment.

## Public portfolio rule

**Show capability, architecture, and outcomes. Keep identity beyond the professional profile—and every operational coordinate—private by default.**
