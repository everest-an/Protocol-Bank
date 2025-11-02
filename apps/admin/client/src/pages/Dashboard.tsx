import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowDown, ArrowUp, TrendingUp, Users, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { BatchActionsToolbar } from "@/components/BatchActionsToolbar";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: stats, isLoading, error } = trpc.dashboard.stats.useQuery();
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const { data: activeAccounts, isLoading: accountsLoading } = trpc.dashboard.activeAccountsByRisk.useQuery(
    { riskLevel: riskFilter },
    { enabled: !!stats }
  );
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const utils = trpc.useUtils();
  const { data: latestOperation } = trpc.accounts.getLatestUndoableOperation.useQuery();

  const batchUpdateRiskLevel = trpc.accounts.batchUpdateRiskLevel.useMutation({
    onSuccess: () => {
      toast.success("風險等級已更新");
      setSelectedAccounts([]);
      utils.dashboard.activeAccountsByRisk.invalidate();
      utils.dashboard.stats.invalidate();
      utils.accounts.getLatestUndoableOperation.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const batchUpdateStatus = trpc.accounts.batchUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("帳戶狀態已更新");
      setSelectedAccounts([]);
      utils.dashboard.activeAccountsByRisk.invalidate();
      utils.dashboard.stats.invalidate();
      utils.accounts.getLatestUndoableOperation.invalidate();
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const undoLastOperation = trpc.accounts.undoLastOperation.useMutation({
    onSuccess: () => {
      toast.success("操作已撤銷");
      utils.dashboard.activeAccountsByRisk.invalidate();
      utils.dashboard.stats.invalidate();
      utils.accounts.getLatestUndoableOperation.invalidate();
    },
    onError: (error) => {
      toast.error(`撤銷失敗: ${error.message}`);
    },
  });

  const handleSelectAccount = (accountId: number, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && activeAccounts) {
      setSelectedAccounts(activeAccounts.map(acc => acc.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleBatchUpdateRiskLevel = (riskLevel: string) => {
    if (selectedAccounts.length === 0) return;
    batchUpdateRiskLevel.mutate({ accountIds: selectedAccounts, riskLevel: riskLevel as any });
  };

  const handleBatchFreeze = () => {
    if (selectedAccounts.length === 0) return;
    batchUpdateStatus.mutate({ accountIds: selectedAccounts, status: "frozen" });
  };

  const handleBatchUnfreeze = () => {
    if (selectedAccounts.length === 0) return;
    batchUpdateStatus.mutate({ accountIds: selectedAccounts, status: "active" });
  };

  const handleBatchExport = async () => {
    if (selectedAccounts.length === 0 || !activeAccounts) return;

    const selectedData = activeAccounts.filter(acc => selectedAccounts.includes(acc.id));
    const csv = [
      ["地址", "餘額", "風險等級", "KYC狀態", "狀態", "創建日期"],
      ...selectedData.map(acc => [
        acc.address,
        acc.balance,
        acc.riskLevel,
        acc.kycStatus,
        acc.status,
        new Date(acc.createdAt).toLocaleString("zh-CN"),
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accounts_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("已導出 CSV 文件");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
          <p className="text-muted-foreground mt-2">Protocol Bank 管理後台概覽</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>錯誤</AlertTitle>
        <AlertDescription>無法加載儀表板數據：{error.message}</AlertDescription>
      </Alert>
    );
  }

  const txStats = stats?.transactions || { total: 0, pending: 0, confirmed: 0, failed: 0, flagged: 0 };
  const accountStats = stats?.accounts || { total: 0, active: 0, frozen: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
  const flaggedTransactions = stats?.flaggedTransactions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">儀表板</h1>
        <p className="text-muted-foreground mt-2">Protocol Bank 管理後台概覽</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總交易數</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{txStats.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              待處理: {txStats.pending || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已確認交易</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{txStats.confirmed?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              成功率: {txStats.total ? ((txStats.confirmed / txStats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">標記交易</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{txStats.flagged || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">需要審核</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活躍帳戶</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountStats.active?.toLocaleString() || 0}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <span className="text-red-600">高: {accountStats.highRisk || 0}</span>
              <span className="text-orange-600">中: {accountStats.mediumRisk || 0}</span>
              <span className="text-green-600">低: {accountStats.lowRisk || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flagged Transactions */}
      {flaggedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>需要審核的交易</CardTitle>
            <CardDescription>以下交易已被標記為可疑，需要人工審核</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flaggedTransactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="destructive" className="text-xs">
                        {tx.status}
                      </Badge>
                      <span className="text-sm font-medium truncate">
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>金額: {parseFloat(tx.amount).toFixed(4)} {tx.currency}</span>
                      <span>風險分數: {tx.riskScore}/100</span>
                      <span>{new Date(tx.createdAt).toLocaleString("zh-CN")}</span>
                    </div>
                    {tx.flaggedReason && (
                      <p className="text-xs text-orange-600 mt-1">{tx.flaggedReason}</p>
                    )}
                  </div>
                  <Link href={`/transactions?id=${tx.id}`}>
                    <Button variant="outline" size="sm">
                      審核
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
            {flaggedTransactions.length > 5 && (
              <div className="mt-4 text-center">
                <Link href="/transactions?status=flagged">
                  <Button variant="link">
                    查看全部 {flaggedTransactions.length} 條標記交易 →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Accounts by Risk Level */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>活躍帳戶</CardTitle>
              <CardDescription>按風險等級篩選查看帳戶</CardDescription>
            </div>
            <Tabs value={riskFilter} onValueChange={setRiskFilter}>
              <TabsList>
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="high" className="text-red-600 data-[state=active]:text-red-600">高風險</TabsTrigger>
                <TabsTrigger value="medium" className="text-orange-600 data-[state=active]:text-orange-600">中風險</TabsTrigger>
                <TabsTrigger value="low" className="text-green-600 data-[state=active]:text-green-600">低風險</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <BatchActionsToolbar
            selectedCount={selectedAccounts.length}
            onClearSelection={() => setSelectedAccounts([])}
            onBatchUpdateRiskLevel={handleBatchUpdateRiskLevel}
            onBatchFreeze={handleBatchFreeze}
            onBatchUnfreeze={handleBatchUnfreeze}
            onBatchExport={handleBatchExport}
            canUndo={!!latestOperation && !latestOperation.undoneAt}
            onUndo={() => undoLastOperation.mutate()}
            lastOperationType={latestOperation?.operationType}
          />
          {accountsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : activeAccounts && activeAccounts.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                <Checkbox
                  checked={activeAccounts.length > 0 && selectedAccounts.length === activeAccounts.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-muted-foreground">全選</span>
              </div>
              <div className="space-y-3">
                {activeAccounts.slice(0, 10).map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={(checked) => handleSelectAccount(account.id, checked as boolean)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={account.riskLevel === "high" ? "destructive" : account.riskLevel === "medium" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {account.riskLevel === "high" ? "高風險" : account.riskLevel === "medium" ? "中風險" : "低風險"}
                        </Badge>
                        <span className="text-sm font-medium truncate">
                          {account.address.slice(0, 10)}...{account.address.slice(-8)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>餘額: {parseFloat(account.balance).toFixed(4)} ETH</span>
                        <span>KYC: {account.kycStatus === "verified" ? "已驗證" : account.kycStatus === "pending" ? "待審" : "未驗證"}</span>
                        <span>{new Date(account.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                    <Link href={`/accounts?id=${account.id}`}>
                      <Button variant="outline" size="sm">
                        查看
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              沒有找到符合條件的帳戶
            </div>
          )}
          {activeAccounts && activeAccounts.length > 10 && (
            <div className="mt-4 text-center">
              <Link href="/accounts">
                <Button variant="link">
                  查看全部 {activeAccounts.length} 個帳戶 →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用管理功能快捷入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/transactions">
              <Button variant="outline" className="w-full justify-start">
                <Wallet className="mr-2 h-4 w-4" />
                查看所有交易
              </Button>
            </Link>
            <Link href="/accounts">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                管理帳戶
              </Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                數據分析
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
