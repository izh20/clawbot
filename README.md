# 🐦 鸟类图库管理系统 (Photo Gallery)

一个专为观鸟爱好者设计的本地照片管理 Web 应用，支持照片管理、EXIF 信息提取、缩略图生成、鸟种识别分类等功能。

---

## 📋 项目简介

本系统是一个基于 **Node.js + Express** 构建的本地照片管理后端服务，搭配前端页面实现照片浏览与管理。

### 核心功能

| 功能 | 描述 |
|------|------|
| 📸 照片上传 | 支持批量上传，自动按日期整理 |
| 🖼️ 缩略图生成 | 自动生成 WebP/AVIF/JPEG 缩略图 |
| 🦜 鸟种识别 | 根据文件夹名称自动识别鸟类 |
| 📊 EXIF 提取 | 提取相机型号、镜头参数、拍摄时间等 |
| 🔍 智能筛选 | 按日期、相机、镜头筛选照片 |
| 🎬 视频支持 | 支持 mp4/mov/avi/mkv/webv 视频 |
| 🤖 AI 分析 | 集成 SuperPicky 进行 AI 鸟种识别 |

---

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **图片处理**: Sharp
- **EXIF 解析**: exifr
- **文件上传**: Multer
- **跨域**: CORS

---

## 📁 项目结构

```
photo-gallery/
├── api/
│   ├── server.js      # 主服务器文件
│   ├── birds.js       # 鸟类数据库 (50+ 鸟种)
│   └── locations.js   # 观鸟地点数据库
├── public/
│   ├── index.html     # 前端页面
│   └── ...
├── scripts/
│   ├── superpicky.scpt    # SuperPicky AI 脚本
│   └── run-superpicky.js
├── package.json
└── .gitignore
```

---

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/zhouheng/photo-gallery
npm install
```

### 2. 配置照片目录

编辑 `api/server.js`，修改照片存储路径：

```javascript
const PHOTO_DIR = '/Volumes/扩展盘512G/bird_photo';  // 改为你的照片目录
```

### 3. 启动服务

```bash
node api/server.js
```

服务启动后访问：**http://localhost:3000**

---

## 📡 API 接口

### 照片管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/photos` | GET | 获取所有照片列表 |
| `/api/upload` | POST | 批量上传照片 |
| `/api/upload-paste` | POST | 粘贴上传图片 |
| `/api/filters` | GET | 获取筛选选项 |
| `/api/thumbnail` | GET | 获取缩略图 |

### 鸟种管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/birds` | GET | 获取所有鸟种及数量 |
| `/api/analyze` | POST | 触发 AI 分析 |

### 视频管理

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/videos` | GET | 获取所有视频 |

---

## 🦜 鸟种数据库

已内置 **50+** 常见鸟类中文名映射：

- 普通翠鸟、棕背伯劳、白头鹎
- 红头长尾山雀、金翅雀、领雀嘴鹎
- 黑尾蜡嘴雀、黑脸噪鹛、乌鸫
- 珠颈斑鸠、白鹭、苍鹭、夜鹭
- 红隼、游隼、普通鵟
- 灰喜鹊、喜鹊、八哥
- ... 更多见 `api/birds.js`

---

## 📍 地点数据库

内置观鸟地点：

- 东京·多摩川河口
- 东京·葛西临海公园
- 东京·上野公园
- 东京·奥多摩湖
- 千叶·谷津干潟
- 神奈川·富士山
- 埼玉·川口

---

## 🔧 高级配置

### 支持的图片格式

```javascript
const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tiff', '.tif', '.dng', '.raw', '.cr2', '.nef', '.arw', '.avif'];
```

### 缩略图配置

- 默认尺寸: 400x400 (保持比例)
- 格式优先级: WebP > AVIF > JPEG
- 存储位置: `.thumbnails/` 隐藏目录

### 照片目录结构

建议按以下方式组织照片：

```
bird_photo/
├── 2024/
│   ├── 2024-01-15/
│   │   └── 普通翠鸟/
│   │       └── IMG_001.jpg
│   └── 2024-01-20/
│       └── 棕背伯劳/
│           └── IMG_002.jpg
├── 3星_优选/
│   └── 普通翠鸟/
└── 1星/
```

---

## 📦 依赖版本

```json
{
  "express": "^5.2.1",
  "sharp": "^0.34.5",
  "exifr": "^7.1.3",
  "multer": "^2.1.1",
  "cors": "^2.8.6"
}
```

---

## 📝 TODO

- [ ] 添加用户认证
- [ ] 支持更多 AI 鸟种识别
- [ ] 照片星级评分功能
- [ ] 地图展示观鸟足迹
- [ ] 照片分享功能

---

## 📖 使用教程

### 1. 启动服务

```bash
cd /Users/zhouheng/photo-gallery
node api/server.js
```

启动成功后，终端显示：
```
Photo gallery API running at http://localhost:3000
Photos directory: /Volumes/扩展盘512G/bird_photo
```

### 2. 访问网页

浏览器打开：**http://localhost:3000**

### 3. 上传照片

#### 方式一：网页上传
- 点击上传按钮，选择照片文件
- 支持批量选择（最多 100 张）
- 照片会自动按拍摄日期整理到对应文件夹

#### 方式二：粘贴上传
- 复制图片到剪贴板
- 在网页中 Ctrl+V 粘贴即可上传

#### 方式三：API 上传
```bash
curl -X POST -F "photos=@/path/to/photo.jpg" \
  http://localhost:3000/api/upload
