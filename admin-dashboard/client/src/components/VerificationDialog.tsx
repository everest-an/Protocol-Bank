import { useState } from "react";
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
import { Loader2, Shield } from "lucide-react";

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

  const requestCodeMutation = trpc.accounts.requestVerificationCode.useMutation();
  const verifyCodeMutation = trpc.accounts.verifyCode.useMutation();

  const handleRequestCode = async () => {
    setIsRequesting(true);
    setError("");

    try {
      await requestCodeMutation.mutateAsync({
        operation,
      });

      setCodeSent(true);
    } catch (err) {
      setError("發送驗證碼失敗，請重試");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("請輸入6位數驗證碼");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await verifyCodeMutation.mutateAsync({
        code,
        operation,
      });

      onVerified();
      handleClose();
    } catch (err) {
      setError("驗證碼無效或已過期");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setCodeSent(false);
    setError("");
    onOpenChange(false);
  };

  const handleCancelClick = () => {
    handleClose();
    onCancel();
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
          {!codeSent ? (
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
          {codeSent && (
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
