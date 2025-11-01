import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronLeft, ChevronRight, Search, Shield } from "lucide-react";
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

export default function Accounts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [kycStatus, setKycStatus] = useState<string>("all");
  const [riskLevel, setRiskLevel] = useState<string>("all");

  const { data, isLoading, error } = trpc.accounts.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    kycStatus: kycStatus !== "all" ? kycStatus : undefined,
    riskLevel: riskLevel !== "all" ? riskLevel : undefined,
  });

  const accounts = data?.accounts || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      frozen: "destructive",
      suspended: "secondary",
      closed: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getKycBadge = (kycStatus: string) => {
    const colors: Record<string, string> = {
      verified: "text-green-600 bg-green-50 border-green-200",
      pending: "text-orange-600 bg-orange-50 border-orange-200",
      rejected: "text-red-600 bg-red-50 border-red-200",
      not_started: "text-gray-600 bg-gray-50 border-gray-200",
    };
    return (
      <Badge variant="outline" className={colors[kycStatus] || ""}>
        {kycStatus.replace("_", " ")}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const colors: Record<string, string> = {
      low: "text-green-600 bg-green-50 border-green-200",
      medium: "text-orange-600 bg-orange-50 border-orange-200",
      high: "text-red-600 bg-red-50 border-red-200",
    };
    return (
      <Badge variant="outline" className={colors[riskLevel] || ""}>
        <Shield className="h-3 w-3 mr-1" />
        {riskLevel}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">帳戶管理</h1>
        <p className="text-muted-foreground mt-2">查看和管理所有用戶帳戶</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
          <CardDescription>根據條件篩選帳戶</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索地址或用戶ID..."
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
                <SelectValue placeholder="帳戶狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有狀態</SelectItem>
                <SelectItem value="active">活躍</SelectItem>
                <SelectItem value="frozen">凍結</SelectItem>
                <SelectItem value="suspended">暫停</SelectItem>
                <SelectItem value="closed">關閉</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={kycStatus}
              onValueChange={(value) => {
                setKycStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="KYC狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有KYC狀態</SelectItem>
                <SelectItem value="verified">已驗證</SelectItem>
                <SelectItem value="pending">待審核</SelectItem>
                <SelectItem value="rejected">已拒絕</SelectItem>
                <SelectItem value="not_started">未開始</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={riskLevel}
              onValueChange={(value) => {
                setRiskLevel(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="風險等級" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有風險等級</SelectItem>
                <SelectItem value="low">低風險</SelectItem>
                <SelectItem value="medium">中風險</SelectItem>
                <SelectItem value="high">高風險</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setKycStatus("all");
                setRiskLevel("all");
                setPage(1);
              }}
            >
              重置篩選
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>帳戶列表</CardTitle>
          <CardDescription>
            共 {total.toLocaleString()} 個帳戶，當前第 {page} / {totalPages} 頁
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
              <AlertDescription>無法加載帳戶數據：{error.message}</AlertDescription>
            </Alert>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>沒有找到符合條件的帳戶</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用戶ID</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead>餘額</TableHead>
                      <TableHead>帳戶狀態</TableHead>
                      <TableHead>KYC狀態</TableHead>
                      <TableHead>風險等級</TableHead>
                      <TableHead>創建時間</TableHead>
                      <TableHead>最後活動</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">#{account.userId}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {account.address.slice(0, 8)}...{account.address.slice(-6)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {parseFloat(account.balance).toFixed(4)} {account.currency}
                        </TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell>{getKycBadge(account.kycStatus)}</TableCell>
                        <TableCell>{getRiskBadge(account.riskLevel)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(account.createdAt).toLocaleDateString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {account.lastActivityAt
                            ? new Date(account.lastActivityAt).toLocaleDateString("zh-CN")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            詳情
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
    </div>
  );
}
