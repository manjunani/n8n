import { PaginationDto } from '@n8n/api-types';
import { Logger, LicenseState } from '@n8n/backend-common';
import { AuthenticatedRequest } from '@n8n/db';
import { Param, Post, Get, RestController, ProjectScope, Query } from '@n8n/decorators';

import { WorkflowVersionCeService } from './workflow-version.service';
import { WorkflowFinderService } from '@/workflows/workflow-finder.service';

const DEFAULT_TAKE = 20;

@RestController('/workflows')
export class WorkflowVersionsCeController {
  constructor(
    private readonly logger: Logger,
    private readonly ceVersions: WorkflowVersionCeService,
    private readonly licenseState: LicenseState,
    private readonly workflowFinderService: WorkflowFinderService,
  ) {}

  @Get('/:workflowId/versions')
  @ProjectScope('workflow:read')
  async list(
    req: AuthenticatedRequest,
    @Param('workflowId') workflowId: string,
    @Query query: PaginationDto,
  ) {
    // If EE history is licensed, CE endpoint returns empty to avoid duplication.
    if (this.licenseState.isWorkflowHistoryLicensed()) return [];
    return await this.ceVersions.list(
      req.user!,
      workflowId,
      query.take ?? DEFAULT_TAKE,
      query.skip ?? 0,
    );
  }

  @Get('/:workflowId/versions/:versionId')
  @ProjectScope('workflow:read')
  async get(
    req: AuthenticatedRequest,
    @Param('workflowId') workflowId: string,
    @Param('versionId') versionId: string,
  ) {
    if (this.licenseState.isWorkflowHistoryLicensed()) return null;
    return await this.ceVersions.get(req.user!, workflowId, versionId);
  }

  @Post('/:workflowId/versions')
  @ProjectScope('workflow:update')
  async snapshot(req: AuthenticatedRequest, @Param('workflowId') workflowId: string) {
    if (this.licenseState.isWorkflowHistoryLicensed()) return { skipped: true };
    const wf = await this.workflowFinderService.findWorkflowForUser(
      workflowId,
      req.user!,
      ['workflow:read'],
    );
    if (!wf) return { success: false };
    await this.ceVersions.saveSnapshot(req.user!, wf, workflowId);
    return { success: true };
  }

  @Post('/:workflowId/versions/:versionId/restore')
  @ProjectScope('workflow:update')
  async restore(
    req: AuthenticatedRequest,
    @Param('workflowId') workflowId: string,
    @Param('versionId') versionId: string,
  ) {
    if (this.licenseState.isWorkflowHistoryLicensed()) return { skipped: true };
    const updated = await this.ceVersions.restore(req.user!, workflowId, versionId);
    return { success: !!updated };
  }
}
