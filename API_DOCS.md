# 接口联调文档 (API Documentation)

本文档旨在协助前端工程师对接后端 API。

**基础信息**:
- **调用方式**: 微信小程序云开发 `wx.cloud.callContainer` 或 `Taro.cloud.callContainer`
- **基础路径**: `/api`
- **鉴权方式**: 通过请求头 `x-wx-openid` 自动鉴权 (微信云托管网关自动注入)
- **响应格式**:
  ```json
  {
    "code": 0,          // 0 表示成功，非 0 表示错误
    "data": { ... },    // 业务数据
    "message": "..."    // 错误信息（仅在 code !== 0 时存在）
  }
  ```

---

## 1. 用户模块 (User)
基础路径: `/api/user`

### 1.1 获取当前用户信息
*   **路径**: `/me`
*   **方法**: `GET`
*   **描述**: 获取当前登录用户的详细信息，包括已加入的班级列表。如果用户不存在，将自动创建基础账号。
*   **响应示例**:
    ```json
    {
      "code": 0,
      "data": {
        "id": "uuid-string",
        "openid": "...",
        "name": "User Name",
        "avatarUrl": "http://...",
        "currentClassId": "class-uuid",
        "classes": [
          {
            "classId": "class-uuid",
            "role": "TEACHER",
            "class": { "name": "Class Name", ... }
          }
        ]
      }
    }
    ```

### 1.2 更新/创建个人资料
*   **路径**: `/profile`
*   **方法**: `POST`
*   **描述**: 更新用户基本信息，或加入新的班级。
*   **请求参数**:
    ```json
    {
      "name": "New Name",             // 可选
      "avatarUrl": "http://...",      // 可选
      "currentClassId": "class-uuid", // 可选，切换当前班级
      "newClassRelation": {           // 可选，加入班级时传
        "classId": "class-uuid",
        "role": "PARENT",             // "TEACHER" | "PARENT" | "NONE"
        "alias": "某某爸爸"            // 可选，班级内昵称
      }
    }
    ```

---

## 2. 班级模块 (Class)
基础路径: `/api/class`

### 2.1 获取我的班级列表
*   **路径**: `/`
*   **方法**: `GET`
*   **描述**: 获取当前用户所有已加入的班级信息。

### 2.2 创建班级
*   **路径**: `/`
*   **方法**: `POST`
*   **请求参数**:
    ```json
    {
      "name": "一年级二班",
      "teacherName": "王老师"
    }
    ```
*   **描述**: 创建新班级，创建者自动成为该班级的 TEACHER。

### 2.3 获取班级详情
*   **路径**: `/:id` (例如 `/api/class/class-uuid-123`)
*   **方法**: `GET`
*   **描述**: 获取指定班级的详细信息，包含学生列表和行为日志。
*   **响应包含**: `students` (学生数组), `logs` (日志数组)

### 2.4 添加学生
*   **路径**: `/:id/student`
*   **方法**: `POST`
*   **请求参数**:
    ```json
    {
      "name": "张三"
    }
    ```

### 2.5 添加行为日志 (打分)
*   **路径**: `/:id/log`
*   **方法**: `POST`
*   **请求参数**:
    ```json
    {
      "studentId": "student-uuid",
      "behaviorLabel": "积极回答问题",
      "behaviorValue": 1,             // 分数变化，可以是负数
      "note": "表现很好"               // 可选备注
    }
    ```
*   **响应**: 返回更新后的班级完整信息（包含最新的 logs 和更新后的学生分数）。

### 2.6 删除/退出班级
*   **路径**: `/:id`
*   **方法**: `DELETE`
*   **描述**: 
    *   **老师 (TEACHER)** 调用时：执行**解散班级**操作。删除班级主体、所有学生数据及行为日志，并解除所有成员的关联。
    *   **家长 (PARENT)** 调用时：执行**退出班级**操作。仅解除当前用户与该班级的关联关系，不影响班级其他数据。
*   **请求参数**: 无
*   **响应**:
    ```json
    {
      "code": 0,
      "message": "Class deleted/left successfully"
    }
    ```

### 2.7 删除学生 (新增)
*   **路径**: `/:id/student/:studentId`
*   **方法**: `DELETE`
*   **描述**: 从班级中彻底移除指定学生，同时删除该学生的所有行为日志。仅老师可操作。
*   **请求参数**: 无
*   **响应**:
    ```json
    {
      "code": 0,
      "message": "Student deleted successfully"
    }
    ```

### 2.8 撤销行为日志 (新增)
*   **路径**: `/:id/log/:logId`
*   **方法**: `DELETE`
*   **描述**: 撤销某次打分。系统会自动回滚该日志对应的分数变化（如撤销“+1”，学生总分“-1”）。仅老师可操作。
*   **请求参数**: 无
*   **响应**:
    ```json
    {
      "code": 0,
      "message": "Log undone successfully",
      "data": { ... } // 返回更新后的班级完整信息
    }
    ```

---

## 前端调用示例 (Taro)

```typescript
// 封装的请求函数
async function callApi(path, method = 'GET', data = {}) {
  const res = await Taro.cloud.callContainer({
    path: `/api${path}`, // 自动拼接 /api 前缀
    method,
    header: {
      'X-WX-SERVICE': 'ai-starclass-backend', // 替换为你的服务名
    },
    data
  });
  
  if (res.statusCode === 200 && res.data.code === 0) {
    return res.data.data;
  }
  throw new Error(res.data.message || 'Request failed');
}

// 使用示例
const myInfo = await callApi('/user/me');
// 撤销日志
await callApi('/class/class-uuid/log/log-uuid', 'DELETE');
```
