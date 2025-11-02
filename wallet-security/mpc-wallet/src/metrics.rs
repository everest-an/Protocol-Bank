///! 监控指标模块
///! 
///! 提供 Prometheus 指标导出

use prometheus::{
    Counter, CounterVec, Gauge, GaugeVec, Histogram, HistogramOpts, HistogramVec, Opts, Registry,
};
use std::sync::Arc;

/// 指标收集器
pub struct MetricsCollector {
    registry: Registry,
    
    // 计数器
    pub transactions_total: CounterVec,
    pub signatures_total: CounterVec,
    pub errors_total: CounterVec,
    pub policy_violations_total: CounterVec,
    pub replay_attacks_detected: Counter,
    pub tamper_detected: Counter,
    pub audit_log_writes: Counter,
    pub audit_log_write_errors: Counter,
    pub key_operations_total: CounterVec,
    pub key_operation_errors: Counter,
    pub network_requests_total: CounterVec,
    pub network_errors_total: CounterVec,
    
    // 直方图（延迟）
    pub signing_duration: HistogramVec,
    pub policy_evaluation_duration: Histogram,
    pub audit_log_write_duration: Histogram,
    pub network_request_duration: HistogramVec,
    
    // 仪表盘（当前状态）
    pub active_sessions: Gauge,
    pub pending_transactions: Gauge,
    pub memory_usage_bytes: Gauge,
    pub cpu_usage_percent: Gauge,
}

