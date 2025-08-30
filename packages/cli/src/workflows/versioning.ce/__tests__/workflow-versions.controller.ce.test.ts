import { mockInstance } from '@n8n/backend-test-utils';
import { Logger, LicenseState } from '@n8n/backend-common';
import type { AuthenticatedRequest } from '@n8n/db';

import { WorkflowVersionCeService } from '../workflow-version.service';
import { WorkflowVersionsCeController } from '../workflow-versions.controller.ce';
import { WorkflowFinderService } from '@/workflows/workflow-finder.service';

describe('WorkflowVersionsCeController', () => {
  const logger = mockInstance(Logger);
  const ce = mockInstance(WorkflowVersionCeService);
  const license = mockInstance(LicenseState);
  const finder = mockInstance(WorkflowFinderService);

  const controller = new WorkflowVersionsCeController(logger, ce, license, finder);

  const req = { user: { id: 'u1' } } as unknown as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('list returns empty when EE history licensed', async () => {
    license.isWorkflowHistoryLicensed.mockReturnValue(true);
    const res = await controller.list(req, 'w1', { take: 10, skip: 0 });
    expect(res).toEqual([]);
    expect(ce.list).not.toHaveBeenCalled();
  });

  test('list returns CE list when not licensed', async () => {
    license.isWorkflowHistoryLicensed.mockReturnValue(false);
    ce.list.mockResolvedValue([{ versionId: 'v1', authors: 'a', createdAt: '', updatedAt: '' }] as any);
    const res = await controller.list(req, 'w1', { take: 10, skip: 0 });
    expect(ce.list).toHaveBeenCalledWith(req.user, 'w1', 10, 0);
    expect(res).toHaveLength(1);
  });

  test('get returns null when EE history licensed', async () => {
    license.isWorkflowHistoryLicensed.mockReturnValue(true);
    const res = await controller.get(req, 'w1', 'v1');
    expect(res).toBeNull();
    expect(ce.get).not.toHaveBeenCalled();
  });

  test('restore calls CE service when not licensed', async () => {
    license.isWorkflowHistoryLicensed.mockReturnValue(false);
    ce.restore.mockResolvedValue({} as any);
    const res = await controller.restore(req, 'w1', 'v1');
    expect(ce.restore).toHaveBeenCalledWith(req.user, 'w1', 'v1');
    expect(res).toEqual({ success: true });
  });
});

