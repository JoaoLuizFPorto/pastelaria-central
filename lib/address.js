const fields = {
  address_postal_code: { label: 'CEP', max: 9 },
  address_street: { label: 'Logradouro', max: 150 },
  address_number: { label: 'Número', max: 20 },
  address_complement: { label: 'Complemento', max: 100 },
  address_district: { label: 'Bairro', max: 100 },
  address_city: { label: 'Cidade', max: 100 },
  address_state: { label: 'Estado (UF)', max: 2 },
  address_reference: { label: 'Ponto de referência', max: 150 }
};
const states = new Set(
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
);
function validateAddress(body, current = {}, required = true) {
  const values = {};
  for (const [key, field] of Object.entries(fields)) {
    const raw = body[key] === undefined ? current[key] || '' : body[key];
    if (typeof raw !== 'string' || raw.length > field.max)
      return { error: 'Confira o campo ' + field.label + '.', values };
    values[key] = raw.trim();
    if (required && key !== 'address_complement' && !values[key])
      return { error: 'Preencha o campo ' + field.label + '.', values };
  }
  if (values.address_postal_code && !/^\d{5}-?\d{3}$/.test(values.address_postal_code))
    return { error: 'Informe um CEP válido com 8 dígitos.', values };
  values.address_postal_code = values.address_postal_code.replace('-', '');
  values.address_state = values.address_state.toUpperCase();
  if (values.address_state && !states.has(values.address_state))
    return { error: 'Informe uma UF válida, como SP.', values };
  return { values };
}
module.exports = { fields, validateAddress };
