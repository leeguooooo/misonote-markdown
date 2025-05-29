import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Annotation {
  id: string;
  text: string;
  comment: string;
  type: 'highlight' | 'note' | 'bookmark';
  position: {
    start: number;
    end: number;
    startContainer: string;
    endContainer: string;
  };
  timestamp: Date;
  author: string;
  docPath: string;
}

const ANNOTATIONS_FILE = path.join(process.cwd(), 'data', 'annotations.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(ANNOTATIONS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取标注数据
function readAnnotations(): Annotation[] {
  ensureDataDirectory();
  
  if (!fs.existsSync(ANNOTATIONS_FILE)) {
    const initialAnnotations: Annotation[] = [];
    writeAnnotations(initialAnnotations);
    return initialAnnotations;
  }
  
  try {
    const data = fs.readFileSync(ANNOTATIONS_FILE, 'utf-8');
    const annotations = JSON.parse(data);
    return annotations.map((annotation: any) => ({
      ...annotation,
      timestamp: new Date(annotation.timestamp)
    }));
  } catch (error) {
    console.error('Error reading annotations:', error);
    return [];
  }
}

// 写入标注数据
function writeAnnotations(annotations: Annotation[]) {
  ensureDataDirectory();
  
  try {
    fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(annotations, null, 2));
  } catch (error) {
    console.error('Error writing annotations:', error);
    throw new Error('Failed to save annotations');
  }
}

// GET - 获取标注
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
    
    const annotations = readAnnotations();
    const docAnnotations = annotations.filter(annotation => annotation.docPath === docPath);
    
    return NextResponse.json({ annotations: docAnnotations });
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
    
    const annotations = readAnnotations();
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      text,
      comment: comment || '',
      type,
      position,
      timestamp: new Date(),
      author,
      docPath
    };
    
    annotations.push(newAnnotation);
    writeAnnotations(annotations);
    
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
    const docPath = searchParams.get('docPath');
    
    if (!annotationId || !docPath) {
      return NextResponse.json(
        { error: 'annotationId and docPath are required' },
        { status: 400 }
      );
    }
    
    const annotations = readAnnotations();
    const filteredAnnotations = annotations.filter(
      annotation => !(annotation.id === annotationId && annotation.docPath === docPath)
    );
    
    if (filteredAnnotations.length === annotations.length) {
      return NextResponse.json(
        { error: 'Annotation not found' },
        { status: 404 }
      );
    }
    
    writeAnnotations(filteredAnnotations);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    return NextResponse.json(
      { error: 'Failed to delete annotation' },
      { status: 500 }
    );
  }
}
