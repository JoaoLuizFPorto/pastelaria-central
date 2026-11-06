const transitions = {
  Registrado: ['Em preparo', 'Cancelado'],
  'Em preparo': ['Pronto para entrega', 'Cancelado'],
  'Pronto para entrega': ['Em rota de entrega', 'Cancelado'],
  'Em rota de entrega': ['Entregue', 'Cancelado'],
  Entregue: [],
  Cancelado: []
};
function nextStatuses(status) {
  status = statusLabel(status);
  // Permite regularizar situações antigas sem sobrescrever seu histórico.
  return Object.hasOwn(transitions, status)
    ? transitions[status]
    : ['Em preparo', 'Pronto para entrega', 'Em rota de entrega', 'Entregue', 'Cancelado'];
}

function statusLabel(status) {
  const aliases = {
    'Pedido registrado': 'Registrado',
    'Pronto para retirada': 'Pronto para entrega',
    'Saiu para entrega': 'Em rota de entrega',
    'Concluído': 'Entregue'
  };
  return Object.hasOwn(aliases, status) ? aliases[status] : status;
}
const allowsMessage = (status) => ['Entregue', 'Cancelado'].includes(status);
function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value.replace(' ', 'T') + 'Z');
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}
module.exports = { nextStatuses, formatDate, statusLabel, allowsMessage };
