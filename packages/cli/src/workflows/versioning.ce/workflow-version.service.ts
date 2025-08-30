import { Logger } from '@n8n/backend-common';
import type { User, WorkflowEntity, WorkflowHistory } from '@n8n/db';
import { WorkflowHistoryRepository } from '@n8n/db';
import { Service } from '@n8n/di';
import type { IWorkflowBase } from 'n8n-workflow';
import { ensureError } from 'n8n-workflow';

import { WorkflowFinderService } from '@/workflows/workflow-finder.service';
import { WorkflowService } from '@/workflows/workflow.service';

@Service()
export class WorkflowVersionCeService {
  constructor(
    private readonly logger: Logger,
    private readonly workflowHistoryRepository: WorkflowHistoryRepository,
    private readonly workflowFinderService: WorkflowFinderService,
    private readonly workflowService: WorkflowService,
  ) {}

  async list(
    user: User,
    workflowId: string,
    take = 20,
    skip = 0,
  ): Promise<Array<Omit<WorkflowHistory, 'nodes' | 'connections'>>> {
    const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
      'workflow:read',
    ]);
    if (!workflow) return [];

    return await this.workflowHistoryRepository.find({
      where: { workflowId: workflow.id },
      take,
      skip,
      select: ['workflowId', 'versionId', 'authors', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async get(user: User, workflowId: string, versionId: string) {
    const workflow = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
      'workflow:read',
    ]);
    if (!workflow) return null;

    return await this.workflowHistoryRepository.findOne({ where: { workflowId, versionId } });
  }

  async saveSnapshot(user: User, workflow: IWorkflowBase | WorkflowEntity, workflowId: string) {
    try {
      if (!workflow.nodes || !workflow.connections) return;

      await this.workflowHistoryRepository.insert({
        authors: `${(user.firstName ?? '').trim()} ${(user.lastName ?? '').trim()}`.trim() || user.email,
        connections: workflow.connections,
        nodes: workflow.nodes,
        versionId: workflow.versionId,
        workflowId,
      });
    } catch (e) {
      const error = ensureError(e);
      this.logger.error(`Failed to save CE workflow version for workflow ${workflowId}`, {
        error,
      });
    }
  }

  async restore(user: User, workflowId: string, versionId: string) {
    const snapshot = await this.get(user, workflowId, versionId);
    if (!snapshot) return null;

    // Pre-restore snapshot of current
    const current = await this.workflowFinderService.findWorkflowForUser(workflowId, user, [
      'workflow:update',
    ]);
    if (!current) return null;

    await this.saveSnapshot(user, current, workflowId);

    // Apply restore via standard update flow (generates new versionId)
    const updatePayload: Partial<WorkflowEntity> = {
      nodes: snapshot.nodes,
      connections: snapshot.connections,
    } as Partial<WorkflowEntity>;

    return await this.workflowService.update(user, updatePayload as WorkflowEntity, workflowId, undefined, undefined, true);
  }
}

