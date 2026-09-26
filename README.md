# dsh-model-endpoint-link

[English](README.en.md) | 简体中文

DSH 浏览器端插件：**把「当前会话选中的模型来源」广播成一个 window 事件**（`dsh:model-selected`），
在用户选中模型的那一刻就通知到关心这件事的组件。已知主要消费者是右下角余额挂件
`dsh-whale-widget`（第三方插件）——它监听这个事件来切换自己的接入点记账。纯事件桥，不读不写任何挂件配置。

## 它解决什么

以余额挂件为例：挂件支持"分接入点记账"，接入点 = DSH 的 **provider 路由 id**。
挂件自己的 `view.mode = auto` 虽然叫"跟随当前会话接入点"，但要等**一轮真正发请求**之后才更新。

本插件补上"**选中的那一刻就通知**"：用户在下拉里选模型 → 立刻广播该模型所属的来源。
任何监听 `window` 上 `dsh:model-selected` 事件的脚本都能收到 `{ provider, model }`。

## 它怎么做到的（零改动消费者）

- 挂在**会话级**插槽 `conversation.session.header.utilities`（零渲染组件，每会话一个）
- 读会话投影 **`modelSelection`**：`{ lastUsed, next }`，取 `next ?? lastUsed`
  ⇒ `next = pending ?? lastUsed`，用户刚选中（写 `model/selection` 事件）时 `next` **立刻**就是新模型
- 派发 `window.dispatchEvent(new CustomEvent('dsh:model-selected', { detail: { provider, model } }))`
- **只在"当前正在看的那个会话"里派发**（`useSessions(s => s.current) === sessionId`），
  避免后台会话把消费者带跑偏
- 同一 selection 去重；变化时会补发一次（900ms 后），防止消费者脚本尚未注册监听时丢事件
- **不读不写任何第三方配置、不调任何第三方路由** —— 纯事件

## 开关

设置 → 通用 → 「挂件接入点跟随模型」，默认开启。关掉后各组件回到自身逻辑。

## 安装

```bash
dsh plugin --profile web add -w dsh-model-endpoint-link
```

手动等价方式：包放到 `<DSH_HOME>/profiles/node_modules/dsh-model-endpoint-link/`，在 `cordis.patch.yml` 加一条：

```yaml
- insert:
    - id: model-endpoint-link
      name: 'dsh-model-endpoint-link'
```

## 卸载

删掉那条 insert（需要完整重启 DSH，插件行只在启动时组装）。

## 已知行为

- 若切到的来源在挂件账本里**还没有**：挂件会在设置面板下拉里补一个占位 option
  （挂件自身既有行为，**不落盘建接入点记录**）；挂件显示该来源的空账是预期结果。

## 兼容性

- DeepSeek Harness `0.1.5-rc.1`（web profile，浏览器端）
- 客户端仅 require `react` / `react/jsx-runtime`（平台基线表内）
- 事件契约 `dsh:model-selected` 由 `dsh-whale-widget` 定义并消费；本插件只做发射端

## License

MIT
