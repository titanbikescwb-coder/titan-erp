import { ReactNode } from "react";
import ModalPadrao from "../ui/ModalPadrao";

interface FinanceiroModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

const FinanceiroModal = ({
  open,
  title,
  children,
  footer,
  onClose,
}: FinanceiroModalProps) => {
  return (
    <ModalPadrao
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={footer}
    >
      <div className="space-y-6">
        {children}
      </div>
    </ModalPadrao>
  );
};

export { FinanceiroModal };