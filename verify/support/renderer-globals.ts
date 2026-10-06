export type RendererGlobals = {
  novelStudio: { invoke(channel: string, req?: unknown): Promise<{ ok: boolean; error: { code: string } }>; on: unknown };
  document: {
    head: { appendChild(node: unknown): void };
    body: { appendChild(node: unknown): void; innerText: string };
    createElement(tag: string): Record<string, unknown>;
  };
  location: { href: string };
  open(url: string): unknown;
  setTimeout(fn: () => void): void;
  remoteScriptRan?: boolean;
};
