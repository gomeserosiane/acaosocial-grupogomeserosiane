// Testes executados pelo próprio navegador, sem dependências de produção.
import { buildMessage } from '../js/whatsapp.js';
const summary = document.querySelector('#summary'), results = document.querySelector('#results');
let total = 0, failed = 0;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
async function check(name, callback) {
  total++;
  const li = document.createElement('li');
  try { await callback(); li.dataset.pass = 'true'; li.textContent = `OK — ${name}`; }
  catch (error) { failed++; li.dataset.pass = 'false'; li.textContent = `FALHOU — ${name}: ${error.message}`; }
  results.append(li);
}
const tick = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const html = await (await fetch('../index.html')).text();
async function fixture(width) {
  const frame = document.createElement('iframe');
  frame.title = `Cadastro em ${width}px`;
  frame.width = width;
  const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
  // Código fixo do harness: nenhum dado de participante é interpolado neste HTML.
  const base = new URL('../', location.href).href;
  frame.srcdoc = html.replace('<head>', `<head><base href="${base}"><script src="tests/browser-fixture.js"></script>`);
  document.querySelector('#frames').append(frame);
  await loaded;
  // O evento load aguarda os módulos e a inicialização da aplicação real.
  await tick();
  return { frame, doc: frame.contentDocument, win: frame.contentWindow };
}
const { doc, win } = await fixture(960);
const form = doc.querySelector('form');
function input(name, value) {
  const field = form.elements[name]; field.value = value;
  field.dispatchEvent(new win.Event('input', { bubbles: true }));
}
function setChecked(selector, checked) {
  const field = doc.querySelector(selector); field.checked = checked;
  field.dispatchEvent(new win.Event('change', { bubbles: true }));
}
function submit() { form.requestSubmit(); }
await check('Campos vazios bloqueiam envio e focam o nome', () => {
  submit(); assert(win.__testPopup.length === 0, 'Tentativa de abrir WhatsApp');
  assert(doc.activeElement.id === 'name', 'Foco incorreto');
  assert(!doc.querySelector('#error-summary').hidden, 'Resumo ausente');
});
await check('Máscaras reais de CPF, CEP e telefone na digitação', async () => {
  input('name', 'Pessoa de Teste'); input('cpf', '52998224725'); input('rg', 'MG-12.345.678'); input('cep', '66000000'); input('phone', '91999999999');
  assert(form.elements.cpf.value === '529.982.247-25', 'CPF');
  assert(form.elements.cep.value === '66000-000', 'CEP');
  assert(form.elements.phone.value === '(91) 99999-9999', 'Telefone');
  await tick();
});
await check('Consulta CEP preenche endereço e mantém campos editáveis', () => {
  assert(form.elements.address.value === 'Rua Sintética', 'Endereço não preenchido');
  assert(form.elements.state.value === 'PA', 'UF não preenchida');
  for (const key of ['address','city','neighborhood','state']) assert(!form.elements[key].readOnly && !form.elements[key].disabled, key);
});
await check('Alteração manual durante consulta é preservada', async () => {
  input('cep', '66010000'); input('address', 'Endereço manual'); await tick();
  assert(form.elements.address.value === 'Endereço manual', 'Edição sobrescrita');
});
await check('Sem número usa S/N e restaura o número anterior', () => {
  input('number', '123 A'); setChecked('#noNumber', true);
  assert(form.elements.number.value === 'S/N' && form.elements.number.readOnly, 'Sem número');
  setChecked('#noNumber', false);
  assert(form.elements.number.value === '123 A' && !form.elements.number.readOnly, 'Restauração');
});
await check('Sem serviço bloqueia envio e foca o primeiro checkbox', () => {
  submit(); assert(win.__testPopup.length === 0, 'Envio indevido');
  assert(doc.activeElement.name === 'services', 'Foco no serviço');
});
await check('Seleção múltipla independente e ausência de consentimento bloqueia envio', () => {
  setChecked('[name="services"][value="Advocacia"]', true);
  setChecked('[name="services"][value="Dentista"]', true);
  assert(doc.querySelectorAll('[name="services"]:checked').length === 2, 'Seleções não independentes');
  submit(); assert(win.__testPopup.length === 0, 'Envio sem autorização');
  assert(doc.activeElement.id === 'consent', 'Foco no consentimento');
});
await check('Envio válido prepara mensagem exata, oferece alternativa e preserva dados', () => {
  setChecked('#consent', true); submit();
  assert(win.__testPopup.length === 1, 'Abertura não solicitada');
  const url = new URL(win.__testPopup[0][0]);
  const expected = buildMessage({ name:'Pessoa de Teste',cpf:'52998224725',rg:'MG-12.345.678',cep:'66010000',address:'Endereço manual',number:'123 A',neighborhood:'Bairro Sintético',city:'Cidade de Teste',state:'PA',phone:'91999999999',email:'',services:['Advocacia','Dentista'] });
  assert(url.searchParams.get('text') === expected, 'Mensagem divergente');
  assert(!doc.querySelector('#send-feedback').hidden, 'Alternativa ausente');
  assert(doc.querySelector('#whatsapp-fallback').href === url.href, 'Link alternativo incorreto');
  assert(form.elements.name.value === 'Pessoa de Teste' && form.elements.consent.checked, 'Dados apagados');
});
await check('Edição invalida o link antigo e email inválido bloqueia novo envio', () => {
  input('email', 'invalido');
  assert(doc.querySelector('#send-feedback').hidden, 'Feedback antigo exposto');
  assert(!doc.querySelector('#whatsapp-fallback').hasAttribute('href'), 'Link antigo exposto');
  submit(); assert(win.__testPopup.length === 1, 'Email inválido aceito');
  assert(doc.activeElement.id === 'email', 'Foco no email'); input('email', '');
});
await check('Falha de CEP não apaga endereço e permite cadastro manual', async () => {
  input('cep', '99999999'); await tick();
  assert(form.elements.address.value === 'Endereço manual', 'Endereço apagado');
  assert(doc.querySelector('#cep-status').textContent.includes('manualmente'), 'Feedback ausente');
  submit(); assert(win.__testPopup.length === 2, 'Cadastro manual bloqueado');
});
await check('Todos os controles possuem label e erros associados; ordem de foco declarativa', () => {
  for (const el of form.querySelectorAll('input,select,button')) {
    assert(!el.hasAttribute('tabindex') || Number(el.getAttribute('tabindex')) <= 0, 'Tabindex artificial');
    if (el.matches('input,select')) assert(el.labels.length > 0, `Label ausente: ${el.name}`);
  }
  for (const el of form.querySelectorAll('input:not(#noNumber),select')) assert(el.getAttribute('aria-describedby'), `Erro não associado: ${el.name}`);
});
for (const width of [320, 375, 425, 768, 1024, 1440]) {
  await check(`Layout ${width}px: sem overflow; um ou dois campos por linha conforme a tela`, async () => {
    const fixtureData = await fixture(width);
    const d = fixtureData.doc, w = fixtureData.win;
    assert(d.documentElement.scrollWidth <= d.documentElement.clientWidth, `Overflow ${d.documentElement.scrollWidth}/${d.documentElement.clientWidth}`);
    const grid = w.getComputedStyle(d.querySelector('.fields-grid'));
    assert(grid.gridTemplateColumns.split(' ').length === (width < 768 ? 1 : 2), 'Grid incorreto');
    const logos = w.getComputedStyle(d.querySelector('.logo-row'));
    assert(logos.gridTemplateColumns.split(' ').length === (width < 768 ? 2 : 4), 'Logos incorretas');
    if (width !== 320 && width !== 768) fixtureData.frame.remove();
  });
}
summary.textContent = `${total - failed}/${total} verificações passaram${failed ? `; ${failed} falharam` : '.'}`;
summary.dataset.complete = 'true'; summary.dataset.failed = String(failed);
