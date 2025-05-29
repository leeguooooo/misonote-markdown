# SimuLive API 接口文档

本文档描述了 SimuLive 自动化直播推流系统的完整 API 接口。

## 基础信息

- **基础URL**: `http://localhost:7007` (开发环境)
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`
- **版本**: 1.0.0

## 认证

所有API请求都需要在请求头中包含有效的JWT token：

```
Authorization: Bearer <your-jwt-token>
```

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    // 具体的响应数据
  }
}
```

### 错误响应

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "错误描述",
  "data": null
}
```

## 任务状态说明

| 状态 | 描述 |
|------|------|
| `pending_transcoding` | 等待转码 |
| `pending_start` | 等待开始 |
| `transcoding` | 转码中 |
| `streaming` | 推流中 |
| `transcoding_failed` | 转码失败 |
| `streaming_failed` | 推流失败 |
| `canceled` | 已取消 |
| `completed` | 已完成 |

## 优先级说明

| 值 | 描述 |
|----|------|
| 1 | 低优先级 |
| 2 | 普通优先级（默认） |
| 3 | 高优先级 |

## 触发类型说明

| 类型 | 描述 |
|------|------|
| `manual` | 手动触发 |
| `scheduled` | 定时触发 |

---

# API 接口

## 任务管理

### 1. 创建直播任务

**POST** `/api/task/create`

创建一个新的直播推流任务，支持定时和手动触发。

#### 请求参数

**请求体** (application/json):

```json
{
  "task_name": "产品发布会直播",
  "priority": 2,
  "trigger_type": "scheduled",
  "start_time": "2025-03-01T10:00:00Z",
  "end_time": "2025-03-01T12:00:00Z",
  "max_transcoding_retry_count": 3,
  "max_streaming_retry_count": 3,
  "created_by_user_id": 123,
  "video_source": "https://example.com/video.mp4",
  "room_name": "产品发布会直播间",
  "room_description": "2025年春季新品发布会",
  "anchor_name": "主播小王",
  "remark": "重要活动，请确保推流质量",
  "enable_loop_streaming": true,
  "loop_end_time": "2025-03-01T18:00:00Z",
  "max_loop_count": 5
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `task_name` | string | ✅ | 任务名称 (1-255字符) |
| `priority` | number | ❌ | 优先级 (1-3，默认2) |
| `trigger_type` | string | ✅ | 触发类型 (`manual` 或 `scheduled`) |
| `start_time` | string | ❌ | 开始时间 (ISO 8601格式，scheduled类型必填) |
| `end_time` | string | ❌ | 结束时间 (ISO 8601格式) |
| `max_transcoding_retry_count` | number | ❌ | 最大转码重试次数 (0-100，默认3) |
| `max_streaming_retry_count` | number | ❌ | 最大推流重试次数 (0-100，默认3) |
| `created_by_user_id` | number | ✅ | 创建者用户ID |
| `video_source` | string | ✅ | 视频源URL |
| `room_name` | string | ✅ | 直播间名称 (1-255字符) |
| `room_description` | string | ❌ | 直播间描述 (1-255字符) |
| `anchor_name` | string | ✅ | 主播名称 (1-255字符) |
| `remark` | string | ❌ | 备注 (1-255字符) |
| `enable_loop_streaming` | boolean | ❌ | 是否启用循环推流 |
| `loop_end_time` | string | ❌ | 循环结束时间 (ISO 8601格式) |
| `max_loop_count` | number | ❌ | 最大循环次数 (1-1000) |

**验证规则**:
- 对于 `scheduled` 触发类型，`start_time` 是必填的
- 如果启用循环推流，必须设置 `loop_end_time` 或 `max_loop_count` 之一

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": 123,
    "manage_site_id": "site_001",
    "task_name": "产品发布会直播",
    "status": "pending_transcoding",
    "priority": 2,
    "trigger_type": "scheduled",
    "start_time": "2025-03-01T10:00:00.000Z",
    "end_time": "2025-03-01T12:00:00.000Z",
    "created_at": "2025-02-26T08:30:00.000Z",
    "updated_at": "2025-02-26T08:30:00.000Z",
    "failure_reason": null,
    "transcoding_retry_count": 0,
    "streaming_retry_count": 0,
    "max_transcoding_retry_count": 3,
    "max_streaming_retry_count": 3,
    "created_by_user_id": 123,
    "push_url": null,
    "stream_key": null,
    "video_source": "https://example.com/video.mp4",
    "room_id": null,
    "room_name": "产品发布会直播间",
    "room_description": "2025年春季新品发布会",
    "anchor_name": "主播小王",
    "remark": "重要活动，请确保推流质量",
    "last_stream_offset": 0,
    "enable_loop_streaming": true,
    "loop_end_time": "2025-03-01T18:00:00.000Z",
    "max_loop_count": 5,
    "current_loop_iteration": 0
  }
}
```

**400 请求参数错误**:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "参数验证失败: 优先级必须是 1、2、3 之一",
  "data": null
}
```

