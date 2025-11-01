import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowDown, ArrowUp, TrendingUp, Users, Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading, error } = trpc.dashboard.stats.useQuery();

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
  const accountStats = stats?.accounts || { total: 0, active: 0, frozen: 0 };
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
            <p className="text-xs text-muted-foreground mt-1">
              總計: {accountStats.total?.toLocaleString() || 0}
            </p>
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
