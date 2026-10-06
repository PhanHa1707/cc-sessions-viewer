---
title: 安装 Sessions Viewer（macOS / Windows / Linux）
description: 下载 macOS、Windows 或 Linux 版的 Sessions Viewer 安装包，以及未签名的 macOS 构建首次启动被 Gatekeeper 拦下时怎么处理。
---

# 安装 Sessions Viewer（macOS / Windows / Linux）

到 [Releases 页面](https://github.com/jerrywu001/cc-sessions-viewer/releases) 下载对应平台的安装包：

| 平台 | 文件 |
| --- | --- |
| macOS (Apple Silicon + Intel) | `.dmg` |
| Windows x64 | `-setup.exe` / `.msi` |
| Linux x86_64 | `.deb` / `.AppImage` |

## macOS：怎么过 Gatekeeper

> [!IMPORTANT]
> macOS 构建只有 ad-hoc 签名，没有做公证（notarization），所以首次打开会被 Gatekeeper 拦下，提示「无法打开"Sessions Viewer"，因为 Apple 无法检查其是否包含恶意软件」。这表示 Apple 未验证该构建，并不能证明下载安全。只有确认安装包来自本项目 Releases 且愿意信任它时，才继续操作。

### macOS 15 Sequoia 及以后

Apple 在 Sequoia 里去掉了右键「打开」这条后门，改走系统设置：

1. 双击应用一次，把警告关掉。
2. 打开 **系统设置 → 隐私与安全性**，滚到最底部。
3. 在「已阻止使用"Sessions Viewer"」旁边点 **仍要打开**，然后验证身份。
4. 再次启动应用，点 **打开**。

### macOS 14 Sonoma 及以前

在 Finder 里右键（或按住 Control 点击）应用，选 **打开**，弹窗里再点一次 **打开**。做一次就够了。

### 任意 macOS 版本，用终端

仅用于已确认可信的下载：该命令移除隔离属性，会绕过相应 Gatekeeper 检查。优先使用上面的系统设置流程。

```bash
xattr -dr com.apple.quarantine "/Applications/Sessions Viewer.app"
```

如果提示 `Operation not permitted`，先检查文件归属和安装位置，不要直接授予更高权限。

## Linux

`.AppImage` 是便携格式，`chmod +x` 之后直接运行。`.deb` 这样安装：

```bash
sudo apt install ./cc-sessions-viewer_<ver>_amd64.deb
```