```

### 4. 浏览照片

- 首页展示所有照片，按拍摄时间排序
- 支持按鸟种、日期、相机、镜头筛选
- 点击照片查看大图和 EXIF 信息

### 5. 鸟种管理

系统会根据**文件夹名称**自动识别鸟种：

```
bird_photo/
├── 2024-01-15/
│   └── 普通翠鸟/          ← 系统识别为"普通翠鸟"
│       └── IMG_001.jpg
```

支持的文件夹命名：
- `普通翠鸟` → Common Kingfisher
- `白鹭` → Little Egret
- `棕背伯劳` → Long-tailed Shrike
- ...（更多见 api/birds.js）

### 6. 星级评定

创建以数字开头的文件夹表示星级：

```
bird_photo/
├── 3星_优选/              ← 3 星
│   └── 普通翠鸟/
│       └── IMG_001.jpg
├── 2星/
└── 1星/
```

### 7. AI 鸟种识别 (SuperPicky)

1. 安装 SuperPicky 应用（macOS）
2. 在网页点击"AI 分析"按钮
3. 系统会调用 AppleScript 运行 SuperPicky
4. 识别结果会自动整理到对应鸟种文件夹

### 8. 视频管理

将视频文件放入照片目录，系统自动识别：

```
bird_photo/
├── 2024-01-15/
│   └── 普通翠鸟/
│       └── video.mp4      ← 自动识别为视频
```

支持格式：mp4, mov, avi, mkv, webm

### 9. 缩略图说明

- 首次访问照片时自动生成缩略图
- 存储在 `.thumbnails/` 隐藏目录
- 支持 WebP、AVIF、JPEG 三种格式
- 客户端优先使用 WebP/AVIF（更小更快）

---

## ⚠️ 注意事项

1. **照片目录**：首次运行前需修改 `api/server.js` 中的 `PHOTO_DIR` 路径
2. **磁盘空间**：缩略图会占用额外空间，建议定期清理 `.thumbnails`
3. **大文件**：上传限制 1GB/次
4. **权限**：确保照片目录有读写权限

---

## 🔧 常见问题

**Q: 上传后照片看不到？**
> A: 检查照片目录路径是否正确，确认文件夹有读写权限

**Q: 缩略图生成失败？**
> A: 检查 Sharp 是否正确安装，尝试重新 `npm install`

**Q: EXIF 信息读取不到？**
> A: 部分 RAW 格式不支持，尝试转换为 JPEG/PNG 后上传

**Q: 如何更新鸟种数据库？**
> A: 编辑 `api/birds.js`，添加新的鸟种映射

---

## 📄 许可证

MIT License

---

## 👤 作者

Frank (@izh20)

---

*本项目用于个人观鸟照片管理，欢迎改进！*
