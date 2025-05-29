import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { path: docPath, content, name } = await request.json();

    if (!docPath || !content) {
      return NextResponse.json(
        { error: 'Path and content are required' },
        { status: 400 }
      );
    }

    // Ensure the docs directory exists
    const docsDir = path.join(process.cwd(), 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Create the full file path
    const fullPath = path.join(docsDir, `${docPath}.md`);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(fullPath, content, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'Document saved successfully',
      path: fullPath 
    });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json(
      { error: 'Failed to save document' },
      { status: 500 }
    );
  }
}
