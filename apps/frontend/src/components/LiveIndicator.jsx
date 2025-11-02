import { Activity } from 'lucide-react';

export default function LiveIndicator({ isLive }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${
            isLive ? 'bg-green-500' : 'bg-gray-400'
          }`}
        >
          {isLive && (
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
          )}
        </div>
      </div>
      <span className="text-sm text-gray-600">
        {isLive ? 'Live' : 'Offline'}
      </span>
      {isLive && <Activity className="w-4 h-4 text-green-500" />}
    </div>
  );
}

