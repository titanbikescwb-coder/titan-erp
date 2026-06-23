import { Building2, Wallet2 } from "lucide-react";
import CardPadrao from "../ui/CardPadrao";
import { BankAccount } from "../../domain/types";

interface FinanceiroAccountsProps {
  accounts: BankAccount[];
  activeAccountFilter: string | null;
  onToggleAccountFilter: (accountId: string) => void;
}

const FinanceiroAccounts = ({
  accounts,
  activeAccountFilter,
  onToggleAccountFilter,
}: FinanceiroAccountsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {accounts.map((acc) => (
        <CardPadrao
          key={acc.id}
          title={acc.name}
          value={acc.currentBalance}
          icon={acc.type === "caixa_loja" ? Wallet2 : Building2}
          iconColor={acc.type === "caixa_loja" ? "text-amber-500" : "text-titan-primary"}
          iconBgColor={acc.type === "caixa_loja" ? "bg-amber-500/10" : "bg-titan-primary/10"}
          isCurrency
          onClick={() => onToggleAccountFilter(acc.id!)}
          active={activeAccountFilter === acc.id}
        />
      ))}
    </div>
  );
};

export { FinanceiroAccounts };