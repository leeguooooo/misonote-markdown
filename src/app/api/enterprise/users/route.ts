import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: '用户管理功能需要专业版或企业版许可证',
    feature: 'multi_user',
    upgradeUrl: '/pricing',
    description: '多用户管理功能允许您添加团队成员并分配不同的权限'
  }, { status: 402 }); // Payment Required
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: '创建用户功能需要专业版或企业版许可证',
    feature: 'multi_user',
    upgradeUrl: '/pricing'
  }, { status: 402 });
}
