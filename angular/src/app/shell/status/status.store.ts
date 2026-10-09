import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { BackendStatus, CliStatus, JobSummary, LibraryStatus } from '@shared/core';
import { BRIDGE } from '../../core/bridge/bridge.token';
import { ErrorService } from '../../core/errors/error.service';

const CLI_NAMES: CliStatus['name'][] = ['claude', 'codex'];

@Injectable({ providedIn: 'root' })
export class StatusStore {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  private readonly clisState = signal<CliStatus[]>(CLI_NAMES.map((name) => ({ name, state: 'unknown', version: null, problemCode: null })));
  private readonly jobsState = signal<JobSummary[]>([]);
  private readonly backendState = signal<BackendStatus | null>(null);
  private readonly libraryState = signal<LibraryStatus | null>(null);
  private readonly pendingJobs = new Map<string, JobSummary>();
  private frame = 0;
  readonly clis = this.clisState.asReadonly();
  readonly jobs = this.jobsState.asReadonly();
  readonly backend = this.backendState.asReadonly();
  readonly library = this.libraryState.asReadonly();
  readonly runningJob = computed(() => this.jobsState().find((job) => job.state === 'running') ?? null);
  readonly attentionCount = computed(() => this.jobsState().filter((job) => job.needsAttention).length);

  constructor() {
    const stopBackend = this.bridge.on('backend:status', (status) => this.backendState.set(status));
    const stopJobs = this.bridge.on('job:progress', (job) => this.queueJob(job));
    inject(DestroyRef).onDestroy(() => {
      stopBackend();
      stopJobs();
      cancelAnimationFrame(this.frame);
    });
    void this.read(this.bridge.invoke('services:detect', null), (clis) => this.clisState.set(clis));
    void this.read(this.bridge.invoke('job:list', null), (jobs) => this.mergeList(jobs));
    void this.read(this.bridge.invoke('backend:getStatus', null), (status) => this.backendState.update((current) => current ?? status));
    void this.read(this.bridge.invoke('library:status', null), (library) => this.libraryState.set(library));
  }

  private async read<T>(request: Promise<T>, apply: (result: T) => void): Promise<void> {
    try {
      apply(await request);
    } catch (error) {
      this.errors.report(error);
    }
  }

  private queueJob(job: JobSummary): void {
    this.pendingJobs.set(job.id, job);
    if (!this.frame) this.frame = requestAnimationFrame(() => this.flush());
  }

  private flush(): void {
    this.frame = 0;
    const updates = [...this.pendingJobs.values()];
    this.pendingJobs.clear();
    this.jobsState.update((jobs) => updates.reduce(upsert, jobs));
  }

  private mergeList(list: JobSummary[]): void {
    const known = new Set([...this.jobsState(), ...this.pendingJobs.values()].map((job) => job.id));
    this.jobsState.update((jobs) => [...list.filter((job) => !known.has(job.id)), ...jobs]);
  }
}

const upsert = (jobs: JobSummary[], job: JobSummary): JobSummary[] => {
  const exists = jobs.some((item) => item.id === job.id);
  return exists ? jobs.map((item) => (item.id === job.id ? job : item)) : [...jobs, job];
};