---

### 2. 获取任务列表

**GET** `/api/task/list`

分页获取直播任务列表，支持多种筛选条件。

#### 请求参数

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `page` | number | ❌ | 1 | 页码 |
| `pageSize` | number | ❌ | 10 | 每页数量 |
| `task_name` | string | ❌ | - | 任务名称（模糊搜索） |
| `status` | string | ❌ | - | 任务状态筛选 |
| `priority` | number | ❌ | - | 优先级筛选 |
| `trigger_type` | string | ❌ | - | 触发类型筛选 |
| `created_by_user_id` | number | ❌ | - | 创建者ID筛选 |

**示例请求**:

```
GET /api/task/list?page=1&pageSize=20&status=streaming&priority=3
```

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "tasks": [
      {
        "id": 123,
        "task_name": "产品发布会直播",
        "status": "streaming",
        "priority": 3,
        "trigger_type": "scheduled",
        "start_time": "2025-03-01T10:00:00.000Z",
        "created_at": "2025-02-26T08:30:00.000Z",
        "room_name": "产品发布会直播间",
        "anchor_name": "主播小王"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3. 获取任务详情

**GET** `/api/task/get`

根据任务ID获取任务的详细信息。

#### 请求参数

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | number | ✅ | 任务ID |

**示例请求**:

```
GET /api/task/get?id=123
```

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": 123,
    "manage_site_id": "site_001",
    "task_name": "产品发布会直播",
    "status": "streaming",
    "priority": 2,
    "trigger_type": "scheduled",
    "start_time": "2025-03-01T10:00:00.000Z",
    "end_time": "2025-03-01T12:00:00.000Z",
    "created_at": "2025-02-26T08:30:00.000Z",
    "updated_at": "2025-03-01T10:05:00.000Z",
    "failure_reason": null,
    "transcoding_retry_count": 0,
    "streaming_retry_count": 0,
    "max_transcoding_retry_count": 3,
    "max_streaming_retry_count": 3,
    "created_by_user_id": 123,
    "push_url": "rtmps://live.example.com/live",
    "stream_key": "sk_abc123def456",
    "video_source": "https://example.com/video.mp4",
    "room_id": 456,
    "room_name": "产品发布会直播间",
    "room_description": "2025年春季新品发布会",
    "anchor_name": "主播小王",
    "remark": "重要活动，请确保推流质量",
    "last_stream_offset": 1800,
    "enable_loop_streaming": true,
    "loop_end_time": "2025-03-01T18:00:00.000Z",
    "max_loop_count": 5,
    "current_loop_iteration": 1
  }
}
```

**404 任务不存在**:

```json
{
  "success": false,
  "code": "RESOURCE_NOT_FOUND",
  "message": "任务不存在",
  "data": null
}
```

---

### 4. 更新任务

**POST** `/api/task/update`

更新现有任务的信息。只能更新未开始推流的任务。

#### 请求参数

**请求体** (application/json):

```json
{
  "id": 123,
  "task_name": "更新后的任务名称",
  "priority": 3,
  "trigger_type": "manual",
  "start_time": "2025-03-01T14:00:00Z",
  "end_time": "2025-03-01T16:00:00Z",
  "max_transcoding_retry_count": 5,
  "max_streaming_retry_count": 5,
  "room_name": "更新后的直播间名称",
  "room_description": "更新后的描述",
  "anchor_name": "更新后的主播名称",
  "remark": "更新后的备注",
  "enable_loop_streaming": false,
  "loop_end_time": null,
  "max_loop_count": null
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | number | ✅ | 任务ID |
| `task_name` | string | ❌ | 任务名称 (1-255字符) |
| `priority` | number | ❌ | 优先级 (1-3) |
| `trigger_type` | string | ❌ | 触发类型 (`manual` 或 `scheduled`) |
| `start_time` | string | ❌ | 开始时间 (ISO 8601格式) |
| `end_time` | string | ❌ | 结束时间 (ISO 8601格式) |
| `max_transcoding_retry_count` | number | ❌ | 最大转码重试次数 (0-100) |
| `max_streaming_retry_count` | number | ❌ | 最大推流重试次数 (0-100) |
| `room_name` | string | ❌ | 直播间名称 (1-255字符) |
| `room_description` | string | ❌ | 直播间描述 (1-255字符) |
| `anchor_name` | string | ❌ | 主播名称 (1-255字符) |
| `remark` | string | ❌ | 备注 (1-255字符) |
| `enable_loop_streaming` | boolean | ❌ | 是否启用循环推流 |
| `loop_end_time` | string | ❌ | 循环结束时间 (ISO 8601格式) |
| `max_loop_count` | number | ❌ | 最大循环次数 (1-1000) |

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": 123,
    "task_name": "更新后的任务名称",
    "status": "pending_transcoding",
    "priority": 3,
    "updated_at": "2025-02-26T09:00:00.000Z"
  }
}
```

**400 无法更新**:

```json
{
  "success": false,
  "code": "INVALID_OPERATION",
  "message": "任务已开始推流，无法更新",
  "data": null
}
```

---

### 5. 取消任务

**POST** `/api/task/cancel`

取消指定的任务。只能取消未完成的任务。

#### 请求参数

**请求体** (application/json):

```json
{
  "id": 123
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | number | ✅ | 任务ID |

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "id": 123,
    "status": "canceled",
    "updated_at": "2025-02-26T09:15:00.000Z"
  }
}
```

**400 无法取消**:

```json
{
  "success": false,
  "code": "DUPLICATE_OPERATION",
  "message": "不能重复取消任务",
  "data": null
}
```

---

### 6. 手动执行任务

**POST** `/api/task/execute`

手动执行指定的任务。只能执行手动触发类型且状态为 `pending_start` 的任务。

#### 请求参数

**请求体** (application/json):

```json
{
  "id": 123
}
```

**字段说明**:

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| `id` | number | ✅ | 任务ID |

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": null
}
```

