# Better AX for Computer Use

[English](README.md) | [简体中文](README.zh-CN.md)

[![Tests](https://github.com/hqhq1025/better-ax-for-computer-use/actions/workflows/test.yml/badge.svg)](https://github.com/hqhq1025/better-ax-for-computer-use/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Better AX for Computer Use 是面向 AI 编程代理的开源无障碍工程 skill。
它帮助开发者改善源码可改应用的可访问性树（AX）、DOM/ARIA 语义、目标身份、
焦点和动作结果验证，让 Computer Use 代理能够理解并操作真实界面。

这里的 AX 不只指 macOS Accessibility，也包括浏览器可访问性树、Windows UI
Automation 等平台接口。项目提供开发工作流、平台指南和一个轻量 Chromium AX
审计脚本，不是电脑控制运行时，也不是无障碍认证工具。

## 适用场景

- 代理看得见按钮，却无法识别、区分或可靠操作。
- React / Electron 控件缺少名称，虚拟列表复用后操作了错误对象。
- SwiftUI、Qt、Canvas 等自绘控件需要与真实业务状态一致的语义表示。
- 输入框的显示值变了，但应用状态没更新；点击保存后数据没有持久化。
- 需要审计某个面板的 Computer Use 可用性，并明确哪些状态尚未验证。

例如，保存按钮需要有可理解的名称和状态；点击后还要确认目标记录真的保存。
只修复名称、只看到 AX 节点或只收到动作成功响应，都不等于完整流程通过。

## 安装与调用

以 Codex 用户级安装为例：

```sh
mkdir -p ~/.agents/skills
git clone https://github.com/hqhq1025/better-ax-for-computer-use.git \
  ~/.agents/skills/better-ax-for-computer-use
```

已有同名目录时不要覆盖。更新前检查本地修改；客户端未刷新 skill 列表时，
可在新会话中调用：

```text
用 $better-ax-for-computer-use 审计这个 Electron 设置面板的 AX。
只报告问题和未覆盖的状态，不改代码。
```

```text
用 $better-ax-for-computer-use 修复这个自绘滑块的可访问性语义。
验证语义调节能够更新真实设置，并在重新加载后保留。
```

其他编程代理可以读取 [SKILL.md](SKILL.md) 和相对路径引用。
自动发现、权限和调用语法取决于客户端；本项目未认证所有客户端的端到端兼容性。

## 工作流

1. 确定本次范围，盘点界面、控件和条件状态。
2. 检查实际消费者能读到的语义树，明确缺失的 frame 或窗口。
3. 在控件及权威应用状态中修复名称、角色、状态、动作和焦点。
4. 区分业务对象 ID 与临时节点引用，重新解析当前目标。
5. 执行动作后重新观察，核对具体业务效果。
6. 报告实际覆盖范围、测试结果及剩余风险。

只读审计不授权修改源码或执行改变状态的探测。源码可改的自绘界面可以在应用内
修复；不可内修的闭源目标需要另行确定外部 adapter 任务。

## 运行离线审计

支持基线为 Node.js 22 或更新版本。离线检查与单元测试不需要 npm 依赖：

```sh
# 合成缺陷示例：控件无名称，退出码 1。
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-before.json

# 补齐名称和 checkbox 状态后，有限检查通过，退出码 0。
node scripts/audit_chromium_ax.mjs --tree-file examples/ax-after.json

# 执行工具回归与文档检查。
node --test scripts/*.test.mjs
```

输入为 CDP AX 节点数组或 `{"nodes": [...]}`。示例是合成测试数据，不是真实用户
记录，也不证明业务操作成功。

实时采集需要目标工作区已有 `playwright` 或 `@playwright/test`；
启动浏览器模式还需要对应的 Chromium：

```sh
# 从目标工作区执行，以解析该工作区的 Playwright。
node ~/.agents/skills/better-ax-for-computer-use/scripts/audit_chromium_ax.mjs \
  --url http://127.0.0.1:3000

# 仅连接已经获准使用的调试端点。
node ~/.agents/skills/better-ax-for-computer-use/scripts/audit_chromium_ax.mjs \
  --cdp http://127.0.0.1:9222 --page-title "My App"
```

不指定标题时，CDP 模式要求只有一个 context 和一个 page；指定标题时，
必须恰好匹配一个页面。脚本不会创建或导航已有用户页面。

| 退出码 | 含义 |
|---|---|
| `0` | 有限检查未发现阻断问题，仍需阅读警告 |
| `1` | 有效树为空，或可操作控件缺少名称 |
| `2` | 参数、输入、采集或清理过程出错 |

脚本不保证 iframe/OOPIF 全覆盖，不验证完整键盘操作、原生平台桥接、引用新鲜度
或业务结果。多个 main、重名及缺失状态需要上下文复核。
报告可能含私人标签和名称；共享前脱敏。`--output` 会覆盖指定路径的已有文件。

## 平台与验证边界

| 平台 | 提供内容 | 未包含的保证 |
|---|---|---|
| Web / React / Chromium | DOM/ARIA、焦点、输入与部分 AX 审计 | 完整无障碍认证或业务流程通过 |
| Electron | renderer、iframe 与原生窗口边界指南 | 原生菜单、窗口及 OS AX 全覆盖 |
| AppKit / SwiftUI | 原生控件、虚拟语义、持久化路径指南 | 原生测试运行器 |
| Windows UIA / Qt / GTK | 控件类型、动作、状态和平台桥接指南 | 各平台完整端到端验证 |

原有 46 项审计工具测试使用离线 fixture 和 fake browser。
文档中的平台覆盖不等于这些平台已经通过真实应用测试。

## 常见问题

### 和普通 a11y 检查有什么区别？

无障碍检查能够发现部分语义缺陷。本 skill 还要求区分目标定位、动作投递与业务
结果，并指导源码修复。它补充人类辅助技术测试，不替代 WCAG 评估。

### 会安装 MCP server 或后台录制吗？

不会。项目没有电脑控制服务、后台录制器或隐藏 agent UI。
可选审计脚本通过已授权的 Playwright/CDP 连接读取 Chromium AX。

### Save 超时后可以直接重试吗？

不能仅因超时就重试。先确认操作终态或已有幂等保障；一次观察没看到效果，
不能证明旧操作不会稍后提交。结果仍未知时停止，避免重复写入。

### 在 Computer Use 生态中属于哪一层？

本项目改善被操作应用的语义。运行时负责执行动作，外部 adapter 弥补不可内修
目标的缺口，录制与回放工具提供演示或回归素材。可参阅
[Awesome Computer Use Ecosystem](https://github.com/hqhq1025/awesome-computer-use-ecosystem)。

## 文档与贡献

详细指南目前使用英文：

- [Skill 入口](SKILL.md)
- [开发检查表](references/developer-checklist.md)
- [平台实现模式](references/platform-patterns.md)
- [消费者契约与负例](references/consumer-contract.md)
- [验证与完成标准](references/verification.md)
- [公开来源与生态参考](references/evidence-and-ecosystem.md)
- [机器可读项目事实](project.json) 与 [纯文本索引](llms.txt)
- [贡献指南](CONTRIBUTING.md)

由 [Haoqing Wang](https://github.com/hqhq1025) 创建和维护，采用 [MIT](LICENSE)
许可证。本项目独立于 OpenAI、Apple、Microsoft 及所引用的生态项目。
