/**
 * MCP 客户端 - 用于与 misonote-markdown 服务器通信
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  MCPServerConfig, 
  MCPDocumentRequest, 
  MCPDocumentResponse, 
  MCPBatchRequest, 
  MCPBatchResponse,
  MCPConnectionTestResult,
  MCPServerCapabilities,
  MCPApiResponse
} from '@/types/mcp';
import { log } from '../logger';

export class MCPClient {
  private axiosInstance: AxiosInstance;
  private serverConfig: MCPServerConfig;

  constructor(serverConfig: MCPServerConfig) {
    this.serverConfig = serverConfig;
    this.axiosInstance = axios.create({
      baseURL: serverConfig.url,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverConfig.apiKey}`,
        'User-Agent': 'misonote-markdown-mcp-client/1.0.0',
      },
    });

    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      (config) => {
        log.debug(`MCP 请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        log.error('MCP 请求错误', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        log.debug(`MCP 响应: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        log.error('MCP 响应错误', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<MCPConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance.get('/api/health');
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
        serverInfo: response.data?.serverInfo,
      };
    } catch (error: any) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error.message || '连接失败',
      };
    }
  }

  /**
   * 获取服务器能力
   */
  async getServerCapabilities(): Promise<MCPServerCapabilities | null> {
    try {
      const response = await this.axiosInstance.get('/api/mcp/capabilities');
      return response.data;
    } catch (error) {
      log.error('获取服务器能力失败', error);
      return null;
    }
  }

  /**
   * 推送单个文档
   */
  async pushDocument(document: MCPDocumentRequest): Promise<MCPDocumentResponse> {
    try {
      const response = await this.axiosInstance.post('/api/mcp/documents', document);
      
      return {
        success: true,
        message: '文档推送成功',
        data: response.data,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '推送失败';
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * 批量推送文档
   */
  async pushDocuments(documents: MCPDocumentRequest[]): Promise<MCPBatchResponse> {
    try {
      const batchRequest: MCPBatchRequest = {
        documents,
        serverId: this.serverConfig.id,
        batchId: this.generateBatchId(),
      };

      const response = await this.axiosInstance.post('/api/mcp/documents/batch', batchRequest);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '批量推送失败';
      
      return {
        success: false,
        batchId: this.generateBatchId(),
        results: documents.map(() => ({
          success: false,
          message: errorMessage,
          error: errorMessage,
        })),
        totalCount: documents.length,
        successCount: 0,
        errorCount: documents.length,
        errors: [errorMessage],
      };
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(path: string): Promise<MCPDocumentResponse> {
    try {
      const response = await this.axiosInstance.delete(`/api/mcp/documents`, {
        data: { path }
      });
      
      return {
        success: true,
        message: '文档删除成功',
        data: response.data,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      
      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * 获取文档列表
   */
  async getDocuments(): Promise<MCPApiResponse<any[]>> {
    try {
      const response = await this.axiosInstance.get('/api/docs');
      
      return {
        success: true,
        data: response.data.docs || [],
        timestamp: new Date(),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '获取文档列表失败';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 获取单个文档
   */
  async getDocument(path: string): Promise<MCPApiResponse<any>> {
    try {
      const response = await this.axiosInstance.get(`/api/docs/${encodeURIComponent(path)}`);
      
      return {
        success: true,
        data: response.data,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '获取文档失败';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 生成批次 ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新服务器配置
   */
  updateServerConfig(newConfig: MCPServerConfig): void {
    this.serverConfig = newConfig;
    
    // 更新 axios 实例配置
    this.axiosInstance.defaults.baseURL = newConfig.url;
    this.axiosInstance.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
  }

  /**
   * 获取当前服务器配置
   */
  getServerConfig(): MCPServerConfig {
    return { ...this.serverConfig };
  }
}

/**
 * MCP 客户端管理器
 */
export class MCPClientManager {
  private clients: Map<string, MCPClient> = new Map();

  /**
   * 获取或创建客户端
   */
  getClient(serverConfig: MCPServerConfig): MCPClient {
    const existingClient = this.clients.get(serverConfig.id);
    
    if (existingClient) {
      // 更新配置（如果有变化）
      existingClient.updateServerConfig(serverConfig);
      return existingClient;
    }

    const newClient = new MCPClient(serverConfig);
    this.clients.set(serverConfig.id, newClient);
    
    log.info(`创建 MCP 客户端: ${serverConfig.name}`);
    return newClient;
  }

  /**
   * 移除客户端
   */
  removeClient(serverId: string): void {
    if (this.clients.delete(serverId)) {
      log.info(`移除 MCP 客户端: ${serverId}`);
    }
  }

  /**
   * 清理所有客户端
   */
  clearClients(): void {
    this.clients.clear();
    log.info('清理所有 MCP 客户端');
  }

  /**
   * 获取所有客户端 ID
   */
  getClientIds(): string[] {
    return Array.from(this.clients.keys());
  }
}

// 全局客户端管理器实例
export const mcpClientManager = new MCPClientManager();
