import { Injectable } from '@angular/core';

interface Layer {
  close: () => void;
}

@Injectable({ providedIn: 'root' })
export class LayerService {
  private layers: Layer[] = [];

  constructor() {
    document.addEventListener('keydown', (event) => {
      const top = this.layers[this.layers.length - 1];
      if (event.key === 'Escape' && top !== undefined && !event.defaultPrevented) {
        event.preventDefault();
        top.close();
      }
    });
  }

  push(close: () => void): () => void {
    const layer: Layer = { close };
    this.layers.push(layer);
    return () => {
      this.layers = this.layers.filter((item) => item !== layer);
    };
  }
}
