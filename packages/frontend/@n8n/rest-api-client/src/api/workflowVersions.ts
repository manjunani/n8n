import type { IRestApiContext } from '../types';
import { makeRestApiRequest } from '../utils';

export async function listWorkflowVersions(
  context: IRestApiContext,
  workflowId: string,
  take = 20,
  skip = 0,
) {
  return await makeRestApiRequest(context, 'GET', `/workflows/${encodeURIComponent(workflowId)}/versions?take=${take}&skip=${skip}`);
}

export async function getWorkflowVersion(
  context: IRestApiContext,
  workflowId: string,
  versionId: string,
) {
  return await makeRestApiRequest(
    context,
    'GET',
    `/workflows/${encodeURIComponent(workflowId)}/versions/${encodeURIComponent(versionId)}`,
  );
}

export async function createWorkflowVersionSnapshot(
  context: IRestApiContext,
  workflowId: string,
) {
  return await makeRestApiRequest(context, 'POST', `/workflows/${encodeURIComponent(workflowId)}/versions`);
}

export async function restoreWorkflowVersion(
  context: IRestApiContext,
  workflowId: string,
  versionId: string,
) {
  return await makeRestApiRequest(
    context,
    'POST',
    `/workflows/${encodeURIComponent(workflowId)}/versions/${encodeURIComponent(versionId)}/restore`,
  );
}

