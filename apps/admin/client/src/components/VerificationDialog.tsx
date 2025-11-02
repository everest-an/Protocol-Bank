import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: string;
  operationName: string;
  onVerified: () => void;
  onCancel: () => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  operation,
  operationName,
  onVerified,
  onCancel,
}: VerificationDialogProps) {
  const [code, setCode] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);

  const requestCodeMutation = trpc.accounts.requestVerificationCode.useMutation();
  const verifyCodeMutation = trpc.accounts.verifyCode.useMutation();
  const { data: lockStatus } = trpc.accounts.checkLockStatus.useQuery(undefined, {
    enabled: open,
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Countdown timer for verification code
  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setTimeout(() => {
        setRemainingTime(remainingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [remainingTime]);

  // Calculate lock remaining time
  const getLockRemainingTime = () => {
    if (!lockStatus?.isLocked || !lockStatus.lockedUntil) return 0;
    const now = new Date().getTime();
    const lockEnd = new Date(lockStatus.lockedUntil).getTime();
    return Math.max(0, Math.ceil((lockEnd - now) / 1000));
  };

  const lockRemainingSeconds = getLockRemainingTime();
  const isLocked = lockStatus?.isLocked && lockRemainingSeconds > 0;

  const handleRequestCode = async () => {
    if (isLocked) {
      toast.error("您的帳戶已被暫時鎖定，請稍後再試");
      return;
    }

    setIsRequesting(true);
    setError("");

    try {
      await requestCodeMutation.mutateAsync({
        operation,
      });

      setCodeSent(true);
      setRemainingTime(300); // 5 minutes
      toast.success("驗證碼已發送");
    } catch (err: any) {
      const errorMsg = err.message || "發送驗證碼失敗，請重試";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("請輸入6位數驗證碼");
      return;
    }

    if (isLocked) {
      toast.error("您的帳戶已被暫時鎖定，請稍後再試");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyCodeMutation.mutateAsync({
        code,
        operation,
      });

      toast.success("驗證成功");
      onVerified();
      handleClose();
    } catch (err: any) {
      const errorMsg = err.message || "驗證失敗";
      setError(errorMsg);
      toast.error(errorMsg);

      // Check if user is now locked
      if (errorMsg.includes("鎖定") || errorMsg.includes("locked")) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setCodeSent(false);
    setError("");
    setRemainingTime(0);
    onOpenChange(false);
  };

  const handleCancelClick = () => {
    handleClose();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-orange-500" />
            <DialogTitle>二次驗證</DialogTitle>
          </div>
          <DialogDescription>
            您正在執行高風險操作：<strong>{operationName}</strong>
            <br />
            為了確保安全，請完成二次驗證。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isLocked ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">帳戶已鎖定</span>
              </div>
              <p className="text-sm text-muted-foreground">
                由於驗證失敗次數過多（{lockStatus?.failedAttempts || 0}次），您的批量操作功能已被暫時鎖定。
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  剩餘鎖定時間：
                  <span className="ml-2 font-mono font-bold text-lg">
                    {formatTime(lockRemainingSeconds)}
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                鎖定將在 {formatTime(lockRemainingSeconds)} 後自動解除，屆時您可以重新嘗試。
              </p>
            </div>
          ) : !codeSent ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                點擊下方按鈕，我們將向您發送一個6位數驗證碼。
              </p>
              <Button
                onClick={handleRequestCode}
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    發送中...
                  </>
                ) : (
                  "發送驗證碼"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="code">驗證碼</Label>
              <Input
                id="code"
                placeholder="請輸入6位數驗證碼"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                驗證碼已發送至您的通知中心，有效期5分鐘。
                {remainingTime > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    剩餘時間：{formatTime(remainingTime)}
                  </span>
                )}
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelClick}>
            取消
          </Button>
          {codeSent && !isLocked && (
            <Button
              onClick={handleVerify}
              disabled={isVerifying || code.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  驗證中...
                </>
              ) : (
                "確認"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
