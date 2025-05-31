import '@testing-library/jest-dom'
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'

// 测试数据库路径
const TEST_DB_DIR = path.join(process.cwd(), 'tests', 'data')
const TEST_DB_PATH = path.join(TEST_DB_DIR, 'test.db')

// 设置测试环境变量
beforeAll(() => {
  // 确保测试数据目录存在
  if (!fs.existsSync(TEST_DB_DIR)) {
    fs.mkdirSync(TEST_DB_DIR, { recursive: true })
  }

  // 设置测试环境变量
  ;(process.env as any).NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-jwt-secret'
  process.env.ADMIN_PASSWORD_HASH_BASE64 = Buffer.from('$2a$12$test.hash.for.testing').toString('base64')
})

// 每个测试前清理数据库
beforeEach(() => {
  // 删除测试数据库文件
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
})

// 每个测试后清理
afterEach(() => {
  // 清理测试数据库
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH)
  }
})

// 全局清理
afterAll(() => {
  // 清理测试数据目录
  if (fs.existsSync(TEST_DB_DIR)) {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true })
  }
})
