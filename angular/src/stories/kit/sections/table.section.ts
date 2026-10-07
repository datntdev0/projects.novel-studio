import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonDirective } from '../../../app/components/button/button.directive';
import { IconComponent } from '../../../app/components/icon/icon.component';
import { PillComponent } from '../../../app/components/status/pill.component';

@Component({
  selector: 'app-kit-table',
  styleUrls: ['../kit-section.css'],
  imports: [ButtonDirective, IconComponent, PillComponent],
  template: `
    <h2>Table</h2>
    <div class="table-wrap" data-testid="kit-table">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th class="num">Chapters</th>
            <th><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.id) {
            <tr
              [class.selected]="row.selected"
              [attr.aria-selected]="row.selected ? 'true' : null"
              [attr.data-testid]="'kit-table-row-' + row.id"
            >
              <td>{{ row.name }}</td>
              <td>
                <ns-pill [tone]="row.tone">{{ row.status }}</ns-pill>
              </td>
              <td class="num">{{ row.chapters }}</td>
              <td>
                <div class="actions">
                  <button
                    nsBtn
                    variant="ghost"
                    size="sm"
                    iconOnly
                    type="button"
                    [attr.aria-label]="'Edit row ' + row.id"
                    [attr.data-testid]="'kit-table-row-' + row.id + '-edit'"
                  >
                    <ns-icon name="pencil" size="sm" />
                  </button>
                  <button
                    nsBtn
                    variant="ghost"
                    size="sm"
                    iconOnly
                    type="button"
                    [attr.aria-label]="'Delete row ' + row.id"
                    [attr.data-testid]="'kit-table-row-' + row.id + '-delete'"
                  >
                    <ns-icon name="trash" size="sm" />
                  </button>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <h3>Key-value</h3>
    <dl class="kv" data-testid="kit-kv">
      <dt>Plain</dt>
      <dd>Value</dd>
      <dt>Mono</dt>
      <dd><code>novels -0001</code></dd>
      <dt>Pill</dt>
      <dd><ns-pill tone="success">Ready</ns-pill></dd>
    </dl>
  `,
  host: { 'data-testid': 'kit-section-table' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitTableSection {
  readonly rows = [
    { id: 1, name: 'Default row', tone: 'success', status: 'OK', chapters: '1,203', selected: false },
    { id: 2, name: 'Selected row', tone: 'warning', status: 'Warn', chapters: '37', selected: true },
    { id: 3, name: 'Another row', tone: 'danger', status: 'Failed', chapters: '312 / 746', selected: false },
  ] as const;
}
