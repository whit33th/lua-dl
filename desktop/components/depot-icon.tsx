import { CheckCircle2, Globe2, HardDrive, Package } from "lucide-react";

export function DepotIcon({ kind }: { kind?: string }) {
  if (kind === "core") {
    return <HardDrive className="depot-icon" size={19} aria-hidden="true" />;
  }
  if (kind === "language") {
    return <Globe2 className="depot-icon" size={19} aria-hidden="true" />;
  }
  if (kind === "dlc") {
    return <Package className="depot-icon" size={19} aria-hidden="true" />;
  }
  return <CheckCircle2 className="depot-icon" size={19} aria-hidden="true" />;
}
