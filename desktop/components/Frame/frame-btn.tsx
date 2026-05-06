import { LucideIcon } from "lucide-react";

interface IFrameButton {
  icon: LucideIcon;
  onClick?: () => void;
  height?: number;
  width?: number;
  type?: "close" | "minimize" | "restore";
}
export default function FrameButton({
  icon: Icon,
  onClick,
  height,
  width,
  type,
}: IFrameButton) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center ${type === "close" ? "hover:bg-red-500 hover:text-white" : "hover:bg-gray-200"}`}
    >
      <Icon height={height} width={width} />
    </button>
  );
}
