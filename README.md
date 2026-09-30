# snake-game

**再吃一口。** 一个手机优先、带现代街机质感的贪吃蛇小游戏。原生 HTML、CSS、JavaScript，无框架、无后端、无运行时依赖。

## 在线游玩

GitHub Pages：https://zslhentai.github.io/snake-game/

## 功能

- 20 × 20 网格，吃到食物增长一格、增加 10 分；撞墙或撞到身体结束游戏。
- 当前分数、最高分、速度等级；每 30 分适度加速，移动间隔从 180ms 降至最低 70ms。
- 开始、暂停、继续、Game Over、重新开始；填满棋盘可以通关。
- 最高分和音效设置保存在本地；浏览器禁止存储时仍可正常游戏。
- 手机滑动与屏幕方向按钮，支持连续滑动，棋盘触摸不滚动页面。
- 桌面方向键、WASD、空格暂停；切换标签页或窗口失焦自动暂停。
- 可关闭的 Web Audio 音效；支持 Vibration API 的浏览器提供轻微进食和死亡震动。
- 深色网格、柔和荧光、适合手指的按钮；适配竖屏、横屏、小屏与安全区域。

最高分只保存在当前浏览器和设备。iOS Safari 通常不支持网页震动，游戏会自动跳过该反馈。

## 本地运行

需要一个静态 HTTP 服务，因为 JavaScript 使用 ES modules。不要直接双击 HTML 使用 `file://` 打开。

```sh
git clone https://github.com/zslhentai/snake-game.git
cd snake-game
python3 -m http.server 8000
```

打开 http://localhost:8000。手机和电脑在同一局域网时，可打开 `http://电脑局域网IP:8000`（需防火墙允许该端口）。

也可以使用任意静态网站服务器，无须构建或安装依赖。

## 操作

| 操作        | 手机                       | 桌面                              |
| ----------- | -------------------------- | --------------------------------- |
| 开始 / 重开 | 点击开始或重开按钮         | 点击按钮；开始/结束界面也可按空格 |
| 转向        | 在棋盘滑动，或点屏幕方向键 | ↑ ↓ ← → 或 WASD                   |
| 暂停 / 继续 | 暂停按钮或界面继续按钮     | 按钮、空格；Esc 暂停              |
| 音效        | 点击声音按钮               | 点击声音按钮                      |

不能直接反向转弯。输入最多缓冲两个转向，分别在后续两个移动周期执行，避免快速连续操作造成直接反向。开始时默认向右前进。

## GitHub Pages 部署

1. 把代码提交并推送到仓库默认分支 `main`。
2. 在仓库 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch**。
3. 选择 **main** 和 **/(root)**，点击 **Save**。
4. 等待 Pages 构建成功，访问 `https://你的用户名.github.io/snake-game/`。

仓库包含 `.nojekyll`，站点无需构建。所有资源使用相对路径，适合 GitHub Pages 项目路径。其他静态托管服务也可直接部署仓库根目录。

## 代码结构

```text
index.html             页面、HUD、状态界面和操作按钮
style.css              视觉样式、手机横竖屏和紧凑布局
script.js              渲染、计时、输入、音效、存储与生命周期
engine.js              独立的游戏规则与方向缓冲
tests/engine.test.js   游戏规则测试
tests/browser.cjs       可重复运行的真实浏览器验证
package.json           仅用于 Node.js 规则测试，无依赖
```

## 检查与验证

Node.js 18+ 可以运行规则测试，无须 `npm install`：

```sh
npm test
# 或查看每一项结果
nodetests/engine.test.js
```

测试覆盖增长/分数/加速、食物不落在蛇身、撞墙/自撞、移动到已离开的尾巴位置、快速转向防反向、暂停、重开，以及满盘通关。

第一版使用真实 Chromium 进行自动化浏览器验证：

- 390 × 844、390 × 664、320 × 568 竖屏；844 × 390 横屏；1440 × 900 桌面。
- 棋盘和控制按钮在视口内，无横向溢出；紧凑手机布局采用并排控制区。
- 通过浏览器触摸事件验证滑动、方向按钮和滑动时页面不滚动。
- 验证开始、暂停/继续、Game Over、重开后状态重置。
- 验证刷新后最高分和声音开关保留。
- 验证全部方向键及 WASD、空格暂停、窗口失焦暂停；页面无 JavaScript/console 错误。

浏览器验证脚本也已保留，可按需安装开发工具（游戏本身无需依赖）：

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
# 先在另一个终端启动上述 8000 端口静态服务
npm run test:browser
```

可用 `BASE_URL` 指定本地服务地址，用 `BROWSER_PATH` 指定已安装的 Chromium 可执行文件。

以上是 Chromium 的手机模拟验证。真机 iPhone Safari、不同安卓浏览器的触摸、音频和震动手感仍值得进一步实测。

## 后续可优化

真机 Safari/安卓兼容性回归、可选难度档位、离线 PWA。保持纯前端，不引入登录、数据库或后端。
