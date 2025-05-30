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

// DELETE - 删除单个评论（管理员功能）
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = authenticateRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const docPath = searchParams.get('docPath');

    if (!commentId || !docPath) {
      return NextResponse.json(
        { error: 'commentId and docPath are required' },
        { status: 400 }
      );
    }

    const comments = readComments();
    let deleted = false;

    // 删除评论或回复
    for (let i = comments.length - 1; i >= 0; i--) {
      const comment = comments[i];

      if (comment.docPath === docPath) {
        // 检查是否是主评论
        if (comment.id === commentId) {
          comments.splice(i, 1);
          deleted = true;
          break;
        }

        // 检查回复
        for (let j = comment.replies.length - 1; j >= 0; j--) {
          if (comment.replies[j].id === commentId) {
            comment.replies.splice(j, 1);
            deleted = true;
            break;
          }
        }

        if (deleted) break;
      }
    }

    if (!deleted) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    writeComments(comments);

    return NextResponse.json({
      success: true,
      message: '评论已删除'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
