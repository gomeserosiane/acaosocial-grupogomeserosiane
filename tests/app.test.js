import test from 'node:test';
import assert from 'node:assert/strict';
import { validCPF, validate } from '../js/validation.js';
import { maskCPF, maskCEP, maskPhone } from '../js/masks.js';
import { buildMessage, buildWhatsAppURL, openWhatsApp } from '../js/whatsapp.js';
import { createCEPLookup } from '../js/cep.js';
import { CONFIG } from '../js/config.js';
import { readFile } from 'node:fs/promises';
// Todos os registros são sintéticos. O CPF é apenas um fixture de algoritmo.
const base = { name: 'Pessoa de Teste', cpf: '52998224725', rg: '12.345.678-X', cep: '66000000', address: 'Rua de Teste', number: '123, casa A', neighborhood: 'Bairro de Teste', city: 'Cidade de Teste', state: 'PA', phone: '91999999999', email: '', services: ['Advocacia'], consent: true };
const complete = { logradouro: 'Rua de Teste', bairro: 'Bairro de Teste', localidade: 'Cidade de Teste', uf: 'PA' };
const response = data => ({ ok: true, json: async () => data });

test('CPF: válido com e sem máscara; inválidos e repetidos rejeitados', () => {
  assert.equal(validCPF('52998224725'), true);
  assert.equal(validCPF('529.982.247-25'), true);
  for (const n of ['52998224724', '00000000000', '11111111111', '123', '']) assert.equal(validCPF(n), false);
});
test('máscaras CPF e CEP aceitam colagem e entrada parcial', () => {
  assert.equal(maskCPF('52998224725'), '529.982.247-25');
  assert.equal(maskCPF('529.982.247-25'), '529.982.247-25');
  assert.equal(maskCPF('5299'), '529.9');
  assert.equal(maskCEP('66000000'), '66000-000');
  assert.equal(maskCEP('66000-000'), '66000-000');
});
test('máscara telefone: fixo, celular, entrada parcial e limite', () => {
  assert.equal(maskPhone('9132223333'), '(91) 3222-3333');
  assert.equal(maskPhone('91999999999'), '(91) 99999-9999');
  assert.equal(maskPhone('91'), '(91');
  assert.equal(maskPhone(''), '');
  assert.equal(maskPhone('9199999999999'), '(91) 99999-9999');
});
test('cadastro completo, email vazio e serviços múltiplos válidos', () => {
  assert.deepEqual(validate(base), {});
  assert.deepEqual(validate({ ...base, services: CONFIG.services }), {});
});
test('nome incompleto é rejeitado; acentos, apóstrofos e hífens aceitos', () => {
  assert.ok(validate({ ...base, name: 'Pessoa' }).name);
  assert.equal(validate({ ...base, name: '  Ana-Maria D’Ávila  ' }).name, undefined);
});
test('RG aceita formatos estaduais com letras; email opcional é validado quando preenchido', () => {
  for (const rg of ['1234567', '12.345.678-X', 'MG-12.345.678', '123/ABC']) assert.equal(validate({ ...base, rg }).rg, undefined);
  for (const email of ['teste', 'a@', 'a @b.com', '@b.com']) assert.ok(validate({ ...base, email }).email);
  assert.equal(validate({ ...base, email: 'teste@example.com' }).email, undefined);
});
test('campos obrigatórios, CEP, UF e telefone bloqueiam dados incompletos', () => {
  const bad = validate({ name: '', cpf: '', rg: '', cep: '12', address: '', number: '', neighborhood: '', city: '', state: 'XX', phone: '', email: '', services: [], consent: false });
  for (const key of ['name','cpf','rg','cep','address','number','neighborhood','city','state','phone','services','consent']) assert.ok(bad[key], key);
  assert.equal(bad.email, undefined);
});
test('endereço manual e número S/N são válidos sem consulta CEP', () => {
  assert.deepEqual(validate({ ...base, number: 'S/N' }), {});
});
test('serviço é obrigatório, seleções independentes e consentimento obrigatório', () => {
  assert.ok(validate({ ...base, services: [] }).services);
  assert.ok(validate({ ...base, services: ['Serviço inexistente'] }).services);
  assert.ok(validate({ ...base, consent: false }).consent);
});
test('mensagem exata: título, endereço, email ausente, serviços ordenados e sem campos extras', () => {
  const message = buildMessage({ ...base, name: '  Pessoa   de Teste ', services: [CONFIG.services[5], 'Advocacia', 'Dentista'] });
  assert.equal(message, '*_NOVO CADASTRO_*\n\n- Nome: Pessoa de Teste\n- CPF: 529.982.247-25\n- RG: 12.345.678-X\n- Endereço: Rua de Teste, 123, casa A, 66000-000, Bairro de Teste, Cidade de Teste, PA\n- Telefone: (91) 99999-9999\n- Email: Não informado\n- Serviços solicitados: Advocacia, Dentista, Emissão de 2ª via de identidade');
  assert.equal(message.includes('undefined'), false);
});
test('URL: número oficial, codificação única e preservação de caracteres especiais', () => {
  const data = { ...base, name: 'Pessoa & Teste', email: 'teste+acao@example.com' };
  const url = buildWhatsAppURL(data);
  assert.equal(new URL(url).pathname, '/5591999635260');
  assert.equal(new URL(url).searchParams.get('text'), buildMessage(data));
  assert.ok(url.includes('%0A'));
  assert.ok(url.includes('%26'));
});
test('abertura usa nova aba com isolamento e tolera bloqueio de pop-up', () => {
  let args;
  openWhatsApp('https://wa.me/5591999635260', (...values) => { args = values; return null; });
  assert.deepEqual(args, ['https://wa.me/5591999635260', '_blank', 'noopener,noreferrer']);
  assert.doesNotThrow(() => openWhatsApp('url', () => { throw new Error('blocked'); }));
});
test('CEP completo: endpoint recebe somente CEP e preenche campos mapeados', async () => {
  let address, request, status;
  const lookup = createCEPLookup({ fetcher: async (url, options) => { request = [url, options]; return response(complete); }, onResult: x => address = x, onStatus: x => status = x });
  await lookup('66000-000');
  assert.equal(request[0], 'https://viacep.com.br/ws/66000000/json/');
  assert.equal(request[1].referrerPolicy, 'no-referrer');
  assert.deepEqual(address, { address: complete.logradouro, neighborhood: complete.bairro, city: complete.localidade, state: 'PA' });
  assert.match(status, /encontrado/);
});
test('CEP parcial não produz campos vazios para apagar valores manuais', async () => {
  let result, status;
  await createCEPLookup({ fetcher: async () => response({ localidade: 'Cidade de Teste', uf: 'PA', bairro: '' }), onResult: x => result = x, onStatus: x => status = x })('66000000');
  assert.deepEqual(result, { city: 'Cidade de Teste', state: 'PA' });
  assert.match(status, /parciais/);
});
test('CEP inexistente, rede, HTTP, JSON e respostas inesperadas permitem fluxo manual', async () => {
  const fetchers = [async () => response({ erro: true }), async () => { throw new Error('offline'); }, async () => ({ ok: false }), async () => ({ ok: true, json: async () => { throw new Error('json'); } }), async () => response(null), async () => response({}), async () => response([]), async () => response({ uf: 'XX' })];
  for (const fetcher of fetchers) {
    let count = 0, status;
    await createCEPLookup({ fetcher, onResult: () => count++, onStatus: x => status = x })('66000000');
    assert.equal(count, 0);
    assert.match(status, /manual/);
  }
});
test('CEP antigo atrasado não sobrescreve o novo, mesmo se fetch ignorar abort', async () => {
  const pending = [], results = [];
  const lookup = createCEPLookup({ fetcher: (url, options) => new Promise(resolve => pending.push({ resolve, options })), onResult: x => results.push(x) });
  const old = lookup('66000000');
  const recent = lookup('66010000');
  assert.equal(pending[0].options.signal.aborted, true);
  pending[1].resolve(response({ ...complete, logradouro: 'Rua Nova' })); await recent;
  pending[0].resolve(response(complete)); await old;
  assert.equal(results.length, 1);
  assert.equal(results[0].address, 'Rua Nova');
});
test('CEP incompleto cancela consulta anterior e não aceita resultado antigo', async () => {
  let resolve, result = false;
  const lookup = createCEPLookup({ fetcher: () => new Promise(r => resolve = r), onResult: () => result = true });
  const old = lookup('66000000'); await lookup('6600');
  resolve(response(complete)); await old;
  assert.equal(result, false);
});
test('CEP timeout recebe feedback e permite preenchimento manual', async () => {
  let status;
  const lookup = createCEPLookup({ timeoutMs: 5, fetcher: (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('abort')))), onStatus: x => status = x });
  await lookup('66000000');
  assert.match(status, /manual/);
});
test('estrutura estática: nove logos, campos em ordem e segurança de dados', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/data-logo="/g) || []).length, 9);
  const keys = ['name','cpf','rg','cep','address','number','neighborhood','city','state','phone','email'];
  let previous = -1;
  for (const key of keys) { const pos = html.indexOf(`id="${key}"`); assert.ok(pos > previous); previous = pos; }
  assert.ok(html.includes('type="module"'));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  for (const file of ['main','form','cep','validation','whatsapp','masks']) {
    const js = await readFile(new URL(`../js/${file}.js`, import.meta.url), 'utf8');
    assert.doesNotMatch(js, /localStorage|sessionStorage|document\.cookie|console\.(log|info|error)|innerHTML|eval\(/);
  }
});
