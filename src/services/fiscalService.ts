import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { 
  FiscalNote, 
  FiscalConfig, 
  Sale, 
  ServiceOrder,
  FiscalNoteStatus
} from '../domain/types';
import { createScopedQuery } from '../lib/firebaseUtils';

export const fiscalService = {
  /**
   * Gets the fiscal configuration for the current tenant.
   */
  async getConfig(): Promise<FiscalConfig | null> {
    const q = createScopedQuery(collection(db, 'fiscalConfig'), limit(1));
    const snap = await getDocs(q);
    
    if (snap.empty) return null;
    
    const data = snap.docs[0].data() as FiscalConfig;
    return { 
      id: snap.docs[0].id, 
      ...data,
      modoFiscal: data.modoFiscal || 'simulacao' // Fallback for existing configs
    } as FiscalConfig;
  },

  /**
   * Saves or updates the fiscal configuration.
   */
  async saveConfig(config: Partial<FiscalConfig>): Promise<void> {
    const currentConfig = await this.getConfig();
    
    if (currentConfig?.id) {
      const docRef = doc(db, 'fiscalConfig', currentConfig.id);
      await updateDoc(docRef, {
        ...config,
        updatedAt: Timestamp.now()
      });
    } else {
      const docRef = doc(collection(db, 'fiscalConfig'));
      await setDoc(docRef, {
        ...config,
        proximoNumeroNFe: config.proximoNumeroNFe || 1,
        proximoNumeroNFCe: config.proximoNumeroNFCe || 1,
        serieNFe: config.serieNFe || 1,
        serieNFCe: config.serieNFCe || 1,
        updatedAt: Timestamp.now()
      });
    }
  },

  /**
   * Gets a list of emitted fiscal notes.
   */
  async getNotes(): Promise<FiscalNote[]> {
    const q = createScopedQuery(
      collection(db, 'fiscalNotes'),
      orderBy('dataEmissao', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as FiscalNote));
  },

  /**
   * Checks if a note already exists for a specific origin.
   */
  async noteExistsForOrigin(origemId: string): Promise<boolean> {
    const q = query(
      collection(db, 'fiscalNotes'),
      where('origemId', '==', origemId),
      where('status', 'in', ['emitida', 'pendente'])
    );
    const snap = await getDocs(q);
    return !snap.empty;
  },

  /**
   * Emits a new fiscal note using Focus NFe API.
   */
  async emitNote(note: Partial<FiscalNote>): Promise<string> {
    const user = auth.currentUser;
    const config = await this.getConfig();
    if (!config) throw new Error('Configuração fiscal não encontrada. Por favor, preencha os dados da empresa logo em Configuração.');
    
    if (config.modoFiscal === 'producao' && !config.focusApiKey) {
      throw new Error('Token da API Focus NFe não encontrado. Configure-o para emitir notas em produção.');
    }

    const exists = await this.noteExistsForOrigin(note.origemId!);
    if (exists) throw new Error('Já existe uma nota fiscal emitida para este registro');

    const noteRef = doc(collection(db, 'fiscalNotes'));
    const configRef = doc(db, 'fiscalConfig', config.id!);

    // 1. Determine local sequence
    const tipo = note.tipo || 'nfce';
    const numero = tipo === 'nfe' ? config.proximoNumeroNFe : config.proximoNumeroNFCe;
    const serie = tipo === 'nfe' ? config.serieNFe : config.serieNFCe;
    const reference = `${(user?.uid || 'admin').substring(0, 8)}-${note.origem}-${note.origemId}`;

    // 2. Decide: Simulation vs Production
    if (config.modoFiscal === 'simulacao') {
      // GENERATE MOCK DATA
      const chaveAcesso = `SIMULADO-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      const protocol = `MOCK-SEFAZ-${Date.now()}`;
      
      const simulatedXml = `
        <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <NFe>
            <infNFe Id="NFe${chaveAcesso.replace(/\D/g, '')}" versao="4.00">
               <ide><nNF>${numero}</nNF><ser>${serie}</ser></ide>
               <emit><CNPJ>${config.cnpj}</CNPJ><xNome>${config.razaoSocial}</xNome></emit>
               <dest><xNome>${note.cliente?.nome}</xNome></dest>
               <total><vNF>${note.total}</vNF></total>
            </infNFe>
          </NFe>
          <protNFe versao="4.00"><infProt><chNFe>${chaveAcesso}</chNFe><nProt>${protocol}</nProt></infProt></protNFe>
        </nfeProc>
      `.trim();

      const fullNote: FiscalNote = {
        ...note as FiscalNote,
        numeroNota: numero,
        serie: serie,
        status: 'emitida', // Auto-authorized in simulation
        dataEmissao: Timestamp.now(),
        reference,
        chaveAcesso,
        xmlSimulado: simulatedXml,
        xml: `/simulado/${chaveAcesso}.xml`,
        danfe: `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=completa&cnpjEmitente=${config.cnpj}`,
        focusStatus: 'simulado_sucesso'
      };

      await setDoc(noteRef, fullNote);

      // Increment internal counter
      const updateField = tipo === 'nfe' ? 'proximoNumeroNFe' : 'proximoNumeroNFCe';
      await updateDoc(configRef, {
        [updateField]: increment(1),
        updatedAt: Timestamp.now()
      });

      return noteRef.id;
    }

    // 2. Transmit to Focus NFe via Proxy (PRODUCTION PATH)
    // We transform our internal note into Focus NFe format
    const focusPayload = {
      reference,
      data_emissao: new Date().toISOString(),
      natureza_operacao: note.naturezaOperacao || "Venda",
      tipo_operacao: 1, // Saída
      finalidade_emissao: 1,
      cliente: {
        nome: note.cliente?.nome,
        cpf: note.cliente?.documento?.length === 11 ? note.cliente.documento : undefined,
        cnpj: note.cliente?.documento?.length === 14 ? note.cliente.documento : undefined,
        logradouro: note.cliente?.endereco?.logradouro,
        numero: note.cliente?.endereco?.numero,
        bairro: note.cliente?.endereco?.bairro,
        municipio: note.cliente?.endereco?.cidade,
        uf: note.cliente?.endereco?.estado,
        cep: note.cliente?.endereco?.cep
      },
      items: note.itens?.map((it, idx) => ({
        numero_item: idx + 1,
        codigo_produto: it.itemId,
        descricao: it.name,
        cfop: note.cfop || "5102",
        unidade_comercial: "UN",
        quantidade_comercial: it.quantity,
        valor_unitario_comercial: it.unitPrice,
        valor_bruto: it.totalPrice,
        icms_situacao_tributaria: config.regimeTributario === 'simples_nacional' ? "102" : "00",
        icms_origem: 0
      })),
      valor_total: note.total,
      presenca_comprador: 1,
      modalidade_frete: 9 // Sem frete
    };

    try {
      const response = await fetch('/api/fiscal/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusApiKey: config.focusApiKey,
          ambiente: config.ambiente,
          tipo: note.tipo,
          payload: focusPayload
        })
      });

      const apiResult = await response.json();
      
      if (!response.ok) {
        throw new Error(apiResult.mensagem || apiResult.error || 'Erro na transmissão');
      }

      // 3. Save to Firestore (Status 'pendente' or 'processando')
      const fullNote: FiscalNote = {
        ...note as FiscalNote,
        numeroNota: numero,
        serie: serie,
        status: 'pendente',
        dataEmissao: Timestamp.now(),
        reference,
        focusStatus: apiResult.status // usually 'processando_autorizacao'
      };

      await setDoc(noteRef, fullNote);

      // 4. Increment internal counter
      const updateField = tipo === 'nfe' ? 'proximoNumeroNFe' : 'proximoNumeroNFCe';
      await updateDoc(configRef, {
        [updateField]: increment(1),
        updatedAt: Timestamp.now()
      });

      return noteRef.id;
    } catch (error: any) {
      console.error("Transmissão Fiscal falhou:", error);
      throw error;
    }
  },

  /**
   * Queries the SEFAZ status via Focus NFe API.
   */
  async checkStatus(noteId: string): Promise<void> {
    const noteRef = doc(db, 'fiscalNotes', noteId);
    const snap = await getDoc(noteRef);
    if (!snap.exists()) return;

    const note = snap.data() as FiscalNote;
    if (note.focusStatus === 'simulado_sucesso') return; // Simulated notes don't need sync

    const config = await this.getConfig();
    if (!config || !config.focusApiKey) return;

    try {
      const queryParams = new URLSearchParams({
        focusApiKey: config.focusApiKey,
        ambiente: config.ambiente,
        tipo: note.tipo
      });

      const response = await fetch(`/api/fiscal/status/${note.reference}?${queryParams.toString()}`);
      const data = await response.json();

      if (response.ok) {
        let newStatus: FiscalNoteStatus = note.status;
        let errorMessage = '';

        if (data.status === 'autorizado') {
           newStatus = 'emitida';
        } else if (data.status === 'rejeitado' || data.status === 'erro_autorizacao') {
           newStatus = 'erro';
           errorMessage = data.mensagem_sefaz || data.erros?.[0]?.mensagem || 'Erro desconhecido na Sefaz';
        } else if (data.status === 'cancelado') {
           newStatus = 'cancelada';
        }

        await updateDoc(noteRef, {
          status: newStatus,
          chaveAcesso: data.chave_nfe || data.chave_nfce,
          xml: data.caminho_xml_nota_fiscal,
          danfe: data.caminho_pdf_danfe,
          errorMessage: errorMessage || null,
          focusStatus: data.status,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error("Status check failed:", error);
    }
  },

  /**
   * Cancels a note.
   */
  async cancelNote(noteId: string, justificativa: string): Promise<void> {
    const noteRef = doc(db, 'fiscalNotes', noteId);
    const snap = await getDoc(noteRef);
    if (!snap.exists()) return;

    const note = snap.data() as FiscalNote;
    if (note.focusStatus === 'simulado_sucesso') {
       await updateDoc(noteRef, {
         status: 'cancelada',
         updatedAt: Timestamp.now()
       });
       return;
    }

    const config = await this.getConfig();
    if (!config || !config.focusApiKey) throw new Error('API Key da Focus NFe não configurada');

    try {
      const response = await fetch(`/api/fiscal/cancel/${note.reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focusApiKey: config.focusApiKey,
          ambiente: config.ambiente,
          tipo: note.tipo,
          justificativa
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensagem || 'Erro ao cancelar nota');
      }

      await updateDoc(noteRef, {
        status: 'cancelada',
        focusStatus: data.status,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      console.error("Cancel failed:", error);
      throw error;
    }
  }
};
