import { DOCUMENT, inject, provideEnvironmentInitializer, type EnvironmentProviders } from '@angular/core';
import sprite from '../../../assets/icons.svg';

export const provideIconSprite = (): EnvironmentProviders =>
  provideEnvironmentInitializer(() => inject(DOCUMENT).body.insertAdjacentHTML('afterbegin', sprite));
