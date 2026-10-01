# GT7 Speed Lab

Gran Turismo 7 风格的圈速→平均速度换算工具。

## 特性
- **GT7 视觉**：暗色 HUD、斜切面板、青蓝/橙霓虹光晕
- **mm:ss.xxx 毫秒级时间输入**（自动格式化）
- **15 条 GT7 真实赛道预设**（Nürburgring、Le Mans、Suzuka 等）
- **KM / MI 全局切换**
- **数字滚动效果 + 扫描线动画**

## 快速开始

### 浏览器直接打开
双击 `index.html`。

### Docker
```bash
docker compose up -d
# 访问 http://localhost:8081
```

### 手动
```bash
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 使用
1. 输入圈速（如 `123456` 自动转为 `1:23.456`）
2. 选择赛道（自动填入距离）或自定义输入
3. 按 `CALCULATE` 或回车 → 查看结果

详细开发与部署见 [HANDOFF.md](./HANDOFF.md)。

## License
MIT