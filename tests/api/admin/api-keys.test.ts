/**
 * API Keys API 路由集成测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/api-keys/route'
import { GET as getById, PUT, DELETE } from '@/app/api/admin/api-keys/[id]/route'
import { cleanTestDatabase } from '../../utils/test-database'
import jwt from 'jsonwebtoken'

// 创建测试用的认证token
function createTestToken(role: string = 'admin'): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret'
  return jwt.sign(
    { 
      userId: 'test-user', 
      role,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
    },
    secret
  )
}

// 创建测试请求
function createTestRequest(
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  return new NextRequest(url, requestInit)
}

describe('API Keys API 路由测试', () => {
  beforeEach(() => {
    cleanTestDatabase()
  })

  afterEach(() => {
    cleanTestDatabase()
  })

  describe('GET /api/admin/api-keys', () => {
    it('应该返回所有API密钥（管理员权限）', async () => {
      const token = createTestToken('admin')
      const request = createTestRequest(
        'GET',
        'http://localhost:3000/api/admin/api-keys',
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    it('应该拒绝非管理员用户', async () => {
      const token = createTestToken('user')
      const request = createTestRequest(
        'GET',
        'http://localhost:3000/api/admin/api-keys',
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('权限')
    })

    it('应该拒绝无认证的请求', async () => {
      const request = createTestRequest(
        'GET',
        'http://localhost:3000/api/admin/api-keys'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/admin/api-keys', () => {
    it('应该创建新的API密钥', async () => {
      const token = createTestToken('admin')
      const requestBody = {
        name: 'Test API Key',
        permissions: ['read', 'write'],
        description: 'Test description',
        rateLimit: 500,
      }

      const request = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        requestBody,
        { Authorization: `Bearer ${token}` }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.apiKey).toBeDefined()
      expect(data.data.secretKey).toBeDefined()
      expect(data.data.apiKey.name).toBe(requestBody.name)
      expect(data.data.apiKey.permissions).toEqual(requestBody.permissions)
      expect(data.data.apiKey.description).toBe(requestBody.description)
      expect(data.data.apiKey.rateLimit).toBe(requestBody.rateLimit)
      expect(data.data.secretKey).toMatch(/^mcp_[a-zA-Z0-9]{32}$/)
    })

    it('应该验证必需字段', async () => {
      const token = createTestToken('admin')
      const requestBody = {
        // 缺少 name 字段
        permissions: ['read'],
      }

      const request = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        requestBody,
        { Authorization: `Bearer ${token}` }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('name')
    })

    it('应该处理过期时间', async () => {
      const token = createTestToken('admin')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后
      const requestBody = {
        name: 'Expiring Key',
        permissions: ['read'],
        expiresAt: expiresAt.toISOString(),
      }

      const request = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        requestBody,
        { Authorization: `Bearer ${token}` }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(new Date(data.data.apiKey.expiresAt)).toEqual(expiresAt)
    })

    it('应该拒绝非管理员用户', async () => {
      const token = createTestToken('user')
      const requestBody = {
        name: 'Unauthorized Key',
        permissions: ['read'],
      }

      const request = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        requestBody,
        { Authorization: `Bearer ${token}` }
      )

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/admin/api-keys/[id]', () => {
    it('应该根据ID获取API密钥', async () => {
      // 先创建一个API密钥
      const token = createTestToken('admin')
      const createRequest = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        { name: 'Test Key', permissions: ['read'] },
        { Authorization: `Bearer ${token}` }
      )

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()
      const apiKeyId = createData.data.apiKey.id

      // 获取API密钥
      const getRequest = createTestRequest(
        'GET',
        `http://localhost:3000/api/admin/api-keys/${apiKeyId}`,
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const response = await getById(getRequest, { params: { id: apiKeyId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(apiKeyId)
      expect(data.data.name).toBe('Test Key')
    })

    it('应该在ID不存在时返回404', async () => {
      const token = createTestToken('admin')
      const request = createTestRequest(
        'GET',
        'http://localhost:3000/api/admin/api-keys/non-existent-id',
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const response = await getById(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('PUT /api/admin/api-keys/[id]', () => {
    it('应该更新API密钥', async () => {
      // 先创建一个API密钥
      const token = createTestToken('admin')
      const createRequest = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        { name: 'Original Name', permissions: ['read'] },
        { Authorization: `Bearer ${token}` }
      )

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()
      const apiKeyId = createData.data.apiKey.id

      // 更新API密钥
      const updateBody = {
        name: 'Updated Name',
        permissions: ['read', 'write'],
        description: 'Updated description',
      }

      const updateRequest = createTestRequest(
        'PUT',
        `http://localhost:3000/api/admin/api-keys/${apiKeyId}`,
        updateBody,
        { Authorization: `Bearer ${token}` }
      )

      const response = await PUT(updateRequest, { params: { id: apiKeyId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // 验证更新结果
      const getRequest = createTestRequest(
        'GET',
        `http://localhost:3000/api/admin/api-keys/${apiKeyId}`,
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const getResponse = await getById(getRequest, { params: { id: apiKeyId } })
      const getData = await getResponse.json()

      expect(getData.data.name).toBe('Updated Name')
      expect(getData.data.permissions).toEqual(['read', 'write'])
      expect(getData.data.description).toBe('Updated description')
    })
  })

  describe('DELETE /api/admin/api-keys/[id]', () => {
    it('应该删除API密钥', async () => {
      // 先创建一个API密钥
      const token = createTestToken('admin')
      const createRequest = createTestRequest(
        'POST',
        'http://localhost:3000/api/admin/api-keys',
        { name: 'To Delete', permissions: ['read'] },
        { Authorization: `Bearer ${token}` }
      )

      const createResponse = await POST(createRequest)
      const createData = await createResponse.json()
      const apiKeyId = createData.data.apiKey.id

      // 删除API密钥
      const deleteRequest = createTestRequest(
        'DELETE',
        `http://localhost:3000/api/admin/api-keys/${apiKeyId}`,
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const response = await DELETE(deleteRequest, { params: { id: apiKeyId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // 验证删除结果
      const getRequest = createTestRequest(
        'GET',
        `http://localhost:3000/api/admin/api-keys/${apiKeyId}`,
        undefined,
        { Authorization: `Bearer ${token}` }
      )

      const getResponse = await getById(getRequest, { params: { id: apiKeyId } })
      expect(getResponse.status).toBe(404)
    })
  })
})
