// Catálogo da Pastelaria Central. Preços em centavos.
const products = [];
const productImages = require('./product-images.json');
function add(id, name, price, category, subcategory, description) {
  products.push({
    id,
    name,
    price,
    category,
    subcategory,
    description,
    image: productImages[id] || '/images/placeholders/product-unavailable.svg'
  });
}
for (const [slug, name] of [
  ['carne', 'Carne'],
  ['queijo', 'Queijo'],
  ['palmito', 'Palmito'],
  ['frango', 'Frango'],
  ['calabresa', 'Calabresa'],
  ['pizza', 'Pizza']
]) {
  add(
    'pastel-' + slug,
    'Pastel de ' + name,
    1000,
    'pastel',
    'pastel-salgado',
    'Pastel simples de ' + name.toLowerCase() + '.'
  );
}
add(
  'pastel-simples-catupiry',
  'Pastel Simples com Catupiry',
  1200,
  'pastel',
  'pastel-salgado',
  'Pastel simples com Catupiry. Recheio base a combinar com a pastelaria.'
);
add(
  'pastel-misto-dois-recheios',
  'Pastel Misto com 2 Recheios',
  1200,
  'pastel',
  'pastel-salgado',
  'Pastel misto com dois recheios. Recheios a combinar com a pastelaria.'
);
add(
  'pastel-sonho-de-valsa',
  'Pastel Sonho de Valsa',
  1000,
  'pastel',
  'pastel-doce',
  'Pastel doce de Sonho de Valsa.'
);
add(
  'pastel-ouro-branco',
  'Pastel Ouro Branco',
  1000,
  'pastel',
  'pastel-doce',
  'Pastel doce de Ouro Branco.'
);
add(
  'pastel-banana',
  'Pastel de Banana',
  1000,
  'pastel',
  'pastel-doce',
  'Banana\nCanela\nLeite condensado'
);
for (const [slug, name] of [
  ['coxinha-frango', 'Coxinha de Frango'],
  ['risoles', 'Risoles'],
  ['enrolado-presunto-queijo', 'Enrolado de Presunto e Queijo'],
  ['empanado-ovo-carne', 'Empanado de Ovo com Carne Moída']
]) {
  add(slug, name, 700, 'salgado', 'salgado-frito', name + '.');
}
for (const [slug, name] of [
  ['calabresa', 'Calabresa'],
  ['carne', 'Carne'],
  ['frango', 'Frango'],
  ['palmito', 'Palmito']
]) {
  add(
    'pastel-pizza-' + slug,
    'Pastel de Pizza ' + name,
    1200,
    'pastel',
    'pastel-especial',
    'Pastel de pizza com ' + name.toLowerCase() + '.'
  );
}
add(
  'pastel-da-casa',
  'Pastel da Casa',
  1300,
  'pastel',
  'pastel-especial',
  'Frango\nBacon\nCheddar'
);
add(
  'pastel-especial',
  'Pastel Especial',
  1700,
  'pastel',
  'pastel-especial',
  'Carne\nQueijo\nFrango\nPalmito\nCatupiry'
);
add(
  'pastel-hamburguer',
  'Pastel Hambúrguer',
  1300,
  'pastel',
  'pastel-especial',
  'Hambúrguer\nQueijo\nTomate\nCatupiry'
);
add('agua', 'Água', 300, 'bebida', 'agua', 'Água sem gás.');
add('agua-com-gas', 'Água com Gás', 300, 'bebida', 'agua', 'Água com gás.');
add(
  'cerveja-lata',
  'Cerveja Lata',
  600,
  'bebida',
  'cerveja',
  'Cerveja em lata. Marca e volume não especificados no cardápio.'
);
add(
  'guarana-antarctica-1l',
  'Guaraná Antarctica 1L',
  700,
  'bebida',
  'refrigerante',
  'Refrigerante Guaraná Antarctica — 1 litro.'
);
const flavors = [
  ['coca-cola', 'Coca-Cola'],
  ['fanta-laranja', 'Fanta Laranja'],
  ['fanta-uva', 'Fanta Uva'],
  ['guarana-antarctica', 'Guaraná Antarctica'],
  ['sprite', 'Sprite']
];
for (const [size, label, price, allowed] of [
  ['200ml', '200ml', 350, flavors],
  ['600ml', '600ml', 800, flavors.slice(0, 3)],
  ['2l', '2L', 1400, flavors],
  ['lata', 'Lata', 600, flavors]
]) {
  for (const [slug, name] of allowed) {
    const id = size === 'lata' && slug === 'fanta-laranja' ? 'fanta-laranja' : slug + '-' + size;
    add(
      id,
      name + ' ' + label + (size === '200ml' ? ' (Caçulinha)' : ''),
      price,
      'bebida',
      'refrigerante',
      name + ' — ' + label + '.'
    );
  }
}
for (const [slug, name, price] of [
  ['copo', 'Copo', 700],
  ['jarra-500ml', 'Jarra 500ml', 900],
  ['jarra-1l', 'Jarra 1L', 1500]
]) {
  add(
    'suco-natural-' + slug,
    'Suco Natural — ' + name,
    price,
    'bebida',
    'suco-natural',
    'Suco natural — ' + name + '. Sabor a combinar com a pastelaria.'
  );
}
const featured = {
  pastel: ['pastel-carne', 'pastel-queijo', 'pastel-frango', 'pastel-calabresa', 'pastel-pizza'],
  bebida: [
    'coca-cola-lata',
    'fanta-laranja',
    'guarana-antarctica-lata',
    'agua',
    'suco-natural-copo'
  ]
};
module.exports = { products, featured };
