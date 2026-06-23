import { LucideIcon } from "lucide-react";
import { Card } from "./Card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
}: StatCardProps) => {
  return (
    <Card className="hover:border-[#0A84FF] transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">
              {title}
            </p>

            <h3 className="text-3xl font-bold text-white">
              {value}
            </h3>

            {subtitle && (
              <p className="text-xs text-zinc-500">
                {subtitle}
              </p>
            )}
          </div>

          {Icon && (
            <div className="rounded-xl bg-[#0A84FF]/10 p-3">
              <Icon className="h-6 w-6 text-[#0A84FF]" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export { StatCard };