impl MetricsCollector {
    /// 创建新的指标收集器
    pub fn new() -> anyhow::Result<Self> {
        let registry = Registry::new();

        // 交易计数器
        let transactions_total = CounterVec::new(
            Opts::new("mpc_transactions_total", "Total number of transactions"),
            &["status", "type"],
        )?;
        registry.register(Box::new(transactions_total.clone()))?;

        // 签名计数器
        let signatures_total = CounterVec::new(
            Opts::new("mpc_signatures_total", "Total number of signatures"),
            &["status"],
        )?;
        registry.register(Box::new(signatures_total.clone()))?;

        // 错误计数器
        let errors_total = CounterVec::new(
            Opts::new("mpc_errors_total", "Total number of errors"),
            &["type"],
        )?;
        registry.register(Box::new(errors_total.clone()))?;

        // 策略违规计数器
        let policy_violations_total = CounterVec::new(
            Opts::new("mpc_policy_violations_total", "Total policy violations"),
            &["rule"],
        )?;
        registry.register(Box::new(policy_violations_total.clone()))?;

        // 重放攻击检测
        let replay_attacks_detected = Counter::new(
            "mpc_replay_attacks_detected_total",
            "Total replay attacks detected",
        )?;
        registry.register(Box::new(replay_attacks_detected.clone()))?;

        // 篡改检测
        let tamper_detected = Counter::new(
            "mpc_tamper_detected_total",
            "Total tamper attempts detected",
        )?;
        registry.register(Box::new(tamper_detected.clone()))?;

        // 审计日志写入
        let audit_log_writes = Counter::new(
            "mpc_audit_log_writes_total",
            "Total audit log writes",
        )?;
        registry.register(Box::new(audit_log_writes.clone()))?;

        // 审计日志写入错误
        let audit_log_write_errors = Counter::new(
            "mpc_audit_log_write_errors_total",
            "Total audit log write errors",
        )?;
        registry.register(Box::new(audit_log_write_errors.clone()))?;

        // 密钥操作
        let key_operations_total = CounterVec::new(
            Opts::new("mpc_key_operations_total", "Total key operations"),
            &["operation"],
        )?;
        registry.register(Box::new(key_operations_total.clone()))?;

        // 密钥操作错误
        let key_operation_errors = Counter::new(
            "mpc_key_operation_errors_total",
            "Total key operation errors",
        )?;
        registry.register(Box::new(key_operation_errors.clone()))?;

        // 网络请求
        let network_requests_total = CounterVec::new(
            Opts::new("mpc_network_requests_total", "Total network requests"),
            &["method", "status"],
        )?;
        registry.register(Box::new(network_requests_total.clone()))?;

        // 网络错误
        let network_errors_total = CounterVec::new(
            Opts::new("mpc_network_errors_total", "Total network errors"),
            &["type"],
        )?;
        registry.register(Box::new(network_errors_total.clone()))?;

        // 签名延迟
        let signing_duration = HistogramVec::new(
            HistogramOpts::new("mpc_signing_duration_seconds", "Signing duration in seconds")
                .buckets(vec![0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0]),
            &["party_id"],
        )?;
        registry.register(Box::new(signing_duration.clone()))?;

        // 策略评估延迟
        let policy_evaluation_duration = Histogram::with_opts(
            HistogramOpts::new(
                "mpc_policy_evaluation_duration_seconds",
                "Policy evaluation duration in seconds",
            )
            .buckets(vec![0.001, 0.005, 0.01, 0.05, 0.1]),
        )?;
        registry.register(Box::new(policy_evaluation_duration.clone()))?;

        // 审计日志写入延迟
        let audit_log_write_duration = Histogram::with_opts(
            HistogramOpts::new(
                "mpc_audit_log_write_duration_seconds",
                "Audit log write duration in seconds",
            )
            .buckets(vec![0.001, 0.005, 0.01, 0.05, 0.1, 0.5]),
        )?;
        registry.register(Box::new(audit_log_write_duration.clone()))?;

        // 网络请求延迟
        let network_request_duration = HistogramVec::new(
            HistogramOpts::new(
                "mpc_network_request_duration_seconds",
                "Network request duration in seconds",
            )
            .buckets(vec![0.01, 0.05, 0.1, 0.5, 1.0, 5.0]),
            &["method"],
        )?;
        registry.register(Box::new(network_request_duration.clone()))?;

        // 活跃会话
        let active_sessions = Gauge::new("mpc_active_sessions", "Number of active MPC sessions")?;
        registry.register(Box::new(active_sessions.clone()))?;

        // 待处理交易
        let pending_transactions = Gauge::new(
            "mpc_pending_transactions",
            "Number of pending transactions",
        )?;
        registry.register(Box::new(pending_transactions.clone()))?;

        // 内存使用
        let memory_usage_bytes = Gauge::new("mpc_memory_usage_bytes", "Memory usage in bytes")?;
        registry.register(Box::new(memory_usage_bytes.clone()))?;

        // CPU 使用
        let cpu_usage_percent = Gauge::new("mpc_cpu_usage_percent", "CPU usage percentage")?;
        registry.register(Box::new(cpu_usage_percent.clone()))?;

        Ok(Self {
            registry,
            transactions_total,
            signatures_total,
            errors_total,
            policy_violations_total,
            replay_attacks_detected,
            tamper_detected,
            audit_log_writes,
            audit_log_write_errors,
            key_operations_total,
            key_operation_errors,
            network_requests_total,
            network_errors_total,
            signing_duration,
            policy_evaluation_duration,
            audit_log_write_duration,
            network_request_duration,
            active_sessions,
            pending_transactions,
            memory_usage_bytes,
            cpu_usage_percent,
        })
    }

    /// 获取注册表
    pub fn registry(&self) -> &Registry {
        &self.registry
    }

    /// 导出指标（Prometheus 格式）
    pub fn export(&self) -> String {
        use prometheus::Encoder;
        let encoder = prometheus::TextEncoder::new();
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();
        encoder.encode(&metric_families, &mut buffer).unwrap();
        String::from_utf8(buffer).unwrap()
    }
}

/// 全局指标实例
lazy_static::lazy_static! {
    pub static ref METRICS: Arc<MetricsCollector> = Arc::new(
        MetricsCollector::new().expect("Failed to create metrics collector")
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_collector() {
        let metrics = MetricsCollector::new().unwrap();
        
        // 测试计数器
        metrics.transactions_total.with_label_values(&["success", "transfer"]).inc();
        metrics.signatures_total.with_label_values(&["success"]).inc();
        
        // 测试直方图
        metrics.signing_duration.with_label_values(&["0"]).observe(0.5);
        
        // 测试仪表盘
        metrics.active_sessions.set(10.0);
        
        // 导出指标
        let output = metrics.export();
        assert!(output.contains("mpc_transactions_total"));
    }
}
