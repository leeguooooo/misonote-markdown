import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import fs from 'fs';
import path from 'path';

interface Comment {
  id: string;
  content: string;
  author: string;
  authorRole?: 'admin' | 'user' | 'guest';
  avatar?: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
  docPath: string;
}

const COMMENTS_FILE = path.join(process.cwd(), 'data', 'comments.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(COMMENTS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取评论数据
function readComments(): Comment[] {
  ensureDataDirectory();

  if (!fs.existsSync(COMMENTS_FILE)) {
    // 创建初始数据文件
    const initialComments: Comment[] = [];
    writeComments(initialComments);
    return initialComments;
  }

  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf-8');
    const comments = JSON.parse(data);
    // 确保时间戳是 Date 对象
    return comments.map((comment: any) => ({
      ...comment,
      timestamp: new Date(comment.timestamp),
      replies: comment.replies.map((reply: any) => ({
        ...reply,
        timestamp: new Date(reply.timestamp)
      }))
    }));
  } catch (error) {
    console.error('Error reading comments:', error);
    return [];
  }
}

// 写入评论数据
function writeComments(comments: Comment[]) {
  ensureDataDirectory();

  try {
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2));
  } catch (error) {
    console.error('Error writing comments:', error);
    throw new Error('Failed to save comments');
  }
}

// GET - 获取评论
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docPath = searchParams.get('docPath');

    if (!docPath) {
      return NextResponse.json(
        { error: 'docPath is required' },
        { status: 400 }
      );
    }

    const comments = readComments();
    const docComments = comments.filter(comment => comment.docPath === docPath);

    return NextResponse.json({ comments: docComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - 创建评论
export async function POST(request: NextRequest) {
  try {
    // 验证认证（可选，如果需要登录才能评论）
    // const user = authenticateRequest(request);
    // if (!user) {
    // return NextResponse.json(
    //   { error: '未授权访问' },
    //   { status: 401 }
    // );
    // }

    const { content, docPath, parentId, author = '匿名用户', authorRole = 'guest' } = await request.json();

    if (!content || !docPath) {
      return NextResponse.json(
        { error: 'content and docPath are required' },
        { status: 400 }
      );
    }

    const comments = readComments();

    const newComment: Comment = {
      id: Date.now().toString(),
      content,
      author,
      authorRole,
      timestamp: new Date(),
      likes: 0,
      replies: [],
      docPath
    };

    if (parentId) {
      // 这是一个回复
      const parentComment = comments.find(c => c.id === parentId);
      if (parentComment) {
        parentComment.replies.push(newComment);
      } else {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    } else {
      // 这是一个新评论
      comments.push(newComment);
    }

    writeComments(comments);

    return NextResponse.json({
      success: true,
      comment: newComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

// PUT - 更新评论（点赞等）
export async function PUT(request: NextRequest) {
  try {
    const { commentId, action, docPath } = await request.json();

    if (!commentId || !action || !docPath) {
      return NextResponse.json(
        { error: 'commentId, action, and docPath are required' },
        { status: 400 }
      );
    }

    const comments = readComments();

    // 查找评论（包括回复）
    let targetComment: Comment | null = null;

    for (const comment of comments) {
      if (comment.docPath === docPath) {
        if (comment.id === commentId) {
          targetComment = comment;
          break;
        }

        // 检查回复
        for (const reply of comment.replies) {
          if (reply.id === commentId) {
            targetComment = reply;
            break;
          }
        }

        if (targetComment) break;
      }
    }

    if (!targetComment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // 执行操作
    switch (action) {
      case 'like':
        targetComment.likes += 1;
        break;
      case 'unlike':
        targetComment.likes = Math.max(0, targetComment.likes - 1);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    writeComments(comments);

    return NextResponse.json({
      success: true,
      comment: targetComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// DELETE - 删除评论
export async function DELETE(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
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

    // 删除评论或回复
    let deleted = false;

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