**400 无法执行**:

```json
{
  "success": false,
  "code": "INVALID_OPERATION",
  "message": "任务未转码完成",
  "data": null
}
```

**常见错误情况**:
- 任务未转码完成
- 任务已经开始推流
- 任务已经取消
- 任务已经完成
- 当前任务状态不允许推流
- 自动任务不允许手动推流

---

## 系统监控

### 7. 获取系统报告

**GET** `/api/report`

获取系统状态报告，包括任务统计、活动任务、系统状态等信息。

#### 请求参数

无需参数。

#### 响应

**200 成功**:

```json
{
  "success": true,
  "code": "OK",
  "message": "操作成功",
  "data": {
    "totalTasks": 150,
    "pendingTranscodingTasks": 5,
    "pendingStartTasks": 3,
    "transcodingTasks": 2,
    "streamingTasks": 1,
    "transcodingFailedTasks": 8,
    "streamingFailedTasks": 12,
    "completedTasks": 115,
    "canceledTasks": 4,
    "activeTasks": [
      {
        "id": 123,
        "task_name": "产品发布会直播",
        "status": "streaming",
        "video_source": "https://example.com/video.mp4",
        "room_name": "产品发布会直播间",
        "anchor_name": "主播小王",
        "start_time": "2025-03-01T10:00:00.000Z",
        "created_at": "2025-02-26T08:30:00.000Z",
        "updated_at": "2025-03-01T10:05:00.000Z",
        "last_stream_offset": 1800
      }
    ],
    "upcomingTasks": [
      {
        "id": 124,
        "task_name": "晚间新闻直播",
        "room_name": "新闻直播间",
        "anchor_name": "新闻主播",
        "start_time": "2025-03-01T20:00:00.000Z"
      }
    ],
    "recentFailedTasks": [
      {
        "id": 122,
        "task_name": "测试任务",
        "status": "transcoding_failed",
        "failure_reason": "视频格式不支持",
        "updated_at": "2025-03-01T09:30:00.000Z"
      }
    ],
    "systemStatus": {
      "uptime": "2 days, 5 hours, 30 minutes",
      "uptimeSeconds": 192600,
      "memoryUsage": {
        "rss": "245.67 MB",
        "heapTotal": "89.23 MB",
        "heapUsed": "67.45 MB",
        "external": "12.34 MB",
        "arrayBuffers": "5.67 MB"
      },
      "memoryInfo": {
        "free": "3.45 GB",
        "total": "8.00 GB",
        "usedPercentage": 57
      },
      "tempVideos": {
        "count": 12,
        "totalSize": "2.34 GB"
      },
      "nodeVersion": "v18.17.0",
      "platform": "darwin",
      "arch": "x64"
    },
    "timestamp": "2025-03-01T10:30:00.000Z"
  }
}
```

