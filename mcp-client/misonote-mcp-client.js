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
          text: `文档路径: ${documentData.path}\n文档名称: ${documentData.name}\n文档大小: ${documentData.size} 字节\n最后修改: ${new Date(documentData.lastModified).toLocaleString()}\n\n--- 文档内容 ---\n\n${documentData.content}`
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
          text: `文档创建成功!\n路径: ${response.data.data.path}\n大小: ${response.data.data.size} 字节\n访问链接: ${SERVER_URL}${response.data.data.url}`
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
          text: `文档更新成功!\n路径: ${response.data.data.path}\n大小: ${response.data.data.size} 字节\n访问链接: ${SERVER_URL}${response.data.data.url}`
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
