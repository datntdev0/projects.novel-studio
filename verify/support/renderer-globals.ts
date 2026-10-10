export type InvokeResult = { ok: boolean; value?: unknown; error: { code: string; message: string } };

export type RendererGlobals = {
  dreamerStudio: { invoke(channel: string, req?: unknown): Promise<InvokeResult>; on: unknown };
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
