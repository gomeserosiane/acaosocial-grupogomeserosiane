import { digits } from './masks.js';
import { CONFIG, UFS } from './config.js';
export const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
export function validCPF(value) {
  const n = digits(value);
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  // Calcula os dois dígitos verificadores com pesos decrescentes.
  for (let size = 9; size <= 10; size++) {
    let sum = 0;
    for (let i = 0; i < size; i++) sum += Number(n[i]) * (size + 1 - i);
    const remainder = (sum * 10) % 11;
    if ((remainder === 10 ? 0 : remainder) !== Number(n[size])) return false;
  }
  return true;
}
export function validate(data) {
  const errors = {};
  if (clean(data.name).split(' ').filter(Boolean).length < 2 || !/\p{L}/u.test(clean(data.name))) errors.name = 'Informe seu nome completo, com pelo menos duas partes.';
  if (!validCPF(data.cpf)) errors.cpf = 'Informe um CPF válido.';
  if (!/^[\p{L}\p{N} .\/()\-]{2,30}$/u.test(clean(data.rg))) errors.rg = 'Informe seu RG. São aceitos letras, números e pontuação usual.';
  if (!/^\d{8}$/.test(digits(data.cep))) errors.cep = 'Informe um CEP com 8 dígitos.';
  for (const [key, label] of Object.entries({ address: 'o endereço', number: 'o número ou marque Sem número', neighborhood: 'o bairro', city: 'a cidade' })) {
    if (!clean(data[key])) errors[key] = `Informe ${label}.`;
  }
  if (!UFS.includes(data.state)) errors.state = 'Selecione o estado.';
  if (!/^[1-9]\d{9,10}$/.test(digits(data.phone))) errors.phone = 'Informe um telefone com DDD e 10 ou 11 dígitos.';
  if (clean(data.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(data.email))) errors.email = 'Informe um email válido ou deixe o campo vazio.';
  if (!Array.isArray(data.services) || !data.services.some(s => CONFIG.services.includes(s))) errors.services = 'Selecione pelo menos um serviço.';
  if (data.consent !== true) errors.consent = 'Confirme sua autorização para continuar.';
  return errors;
}
