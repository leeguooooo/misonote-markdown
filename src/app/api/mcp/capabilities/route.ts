import { NextRequest, NextResponse } from 'next/server';
import { authenticateMcpRequest } from '@/lib/api-auth';

// GET - 获取 MCP 服务器能力
export async function GET(request: NextRequest) {
  try {
    // 验证 API 密钥（可选，某些情况下可能需要公开访问）
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const authResult = authenticateMcpRequest(request);
      if (!authResult.success) {
        return NextResponse.json(
          { 
            success: false,
            error: authResult.error,
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }
    }

    const capabilities = {
      success: true,
      data: {
        // 服务器基本信息
        server: {
          name: 'misonote-markdown',
          description: 'Markdown documentation system with MCP support',
          version: '1.0.0',
          vendor: 'misonote',
          homepage: 'https://github.com/misonote/markdown-preview'
        },

        // MCP 协议支持
        protocol: {
          version: '1.0.0',
          supportedMethods: [
            'documents.list',
            'documents.create',
            'documents.update',
            'documents.delete',
            'documents.get',
            'documents.batch'
          ]
        },

        // 功能能力
        capabilities: {
          // 批量操作支持
          supportsBatch: true,
          maxBatchSize: 100,

          // Webhook 支持
          supportsWebhooks: true,
          webhookMethods: ['POST'],
          webhookSignature: 'sha256',

          // 元数据支持
          supportsMetadata: true,
          metadataFields: [
            'title',
            'description',
            'tags',
            'author',
            'created',
            'modified',
            'category'
          ],

          // 版本控制
          supportsVersioning: false,

          // 搜索功能
          supportsSearch: true,
          searchMethods: ['fulltext', 'metadata'],

          // 文件格式支持
          supportedFormats: ['markdown', 'md'],
          supportedEncodings: ['utf-8'],

          // 大小限制
          maxDocumentSize: 10 * 1024 * 1024, // 10MB
          maxPathLength: 255,

          // 路径规则
          pathRules: {
            allowedCharacters: 'alphanumeric, hyphen, underscore, slash, dot',
            caseSensitive: true,
            maxDepth: 10,
            reservedNames: ['api', 'admin', 'health', 'mcp']
          }
        },

        // API 端点
        endpoints: {
          health: '/api/health',
          documents: '/api/mcp/documents',
          batch: '/api/mcp/documents/batch',
          webhook: '/api/mcp/webhook',
          capabilities: '/api/mcp/capabilities'
        },

        // 认证方式
        authentication: {
          methods: ['api-key'],
          apiKey: {
            header: 'Authorization',
            format: 'Bearer {token}',
            alternativeHeaders: ['X-API-Key'],
            prefix: 'mcp_'
          }
        },

        // 速率限制
        rateLimiting: {
          enabled: true,
          defaultLimit: 1000, // 每小时
          windowSize: 3600, // 秒
          headers: {
            limit: 'X-RateLimit-Limit',
            remaining: 'X-RateLimit-Remaining',
            reset: 'X-RateLimit-Reset'
          }
        },

        // 错误处理
        errorHandling: {
          format: 'json',
          includeTimestamp: true,
          includeRequestId: false,
          standardCodes: true
        },

        // 响应格式
        responseFormat: {
          contentType: 'application/json',
          charset: 'utf-8',
          structure: {
            success: 'boolean',
            data: 'object|array',
            message: 'string',
            error: 'string',
            timestamp: 'string'
          }
        }
      },
      message: 'MCP 服务器能力信息',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(capabilities, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // 缓存 1 小时
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('获取 MCP 能力信息失败:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '获取服务器能力信息失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
