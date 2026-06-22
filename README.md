# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 分享给 Windows 同事

1. 给当前版本打 tag 并推送：

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. GitHub Actions 会自动构建 Windows 安装包（`.exe` 安装程序 + `.msi`），并上传到 Release。

3. 进入 GitHub 仓库的 **Releases** 页面，推荐下载 `.exe` 文件发给同事（双击按向导安装，更像常见 Windows 软件）。

4. 同事双击 `.exe` 安装即可。安装程序会自动处理 WebView2；若启动时仍提示缺少 WebView2，请安装 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)。
