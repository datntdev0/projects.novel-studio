import { Component, TemplateRef, afterNextRender, inject, signal, viewChild } from '@angular/core';
import type { Assignments, CliStatus, JobSummary, LibraryStats, LibraryStatus } from '@shared/core';
import { BRIDGE } from '../../app/core/bridge/bridge.token';
import { ErrorService } from '../../app/core/errors/error.service';
import { ShellPanels } from '../../app/shell/shell-panels';
import { ShellStore } from '../../app/shell/shell.store';
import { ProbeFoundationComponent } from './foundation/probe-foundation.component';

@Component({ selector: 'ns-probe', imports: [ProbeFoundationComponent], templateUrl: './probe.component.html' })
export class ProbeComponent {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  private readonly panels = inject(ShellPanels);
  protected readonly store = inject(ShellStore);
  protected readonly status = signal<LibraryStatus | null>(null);
  protected readonly stats = signal<LibraryStats | null>(null);
  protected readonly clis = signal<CliStatus[]>([]);
  protected readonly assignments = signal<Assignments | null>(null);
  protected readonly jobs = signal<JobSummary[]>([]);
  private readonly left = viewChild.required<TemplateRef<unknown>>('left');
  private readonly right = viewChild.required<TemplateRef<unknown>>('right');
  private readonly bottom = viewChild.required<TemplateRef<unknown>>('bottom');

  constructor() {
    afterNextRender(() => {
      this.panels.set('left', this.left());
      this.panels.set('right', this.right());
      this.panels.set('bottom', this.bottom());
    });
    void this.loadValues();
  }

  protected openFirstNovel(): void {
    const first = this.store.novels()[0];
    if (first) void this.store.open(first.id);
  }

  private async loadValues(): Promise<void> {
    try {
      this.status.set(await this.bridge.invoke('library:status', null));
      this.stats.set(await this.bridge.invoke('data:libraryStats', null));
      this.clis.set(await this.bridge.invoke('services:detect', null));
      this.assignments.set(await this.bridge.invoke('settings:assignments', null));
      this.jobs.set(await this.bridge.invoke('job:list', null));
    } catch (error) {
      this.errors.report(error);
    }
  }
}
