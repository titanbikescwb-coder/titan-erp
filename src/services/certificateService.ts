import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../firebase/config';
import { DigitalCertificate } from '../domain/types';
import forge from 'node-forge';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'vrum-bike-secret-key'; // In production, this should be an environment variable

export const certificateService = {
  // Get current certificate
  getCertificate: (callback: (cert: DigitalCertificate | null) => void) => {
    const docRef = doc(db, 'certificates', 'global');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as DigitalCertificate);
      } else {
        callback(null);
      }
    });
  },

  // Upload and validate certificate
  uploadCertificate: async (file: File, password: string) => {
    // 1. Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const p12Der = forge.util.createBuffer(bytes.buffer);

    try {
      // 2. Try to parse P12/PFX
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      // 3. Extract certificate info
      // We look for bags with certificates
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];
      
      if (!certBag || !certBag.cert) {
        throw new Error('Certificado não encontrado no arquivo.');
      }

      const cert = certBag.cert;
      const validFrom = cert.validity.notBefore;
      const validTo = cert.validity.notAfter;
      const subject = cert.subject.getField('CN')?.value || 'Desconhecido';
      const issuer = cert.issuer.getField('CN')?.value || 'Desconhecido';

      // 4. Determine status
      const now = new Date();
      let status: 'válido' | 'inválido' | 'expirado' = 'válido';
      if (now < validFrom) status = 'inválido';
      if (now > validTo) status = 'expirado';

      // 5. Upload file to Storage
      const storageRef = ref(storage, `certificates/global/${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      // 6. Encrypt password
      const passwordEncrypted = CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();

      // 7. Save to Firestore
      const certData: Omit<DigitalCertificate, 'id'> = {
        fileName: file.name,
        fileUrl,
        passwordEncrypted,
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString(),
        subject,
        issuer,
        status,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuário Individual'
      };

      await setDoc(doc(db, 'certificates', 'global'), certData);
      return certData;

    } catch (error: any) {
      console.error('Erro ao validar certificado:', error);
      throw new Error('Senha incorreta ou arquivo de certificado inválido.');
    }
  },

  // Decrypt password (for use in NFe emission later)
  decryptPassword: (encrypted: string) => {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
};
