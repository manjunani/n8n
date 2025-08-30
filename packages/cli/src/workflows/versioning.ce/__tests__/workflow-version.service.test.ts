import { mockInstance } from '@n8n/backend-test-utils';
import { Logger } from '@n8n/backend-common';
import type { User, WorkflowEntity } from '@n8n/db';
import { WorkflowHistoryRepository } from '@n8n/db';

import { WorkflowFinderService } from '@/workflows/workflow-finder.service';
import { WorkflowService } from '@/workflows/workflow.service';

import { WorkflowVersionCeService } from '../workflow-version.service';

describe('WorkflowVersionCeService', () => {
  const logger = mockInstance(Logger);
  const repo = mockInstance(WorkflowHistoryRepository);
  const finder = mockInstance(WorkflowFinderService);
  const wfService = mockInstance(WorkflowService);

  const service = new WorkflowVersionCeService(logger, repo, finder, wfService);

  const user = { id: 'u1', email: 'u@example.com', firstName: 'U', lastName: 'S' } as unknown as User;
  const workflowId = 'w1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveSnapshot does nothing without nodes/connections', async () => {
    await service.saveSnapshot(user, { versionId: 'v1' } as unknown as WorkflowEntity, workflowId);
    expect(repo.insert).not.toHaveBeenCalled();
  });

  test('saveSnapshot inserts when nodes/connections present', async () => {
    await service.saveSnapshot(
      user,
      {
        versionId: 'v2',
        nodes: [],
        connections: {},
      } as unknown as WorkflowEntity,
      workflowId,
    );
    expect(repo.insert).toHaveBeenCalledTimes(1);
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 'v2', workflowId, nodes: [], connections: {} }),
    );
  });

  test('restore snapshots current and updates workflow', async () => {
    finder.findWorkflowForUser.mockResolvedValue({ id: workflowId, versionId: 'curr', nodes: [], connections: {} } as unknown as WorkflowEntity);
    repo.findOne.mockResolvedValue({ workflowId, versionId: 'v3', nodes: [], connections: {} } as any);
    wfService.update.mockResolvedValue({ id: workflowId } as any);

    const result = await service.restore(user, workflowId, 'v3');

    expect(repo.insert).toHaveBeenCalled(); // pre-restore snapshot
    expect(wfService.update).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ nodes: [], connections: {} }),
      workflowId,
      undefined,
      undefined,
      true,
    );
    expect(result).toEqual(expect.objectContaining({ id: workflowId }));
  });
});

