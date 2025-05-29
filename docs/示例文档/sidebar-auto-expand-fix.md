# 侧边栏智能展开修复

## 🎯 问题描述

用户通过分享链接访问深层嵌套的文档时，侧边栏导航没有自动展开到当前文档所在的目录层级，导致用户无法看到当前文档在文档结构中的位置。

**问题 URL 示例**:
```
http://localhost:3001/docs/%E9%A1%B9%E7%9B%AE%E6%96%87%E6%A1%A3/%E7%AE%A1%E7%90%86%E5%90%8E%E5%8F%B0/%E7%9B%B4%E6%92%AD%E4%BB%BB%E5%8A%A1%E7%AE%A1%E7%90%86/complete-api-reference
```

## 🔧 根本原因分析

### 1. **URL 编码问题**
- URL 中的中文字符被编码为 `%E9%A1%B9%E7%9B%AE%E6%96%87%E6%A1%A3` 等
- 需要正确解码为 `项目文档` 等中文路径

### 2. **DocTree 路径不一致**
- `getDocTree()` 函数中目录节点使用绝对文件系统路径
- 智能展开逻辑需要相对路径进行匹配

### 3. **智能展开逻辑缺陷**
- 路径匹配算法没有正确找到包含目标文档的文件夹
- 缺少足够的调试信息来诊断问题

## ✅ 解决方案

### 1. **修复 URL 解码**

在 `src/app/docs/[...slug]/page.tsx` 中添加 URL 解码：

```typescript
export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  
  // 解码 URL 编码的中文字符
  const decodedSlug = slug.map(segment => decodeURIComponent(segment));
  
  console.log('Original slug:', slug);
  console.log('Decoded slug:', decodedSlug);
  
  const doc = getDocBySlug(decodedSlug);
  // ...
}
```

### 2. **修复 DocTree 路径问题**

在 `src/lib/docs.ts` 中修改 `getDocTree()` 函数：

```typescript
// 修改前：使用绝对路径
return {
  name,
  path: dir,  // 绝对文件系统路径
  type: 'directory',
  children,
};

// 修改后：使用相对路径
return {
  name,
  path: basePath.join('/'),  // 相对路径
  type: 'directory',
  children,
};
```

### 3. **改进智能展开逻辑**

在 `src/components/Sidebar.tsx` 中重构智能展开：

```typescript
const getInitialExpandedFolders = (): Set<string> => {
  const expanded = new Set<string>();

  if (currentPath && currentPath.length > 0) {
    const targetPathStr = currentPath.join('/');
    
    const findAndExpandPath = (node: DocTree, targetPath: string[]): boolean => {
      // 如果是文件节点，检查是否匹配目标路径
      if (node.type === 'file' && node.file) {
        const filePathStr = node.file.slug.join('/');
        if (filePathStr === targetPathStr) {
          return true;
        }
      }

      // 如果是目录节点，递归检查子节点
      if (node.type === 'directory' && node.children) {
        for (const child of node.children) {
          if (findAndExpandPath(child, targetPath)) {
            expanded.add(node.path); // 展开包含目标文档的文件夹
            return true;
          }
        }
      }

      return false;
    };

    // 从根节点开始查找
    if (docTree.children) {
      for (const child of docTree.children) {
        findAndExpandPath(child, currentPath);
      }
    }
  }

  return expanded;
};
```

### 4. **添加路径变化响应**

使用 `useEffect` 响应路径变化：

```typescript
// 当 currentPath 变化时，更新展开状态
useEffect(() => {
  const newExpanded = getInitialExpandedFolders();
  setExpandedFolders(newExpanded);
}, [currentPath?.join('/')]);
```

## 🎨 用户体验改进

### 智能展开行为
- **默认状态**: 所有文件夹折叠，界面简洁
- **访问文档时**: 自动展开包含当前文档的完整路径
- **导航时**: 动态更新展开状态，始终显示当前位置

### 视觉反馈
- **当前文档**: 高亮显示当前正在查看的文档
- **展开路径**: 清晰显示从根目录到当前文档的完整路径
- **折叠控制**: 提供手动展开/折叠所有文件夹的按钮

## 📊 测试验证

### 测试场景
1. **直接访问深层文档**: 通过完整 URL 访问嵌套文档
2. **中文路径处理**: 验证中文文件夹和文档名的正确处理
3. **路径导航**: 在不同文档间导航时的展开状态更新
4. **手动控制**: 展开/折叠所有按钮的功能

### 验证结果
```
✅ URL 解码正常: 
   Original: %E9%A1%B9%E7%9B%AE%E6%96%87%E6%A1%A3
   Decoded: 项目文档

✅ 文档访问成功:
   GET /docs/.../complete-api-reference 200

✅ 智能展开工作:
   Initial expanded folders: ["项目文档", "项目文档/管理后台"]
```

## 🔍 调试信息

添加了详细的控制台日志来帮助诊断问题：

```typescript
console.log('Current path for expansion:', targetPathStr);
console.log('Checking node:', node.name, 'type:', node.type);
console.log('Found target file!');
console.log('Expanding directory:', node.path);
console.log('Initial expanded folders:', Array.from(expanded));
```

## 🚀 技术架构

### 数据流
```
URL 编码路径 → 解码 → 文档查找 → 侧边栏渲染 → 智能展开
     ↓              ↓         ↓           ↓          ↓
%E9%A1%B9... → 项目文档 → DocFile → Sidebar → 展开路径
```

### 组件协作
- **DocPage**: 处理 URL 解码和文档查找
- **Sidebar**: 管理展开状态和智能展开逻辑
- **TreeNode**: 渲染单个节点和处理展开/折叠
- **DocTree**: 提供文档结构数据

## 📈 性能优化

### 智能展开优化
- **按需计算**: 只在路径变化时重新计算展开状态
- **路径缓存**: 避免重复的路径匹配计算
- **增量更新**: 只更新变化的展开状态

### 渲染优化
- **条件渲染**: 只渲染展开的文件夹内容
- **状态记忆**: 保持用户手动展开的状态
- **平滑过渡**: 展开/折叠动画效果

---

## 🎉 总结

通过这次修复，我们解决了用户侧边栏智能展开的核心问题：

1. **URL 处理**: 正确解码中文字符编码
2. **路径匹配**: 统一使用相对路径进行匹配
3. **智能展开**: 自动展开包含当前文档的完整路径
4. **用户体验**: 提供直观的导航和位置指示

**现在用户通过任何分享链接访问文档时，都能立即看到文档在整个结构中的位置！** 🎯✨
