# Dazi Mobile

Dazi 原生手机客户端，基于 Flutter，支持 iOS 与 Android。

## 已实现功能

- 通过局域网连接桌面端运行的 `dazi-daemon`。
- QR 扫描或手动输入完成 PIN 配对。
- 项目列表（状态/优先级/任务类型/运行时间），下拉刷新。
- 项目详情：README 编辑/预览、交互式终端、日志、上下文。
- 调度编辑：单次/定时/循环，支持动作选择（notify/autopilot）。
- 审批列表与详情：Markdown 计划展示、批准/拒绝。
- 全局记忆编辑：Profile / Facts / Patterns。
- 本地通知：审批请求、任务完成。
- 交互式终端：xterm.dart + WebSocket PTY，虚拟功能键（Esc/Tab/方向键/Ctrl+C/Ctrl+D/PgUp/PgDn/回车/退格）。

## 开发环境

- Flutter SDK ≥3.6.0
- Dart ≥3.6.0
- iOS: Xcode + CocoaPods
- Android: Android Studio + JDK 17 + Android SDK

## 运行

```bash
cd dazi_mobile
flutter pub get
flutter run
```

## 测试

```bash
cd dazi_mobile
flutter test
```

## 项目结构

```
lib/
├── api/          # Dio 客户端、认证拦截器、REST API 封装
├── models/       # freezed 数据模型
├── providers/    # Riverpod 状态管理
├── services/     # 安全存储、本地缓存、通知
├── screens/      # 页面
├── utils/        # 工具类与常量
├── websocket/    # 事件与终端 WebSocket
└── widgets/      # 可复用组件
```

## 配对流程

1. 在电脑启动 `dazi-daemon`，终端会显示局域网地址和 6 位 PIN。
2. 打开手机 App，扫描二维码或手动输入地址和 PIN。
3. App 通过 `/api/v1/pair` 获取 `device_token` 并安全存储。
4. 后续访问使用 Bearer token 鉴权。

## 已知限制

- xterm.dart 当前版本未暴露公共滚动 API，终端回滚暂通过 PgUp/PgDn 键实现。
- 手势滚动、生物识别锁、离线完全可用等特性按路线图后续补齐。
