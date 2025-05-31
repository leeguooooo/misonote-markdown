import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/core/auth/auth';
import fs from 'fs';
import path from 'path';

const ANNOTATIONS_FILE = path.join(process.cwd(), 'data', 'annotations.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(ANNOTATIONS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取标注数据
function readAnnotations() {
  ensureDataDirectory();

  if (!fs.existsSync(ANNOTATIONS_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(ANNOTATIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading annotations:', error);
    return [];
  }
}

// 写入标注数据
function writeAnnotations(annotations: any[]) {
  ensureDataDirectory();

  try {
    fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(annotations, null, 2));
  } catch (error) {
    console.error('Error writing annotations:', error);
    throw new Error('Failed to save annotations');
  }
}

// DELETE - 删除单个标注（管理员功能）
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
    const annotationId = searchParams.get('annotationId');
    const docPath = searchParams.get('docPath');

    if (!annotationId || !docPath) {
      return NextResponse.json(
        { error: 'annotationId and docPath are required' },
        { status: 400 }
      );
    }

    const annotations = readAnnotations();
    const filteredAnnotations = annotations.filter(
      (annotation: any) => !(annotation.id === annotationId && annotation.docPath === docPath)
    );

    if (filteredAnnotations.length === annotations.length) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }

    writeAnnotations(filteredAnnotations);

    return NextResponse.json({
      success: true,
      message: '标注已删除'
    });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
