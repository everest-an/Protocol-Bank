import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Shield,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TransactionDetailDialogProps {
  transactionId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

export function TransactionDetailDialog({
  transactionId,
  open,
  onOpenChange,
  onStatusUpdate,
}: TransactionDetailDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const { data: transaction, isLoading } = trpc.transactions.getById.useQuery(transactionId, {
    enabled: open,
  });

  const analyzeMutation = trpc.transactions.analyzeTransaction.useMutation({
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
      toast.success("AI分析完成");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(`分析失敗：${error.message}`);
    },
  });

  const updateStatusMutation = trpc.transactions.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("交易狀態已更新");
      onStatusUpdate?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeMutation.mutate(transactionId);
  };

  const handleUpdateStatus = (status: "confirmed" | "flagged" | "failed", reason?: string) => {
    updateStatusMutation.mutate({
      id: transactionId,
      status,
      flaggedReason: reason,
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      pending: { variant: "secondary", icon: AlertCircle },
      confirmed: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
      flagged: { variant: "destructive", icon: AlertTriangle },
    };
    const { variant, icon: Icon } = config[status] || config.pending;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getRecommendationColor = (action: string) => {
    const colors: Record<string, string> = {
      approve: "text-green-600 bg-green-50 border-green-200",
      flag: "text-orange-600 bg-orange-50 border-orange-200",
      reject: "text-red-600 bg-red-50 border-red-200",
    };
    return colors[action] || "";
  };

  const getConfidenceColor = (level: string) => {
    const colors: Record<string, string> = {
      high: "text-green-600",
      medium: "text-orange-600",
      low: "text-red-600",
    };
    return colors[level] || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            交易詳情
            {transaction && getStatusBadge(transaction.status)}
          </DialogTitle>
          <DialogDescription>查看交易詳細信息並進行AI風險分析</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !transaction ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>錯誤</AlertTitle>
            <AlertDescription>無法加載交易詳情</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Transaction Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground">基本信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">交易哈希</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs truncate">{transaction.txHash}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => window.open(`https://etherscan.io/tx/${transaction.txHash}`, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">交易類型</p>
                  <Badge variant="outline">{transaction.type}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">金額</p>
                  <p className="font-medium">
                    {parseFloat(transaction.amount).toFixed(4)} {transaction.currency}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">風險分數</p>
                  <div className="flex items-center gap-2">
                    <Shield
                      className={`h-4 w-4 ${
                        (transaction.riskScore || 0) > 70
                          ? "text-red-600"
                          : (transaction.riskScore || 0) > 40
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        (transaction.riskScore || 0) > 70
                          ? "text-red-600"
                          : (transaction.riskScore || 0) > 40
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {transaction.riskScore || 0}/100
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">發送方</p>
                  <p className="font-mono text-xs">
                    {transaction.fromAddress.slice(0, 10)}...{transaction.fromAddress.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">接收方</p>
                  <p className="font-mono text-xs">
                    {transaction.toAddress.slice(0, 10)}...{transaction.toAddress.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">區塊號</p>
                  <p className="font-mono text-xs">{transaction.blockNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Gas費用</p>
                  <p className="text-xs">
                    {transaction.gasFee} ETH ({transaction.gasUsed} gas)
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">創建時間</p>
                  <p className="text-xs">{new Date(transaction.createdAt).toLocaleString("zh-CN")}</p>
                </div>
                {transaction.flaggedReason && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground mb-1">標記原因</p>
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{transaction.flaggedReason}</AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  AI風險分析
                </h3>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      開始AI分析
                    </>
                  )}
                </Button>
              </div>

              {analysis && (
                <div className="space-y-4">
                  {/* Risk Assessment */}
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-medium text-sm mb-2">風險評估</h4>
                    <p className="text-sm text-muted-foreground">{analysis.riskAssessment}</p>
                  </div>

                  {/* Anomaly Indicators */}
                  {analysis.anomalyIndicators && analysis.anomalyIndicators.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">異常指標</h4>
                      <ul className="space-y-2">
                        {analysis.anomalyIndicators.map((indicator: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span>{indicator}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">建議操作</h4>
                      <Badge variant="outline" className={getRecommendationColor(analysis.recommendedAction)}>
                        {analysis.recommendedAction === "approve" && "批准"}
                        {analysis.recommendedAction === "flag" && "標記"}
                        {analysis.recommendedAction === "reject" && "拒絕"}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">置信度</h4>
                      <span className={`font-medium ${getConfidenceColor(analysis.confidenceLevel)}`}>
                        {analysis.confidenceLevel === "high" && "高"}
                        {analysis.confidenceLevel === "medium" && "中"}
                        {analysis.confidenceLevel === "low" && "低"}
                      </span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">詳細分析</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.reasoning}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleUpdateStatus("confirmed")}
                      disabled={updateStatusMutation.isPending}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      批准交易
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("flagged", analysis.reasoning)}
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      標記為可疑
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus("failed", "Rejected by admin after AI analysis")}
                      disabled={updateStatusMutation.isPending}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      拒絕交易
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
