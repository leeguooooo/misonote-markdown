# 多阶段构建 Dockerfile for Misonote Markdown System
FROM node:18-alpine AS base

# 安装必要的系统依赖和构建工具（移除 SQLite，添加 PostgreSQL 客户端）
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    musl-dev \
    postgresql-client \
    pkgconfig \
    git

# 设置工作目录
WORKDIR /app

# 复制 package 文件和配置文件
COPY package.json pnpm-lock.yaml* .pnpmrc pnpm-workspace.yaml ./
COPY scripts/install.sh ./scripts/

# 安装 pnpm
RUN npm install -g pnpm

# 设置构建环境变量
ENV PYTHON=/usr/bin/python3
ENV npm_config_build_from_source=false
ENV MAKEFLAGS="-j$(nproc)"
ENV npm_config_target_platform=linux
ENV npm_config_cache=/tmp/.npm

# 使用一键安装命令（自动处理构建脚本）
RUN chmod +x scripts/install.sh && \
    SKIP_POSTINSTALL=true pnpm install --no-frozen-lockfile --prefer-offline && \
    (echo "a" | pnpm approve-builds || echo "构建脚本已处理")

# 构建阶段
FROM base AS builder

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# 默认管理员密码: admin123 (可通过环境变量覆盖)
ENV ADMIN_PASSWORD_HASH_BASE64=JDJiJDEyJDRqY3YuRkVkTzBzLmUvamkvN09DVS5VeEtqTnlBTmszL2Y4VG1sS2JiY2w2VDNSMjNqdDhh

# 生成默认环境变量（如果不存在）
RUN if [ ! -f .env ]; then \
    echo "# Docker 环境默认配置" > .env && \
    echo "NODE_ENV=production" >> .env && \
    echo "PORT=3001" >> .env && \
    echo "# 管理员密码将在首次启动时设置" >> .env; \
    fi


# Docker 环境下使用简化的构建流程
ENV DOCKER_BUILD=true
RUN pnpm prebuild:docker && pnpm build:docker

# 生产运行阶段
FROM node:18-alpine AS runner

# 安装必要的系统依赖（添加 PostgreSQL 客户端）
RUN apk add --no-cache \
    libc6-compat \
    bash \
    postgresql-client

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# MCP 客户端不包含在镜像中，用户需要本地安装

# 安装运行时必需的依赖（bcryptjs 用于密码处理）
RUN pnpm add bcryptjs

# 设置启动脚本权限
RUN chmod +x scripts/docker-entrypoint.sh

# 创建必要的目录
RUN mkdir -p docs data logs
RUN chown -R nextjs:nodejs /app

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001
# 默认管理员密码: admin123 (可通过环境变量覆盖)
ENV ADMIN_PASSWORD_HASH_BASE64=JDJiJDEyJDRqY3YuRkVkTzBzLmUvamkvN09DVS5VeEtqTnlBTmszL2Y4VG1sS2JiY2w2VDNSMjNqdDhh

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 设置入口点和启动命令
ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
