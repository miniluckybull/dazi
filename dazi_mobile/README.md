# Dazi Mobile

Dazi 原生手机客户端，基于 Flutter，支持 iOS 与 Android。

## 功能定位

- 通过局域网连接桌面端运行的 `dazi-daemon`。
- 随时浏览项目、编辑 README/schedule、处理审批、与 agent 协作。
- 内置交互式终端（xterm.dart + WebSocket PTY），支持虚拟功能键与手势滚动。

## 开发环境

- Flutter SDK ≥3.6.0
- Dart ≥3.6.0
- iOS: Xcode + CocoaPods
- Android: Android Studio + JDK 17

## 运行

```bash
cd dazi_mobile
flutter pub get
flutter run
```

## 项目结构

```
lib/
├── api/          # Dio 客户端、认证拦截器、REST API 封装
├── models/       # freezed 数据模型
├── providers/    # Riverpod 状态管理
├── services/     # 安全存储、本地缓存、通知、生物识别
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
