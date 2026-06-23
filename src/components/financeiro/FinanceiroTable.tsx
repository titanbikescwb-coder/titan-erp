import { motion } from "motion/react";
import { CheckCircle2, Trash2, User, Truck } from "lucide-react";
import { FinancialEntry, FinancialStatus } from "../../domain/types";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface FinanceiroTableProps {
  entries: FinancialEntry[];
  formatDate: (timestamp: any) => string;
  formatCurrency: (value: number) => string;
  onUpdateStatus: (entry: FinancialEntry, status: FinancialStatus) => void;
  onDeleteEntry: (entryId: string) => void;
}

const FinanceiroTable = ({
  entries,
  formatDate,
  formatCurrency,
  onUpdateStatus,
  onDeleteEntry,
}: FinanceiroTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-black/20 border-b border-titan-border">
            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em]">
              Data Limite
            </th>
            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em]">
              Documento / Categoria
            </th>
            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] text-right">
              Valor Global
            </th>
            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] text-center">
              Status
            </th>
            <th className="px-8 py-6 text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.3em] text-right">
              Controle
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-titan-border">
          {entries.map((entry, idx) => {
            const dueDate = entry.dueDate
              ? entry.dueDate.toDate
                ? entry.dueDate.toDate()
                : new Date(entry.dueDate)
              : null;

            const isLate =
              entry.status === "pendente" &&
              dueDate &&
              dueDate < new Date();

            return (
              <motion.tr
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={entry.id}
                className="group hover:bg-white/[0.03] transition-all"
              >
                <td className="px-8 py-6 text-[13px] font-black text-titan-text-secondary whitespace-nowrap">
                  {formatDate(entry.dueDate)}
                </td>

                <td className="px-8 py-6">
                  <p className="text-[15px] font-black text-white uppercase tracking-tight leading-none mb-2.5 group-hover:text-titan-primary transition-colors">
                    {entry.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-titan-text-secondary uppercase tracking-[0.2em]">
                      {entry.category}
                    </span>

                    {(entry.customerName || entry.supplierName) && (
                      <>
                        <span className="text-[10px] text-white/10">•</span>
                        <span className="text-[10px] font-black text-titan-primary uppercase tracking-[0.1em] flex items-center gap-1">
                          {entry.type === "receita" ? (
                            <User className="w-3 h-3" />
                          ) : (
                            <Truck className="w-3 h-3" />
                          )}
                          {entry.customerName || entry.supplierName}
                        </span>
                      </>
                    )}
                  </div>
                </td>

                <td
                  className={cn(
                    "px-8 py-6 text-xl font-black text-right tracking-tighter",
                    entry.type === "receita"
                      ? "text-emerald-400"
                      : "text-red-400"
                  )}
                >
                  {entry.type === "receita" ? "+" : "-"}
                  {formatCurrency(entry.amount)}
                </td>

                <td className="px-8 py-6 text-center">
                  <span
                    className={cn(
                      "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                      entry.status === "pago"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isLate
                          ? "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}
                  >
                    {isLate ? "atrasado" : entry.status}
                  </span>
                </td>

                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    {entry.status === "pendente" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdateStatus(entry, "pago")}
                        className="w-12 h-12 p-0 rounded-2xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 shadow-xl hover:text-white transition-all"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => entry.id && onDeleteEntry(entry.id)}
                      className="w-12 h-12 p-0 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 shadow-xl hover:text-white transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export { FinanceiroTable };