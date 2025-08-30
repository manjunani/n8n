<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useWorkflowsStore } from '@/stores/workflows.store';
import {
  listWorkflowVersions,
  getWorkflowVersion,
  restoreWorkflowVersion,
} from '@n8n/rest-api-client/api/workflowVersions';
import type { INode, IConnections } from 'n8n-workflow';
import NodeDiff from '@/features/workflow-diff/NodeDiff.vue';
import { useRootStore } from '@n8n/stores/useRootStore';

type VersionMeta = { versionId: string; authors: string; createdAt: string; updatedAt: string };

const route = useRoute();
const router = useRouter();
const toast = useToast();
const workflowsStore = useWorkflowsStore();
const rootStore = useRootStore();

const workflowId = computed(() => String(route.params.workflowId ?? ''));
const selectedVersionId = ref<string | undefined>(String(route.params.versionId ?? ''));
const versions = ref<VersionMeta[]>([]);
const loading = ref(false);

const currentJson = ref('');
const versionJson = ref('');

async function loadList() {
  loading.value = true;
  try {
    const data = await listWorkflowVersions(rootStore.restApiContext, workflowId.value, 50, 0);
    versions.value = data as VersionMeta[];
    if (!selectedVersionId.value && versions.value.length) {
      selectedVersionId.value = versions.value[0].versionId;
      void router.replace({ params: { ...route.params, versionId: selectedVersionId.value } });
    }
  } catch (e) {
    toast.showError(e, 'Failed to load versions');
  } finally {
    loading.value = false;
  }
}

async function loadDiff() {
  if (!selectedVersionId.value) return;
  try {
    const [wf, ver] = await Promise.all([
      workflowsStore.fetchWorkflow(workflowId.value),
      getWorkflowVersion(rootStore.restApiContext, workflowId.value, selectedVersionId.value),
    ]);
    const current = { nodes: wf.nodes as INode[], connections: wf.connections as IConnections };
    currentJson.value = JSON.stringify(current, null, 2);
    versionJson.value = JSON.stringify({ nodes: ver.nodes, connections: ver.connections }, null, 2);
  } catch (e) {
    toast.showError(e, 'Failed to load version');
  }
}

async function restore() {
  if (!selectedVersionId.value) return;
  try {
    await restoreWorkflowVersion(rootStore.restApiContext, workflowId.value, selectedVersionId.value);
    toast.showMessage({ title: 'Restored', message: 'Workflow restored to selected version' });
    await loadDiff();
  } catch (e) {
    toast.showError(e, 'Failed to restore version');
  }
}

function download() {
  if (!versionJson.value) return;
  const blob = new Blob([versionJson.value], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `workflow-${workflowId.value}-${selectedVersionId.value}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

onMounted(async () => {
  await loadList();
  await loadDiff();
});

watch(
  () => route.params.versionId,
  async (v) => {
    selectedVersionId.value = v ? String(v) : selectedVersionId.value;
    await loadDiff();
  },
);

function selectVersion(v: VersionMeta) {
  void router.push({ params: { ...route.params, versionId: v.versionId } });
}
</script>

<template>
  <div class="tw-flex tw-h-full">
    <aside class="tw-w-80 tw-border-r tw-border-foreground-base tw-overflow-auto">
      <div class="tw-p-3 tw-font-semibold">Versions</div>
      <ul>
        <li
          v-for="v in versions"
          :key="v.versionId"
          class="tw-cursor-pointer tw-px-3 tw-py-2 hover:tw-bg-foreground-base/20"
          :class="{ 'tw-bg-foreground-base/10': v.versionId === selectedVersionId }"
          @click="selectVersion(v)"
        >
          <div class="tw-text-xs tw-text-foreground-dark">{{ new Date(v.createdAt).toLocaleString() }}</div>
          <div class="tw-text-sm">{{ v.authors || 'Unknown' }}</div>
          <div class="tw-text-2xs tw-text-foreground-dark">{{ v.versionId }}</div>
        </li>
      </ul>
    </aside>
    <section class="tw-flex-1 tw-flex tw-flex-col">
      <div class="tw-flex tw-justify-between tw-items-center tw-border-b tw-border-foreground-base tw-p-3">
        <div class="tw-font-semibold tw-flex tw-items-center tw-gap-3">
          <span>Diff vs Current</span>
          <a
            href="https://github.com/n8n-io/n8n/blob/master/docs/CE_WORKFLOW_VERSIONING.md"
            target="_blank"
            rel="noopener"
            class="tw-text-primary"
          >Learn more</a>
        </div>
        <div class="tw-flex tw-gap-2">
          <n8n-button size="small" @click="download" :disabled="!selectedVersionId">Download</n8n-button>
          <n8n-button size="small" type="primary" @click="restore" :disabled="!selectedVersionId">Restore</n8n-button>
        </div>
      </div>
      <div class="tw-flex-1 tw-overflow-auto">
        <NodeDiff :old-string="versionJson" :new-string="currentJson" output-format="side-by-side" />
      </div>
    </section>
  </div>
  <div v-if="loading" class="tw-absolute tw-inset-0 tw-bg-black/20" />
  
</template>

<style scoped>
</style>
