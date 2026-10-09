import { Component, DestroyRef, Type, inject, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ModuleEmptyComponent } from './module-empty/module-empty.component';
import { findEntry } from './registry/module-registry';
import { ShellPanels } from './shell-panels';
import { ShellStore } from './shell.store';

@Component({
  selector: 'ns-module-host',
  imports: [NgComponentOutlet, ModuleEmptyComponent],
  template: `
    <div style="height: 100%" [attr.data-testid]="'module-host-' + id">
      @if (entry && !entry.load) {
        <ns-module-empty [entry]="entry" />
      } @else {
        <ng-container *ngComponentOutlet="content()" />
      }
    </div>
  `,
})
export class ModuleHostComponent {
  protected readonly id: string = inject(ActivatedRoute).snapshot.data['moduleId'];
  protected readonly entry = findEntry(this.id);
  protected readonly content = signal<Type<unknown> | null>(null);

  constructor() {
    const panels = inject(ShellPanels);
    inject(ShellStore).activate(this.id);
    inject(DestroyRef).onDestroy(() => panels.clear());
    this.entry?.load?.().then((component) => this.content.set(component));
  }
}
