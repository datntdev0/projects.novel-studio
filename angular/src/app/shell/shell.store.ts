import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { NovelSummary } from '@shared/core';
import { BRIDGE } from '../core/bridge/bridge.token';
import { ErrorService } from '../core/errors/error.service';

@Injectable({ providedIn: 'root' })
export class ShellStore {
  private readonly bridge = inject(BRIDGE);
  private readonly errors = inject(ErrorService);
  private readonly router = inject(Router);
  private readonly activeModuleState = signal('');
  private readonly openNovelState = signal<string | null>(null);
  private readonly novelsState = signal<NovelSummary[]>([]);
  private readonly badgesState = signal<Record<string, number>>({});
  private readonly openChapterState = signal<number | null>(null);
  readonly recentNovels = computed(() => {
    const opened = this.novelsState().filter((novel) => novel.lastOpenedAt);
    const unopened = this.novelsState().filter((novel) => !novel.lastOpenedAt);
    opened.sort((a, b) => (b.lastOpenedAt ?? '').localeCompare(a.lastOpenedAt ?? ''));
    unopened.sort((a, b) => a.title.localeCompare(b.title));
    return [...opened, ...unopened];
  });
  readonly activeModule = this.activeModuleState.asReadonly();
  readonly openNovel = this.openNovelState.asReadonly();
  readonly novels = this.novelsState.asReadonly();
  readonly badges = this.badgesState.asReadonly();
  readonly openChapter = this.openChapterState.asReadonly();

  async load(): Promise<void> {
    try {
      this.novelsState.set(await this.bridge.invoke('library:listNovels', null));
    } catch (error) {
      this.errors.report(error);
    }
  }

  go(id: string): void {
    void this.router.navigate(['/', id]);
  }

  async open(novelId: string): Promise<void> {
    this.openNovelState.set(novelId);
    if (this.activeModuleState() === 'home') this.go('reader');
    try {
      await this.bridge.invoke('library:markNovelOpened', { novelId });
      await this.load();
    } catch (error) {
      this.errors.report(error);
    }
  }

  closeNovel(): void {
    this.openNovelState.set(null);
    this.openChapterState.set(null);
  }

  activate(moduleId: string): void {
    this.activeModuleState.set(moduleId);
    if (moduleId === 'home') this.closeNovel();
  }
}
