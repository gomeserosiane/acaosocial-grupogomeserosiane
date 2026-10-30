import { CONFIG } from './config.js';
import { clean } from './validation.js';
import { maskCPF, maskCEP, maskPhone } from './masks.js';
export function buildMessage(data) {
  const address = [data.address, data.number, maskCEP(data.cep), data.neighborhood, data.city, data.state].map(clean).join(', ');
  const services = CONFIG.services.filter(s => data.services.includes(s)).join(', ');
  return `*_NOVO CADASTRO_*\n\n- Nome: ${clean(data.name)}\n- CPF: ${maskCPF(data.cpf)}\n- RG: ${clean(data.rg)}\n- Endereço: ${address}\n- Telefone: ${maskPhone(data.phone)}\n- Email: ${clean(data.email) || 'Não informado'}\n- Serviços solicitados: ${services}`;
}
export const buildWhatsAppURL = data => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildMessage(data))}`;
// Síncrono: preserva o gesto do usuário para navegadores que restringem pop-ups.
export function openWhatsApp(url, open = window.open.bind(window)) {
  try { open(url, '_blank', 'noopener,noreferrer'); } catch { /* O link alternativo continua disponível. */ }
}