**字段说明**:

| 字段 | 描述 |
|------|------|
| `totalTasks` | 总任务数 |
| `pendingTranscodingTasks` | 等待转码任务数 |
| `pendingStartTasks` | 等待开始任务数 |
| `transcodingTasks` | 转码中任务数 |
| `streamingTasks` | 推流中任务数 |
| `transcodingFailedTasks` | 转码失败任务数 |
| `streamingFailedTasks` | 推流失败任务数 |
| `completedTasks` | 已完成任务数 |
| `canceledTasks` | 已取消任务数 |
| `activeTasks` | 当前活动中的任务列表（最多5个） |
| `upcomingTasks` | 即将执行的任务列表（最多5个） |
| `recentFailedTasks` | 最近失败的任务列表（最多5个） |
| `systemStatus` | 系统状态信息 |

---

## 错误代码说明

| 错误代码 | HTTP状态码 | 描述 |
|----------|------------|------|
| `OK` | 200 | 操作成功 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `INVALID_OPERATION` | 400 | 无效操作 |
| `DUPLICATE_OPERATION` | 400 | 重复操作 |
| `UNAUTHORIZED` | 401 | 认证失败 |
| `RESOURCE_NOT_FOUND` | 404 | 资源不存在 |
| `UNKNOWN_ERROR` | 500 | 服务器内部错误 |

---

## 使用示例

### 创建并执行手动任务

```bash
# 1. 创建手动任务
curl -X POST http://localhost:7007/api/task/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "测试直播任务",
    "trigger_type": "manual",
    "created_by_user_id": 123,
    "video_source": "https://pub-4e236d440d13497eb12b68fe26d02772.r2.dev/videos/user/profile/videos/67ba5418-5b85-4fd9-82c7-39fc09bc8dcd.webm",
    "room_name": "测试直播间",
    "anchor_name": "测试主播"
  }'

# 2. 等待转码完成后，手动执行任务
curl -X POST http://localhost:7007/api/task/execute \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123
  }'
```

### 创建定时任务

```bash
curl -X POST http://localhost:7007/api/task/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "定时直播任务",
    "trigger_type": "scheduled",
    "start_time": "2025-03-01T20:00:00Z",
    "end_time": "2025-03-01T22:00:00Z",
    "created_by_user_id": 123,
    "video_source": "https://example.com/video.mp4",
    "room_name": "定时直播间",
    "anchor_name": "定时主播",
    "enable_loop_streaming": true,
    "max_loop_count": 3
  }'
```

### 查询任务列表

```bash
# 查询所有推流中的任务
curl -X GET "http://localhost:7007/api/task/list?status=streaming&page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 查询高优先级任务
curl -X GET "http://localhost:7007/api/task/list?priority=3" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 获取系统状态

```bash
curl -X GET http://localhost:7007/api/report \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 注意事项

### 1. 认证要求

- 所有API请求都需要有效的JWT token
- Token需要包含正确的 `manage_site_id` 信息
- Token过期后需要重新获取

### 2. 任务状态流转

```
pending_transcoding → transcoding → pending_start → streaming → completed
                   ↓              ↓               ↓
              transcoding_failed  ↓         streaming_failed
                                 ↓
                              canceled
```

### 3. 循环推流规则

- 启用循环推流时，必须设置 `loop_end_time` 或 `max_loop_count` 之一
- 循环推流会在达到时间限制或次数限制时自动停止
- 循环推流支持三种结束模式：
  1. 正常单次推流完成
  2. 基于时间的结束（`loop_end_time`）
  3. 基于次数的循环（`max_loop_count`）

### 4. 重试机制

- 转码失败会根据 `max_transcoding_retry_count` 自动重试
- 推流失败会根据 `max_streaming_retry_count` 自动重试
- 重试次数用完后任务状态变为对应的失败状态

### 5. 视频源要求

- 支持 HTTP/HTTPS URL
- 推荐使用 MP4、WebM 等常见格式
- 视频文件需要可公开访问

---

## 更新日志

### v1.0.0 (2025-02-26)

- 初始版本发布
- 支持任务的完整生命周期管理
- 支持定时和手动触发
- 支持循环推流功能
- 提供系统状态监控接口
