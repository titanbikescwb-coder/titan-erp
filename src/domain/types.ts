export interface PermissionActions {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  cancel?: boolean;
  export?: boolean;
}
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  active: boolean;
  isAdmin?: boolean;
  role?: string;
  permissions?: string[];
  permissionsActions?: {
  [module: string]: PermissionActions;
};
  commissionRate?: number;
  createdAt: any;
}

export interface SaaS_Venda {
  id?: string;
  total: number;
  status: 'pendente' | 'finalizado';
  createdAt: any;
  userId: string; // uid do dono da venda
}

export interface SaaS_Caixa {
  id?: string;
  type: 'entrada' | 'saida';
  origin: 'venda' | 'os' | 'manual';
  value: number;
  date: any;
  userId: string;
}

export interface ActionLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: string;
  module: string;
  timestamp: any;
  details?: string;
}

export type CashSessionStatus = 'open' | 'closed';

export interface CashSession {
  id?: string;
  userId: string;
  userName: string;
  openedAt: any;
  closedAt?: any;
  initialValue: number;
  finalValueCash?: number;
  finalValueCard?: number;
  finalValuePix?: number;
  totalMovementsIn: number;
  totalMovementsOut: number;
  status: CashSessionStatus;
}

export type MovementType = 'suprimento' | 'sangria';

export interface CashMovement {
  id?: string;
  sessionId: string;
  userId: string;
  type: MovementType;
  amount: number;
  reason: string;
  timestamp: any;
  saleId?: string;
}

export interface Product {
  id?: string;
  userId?: string;
  name: string;
  description: string;
  costPrice: number;
  price: number;
  stock: number;
  minStock: number;
  category: string;
  sku: string;
  barcode?: string;
  imageUrl?: string;
  productCode?: number;
  classId?: string;
}

export type ProductMovementType = 'entrada' | 'saida' | 'venda' | 'ajuste';

export interface ProductMovement {
  id?: string;
  productId: string;
  productName: string;
  type: ProductMovementType;
  quantity: number;
  reason: string;
  userId: string;
  userName: string;
  timestamp: any;
}

export interface ServiceItem {
  id?: string;
  userId?: string;
  name: string;
  description: string;
  price: number;
}

export interface SaleItem {
  itemId: string;
  name: string;
  type: 'product' | 'service';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPrice?: number;
}

export type PaymentMethod = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
}

export interface Sale {
  id?: string;
  saleNumber: number;
  userId: string;
  userName: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  payments?: SalePayment[];
  status: 'FINALIZADA' | 'CANCELADA';
  paymentStatus: 'CONFIRMADO' | 'PENDENTE';
  timestamp: any;
  cashSessionId: string;
  financialEntryId?: string;
  osId?: string;
  notes?: string;
}

export type FinancialType = 'receita' | 'despesa';
export type FinancialStatus = 'pendente' | 'pago' | 'atrasado' | 'cancelado';

export interface FinancialEntry {
  id?: string;
  type: FinancialType;
  amount: number;
  description: string;
  category: string;
  date: any;
  dueDate: any;
  paymentDate?: any;
  status: FinancialStatus;
  saleId?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  userId: string;
  bankAccountId?: string; // Link to BankAccount
  isRecurring?: boolean;
  recurrenceId?: string;
  recurrencePeriod?: 'mensal' | 'semanal' | 'anual';
}

export interface BankAccount {
  id?: string;
  userId?: string;
  name: string; // Ex: Caixa Loja, Banco Inter, Santander
  type: 'corrente' | 'poupanca' | 'caixa_loja' | 'investimento';
  initialBalance: number;
  currentBalance: number;
  active: boolean;
  createdAt: any;
}

export type BudgetStatus = 'aberto' | 'aprovado' | 'recusado' | 'convertido';

export interface Budget {
  id?: string;
  budgetNumber: number;
  userId: string;
  userName: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  status: BudgetStatus;
  validUntil: any;
  timestamp: any;
  convertedToId?: string;
  convertedToSaleId?: string;
  convertedType?: 'venda' | 'servico';
}

export interface Bike {
  id?: string;
  userId?: string;
  customerId: string;
  customerName: string;
  serialNumber?: string; // Nº de Série do Quadro
  brand: string;
  model: string;
  year?: string;
  color?: string;
  type?: string; // MTB, Speed, Urbana, E-Bike
  lastVisit?: any;
  createdAt: any;
}

