# Community Edition Workflow Versioning

Community Edition (CE) workflow versioning provides lightweight snapshots of a workflow’s structure (nodes and connections) without requiring the Enterprise Workflow History feature.

This document explains how it works, how to use it in the UI, and how to use the REST API.

## What gets versioned

- Snapshots include only the workflow graph: `nodes` and `connections`.
- Snapshots are saved automatically on create and on updates that change `versionId`.
- You can also create a manual snapshot via API.

## UI usage

- Open any saved workflow in the editor.
- Click the “Versions” button in the top header.
- In the Versions view:
  - Select a snapshot on the left to see a JSON diff vs the current workflow.
  - Click “Restore” to roll back to the selected snapshot. A snapshot of the current state is saved before restore.
  - Click “Download” to save the snapshot JSON.

> Note: If Enterprise Workflow History is licensed, the CE Versions view will be hidden and the EE “Workflow History” remains authoritative.

## REST API

All endpoints are under `/rest`.

- List versions:
  - `GET /workflows/:workflowId/versions?take=20&skip=0`
- Get a version:
  - `GET /workflows/:workflowId/versions/:versionId`
- Create a snapshot now:
  - `POST /workflows/:workflowId/versions`
- Restore a version:
  - `POST /workflows/:workflowId/versions/:versionId/restore`

Responses include basic metadata (`versionId`, `authors`, `createdAt`, `updatedAt`) and, for a single version, `nodes` and `connections`.

## Behavior and limits

- CE versioning stores data in the existing `WorkflowHistory` table. No extra migrations are needed.
- If Enterprise Workflow History is licensed, CE endpoints return no-op/empty to avoid duplication.
- Optional pruning and notes can be added in future iterations.

## Troubleshooting

- Versions button not visible: Ensure the workflow is saved and EE Workflow History is not licensed.
- No versions listed: The workflow may not have been saved since enabling CE versioning.
- Restore fails: Check permissions for the workflow and that the instance is healthy (`/healthz`).

## Deployment notes

For a quick VPS deployment (Hostinger example), see `deploy/hostinger/README.md`.

