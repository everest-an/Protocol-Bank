import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionDetailDialog } from "@/components/TransactionDetailDialog";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = trpc.transactions.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    type: type !== "all" ? type : undefined,
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      failed: "destructive",
      flagged: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      deposit: "text-green-600 bg-green-50 border-green-200",
      withdrawal: "text-orange-600 bg-orange-50 border-orange-200",
      transfer: "text-blue-600 bg-blue-50 border-blue-200",
      payment: "text-purple-600 bg-purple-50 border-purple-200",
    };
    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">交易管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有交易記錄</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
          <CardDescription>根據條件篩選交易記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索交易哈希或地址..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="pending">待處理</SelectItem>
                <SelectItem value="confirmed">已確認</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
                <SelectItem value="flagged">已標記</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇類型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有類型</SelectItem>
                <SelectItem value="deposit">存款</SelectItem>
                <SelectItem value="withdrawal">提款</SelectItem>
                <SelectItem value="transfer">轉帳</SelectItem>
                <SelectItem value="payment">支付</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setType("all");
                setPage(1);
              }}
            >
              重置篩選
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>交易列表</CardTitle>
          <CardDescription>
            共 {total.toLocaleString()} 條交易記錄，當前第 {page} / {totalPages} 頁
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>錯誤</AlertTitle>
              <AlertDescription>無法加載交易數據：{error.message}</AlertDescription>
            </Alert>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>沒有找到符合條件的交易記錄</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>交易哈希</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>發送方</TableHead>
                      <TableHead>接收方</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>風險分數</TableHead>
                      <TableHead>時間</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[120px]">
                              {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                window.open(`https://etherscan.io/tx/${tx.txHash}`, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(tx.type)}</TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(tx.amount).toFixed(4)} {tx.currency}
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[100px]">
                          {tx.fromAddress.slice(0, 6)}...{tx.fromAddress.slice(-4)}
                        </TableCell>
                        <TableCell className="font-mono text-xs truncate max-w-[100px]">
                          {tx.toAddress.slice(0, 6)}...{tx.toAddress.slice(-4)}
                        </TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell>
                          <span
                            className={`font-medium ${
                              (tx.riskScore || 0) > 70
                                ? "text-red-600"
                                : (tx.riskScore || 0) > 40
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {tx.riskScore || 0}/100
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransactionId(tx.id);
                              setDialogOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI分析
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  顯示 {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} 條，共 {total} 條
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一頁
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {page} / {totalPages} 頁
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= totalPages}
                  >
                    下一頁
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Detail Dialog */}
      {selectedTransactionId && (
        <TransactionDetailDialog
          transactionId={selectedTransactionId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onStatusUpdate={() => refetch()}
        />
      )}
    </div>
  );
}
