# GT7 Speed Lab — Handoff

## 1. 项目概述
**GT7 Speed Lab** 是一个静态前端站点，模拟 Gran Turismo 7 的视觉语言（HUD 斜切面板、青蓝/橙双色系统、扫描线动画），核心功能是把**圈速时间**和**距离**换算为**平均速度**，并支持 GT7 真实赛道的预设长度。

- **类型**：纯静态站点（无后端）
- **入口**：`index.html`
- **核心交互**：输入 `mm:ss.xxx` 圈速 + 距离 → 输出 km/h 与 mph
- **托管**：任意静态主机；本仓库提供 Docker 化方案

## 2. 仓库结构
```
speedtrans/
├── index.html              # 单页入口（HTML5）
├── css/
│   └── style.css          # GT7 视觉系统 + 响应式 + 动画
├── js/
│   ├── tracks.js          # 15 条 GT7 真实赛道（km 单位）
│   └── app.js             # 时间解析、计算、交互逻辑
├── Dockerfile              # nginx:alpine 多阶段不适用，单阶段即可
├── docker.conf            # nginx 配置（gzip、缓存、安全头）
├── docker-compose.yml     # 一键启动（端口 8081）
├── .dockerignore
├── HANDOFF.md             # 本文件
└── README.md              # 用户面向说明
```

## 3. 本地开发

### 3.1 直接打开（最快）
- 双击 `index.html` 即可在浏览器运行
- 无构建步骤、无依赖

### 3.2 本地服务器（推荐）
```bash
# 任选其一
python3 -m http.server 8000
npx serve .
npx http-server -p 8000
```
访问 `http://localhost:8000`

### 3.3 Docker
```bash
# 构建镜像
docker build -t speedtrans:latest .

# 运行容器（端口 8081）
docker run --rm -d --name speedtrans -p 8081:80 speedtrans:latest

# 或使用 compose
docker compose up -d

# 验证
curl -I http://localhost:8081

# 查看日志
docker logs -f speedtrans

# 停止
docker stop    / docker compose down
```

## 4. 部署

### 4.1 生产环境
- **Docker 镜像小**：基于 `nginx:1.27-alpine`，通常 < 15MB
- **默认端口**：容器内 80，compose 映射到 8081（可在 `docker-compose.yml` 修改）
- **HTTPS**：建议在前面接 nginx / Caddy / Cloudflare 终止 TLS

### 4.2 镜像发布到 GHCR
```bash
# 登录
ghcr.io --with-token < token.txt

# 打 tag
docker build -t ghcr.io/<owner>/speedtrans:1.0.0 .
docker push ghcr.io/<owner>/speedtrans:1.0.0
```

## 5. 关键模块说明

### 5.1 时间格式化（`js/app.js:24`）
```js
function formatTimeInput(raw)
```
- 任意数字输入 → 自动分段为 `mm:ss.xxx`
- 输入 `123456` → 显示 `1:23.456`
- 校验：秒 0-59、毫秒 0-999
- 触发 `parseTimeToSeconds()` 转秒数

### 5.2 速度计算（`js/app.js:111`）
```js
function calculate()
```
- 公式：`v_kmh = distance_km / (total_seconds)`
- 校验时间与距离后调用 `renderResult()`
- 同时输出 km/h 和 mph 两套结果

### 5.3 单位切换（`js/app.js:96`）
```js
function switchUnit(newUnit)
```
- KM ↔ MI 全局切换
- 距离与速度同步换算（1 km = 0.621371 mi）
- 单位指示器动画使用 `clip-path` 斜切形状
- 常量 `KM_PER_MILE = 1.609344`

### 5.4 赛道预设（`js/tracks.js`）
- 15 条 GT7 真实赛道（Nürburgring Nordschleife、Le Mans、Suzuka 等）
- 新增：在数组末尾追加 `{ name, km, country }` 即可

### 5.5 视觉系统（`css/style.css`）
- 颜色变量：`:root` 中的 `--cyan` (#00E5FF) 与 `--orange` (#FF6B1A)
- 字体：Rajdhani (UI)、Orbitron (数字)
- 斜切角：使用 `clip-path: polygon()` 实现 GT7 风格切角
- 发光：所有主交互元素用 `box-shadow` 实现霓虹效果

## 6. 已知约束 / 后续可扩展
- **纯前端**：所有数据本地计算，**无服务端、无持久化**（刷新页面清空）
- **赛道数据硬编码**：未来可改为外部 JSON 加载
- **国际化**：当前仅英文 UI；如需中文 UI，编辑 `index.html` 文案即可
- **可扩展功能**：
  - 圈速对比（PP / Gold / Bronze 评级）
  - 多车手历史保存（localStorage）
  - 圈速分解（sector time）
  - 车辆数据展示（扭矩 / 功率曲线）

## 7. 浏览器兼容
- Chrome / Edge / Safari / Firefox 最近 2 年版本
- 移动端 iOS 14+ / Android 9+
- 使用特性：`clip-path`、`backdrop-filter`、CSS Grid、CSS Variables、ES6+

## 9. 常见问题
**Q: 端口冲突？**
A: 修改 `docker-compose.yml` 中 `- "8081:80"` 为其他端口，例如 `"8888:80"`

**Q: 修改样式后浏览器不更新？**
A: nginx 配置对静态资源设置了 7 天缓存，硬刷新 `Ctrl+Shift+R` 或在 DevTools 禁用缓存

**Q: 镜像太大？**
A: 当前已用 `nginx:alpine`，无需进一步优化。如需极致精简可改用 `nginx:1.27-unprivileged`

## 10. 维护者清单
| 角色 | 责任 |
|---|---|
| 产品 | 需求 / 文案 |
| 前端 | `index.html` / `css/` / `js/` |
| 运维 | `Dockerfile` / `docker-compose.yml` / nginx 配置 |