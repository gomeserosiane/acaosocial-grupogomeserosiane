// Mantém somente os dígitos e limita cada campo ao comprimento esperado.
export const digits = value => String(value ?? '').replace(/\D/g, '');
export function maskCPF(value) {
  return digits(value).slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}
export const maskCEP = value => digits(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
export function maskPhone(value) {
  const n = digits(value).slice(0, 11);
  if (!n) return '';
  if (n.length <= 2) return `(${n}`;
  const local = n.slice(2), split = n.length > 10 ? 5 : 4;
  return `(${n.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? '-' + local.slice(split) : ''}`;
}
export function bindMask(input, mask) {
  input.addEventListener('input', () => {
    // Restaura a posição pelos dígitos à esquerda do cursor, inclusive em edições no meio.
    const count = digits(input.value.slice(0, input.selectionStart)).length;
    const wasAtEnd = input.selectionStart === input.value.length;
    input.value = mask(input.value);
    let pos = input.value.length;
    if (!wasAtEnd) {
      let seen = 0;
      pos = 0;
      while (pos < input.value.length && seen < count) {
        if (/\d/.test(input.value[pos])) seen++;
        pos++;
      }
    }
    input.setSelectionRange(pos, pos);
  });
}
