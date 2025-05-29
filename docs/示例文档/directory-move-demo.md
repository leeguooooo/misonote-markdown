# 目录移动功能演示

## 🎯 新增功能：目录拖拽移动

现在系统支持完整的目录拖拽移动功能！

### ✨ 功能特性

#### 1. **文件夹拖拽**
- ✅ 文件夹可以像文件一样拖拽
- ✅ 支持嵌套文件夹的移动
- ✅ 自动移动所有子文件和子文件夹

#### 2. **智能防护**
- ✅ 防止将文件夹移动到自己的子目录中
- ✅ 检测循环移动并阻止
- ✅ 友好的错误提示

#### 3. **根目录支持**
- ✅ 支持拖拽到根目录
- ✅ 视觉反馈和拖拽提示
- ✅ 只允许子目录项目移动到根目录

#### 4. **元数据同步**
- ✅ 自动更新移动文件夹的元数据
- ✅ 递归更新所有子项目的元数据
- ✅ 保持隐藏状态等属性

## 🎨 用户体验

### 视觉反馈
```
拖拽时的视觉效果：
├── 被拖拽项目：半透明显示
├── 目标文件夹：绿色高亮边框
├── 根目录区域：绿色虚线边框
└── 拖拽提示：底部提示信息
```

### 操作流程
1. **选择要移动的文件夹**
2. **拖拽到目标位置**
   - 其他文件夹：移动到该文件夹内
   - 根目录区域：移动到根目录
3. **系统自动验证**
   - 检查是否为有效移动
   - 防止循环移动
4. **执行移动操作**
   - 移动文件夹及所有内容
   - 更新元数据
   - 刷新界面

## 🔧 技术实现

### 后端实现

```typescript
// 文件系统管理器的移动方法
async moveFile(sourcePath: string, targetPath: string): Promise<void> {
  // 1. 路径验证
  if (!this.validatePath(sourcePath) || !this.validatePath(targetPath)) {
    throw new Error('Invalid path');
  }

  // 2. 循环移动检测
  if (sourceStats.isDirectory()) {
    const normalizedSource = path.resolve(fullSourcePath);
    const normalizedTarget = path.resolve(fullTargetPath);
    
    if (normalizedTarget.startsWith(normalizedSource + path.sep)) {
      throw new Error('Cannot move directory into itself');
    }
  }

  // 3. 执行移动
  fs.renameSync(fullSourcePath, fullTargetPath);

  // 4. 更新元数据
  if (sourceStats.isDirectory()) {
    this.updateSubDirectoryMetadata(fullTargetPath, sourcePath, targetPath);
  }
}
```

### 前端实现

```typescript
// 拖拽处理逻辑
const handleDrop = async (e: React.DragEvent, targetNode: TreeNode) => {
  // 1. 基本验证
  if (!draggedItem || draggedItem.path === targetNode.path) return;
  if (targetNode.type !== 'folder') return;

  // 2. 循环移动检测
  if (draggedItem.type === 'folder') {
    if (targetNode.path.startsWith(draggedItem.path + '/')) {
      alert('不能将文件夹移动到自己的子目录中');
      return;
    }
  }

  // 3. 执行移动
  const newPath = targetNode.path ? 
    `${targetNode.path}/${draggedItem.name}` : 
    draggedItem.name;
  await onFileMove(draggedItem.path, newPath);
};
```

## 📊 测试场景

### 基本移动测试
- [x] 文件夹移动到其他文件夹
- [x] 文件夹移动到根目录
- [x] 嵌套文件夹的移动
- [x] 空文件夹的移动

### 边界情况测试
- [x] 防止移动到自己的子目录
- [x] 防止移动到同名位置
- [x] 处理不存在的源路径
- [x] 处理权限错误

### 用户体验测试
- [x] 拖拽视觉反馈
- [x] 错误提示友好性
- [x] 操作流程顺畅性
- [x] 界面响应速度

## 🎉 使用示例

### 场景 1：重组文档结构
```
原始结构：
docs/
├── api/
├── tutorials/
└── old-folder/
    ├── important-doc.md
    └── subfolder/

操作：拖拽 old-folder 到 api 文件夹

结果结构：
docs/
├── api/
│   └── old-folder/
│       ├── important-doc.md
│       └── subfolder/
└── tutorials/
```

### 场景 2：提升文件夹层级
```
原始结构：
docs/
└── temp/
    └── project-docs/
        ├── readme.md
        └── guide.md

操作：拖拽 project-docs 到根目录

结果结构：
docs/
├── temp/
└── project-docs/
    ├── readme.md
    └── guide.md
```

## 🚀 未来增强

### 计划中的功能
- [ ] 批量移动多个文件夹
- [ ] 移动历史记录和撤销
- [ ] 移动进度指示器
- [ ] 移动冲突解决策略

### 性能优化
- [ ] 大文件夹移动的异步处理
- [ ] 移动操作的事务性保证
- [ ] 网络中断时的恢复机制

---

**目录移动功能现在完全可用，为文档管理提供了更强大的组织能力！** 🎉
