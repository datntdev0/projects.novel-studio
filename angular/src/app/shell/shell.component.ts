import { Component, computed, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { findEntry } from './registry/module-registry';
import { ShellPanels } from './shell-panels';

@Component({
  selector: 'ns-shell',
  imports: [NgTemplateOutlet, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly panels = inject(ShellPanels);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: '' },
  );
  private readonly entry = computed(() => findEntry(this.url().split(/[/?#]/)[1] ?? ''));
  private readonly shown = computed(() => {
    const entry = this.entry();
    return {
      left: !!entry?.load && entry.panels.left,
      right: !!entry?.load && entry.panels.right,
      bottom: !!entry?.load && entry.panels.bottom,
    };
  });
  protected readonly columns = computed(
    () => `var(--rail-w) ${this.shown().left ? 'var(--left-w)' : '0'} minmax(0, 1fr) ${this.shown().right ? 'var(--right-w)' : '0'}`,
  );
  protected readonly rows = computed(() => `var(--top-h) minmax(0, 1fr) ${this.shown().bottom ? 'var(--bottom-h)' : '0'} var(--status-h)`);
}
