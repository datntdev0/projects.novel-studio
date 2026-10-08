import { Component, Type, inject, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { findEntry } from './registry/module-registry';

@Component({
  selector: 'ns-module-host',
  imports: [NgComponentOutlet],
  template: '<div [attr.data-testid]="\'module-host-\' + id"><ng-container *ngComponentOutlet="content()" /></div>',
})
export class ModuleHostComponent {
  protected readonly id: string = inject(ActivatedRoute).snapshot.data['moduleId'];
  protected readonly content = signal<Type<unknown> | null>(null);

  constructor() {
    findEntry(this.id)
      ?.load?.()
      .then((component) => this.content.set(component));
  }
}
