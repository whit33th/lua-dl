import { LucideIcon } from "lucide-react";

interface WindowFrameButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  height?: number;
  width?: number;
  type?: "close" | "minimize" | "restore";
}
export default function WindowFrameButton({
  icon: Icon,
  onClick,
  height,
  width,
  type,
}: WindowFrameButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center ${type === "close" ? "hover:bg-red-500 hover:text-white" : "hover:bg-gray-200"}`}
    >
      <Icon height={height} width={width} />
    </button>
  );
}

