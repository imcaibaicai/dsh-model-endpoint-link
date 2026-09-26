# dsh-model-endpoint-link

简体中文 | [English](README.en.md)

A browser-only DSH plugin that **broadcasts the current session's effective model selection as a window event** (`dsh:model-selected`) the moment it changes, notifying anything that cares about that moment. The known primary consumer is the bottom-right balance widget `dsh-whale-widget` (a third-party plugin), which listens for this event to switch its accounting endpoint. Pure event bridge — it reads and writes no widget configuration.

## The problem it solves

Take the balance widget as the example: it supports per-endpoint accounting, where an endpoint is a DSH **provider route id**. The widget's own `view.mode = auto` is named "follow the current session endpoint", but it only updates **after a real request round**.

This plugin adds "notify at the moment of selection": the user picks a model in the dropdown → the model's source is broadcast immediately. Any script listening for `dsh:model-selected` on `window` receives `{ provider, model }`.

## How it works (zero changes to the consumer)

- Seated on the **session-level** slot `conversation.session.header.utilities` (zero-render component, one per session)
- Reads the session projection **`modelSelection`**: `{ lastUsed, next }`, taking `next ?? lastUsed`
  ⇒ `next = pending ?? lastUsed`, so the moment the user picks a model (writes the `model/selection` event), `next` **is** the new model
- Dispatches `window.dispatchEvent(new CustomEvent('dsh:model-selected', { detail: { provider, model } }))`
- **Only the session currently on stage dispatches** (`useSessions(s => s.current) === sessionId`), so a background session cannot hijack the consumer
- Dedupes identical selections; on change it re-dispatches once (after 900ms) in case the consumer script has not registered its listener yet
- **Reads and writes no third-party configuration and calls no third-party route** — pure event

## Toggle

Settings → General → "Follow model source in the balance widget", on by default. Off returns every component to its own logic.

## Install

```bash
dsh plugin --profile web add -w dsh-model-endpoint-link
```

Manual equivalent: place the package at `<DSH_HOME>/profiles/node_modules/dsh-model-endpoint-link/` and add a row to `cordis.patch.yml`:

```yaml
- insert:
    - id: model-endpoint-link
      name: 'dsh-model-endpoint-link'
```

## Uninstall

Delete the insert row (requires a full DSH restart — plugin rows are assembled at startup).

## Known behavior

- If the switched-to source does **not exist yet** in the widget's ledger: the widget adds a placeholder option to its settings dropdown (the widget's own existing behavior, **no on-disk endpoint record is created**); an empty ledger display for that source is the expected result.

## Compatibility

- DeepSeek Harness `0.1.5-rc.1` (web profile, browser side)
- Client-side `require` limited to `react` / `react/jsx-runtime` (platform baseline table)
- The `dsh:model-selected` event contract is defined and consumed by `dsh-whale-widget`; this plugin is only the dispatcher

## License

MIT
