import { validate } from './validation.js';
import { buildWhatsAppURL, openWhatsApp } from './whatsapp.js';
export function readForm(form) {
  const data = Object.fromEntries(new FormData(form));
  data.services = new FormData(form).getAll('services');
  data.consent = form.elements.consent.checked;
  if (form.elements.noNumber.checked) data.number = 'S/N';
  return data;
}
export function bindForm(form) {
  let attempted = false, previousNumber = '';
  const summary = document.querySelector('#error-summary');
  const feedback = document.querySelector('#send-feedback');
  const fallback = document.querySelector('#whatsapp-fallback');
  function control(key) { return key === 'services' ? form.querySelector('[name="services"]') : form.elements[key]; }
  function showErrors(errors, shouldFocus = false) {
    for (const key of ['name','cpf','rg','cep','address','number','neighborhood','city','state','phone','email','services','consent']) {
      const error = document.getElementById(`${key}-error`);
      error.textContent = errors[key] || '';
      const inputs = key === 'services' ? form.querySelectorAll('[name="services"]') : [control(key)];
      inputs.forEach(input => input.setAttribute('aria-invalid', String(Boolean(errors[key]))));
    }
    const keys = Object.keys(errors);
    summary.hidden = !keys.length;
    summary.textContent = keys.length ? `Revise ${keys.length === 1 ? 'o campo indicado' : `os ${keys.length} campos indicados`} para continuar.` : '';
    if (shouldFocus && keys.length) control(keys[0]).focus();
  }
  // Sem número mantém o valor anterior somente em memória enquanto a página está aberta.
  form.elements.noNumber.addEventListener('change', event => {
    const input = form.elements.number;
    if (event.target.checked) { previousNumber = input.value; input.value = 'S/N'; }
    else input.value = previousNumber;
    input.readOnly = event.target.checked;
  });
  function onEdit() {
    // Invalida o link antigo para que uma edição nunca abra uma mensagem desatualizada.
    feedback.hidden = true;
    fallback.removeAttribute('href');
    const selected = form.querySelectorAll('[name="services"]:checked').length;
    document.querySelector('#service-count').textContent = selected ? `${selected} selecionado${selected > 1 ? 's' : ''}` : 'Selecione um ou mais';
    if (attempted) showErrors(validate(readForm(form)));
  }
  form.addEventListener('input', onEdit);
  form.addEventListener('change', onEdit);
  form.addEventListener('focusout', event => {
    const key = event.target.name;
    if (!key || key === 'services' || key === 'consent' || key === 'noNumber') return;
    const error = validate(readForm(form))[key];
    const element = document.getElementById(`${key}-error`);
    if (element && event.target.value.trim()) {
      element.textContent = error || '';
      event.target.setAttribute('aria-invalid', String(Boolean(error)));
    }
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    attempted = true;
    const data = readForm(form), errors = validate(data);
    showErrors(errors, true);
    if (Object.keys(errors).length) return;
    const url = buildWhatsAppURL(data);
    fallback.href = url;
    feedback.hidden = false;
    openWhatsApp(url);
  });
}
