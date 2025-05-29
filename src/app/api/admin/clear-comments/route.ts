import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const COMMENTS_FILE = path.join(process.cwd(), 'data', 'comments.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(COMMENTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取评论数据
function readComments() {
  ensureDataDirectory();

  if (!fs.existsSync(COMMENTS_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

// 写入评论数据
function writeComments(comments: any[]) {
  ensureDataDirectory();

  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error writing comments:', error);
    throw new Error('Failed to save comments');
  }
}

// POST - 清空评论（管理员功能）
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { docPath } = await request.json();

    if (!docPath) {
      return NextResponse.json(
        { error: 'docPath is required' },
        { status: 400 }
      );
    }

    const comments = readComments();

    // 过滤掉指定文档的所有评论
    const filteredComments = comments.filter((comment: any) => comment.docPath !== docPath);

    writeComments(filteredComments);

    const deletedCount = comments.length - filteredComments.length;

    return NextResponse.json({
      success: true,
      message: `已删除 ${deletedCount} 条评论`,
      deletedCount
    });
  } catch (error) {
    console.error('Error clearing comments:', error);
    return NextResponse.json(
      { error: 'Failed to clear comments' },
      { status: 500 }
    );
  }
}
