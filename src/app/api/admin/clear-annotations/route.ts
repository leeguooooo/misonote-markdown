import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
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

// POST - 清空标注（管理员功能）
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

    const annotations = readAnnotations();

    // 过滤掉指定文档的所有标注
    const filteredAnnotations = annotations.filter((annotation: any) => annotation.docPath !== docPath);

    writeAnnotations(filteredAnnotations);

    const deletedCount = annotations.length - filteredAnnotations.length;

    return NextResponse.json({
      success: true,
      message: `已删除 ${deletedCount} 条标注`,
      deletedCount
    });
  } catch (error) {
    console.error('Error clearing annotations:', error);
    return NextResponse.json(
      { error: 'Failed to clear annotations' },
      { status: 500 }
    );
  }
}
