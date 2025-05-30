#!/usr/bin/env node

/**
 * Misonote Markdown MCP Client
 * 为 AI 编辑器提供 MCP 协议支持，连接到 misonote-markdown 服务器
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// 配置
const SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.MCP_API_KEY;

// 检查 API 密钥的函数
function checkApiKey() {
  if (!API_KEY) {
    throw new Error('MCP_API_KEY 环境变量未设置。请在 Cursor 配置中设置此变量。');
  }
  return API_KEY;
}

// 创建 axios 实例的函数
function createApiClient() {
  const apiKey = checkApiKey();
  return axios.create({
    baseURL: SERVER_URL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'misonote-mcp-client/1.0.0'
    },
    timeout: 10000
  });
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'misonote-markdown',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具定义
const TOOLS = [
  {
    name: 'list_documents',
    description: '获取文档列表',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径（可选）',
          default: ''
        }
      }
    }
  },
  {
    name: 'get_document',
    description: '获取单个文档内容',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径',
        }
      },
      required: ['path']
    }
  },
  {
    name: 'create_document',
    description: '创建新文档',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径',
        },
        content: {
          type: 'string',
          description: '文档内容',
        },
        title: {
          type: 'string',
          description: '文档标题（可选）',
        },
        metadata: {
          type: 'object',
          description: '文档元数据（可选）',
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'update_document',
    description: '更新现有文档',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径',
        },
        content: {
          type: 'string',
          description: '文档内容',
        },
        title: {
          type: 'string',
          description: '文档标题（可选）',
        },
        metadata: {
          type: 'object',
          description: '文档元数据（可选）',
        }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'delete_document',
    description: '删除文档',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径',
        }
      },
      required: ['path']
    }
  },
  {
    name: 'get_server_info',
    description: '获取服务器信息和能力',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_documents',
    description: '搜索文档内容、标题或路径',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词',
        },
        searchType: {
          type: 'string',
          description: '搜索类型：content（内容）、title（标题）、path（路径）',
          enum: ['content', 'title', 'path'],
          default: 'content'
        },
        path: {
          type: 'string',
          description: '限制搜索范围的路径（可选）',
        }
      },
      required: ['query']
    }
  },
  {
    name: 'add_memory',
    description: '添加记忆条目（用户习惯、偏好、复盘等）',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目名称（可选，默认为 default）',
          default: 'default'
        },
        type: {
          type: 'string',
          description: '记忆类型',
          enum: ['habits', 'preferences', 'retrospectives', 'insights'],
        },
        content: {
          type: 'string',
          description: '记忆内容',
        },
        tags: {
          type: 'string',
          description: '标签（可选，用逗号分隔）',
        }
      },
      required: ['type', 'content']
    }
  },
  {
    name: 'get_memories',
    description: '获取记忆内容',
    inputSchema: {
      type: 'object',
      properties: {
        project: {
          type: 'string',
          description: '项目名称（可选，默认为 default）',
          default: 'default'
        },
        type: {
          type: 'string',
          description: '记忆类型（可选，不指定则获取所有类型）',
          enum: ['habits', 'preferences', 'retrospectives', 'insights'],
        }
      }
    }
  },
  {
    name: 'search_memories',
    description: '搜索记忆内容',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词',
        },
        project: {
          type: 'string',
          description: '项目名称（可选，默认搜索所有项目）',
        },
        type: {
          type: 'string',
          description: '记忆类型（可选，默认搜索所有类型）',
          enum: ['habits', 'preferences', 'retrospectives', 'insights'],
        }
      },
      required: ['query']
    }
  },
  {
    name: 'list_memory_projects',
    description: '列出所有记忆项目',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_document_url',
    description: '获取文档的在线观看地址',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '文档路径',
        }
      },
      required: ['path']
    }
  }
];

// 列出可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_documents':
        return await listDocuments(args.path || '');

      case 'get_document':
        return await getDocument(args.path);

      case 'create_document':
        return await createDocument(args.path, args.content, args.title, args.metadata);

      case 'update_document':
        return await updateDocument(args.path, args.content, args.title, args.metadata);

      case 'delete_document':
        return await deleteDocument(args.path);

      case 'get_server_info':
        return await getServerInfo();

      case 'search_documents':
        return await searchDocuments(args.query, args.searchType, args.path);

      case 'add_memory':
        return await addMemory(args.project || 'default', args.type, args.content, args.tags);

      case 'get_memories':
        return await getMemories(args.project || 'default', args.type);

      case 'search_memories':
        return await searchMemories(args.query, args.project, args.type);

      case 'list_memory_projects':
        return await listMemoryProjects();

      case 'get_document_url':
        return await getDocumentUrl(args.path);

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `未知工具: ${name}`
        );
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `工具执行失败: ${error.message}`
    );
  }
});

// 工具实现函数
async function listDocuments(path) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/mcp/documents', {
      params: { path }
    });

    const documents = response.data.data.documents || [];

    return {
      content: [
        {
          type: 'text',
          text: `找到 ${documents.length} 个文档:\n\n` +
                documents.map(doc =>
                  `- ${doc.name} (${doc.path})\n  大小: ${doc.size} 字节\n  修改时间: ${new Date(doc.lastModified).toLocaleString()}`
                ).join('\n\n')
        }
      ]
    };
  } catch (error) {
    throw new Error(`获取文档列表失败: ${error.response?.data?.error || error.message}`);
  }
}

async function getDocument(path) {
  try {
    const apiClient = createApiClient();
    // 使用 MCP 文档 API 获取文档内容
    const response = await apiClient.get('/api/mcp/documents', {
      params: {
        path: path.replace('.md', ''),
        content: 'true'
      }
    });

    const documentData = response.data.data;

    return {
      content: [
        {
          type: 'text',
          text: `文档路径: ${documentData.path}\n文档名称: ${documentData.name}\n文档大小: ${documentData.size} 字节\n最后修改: ${new Date(documentData.lastModified).toLocaleString()}\n${documentData.fullUrl ? `在线地址: ${documentData.fullUrl}\n` : ''}\n--- 文档内容 ---\n\n${documentData.content}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`获取文档失败: ${error.response?.data?.error || error.message}`);
  }
}

async function createDocument(path, content, title, metadata) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post('/api/mcp/documents', {
      path,
      content,
      title,
      metadata,
      operation: 'create'
    });

    return {
      content: [
        {
          type: 'text',
          text: `文档创建成功!\n路径: ${response.data.data.path}\n大小: ${response.data.data.size} 字节\n${response.data.data.fullUrl ? `在线地址: ${response.data.data.fullUrl}` : `访问链接: ${SERVER_URL}${response.data.data.url}`}\n\n📖 点击地址即可在浏览器中查看文档。`
        }
      ]
    };
  } catch (error) {
    throw new Error(`创建文档失败: ${error.response?.data?.error || error.message}`);
  }
}

async function updateDocument(path, content, title, metadata) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post('/api/mcp/documents', {
      path,
      content,
      title,
      metadata,
      operation: 'update'
    });

    return {
      content: [
        {
          type: 'text',
          text: `文档更新成功!\n路径: ${response.data.data.path}\n大小: ${response.data.data.size} 字节\n${response.data.data.fullUrl ? `在线地址: ${response.data.data.fullUrl}` : `访问链接: ${SERVER_URL}${response.data.data.url}`}\n\n📖 点击地址即可在浏览器中查看更新后的文档。`
        }
      ]
    };
  } catch (error) {
    throw new Error(`更新文档失败: ${error.response?.data?.error || error.message}`);
  }
}

async function deleteDocument(path) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.delete('/api/mcp/documents', {
      data: { path }
    });

    return {
      content: [
        {
          type: 'text',
          text: `文档删除成功!\n路径: ${response.data.data.path}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`删除文档失败: ${error.response?.data?.error || error.message}`);
  }
}

async function getServerInfo() {
  try {
    const apiClient = createApiClient();
    const [healthResponse, capabilitiesResponse] = await Promise.all([
      apiClient.get('/api/health'),
      apiClient.get('/api/mcp/capabilities')
    ]);

    const health = healthResponse.data;
    const capabilities = capabilitiesResponse.data.data;

    return {
      content: [
        {
          type: 'text',
          text: `服务器信息:\n\n` +
                `名称: ${capabilities.server.name}\n` +
                `版本: ${capabilities.server.version}\n` +
                `状态: ${health.status}\n` +
                `响应时间: ${health.responseTime}ms\n\n` +
                `支持的功能:\n` +
                `- 批量操作: ${capabilities.capabilities.supportsBatch ? '✅' : '❌'}\n` +
                `- Webhook: ${capabilities.capabilities.supportsWebhooks ? '✅' : '❌'}\n` +
                `- 元数据: ${capabilities.capabilities.supportsMetadata ? '✅' : '❌'}\n` +
                `- 搜索功能: ${capabilities.capabilities.supportsSearch ? '✅' : '❌'}\n` +
                `- 最大文档大小: ${(capabilities.capabilities.maxDocumentSize / 1024 / 1024).toFixed(1)}MB\n` +
                `- 支持格式: ${capabilities.capabilities.supportedFormats.join(', ')}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`获取服务器信息失败: ${error.response?.data?.error || error.message}`);
  }
}

async function searchDocuments(query, searchType = 'content', path = '') {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/mcp/documents', {
      params: {
        search: query,
        searchType: searchType,
        ...(path && { path })
      }
    });

    const searchData = response.data.data;
    const documents = searchData.documents || [];

    if (documents.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔍 搜索结果\n\n关键词: "${query}"\n搜索类型: ${searchType}\n${path ? `搜索范围: ${path}\n` : ''}\n❌ 未找到相关文档`
          }
        ]
      };
    }

    let resultText = `🔍 搜索结果\n\n关键词: "${query}"\n搜索类型: ${searchType}\n${path ? `搜索范围: ${path}\n` : ''}找到 ${documents.length} 个相关文档:\n\n`;

    documents.forEach((doc, index) => {
      resultText += `${index + 1}. **${doc.name}**\n`;
      resultText += `   路径: ${doc.path}\n`;
      resultText += `   大小: ${doc.size} 字节\n`;
      resultText += `   修改时间: ${new Date(doc.lastModified).toLocaleString()}\n`;

      if (doc.fullUrl) {
        resultText += `   在线地址: ${doc.fullUrl}\n`;
      }

      if (doc.relevanceScore) {
        resultText += `   相关性: ${doc.relevanceScore}/10\n`;
      }

      if (doc.excerpt) {
        resultText += `   摘要: ${doc.excerpt.substring(0, 150)}${doc.excerpt.length > 150 ? '...' : ''}\n`;
      }

      if (doc.matchedSnippets && doc.matchedSnippets.length > 0) {
        resultText += `   匹配片段:\n`;
        doc.matchedSnippets.slice(0, 2).forEach((snippet, i) => {
          resultText += `     ${i + 1}. "${snippet.substring(0, 100)}${snippet.length > 100 ? '...' : ''}"\n`;
        });
      }

      resultText += '\n';
    });

    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  } catch (error) {
    throw new Error(`搜索文档失败: ${error.response?.data?.error || error.message}`);
  }
}

// 记忆系统函数
async function addMemory(project, type, content, tags) {
  try {
    const timestamp = new Date().toISOString();
    const memoryPath = `memories/${project}/${type}`;

    // 构建记忆条目
    const tagsText = tags ? ` #${tags.split(',').map(t => t.trim()).join(' #')}` : '';
    const memoryEntry = `\n## ${timestamp}\n\n${content}${tagsText}\n\n---\n`;

    // 尝试获取现有记忆文档
    const apiClient = createApiClient();
    let existingContent = '';

    try {
      const response = await apiClient.get('/api/mcp/documents', {
        params: {
          path: memoryPath,
          content: 'true'
        }
      });
      existingContent = response.data.data.content;
    } catch (error) {
      // 文档不存在，创建新的
      const typeNames = {
        habits: '用户习惯',
        preferences: '用户偏好',
        retrospectives: '复盘记录',
        insights: '洞察学习'
      };

      existingContent = `# ${typeNames[type]} - ${project}\n\n> 这是 ${project} 项目的${typeNames[type]}记录\n\n---\n`;
    }

    // 添加新记忆条目
    const newContent = existingContent + memoryEntry;

    // 更新或创建文档
    const operation = existingContent.includes('# ') ? 'update' : 'create';
    const response = await apiClient.post('/api/mcp/documents', {
      path: memoryPath,
      content: newContent,
      operation: operation
    });

    return {
      content: [
        {
          type: 'text',
          text: `🧠 记忆已添加!\n\n项目: ${project}\n类型: ${type}\n内容: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}\n${tags ? `标签: ${tags}\n` : ''}时间: ${new Date(timestamp).toLocaleString()}\n\n访问链接: ${SERVER_URL}${response.data.data.url}`
        }
      ]
    };
  } catch (error) {
    throw new Error(`添加记忆失败: ${error.response?.data?.error || error.message}`);
  }
}

async function getMemories(project, type) {
  try {
    const apiClient = createApiClient();

    if (type) {
      // 获取特定类型的记忆
      const memoryPath = `memories/${project}/${type}`;
      try {
        const response = await apiClient.get('/api/mcp/documents', {
          params: {
            path: memoryPath,
            content: 'true'
          }
        });

        const typeNames = {
          habits: '用户习惯',
          preferences: '用户偏好',
          retrospectives: '复盘记录',
          insights: '洞察学习'
        };

        return {
          content: [
            {
              type: 'text',
              text: `🧠 ${typeNames[type]} - ${project}\n\n${response.data.data.content}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `🧠 ${project} 项目的 ${type} 记忆\n\n暂无记录。`
            }
          ]
        };
      }
    } else {
      // 获取项目的所有记忆
      const memoryTypes = ['habits', 'preferences', 'retrospectives', 'insights'];
      const typeNames = {
        habits: '用户习惯',
        preferences: '用户偏好',
        retrospectives: '复盘记录',
        insights: '洞察学习'
      };

      let resultText = `🧠 ${project} 项目的所有记忆\n\n`;

      for (const memoryType of memoryTypes) {
        const memoryPath = `memories/${project}/${memoryType}`;
        try {
          const response = await apiClient.get('/api/mcp/documents', {
            params: {
              path: memoryPath,
              content: 'true'
            }
          });

          resultText += `## ${typeNames[memoryType]}\n\n${response.data.data.content}\n\n`;
        } catch (error) {
          resultText += `## ${typeNames[memoryType]}\n\n暂无记录。\n\n`;
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: resultText
          }
        ]
      };
    }
  } catch (error) {
    throw new Error(`获取记忆失败: ${error.response?.data?.error || error.message}`);
  }
}

async function searchMemories(query, project, type) {
  try {
    const apiClient = createApiClient();
    let searchPath = 'memories';

    if (project) {
      searchPath += `/${project}`;
      if (type) {
        searchPath += `/${type}`;
      }
    }

    const response = await apiClient.get('/api/mcp/documents', {
      params: {
        search: query,
        searchType: 'content',
        path: searchPath
      }
    });

    const searchData = response.data.data;
    const documents = searchData.documents || [];

    if (documents.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🧠 记忆搜索结果\n\n关键词: "${query}"\n${project ? `项目: ${project}\n` : ''}${type ? `类型: ${type}\n` : ''}\n❌ 未找到相关记忆`
          }
        ]
      };
    }

    let resultText = `🧠 记忆搜索结果\n\n关键词: "${query}"\n${project ? `项目: ${project}\n` : ''}${type ? `类型: ${type}\n` : ''}找到 ${documents.length} 个相关记忆:\n\n`;

    documents.forEach((doc, index) => {
      const pathParts = doc.path.split('/');
      const projectName = pathParts[1] || 'unknown';
      const memoryType = pathParts[2] || 'unknown';

      resultText += `${index + 1}. **${doc.name}**\n`;
      resultText += `   项目: ${projectName}\n`;
      resultText += `   类型: ${memoryType}\n`;
      resultText += `   修改时间: ${new Date(doc.lastModified).toLocaleString()}\n`;

      if (doc.excerpt) {
        resultText += `   摘要: ${doc.excerpt.substring(0, 200)}${doc.excerpt.length > 200 ? '...' : ''}\n`;
      }

      if (doc.matchedSnippets && doc.matchedSnippets.length > 0) {
        resultText += `   匹配片段:\n`;
        doc.matchedSnippets.slice(0, 2).forEach((snippet, i) => {
          resultText += `     ${i + 1}. "${snippet.substring(0, 150)}${snippet.length > 150 ? '...' : ''}"\n`;
        });
      }

      resultText += '\n';
    });

    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  } catch (error) {
    throw new Error(`搜索记忆失败: ${error.response?.data?.error || error.message}`);
  }
}

async function listMemoryProjects() {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/mcp/documents', {
      params: { path: 'memories' }
    });

    const documents = response.data.data.documents || [];
    const projects = new Set();

    documents.forEach(doc => {
      const pathParts = doc.path.split('/');
      if (pathParts.length >= 2 && pathParts[0] === 'memories') {
        projects.add(pathParts[1]);
      }
    });

    const projectList = Array.from(projects);

    if (projectList.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🧠 记忆项目列表\n\n暂无记忆项目。\n\n💡 提示: 使用 add_memory 命令开始记录第一个项目的记忆。`
          }
        ]
      };
    }

    let resultText = `🧠 记忆项目列表\n\n找到 ${projectList.length} 个项目:\n\n`;

    for (const project of projectList) {
      resultText += `📁 **${project}**\n`;

      // 统计每个项目的记忆类型
      const projectDocs = documents.filter(doc => doc.path.startsWith(`memories/${project}/`));
      const types = new Set();
      projectDocs.forEach(doc => {
        const pathParts = doc.path.split('/');
        if (pathParts.length >= 3) {
          types.add(pathParts[2]);
        }
      });

      if (types.size > 0) {
        resultText += `   记忆类型: ${Array.from(types).join(', ')}\n`;
        resultText += `   文档数量: ${projectDocs.length}\n`;
      }

      resultText += '\n';
    }

    return {
      content: [
        {
          type: 'text',
          text: resultText
        }
      ]
    };
  } catch (error) {
    throw new Error(`获取记忆项目列表失败: ${error.response?.data?.error || error.message}`);
  }
}

async function getDocumentUrl(path) {
  try {
    // 生成文档地址
    const cleanPath = path.replace('.md', '');
    const viewUrl = `/docs/${encodeURIComponent(cleanPath)}`;
    const fullUrl = `${SERVER_URL}${viewUrl}`;

    // 检查文档是否存在
    const apiClient = createApiClient();
    try {
      await apiClient.get('/api/mcp/documents', {
        params: {
          path: cleanPath,
          content: 'false'  // 只检查存在性，不获取内容
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `🔗 文档地址\n\n文档路径: ${path}\n在线地址: ${fullUrl}\n\n📖 点击地址即可在浏览器中查看文档内容。`
          }
        ]
      };
    } catch (error) {
      // 文档不存在，但仍然返回地址
      return {
        content: [
          {
            type: 'text',
            text: `🔗 文档地址\n\n文档路径: ${path}\n在线地址: ${fullUrl}\n\n⚠️ 注意: 该文档可能不存在，请先创建文档后再访问。`
          }
        ]
      };
    }
  } catch (error) {
    throw new Error(`生成文档地址失败: ${error.message}`);
  }
}

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Misonote Markdown MCP 服务器已启动');
}

main().catch((error) => {
  console.error('MCP 服务器启动失败:', error);
  process.exit(1);
});
