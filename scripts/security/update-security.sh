#!/bin/bash

# 安全配置更新脚本
# 用于快速更新服务器上的安全配置

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到 root 用户，请确保这是预期的"
    fi
}

# 检查必要的命令
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v pm2 &> /dev/null; then
        log_error "PM2 未安装，请先安装 PM2"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先安装 pnpm"
        exit 1
    fi

    log_success "依赖检查通过"
}

# 备份当前配置
backup_config() {
    log_info "备份当前配置..."

    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        log_success "已备份 .env 文件"
    fi

    if [ -f "ecosystem.config.js" ]; then
        cp ecosystem.config.js ecosystem.config.js.backup.$(date +%Y%m%d_%H%M%S)
        log_success "已备份 ecosystem.config.js 文件"
    fi
}

# 生成新的 JWT 密钥
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32
    else
        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    fi
}

# 获取用户输入的密码
get_admin_password() {
    echo ""
    log_info "设置管理员密码"
    echo "请输入新的管理员密码 (至少6位字符):"

    # 隐藏输入的密码
    read -s password
    echo ""

    # 验证密码长度
    if [ ${#password} -lt 6 ]; then
        log_error "密码长度至少需要6位字符"
        exit 1
    fi

    echo "请再次确认密码:"
    read -s password_confirm
    echo ""

    # 验证密码一致性
    if [ "$password" != "$password_confirm" ]; then
        log_error "两次输入的密码不一致"
        exit 1
    fi

    log_success "密码设置成功"
}

# 生成密码哈希
generate_password_hash() {
    log_info "正在生成密码哈希..."

    # 使用 Node.js 生成 bcrypt 哈希
    password_hash=$(node -e "
        const bcrypt = require('bcryptjs');
        const hash = bcrypt.hashSync('$password', 12);
        console.log(hash);
    ")

    if [ -z "$password_hash" ]; then
        log_error "密码哈希生成失败"
        exit 1
    fi

    log_success "密码哈希生成成功"
}

# 更新 .env 文件
update_env_file() {
    log_info "更新 .env 文件..."

    local jwt_secret=$(generate_jwt_secret)

    # 使用 printf 而不是 cat << EOF 来避免变量展开问题
    {
        echo "# 管理员密码哈希 (自动生成)"
        printf "ADMIN_PASSWORD_HASH=%s\n" "$password_hash"
        echo ""
        echo "# JWT 密钥 (自动生成的安全密钥)"
        printf "JWT_SECRET=%s\n" "$jwt_secret"
        echo ""
        echo "# 环境设置"
        echo "NODE_ENV=production"
        echo ""
        echo "# 服务端口"
        echo "PORT=3001"
    } > .env

    # 设置安全权限
    chmod 600 .env

    log_success "已更新 .env 文件"
}

# 验证配置文件
verify_config() {
    log_info "验证配置文件..."

    if [ ! -f ".env" ]; then
        log_error ".env 文件不存在"
        exit 1
    fi

    if ! grep -q "ADMIN_PASSWORD_HASH" .env; then
        log_error ".env 文件中缺少 ADMIN_PASSWORD_HASH"
        exit 1
    fi

    if ! grep -q "JWT_SECRET" .env; then
        log_error ".env 文件中缺少 JWT_SECRET"
        exit 1
    fi

    log_success "配置文件验证通过"
}

# 重启 PM2 应用
restart_app() {
    log_info "重启 PM2 应用..."

    # 检查应用是否存在
    if pm2 list | grep -q "docs-platform"; then
        pm2 restart docs-platform --update-env
        log_success "应用重启成功"
    else
        log_warning "未找到 docs-platform 应用，尝试启动..."
        pm2 start ecosystem.config.js --env production
        log_success "应用启动成功"
    fi
}

# 显示应用状态
show_status() {
    log_info "应用状态:"
    pm2 status

    echo ""
    log_info "最近日志:"
    pm2 logs docs-platform --lines 10 || true
}

# 显示登录信息
show_login_info() {
    echo ""
    log_success "=== 安全配置更新完成 ==="
    echo ""
    echo "新的登录凭据:"
    echo "  用户名: admin"
    echo "  密码: [你刚才设置的密码]"
    echo ""
    echo "应用地址: http://localhost:3001"
    echo ""
    log_success "密码已安全设置，请使用新密码登录"
    log_warning "请立即登录并验证配置是否正确"
}

# 主函数
main() {
    echo "🔐 安全配置更新脚本"
    echo "===================="
    echo ""

    check_root
    check_dependencies
    backup_config
    get_admin_password
    generate_password_hash
    update_env_file
    verify_config
    restart_app
    show_status
    show_login_info
}

# 如果直接运行此脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
