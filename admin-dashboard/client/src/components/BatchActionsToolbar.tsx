import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Flag, Lock, Unlock, X, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VerificationDialog } from "@/components/VerificationDialog";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface BatchActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchUpdateRiskLevel: (riskLevel: string) => void;
  onBatchFreeze: () => void;
  onBatchUnfreeze: () => void;
  onBatchExport: () => void;
  canUndo?: boolean;
  onUndo?: () => void;
  lastOperationType?: string;
}

export function BatchActionsToolbar({
  selectedCount,
  onClearSelection,
  onBatchUpdateRiskLevel,
  onBatchFreeze,
  onBatchUnfreeze,
  onBatchExport,
  canUndo = false,
  onUndo,
  lastOperationType,
}: BatchActionsToolbarProps) {
  const { data: lockStatus } = trpc.accounts.checkLockStatus.useQuery(undefined, {
    refetchInterval: 5000, // Check every 5 seconds
  });

  const isLocked = lockStatus?.isLocked || false;
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean;
    operation: string;
    operationName: string;
    onVerified: () => void;
  }>({ open: false, operation: "", operationName: "", onVerified: () => {} });

  const handleBatchUpdateRiskLevel = (riskLevel: string) => {
    // High-risk operations require two-factor authentication
    const isHighRisk = riskLevel === "high" || riskLevel === "critical";
    
    if (isHighRisk) {
      setVerificationDialog({
        open: true,
        operation: `bulk_update_risk_${riskLevel}`,
        operationName: `批量設置為${riskLevel === "high" ? "高" : "極高"}風險等級`,
        onVerified: () => {
          onBatchUpdateRiskLevel(riskLevel);
        },
      });
    } else {
      setConfirmDialog({
        open: true,
        title: "確認批量更新風險等級",
        description: `您確定要將 ${selectedCount} 個帳戶的風險等級設置為 ${riskLevel} 嗎？此操作可以撤銷。`,
        onConfirm: () => {
          onBatchUpdateRiskLevel(riskLevel);
          setConfirmDialog({ ...confirmDialog, open: false });
        },
      });
    }
  };

  const handleBatchFreeze = () => {
    if (isLocked) {
      toast.error("您的帳戶已被暫時鎖定，無法執行批量操作");
      return;
    }
    // Batch freeze is a high-risk operation
    setVerificationDialog({
      open: true,
      operation: "bulk_freeze",
      operationName: "批量凍結帳戶",
      onVerified: () => {
        onBatchFreeze();
      },
    });
  };

  const handleBatchUnfreeze = () => {
    setConfirmDialog({
      open: true,
      title: "確認批量解凍帳戶",
      description: `您確定要解凍 ${selectedCount} 個帳戶嗎？此操作可以撤銷。`,
      onConfirm: () => {
        onBatchUnfreeze();
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  const handleUndo = () => {
    if (!onUndo) return;
    setConfirmDialog({
      open: true,
      title: "確認撤銷操作",
      description: `您確定要撤銷上次的 ${lastOperationType || "批量操作"} 嗎？這將恢復到操作前的狀態。`,
      onConfirm: () => {
        onUndo();
        setConfirmDialog({ ...confirmDialog, open: false });
      },
    });
  };

  if (selectedCount === 0 && !canUndo) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-accent/50 border rounded-lg mb-4">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          已選擇 {selectedCount} 個帳戶
        </Badge>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-4 w-4 mr-1" />
          取消選擇
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Flag className="h-4 w-4 mr-2" />
              設置風險等級
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>選擇風險等級</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleBatchUpdateRiskLevel("low")}>
              <span className="text-green-600">● 低風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBatchUpdateRiskLevel("medium")}>
              <span className="text-orange-600">● 中風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBatchUpdateRiskLevel("high")}>
              <span className="text-red-600">● 高風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBatchUpdateRiskLevel("critical")}>
              <span className="text-purple-600">● 極高風險</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBatchFreeze}
          disabled={isLocked}
          title={isLocked ? "帳戶已鎖定，無法執行批量操作" : ""}
        >
          <Lock className="h-4 w-4 mr-2" />
          凍結
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleBatchUnfreeze}
          disabled={isLocked}
          title={isLocked ? "帳戶已鎖定，無法執行批量操作" : ""}
        >
          <Unlock className="h-4 w-4 mr-2" />
          解凍
        </Button>

        <Button variant="outline" size="sm" onClick={onBatchExport}>
          <Download className="h-4 w-4 mr-2" />
          導出
        </Button>

        {canUndo && onUndo && (
          <Button variant="outline" size="sm" onClick={handleUndo} className="ml-2">
            <Undo2 className="h-4 w-4 mr-2" />
            撤銷上次操作
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />

      <VerificationDialog
        open={verificationDialog.open}
        onOpenChange={(open) =>
          setVerificationDialog({ ...verificationDialog, open })
        }
        operation={verificationDialog.operation}
        operationName={verificationDialog.operationName}
        onVerified={verificationDialog.onVerified}
        onCancel={() =>
          setVerificationDialog({ ...verificationDialog, open: false })
        }
      />
    </div>
  );
}
