// Apenas no harness de testes: intercepta efeitos externos antes de carregar main.js.
window.__testPopup = [];
window.open = (...args) => { window.__testPopup.push(args); return null; };
window.fetch = async (url, options) => {
  if (!/^https:\/\/viacep\.com\.br\/ws\/\d{8}\/json\/$/.test(String(url))) throw new Error('Destino inesperado no teste');
  const cep = String(url).match(/ws\/(\d{8})/)[1];
  if (cep === '99999999') throw new Error('Falha de rede simulada');
  if (cep === '88888888') return { ok: true, json: async () => ({ erro: true }) };
  return { ok: true, json: async () => ({ logradouro: 'Rua Sintética', bairro: 'Bairro Sintético', localidade: 'Cidade de Teste', uf: 'PA' }) };
};
