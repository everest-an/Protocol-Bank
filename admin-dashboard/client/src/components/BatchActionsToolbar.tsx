import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Flag, Lock, Unlock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BatchActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchUpdateRiskLevel: (riskLevel: string) => void;
  onBatchFreeze: () => void;
  onBatchUnfreeze: () => void;
  onBatchExport: () => void;
}

export function BatchActionsToolbar({
  selectedCount,
  onClearSelection,
  onBatchUpdateRiskLevel,
  onBatchFreeze,
  onBatchUnfreeze,
  onBatchExport,
}: BatchActionsToolbarProps) {
  if (selectedCount === 0) return null;

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
            <DropdownMenuItem onClick={() => onBatchUpdateRiskLevel("low")}>
              <span className="text-green-600">● 低風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateRiskLevel("medium")}>
              <span className="text-orange-600">● 中風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateRiskLevel("high")}>
              <span className="text-red-600">● 高風險</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBatchUpdateRiskLevel("critical")}>
              <span className="text-purple-600">● 極高風險</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={onBatchFreeze}>
          <Lock className="h-4 w-4 mr-2" />
          凍結
        </Button>

        <Button variant="outline" size="sm" onClick={onBatchUnfreeze}>
          <Unlock className="h-4 w-4 mr-2" />
          解凍
        </Button>

        <Button variant="outline" size="sm" onClick={onBatchExport}>
          <Download className="h-4 w-4 mr-2" />
          導出
        </Button>
      </div>
    </div>
  );
}
