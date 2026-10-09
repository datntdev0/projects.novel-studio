import { Directive, ElementRef, OnDestroy, computed, inject, input } from '@angular/core';
import { PanelSide } from '@shared/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { LayoutStore } from './layout.store';

const SIZE_PROPERTIES: Record<PanelSide, string> = { left: '--cur-left-w', right: '--cur-right-w', bottom: '--cur-bottom-h' };

@Directive({
  selector: '[nsResizer]',
  host: { '[attr.title]': 'title()', '(pointerdown)': 'start($event)', '(dblclick)': 'layout.resetPanel(nsResizer())' },
})
export class ResizerDirective implements OnDestroy {
  readonly nsResizer = input.required<PanelSide>();
  protected readonly layout = inject(LayoutStore);
  protected readonly title = computed(() => this.i18n.t('layout.resizer'));
  private readonly i18n = inject(I18nService);
  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private stopDrag: (() => void) | null = null;

  start(event: PointerEvent): void {
    event.preventDefault();
    this.stopDrag?.();
    const side = this.nsResizer();
    const origin = side === 'bottom' ? event.clientY : event.clientX;
    const base = parseFloat(getComputedStyle(this.host).getPropertyValue(SIZE_PROPERTIES[side]));
    const move = (e: PointerEvent): void => {
      const delta = side === 'bottom' ? origin - e.clientY : side === 'left' ? e.clientX - origin : origin - e.clientX;
      this.layout.resize(side, base + delta);
    };
    const up = (): void => {
      this.stopDrag?.();
      void this.layout.save();
    };
    this.host.setPointerCapture(event.pointerId);
    this.host.classList.add('dragging');
    this.host.addEventListener('pointermove', move);
    this.host.addEventListener('pointerup', up);
    this.stopDrag = () => {
      this.host.removeEventListener('pointermove', move);
      this.host.removeEventListener('pointerup', up);
      this.host.classList.remove('dragging');
      this.stopDrag = null;
    };
  }

  ngOnDestroy(): void {
    this.stopDrag?.();
  }
}
