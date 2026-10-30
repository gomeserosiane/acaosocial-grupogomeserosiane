import { CONFIG, UFS } from './config.js';
import { bindMask, maskCPF, maskCEP, maskPhone } from './masks.js';
import { bindCEP } from './cep.js';
import { bindForm } from './form.js';
// Conteúdo de configuração é inserido como texto, sem HTML dinâmico.
for (const [index, logo] of CONFIG.logos.entries()) {
  const slot = document.querySelector(`[data-logo="${index}"]`);
  if (!slot || !logo.src) continue;
  const img = new Image();
  img.alt = logo.alt;
  img.width = index === 0 ? 200 : 140;
  img.height = index === 0 ? 80 : 50;
  img.addEventListener('load', () => slot.replaceChildren(img));
  img.src = logo.src;
}
const state = document.querySelector('#state');
for (const uf of UFS) state.add(new Option(uf, uf));
for (const service of CONFIG.services) {
  const label = document.createElement('label');
  label.className = 'service-option';
  const input = document.createElement('input');
  input.type = 'checkbox'; input.name = 'services'; input.value = service;
  input.setAttribute('aria-describedby', 'services-error');
  const text = document.createElement('span'); text.textContent = service;
  label.append(input, text);
  document.querySelector('#services-list').append(label);
}
for (const [key, value] of Object.entries(CONFIG.privacy)) document.querySelector(`[data-privacy="${key}"]`).textContent = value;
const form = document.querySelector('#registration');
bindMask(form.elements.cpf, maskCPF);
bindMask(form.elements.cep, maskCEP);
bindMask(form.elements.phone, maskPhone);
bindCEP(form);
bindForm(form);
// O botão permanece indisponível até a inicialização completa.
form.querySelector('[type="submit"]').disabled = false;
