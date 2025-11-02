# MPC Wallet Dockerfile
FROM rust:1.75 as builder

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libgmp-dev \
    protobuf-compiler \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 复制 Cargo 文件
COPY Cargo.toml Cargo.lock ./
COPY build.rs ./

# 复制源代码
COPY src ./src
COPY proto ./proto

# 编译项目
RUN cargo build --release

# 运行时镜像
FROM debian:bookworm-slim

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    libgmp10 \
    libssl3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 创建非 root 用户
RUN useradd -r -s /bin/false mpc-wallet

# 创建必要的目录
RUN mkdir -p /app /data /config /logs && \
    chown -R mpc-wallet:mpc-wallet /app /data /config /logs

# 复制二进制文件
COPY --from=builder /app/target/release/mpc_wallet /app/

# 切换到非 root 用户
USER mpc-wallet

# 设置工作目录
WORKDIR /app

# 暴露 gRPC 端口
EXPOSE 50051

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD [ "/app/mpc_wallet", "health-check" ] || exit 1

# 启动命令
ENTRYPOINT ["/app/mpc_wallet"]
CMD ["--config", "/config/config.toml"]
