const categories = [
  {
    value: 'pastel',
    label: 'Pastel',
    subcategories: [
      { value: 'pastel-salgado', label: 'Pastel salgado' },
      { value: 'pastel-doce', label: 'Pastel doce' },
      { value: 'pastel-especial', label: 'Pastel especial' }
    ]
  },
  {
    value: 'bebida',
    label: 'Bebida',
    subcategories: [
      { value: 'agua', label: 'Água' },
      { value: 'refrigerante', label: 'Refrigerante' },
      { value: 'suco-natural', label: 'Suco natural' },
      { value: 'cerveja', label: 'Cerveja' }
    ]
  },
  {
    value: 'salgado',
    label: 'Salgado',
    subcategories: [{ value: 'salgado-frito', label: 'Salgado frito' }]
  },
  { value: 'combo', label: 'Combo', subcategories: [{ value: 'combo', label: 'Combo' }] }
];
const validSubcategory = (category, subcategory) =>
  categories.some(
    (entry) =>
      entry.value === category && entry.subcategories.some((sub) => sub.value === subcategory)
  );
const defaults = Object.fromEntries(
  categories.map((entry) => [entry.value, entry.subcategories[0].value])
);
module.exports = { categories, validSubcategory, defaults };
