## CI 代码评审文档 API

该接口允许 CI/CD（例如 GitHub Actions + Codex 自动 Review）直接把评审结果发布到文档仓库，而无需经过 MCP。

### Endpoint

```
POST /api/integrations/reviews
Authorization: Bearer mcp_xxx   # 使用 API Keys 功能生成
Content-Type: application/json
```

### 请求体

```json
{
  "repository": "github.com/acme/project",
  "commit": "5c1fe9482974f4a4264d14135dfc767852b6a011",
  "branch": "feature/markdown-api",
  "workflow": "codex-review",
  "runId": "678901234",
  "pullRequest": 42,
  "summary": "CI 自动评审摘要……",
  "findings": [
    {
      "title": "处理空值的逻辑缺失",
      "severity": "high",
      "file": "src/server/api.ts",
      "line": 128,
      "details": "具体描述……",
      "recommendation": "示例修复建议……",
      "status": "open"
    }
  ],
  "recommendations": [
    "补充 E2E 覆盖",
    "在 README 中记录约束"
  ],
  "links": [
    { "label": "Workflow Logs", "url": "https://github.com/acme/project/actions/runs/678901234" }
  ],
  "tags": ["code-review", "codex"],
  "metadata": {
    "ci": "github-actions",
    "triggeredBy": "dependabot[bot]"
  }
}
```

### 响应

```json
{
  "success": true,
  "path": "reviews/acme-project/2025/02/03/5c1fe94-1739255028947.md",
  "url": "/docs/reviews/acme-project/2025/02/03/5c1fe94-1739255028947",
  "title": "Code Review - github.com/acme/project @ 5c1fe94"
}
```

若需要自定义路径或标题，可在请求中传入 `documentPath`（自动补 `.md`）与 `title`。也可以直接提供完整的 `content`，否则 API 会根据提供的数据生成默认 Markdown 与 frontmatter。

### 权限

- 需要使用 `API Keys` 中启用了 `write` 权限的密钥。
- 速率限制与审计会复用现有 API Key 机制。

### 在 GitHub Actions 中使用示例

```yaml
- name: Publish Codex Review
  run: |
    curl -X POST https://docs.example.com/api/integrations/reviews \
      -H "Authorization: Bearer ${{ secrets.DOCS_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d @payload.json
```

其中 `payload.json` 可以由上一步的 Codex 结果渲染得到。
