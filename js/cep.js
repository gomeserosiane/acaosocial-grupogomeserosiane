import { digits } from './masks.js';
import { UFS } from './config.js';
// Injeção de fetch permite testar rede, erros, timeouts e respostas fora de ordem.
export function createCEPLookup({ fetcher = globalThis.fetch, onStatus = () => {}, onResult = () => {}, timeoutMs = 8000 } = {}) {
  let controller, revision = 0;
  return async function lookup(value) {
    const current = ++revision;
    controller?.abort();
    const cep = digits(value);
    if (cep.length !== 8) { onStatus(''); return; }
    controller = new AbortController();
    const active = controller;
    onStatus('Consultando CEP…', 'loading');
    const timeout = setTimeout(() => active.abort(), timeoutMs);
    try {
      const response = await fetcher(`https://viacep.com.br/ws/${cep}/json/`, { signal: active.signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('network');
      const data = await response.json();
      if (current !== revision) return;
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('response');
      if (data.erro) { onStatus('CEP não encontrado. Confira o CEP ou preencha o endereço manualmente.', 'warning'); return; }
      const address = {};
      for (const [field, key] of Object.entries({ address: 'logradouro', neighborhood: 'bairro', city: 'localidade', state: 'uf' })) {
        if (typeof data[key] === 'string' && data[key].trim() && data[key].length <= 160 && (field !== 'state' || UFS.includes(data[key]))) address[field] = data[key].trim();
      }
      if (!Object.keys(address).length) throw new Error('response');
      onResult(address);
      onStatus(Object.keys(address).length === 4 ? 'Endereço encontrado. Confira os dados e informe o número.' : 'CEP encontrado com dados parciais. Complete o endereço manualmente.', 'success');
    } catch {
      if (current === revision) onStatus('Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.', 'warning');
    } finally { clearTimeout(timeout); }
  };
}
export function bindCEP(form) {
  const status = document.querySelector('#cep-status');
  const fields = ['address', 'neighborhood', 'city', 'state'];
  let snapshot = {};
  const lookup = createCEPLookup({
    onStatus(message, state = '') {
      status.textContent = message;
      status.dataset.state = state;
      form.elements.cep.setAttribute('aria-busy', String(state === 'loading'));
    },
    onResult(address) {
      // Preserva alterações manuais realizadas durante a requisição.
      for (const [key, value] of Object.entries(address)) {
        const input = form.elements[key];
        if (input.value === snapshot[key]) {
          input.value = value;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  });
  form.elements.cep.addEventListener('input', () => {
    snapshot = Object.fromEntries(fields.map(key => [key, form.elements[key].value]));
    lookup(form.elements.cep.value);
  });
}