export type ServiceOrderStatus = 'aberto' | 'em_andamento' | 'finalizado' | 'entregue';

export interface ServiceOrder {
  id?: string;
  osNumber: number;
  userId: string;
  userName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  bikeId?: string;
  bikeDetails?: string; // Fallback for quick entry
  problemDescription: string;
  items: SaleItem[];
  totalAmount: number;
  status: ServiceOrderStatus;
  timestamp: any;
  entryDate: string;
  exitDate?: string;
  finishedAt?: any;
  deliveredAt?: any;
  convertedToSaleId?: string;
}

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface Customer {
  id?: string;
  userId?: string;
  name: string;
  email?: string;
  phone: string;
  document: string; // CPF or CNPJ
  address: Address;
  createdAt: any;
}

export interface Supplier {
  id?: string;
  userId?: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  address: Address;
  notes?: string;
  createdAt: any;
}

export interface Employee {
  id?: string;
  userId?: string; // Link to Firebase Auth User
  name: string;
  email: string;
  phone?: string;
  position: string;
  active: boolean;
  isAdmin?: boolean;
  permissions?: string[];
  permissionsActions?: {
  [module: string]: PermissionActions;
};
  address?: Address;
  createdAt: any;
}

export type AccentColorKey =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'red'
  | 'cyan'
  | 'gold';

export interface AppearanceSettings {
  accentColor: AccentColorKey;
  theme: 'dark';
  borderRadius: 'modern' | 'classic';
  compactMode: boolean;
}

export interface CompanySettings {
  id: string;
  userId?: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: Address;
  logoUrl?: string;
  receiptMessage?: string;
  showCnpjOnReceipt?: boolean;
  showAddressOnReceipt?: boolean;
  paymentMethods: string[];
  productCategories: string[];
  appearance?: AppearanceSettings;
  updatedAt: any;
}

export interface DigitalCertificate {
  id?: string;
  fileName: string;
  fileUrl: string; // URL to the file in storage
  passwordEncrypted: string;
  validFrom: any;
  validTo: any;
  subject: string;
  issuer: string;
  status: 'válido' | 'inválido' | 'expirado';
  updatedAt: any;
  updatedBy: string;
}

export type FiscalNoteStatus = 'pendente' | 'emitida' | 'cancelada' | 'erro';
export type FiscalNoteType = 'nfe' | 'nfce';
export type FiscalRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';
export type FiscalAmbiente = 'homologacao' | 'producao';

export interface FiscalConfig {
  id?: string;
  cnpj: string;
  razaoSocial: string;
  ie: string;
  address: Address;
  regimeTributario: FiscalRegime;
  ambiente: FiscalAmbiente;
  modoFiscal: 'simulacao' | 'producao';
  certificadoDigital?: string;
  proximoNumeroNFe: number;
  proximoNumeroNFCe: number;
  serieNFe: number;
  serieNFCe: number;
  focusApiKey?: string;
  whatsappMessage?: string;
  contadorEmail?: string;
  updatedAt: any;
}

export interface FiscalNote {
  id?: string;
  tipo: FiscalNoteType;
  origem: 'venda' | 'os';
  origemId: string;
  cliente: {
    nome: string;
    documento: string;
    email?: string;
    telefone?: string;
    endereco?: Address;
  };
  itens: SaleItem[];
  total: number;
  status: FiscalNoteStatus;
  dataEmissao: any;
  numeroNota: number;
  serie: number;
  chaveAcesso?: string;
  xml?: string;
  cfop?: string;
  naturezaOperacao?: string;
  meioPagamento?: string;
  observacoes?: string;
  errorMessage?: string;
  reference?: string;
  focusStatus?: string;
  danfe?: string;
  xmlSimulado?: string;
}

export interface Commission {
  id?: string;
  userId?: string;
  employeeId: string;
  employeeName: string;
  saleId: string;
  saleNumber: number;
  amount: number;
  percentage: number;
  status: 'pendente' | 'pago';
  timestamp: any;
  paymentDate?: any;
}

export interface Appointment {
  id?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  bikeId?: string;
  bikeDetails?: string;
  date: any; // Timestamp
  startTime: string; // HH:mm
  endTime?: string;
  serviceDescription: string;
  status: 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'faltou' | 'cancelado';
  notes?: string;
  createdAt: any;
  userId: string;
}

