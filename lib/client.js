window.__ModuleLoader__.load({
	id: "dsh-model-endpoint-link",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		// #region constants
		/** Locale namespace owned by this plugin (dictionary keys + slot `t`). */
		const NS = "modelEndpointLink";
		/** Host user-settings namespace owned by this plugin. */
		const SETTINGS_NAMESPACE = "ui-model-endpoint-link";
		/** Field carrying the on/off preference. */
		const FIELD = "enabled";
		/** Default preference: on. */
		const DEFAULT_ENABLED = true;
		/** Session slot this plugin seats a zero-render component on. */
		const SESSION_SLOT = "conversation.session.header.utilities";
		/** Session projection carrying the durable model-selection intent. */
		const SELECTION_PROJECTION = "modelSelection";
		/**
		 * Event contract owned by the balance widget: it listens on `window` for this
		 * name and switches its acconting endpoint to `detail.provider` right away.
		 */
		const EVENT_NAME = "dsh:model-selected";
		/**
		 * One extra re-dispatch shortly after a change. The widget script is injected
		 * into the page independently of this plugin, so a dispatch fired before its
		 * listener is registered would otherwise be lost.
		 */
		const REPEAT_MS = 900;
		const zh = {
			title: "挂件接入点跟随模型",
			description: "切换模型时，右下角余额挂件自动切到该模型所属来源的接入点",
			on: "已开启",
			off: "已关闭"
		};
		const en = {
			title: "Follow model source in the balance widget",
			description: "Switch the bottom-right balance widget to the chosen model's source endpoint",
			on: "On",
			off: "Off"
		};
		// #endregion
		// #region styles
		const css = `
.mel-row{border-bottom:.5px solid var(--dsw-alias-border-l2);align-items:center;gap:8px;padding:16px 0;display:flex}
.mel-rowText{flex-direction:column;flex:1;gap:4px;min-width:0;padding-right:48px;display:flex}
.mel-title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}
.mel-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;font-weight:400;line-height:18px}
.mel-toggle{flex:none;min-width:58px;height:28px;padding:0 12px;border:none;border-radius:14px;cursor:pointer;
  font-size:13px;line-height:28px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}
.mel-toggle[aria-pressed="true"]{background:var(--dsw-alias-state-business-primary,#4d6bfe);color:#fff}
`;
		try {
			if (typeof document !== "undefined") {
				const key = "dsh-model-endpoint-link";
				if (document.querySelector("style[data-plugin-css=" + JSON.stringify(key) + "]") === null) {
					const tag = document.createElement("style");
					tag.dataset.plugin = key;
					tag.dataset.pluginCss = key;
					tag.textContent = css;
					document.head.appendChild(tag);
				}
			}
		} catch (error) {}
		// #endregion
		// #region helpers
		/**
		 * Reduce one projection value to the currently effective selection.
		 * `next` is `pending ?? lastUsed`, so it already reflects a model that was just
		 * picked but not used yet — which is exactly the "switch on selection" moment.
		 * @param value - `modelSelection` projection wire value.
		 * @returns the effective selection, or null.
		 */
		function effectiveSelection(value) {
			try {
				if (value === null || value === void 0) return null;
				const pick = value.next === void 0 || value.next === null ? value.lastUsed : value.next;
				if (pick === null || pick === void 0) return null;
				if (typeof pick.provider !== "string" || pick.provider === "") return null;
				return {
					provider: pick.provider,
					model: typeof pick.model === "string" ? pick.model : ""
				};
			} catch (error) {
				return null;
			}
		}
		/** Dedupe key for one selection. */
		function selectionKey(pick) {
			return pick.provider + "\u0000" + pick.model;
		}
		/**
		 * Publish the selection on the `window` event the balance widget listens to.
		 * @param pick - effective selection.
		 */
		function publishSelection(pick) {
			try {
				window.dispatchEvent(new CustomEvent(EVENT_NAME, {
					detail: {
						provider: pick.provider,
						model: pick.model
					}
				}));
			} catch (error) {}
		}
		// #endregion
		// #region session seat
		/**
		 * Zero-render seat mounted once per Session. Publishes the Session's effective
		 * model selection whenever it changes, so the balance widget follows the model.
		 * Only the Session currently shown in the workspace publishes, so a background
		 * Session cannot hijack the widget.
		 * @param props - composed Session-scope slot props plus this plugin's injected face.
		 * @returns nothing; this component never renders UI.
		 */
		function LinkSeat(props) {
			const enabled = props.getEnabled() === true;
			const selection = props.useProjection(SELECTION_PROJECTION);
			const currentId = props.useSessions((s) => s.current);
			const publishedRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				let timer = 0;
				try {
					if (!enabled) {
						// Re-arm so re-enabling re-syncs even when the model never changed.
						publishedRef.current = null;
						return void 0;
					}
					if (props.sessionId === void 0) return void 0;
					if (currentId !== props.sessionId) return void 0;
					const pick = effectiveSelection(selection);
					if (pick === null) return void 0;
					const key = selectionKey(pick);
					if (publishedRef.current === key) return void 0;
					publishedRef.current = key;
					publishSelection(pick);
					timer = window.setTimeout(() => publishSelection(pick), REPEAT_MS);
				} catch (error) {}
				return () => {
					try {
						window.clearTimeout(timer);
					} catch (error) {}
				};
			}, [
				enabled,
				selection,
				currentId,
				props.sessionId
			]);
			return null;
		}
		// #endregion
		// #region settings row
		/**
		 * Settings → General row: one on/off switch for this plugin.
		 * @param props - composed Settings slot props plus this plugin's injected face.
		 * @returns the preference row.
		 */
		function LinkRow(props) {
			const t = props.t;
			const [enabled, setLocal] = (0, react.useState)(() => props.getEnabled());
			(0, react.useEffect)(() => props.subscribeEnabled(() => setLocal(props.getEnabled())), [props]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: "mel-row",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: "mel-rowText",
					children: [(0, react_jsx_runtime.jsx)("div", {
						className: "mel-title",
						children: t("title")
					}), (0, react_jsx_runtime.jsx)("div", {
						className: "mel-desc",
						children: t("description")
					})]
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mel-toggle",
					"aria-pressed": enabled,
					onClick: () => props.setEnabled(!enabled),
					children: enabled ? t("on") : t("off")
				})]
			});
		}
		// #endregion
		// #region plugin
		const inject = [
			"slots",
			"locale",
			"settingsScope"
		];
		/**
		 * Client plugin body: own the preference, seat the per-Session publisher, and
		 * expose the Settings row.
		 * @param ctx - client cordis context.
		 */
		function apply(ctx) {
			let host;
			try {
				host = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
			} catch (error) {
				host = void 0;
			}
			let current = DEFAULT_ENABLED;
			const listeners = /* @__PURE__ */ new Set();
			const publish = () => {
				for (const listener of [...listeners]) {
					try {
						listener();
					} catch (error) {}
				}
			};
			const adopt = () => {
				const section = host === void 0 ? void 0 : host.getSnapshot().value;
				const raw = section === void 0 || section === null ? void 0 : section[FIELD];
				const next = typeof raw === "boolean" ? raw : DEFAULT_ENABLED;
				if (next === current) return;
				current = next;
				publish();
			};
			if (host !== void 0) {
				ctx.effect(() => host.subscribe(adopt), "model-endpoint-link: settings scope adoption");
				adopt();
			}
			const getEnabled = () => current;
			const subscribeEnabled = (listener) => {
				listeners.add(listener);
				return () => {
					listeners.delete(listener);
				};
			};
			const setEnabled = (value) => {
				const next = value === true;
				if (next === current) return;
				current = next;
				publish();
				if (host !== void 0) {
					try {
						host.set(FIELD, next);
					} catch (error) {}
				}
			};
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "model-endpoint-link: dictionaries");
			ctx.slots.inject(SESSION_SLOT, () => ctx.slots.register({
				name: SESSION_SLOT,
				id: "model-endpoint-link",
				order: 92,
				locale: NS,
				inject: () => ({
					getEnabled,
					subscribeEnabled
				})
			}, LinkSeat));
			ctx.slots.inject("settings.general.item", () => ctx.slots.register({
				name: "settings.general.item",
				id: "model-endpoint-link",
				order: 18,
				locale: NS,
				inject: () => ({
					getEnabled,
					subscribeEnabled,
					setEnabled
				})
			}, LinkRow));
		}
		// #endregion
		exports.LinkSeat = LinkSeat;
		exports.LinkRow = LinkRow;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
