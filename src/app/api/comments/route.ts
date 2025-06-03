import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import {
  createComment,
  getCommentsByDocument,
  updateComment,
  deleteComment,
  likeComment,
  type Comment,
  type CreateCommentRequest
} from '@/core/services/comment-service';

// 数据库操作已移至 comment-service

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

    const comments = await getCommentsByDocument(docPath); // 只显示已审核的评论（现在默认都会审核通过）

    return NextResponse.json({ comments });
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

    const commentRequest: CreateCommentRequest = {
      documentPath: docPath,
      content,
      authorName: author,
      authorRole,
      parentId
    };

    const newComment = await createComment(commentRequest);

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
    const { commentId, action } = await request.json();

    if (!commentId || !action) {
      return NextResponse.json(
        { error: 'commentId and action are required' },
        { status: 400 }
      );
    }

    let success = false;

    // 执行操作
    switch (action) {
      case 'like':
        success = await likeComment(commentId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
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

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    const success = await deleteComment(commentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
