import { NextRequest, NextResponse } from 'next/server';
import {
  createAnnotation,
  getAnnotationsByDocument,
  deleteAnnotation,
  type Annotation,
  type CreateAnnotationRequest,
  type AnnotationType
} from '@/core/services/annotation-service';

// 数据库操作已移至 annotation-service

// GET - 获取标注
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const docPath = searchParams.get('docPath');
    const type = searchParams.get('type') as AnnotationType;

    if (!docPath) {
      return NextResponse.json(
        { error: 'docPath is required' },
        { status: 400 }
      );
    }

    const annotations = await getAnnotationsByDocument(docPath, type, false); // 只显示已审核的标注（现在默认都会审核通过）

    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Error fetching annotations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch annotations' },
      { status: 500 }
    );
  }
}

// POST - 创建标注
export async function POST(request: NextRequest) {
  try {
    const { text, comment, type, position, docPath, author = '当前用户' } = await request.json();

    if (!text || !type || !position || !docPath) {
      return NextResponse.json(
        { error: 'text, type, position, and docPath are required' },
        { status: 400 }
      );
    }

    const annotationRequest: CreateAnnotationRequest = {
      documentPath: docPath,
      annotationType: type as AnnotationType,
      selectedText: text,
      commentText: comment || '',
      positionData: position,
      authorName: author,
      authorRole: 'guest'
    };

    const newAnnotation = await createAnnotation(annotationRequest);

    return NextResponse.json({
      success: true,
      annotation: newAnnotation
    });
  } catch (error) {
    console.error('Error creating annotation:', error);
    return NextResponse.json(
      { error: 'Failed to create annotation' },
      { status: 500 }
    );
  }
}

// DELETE - 删除标注
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annotationId = searchParams.get('annotationId');

    if (!annotationId) {
      return NextResponse.json(
        { error: 'annotationId is required' },
        { status: 400 }
      );
    }

    const success = await deleteAnnotation(annotationId);

    if (!success) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
