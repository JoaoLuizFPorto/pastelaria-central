const errors = {
  409: {
    title: 'Pedido atualizado',
    description:
      'Este pedido foi alterado por outro administrador. Atualize a página e confira o status antes de continuar.'
  },
  400: {
    title: 'Solicitação inválida',
    description:
      'Não foi possível processar os dados enviados. Confira as informações e tente novamente.'
  },
  401: { title: 'Login necessário', description: 'Entre na sua conta para acessar esta página.' },
  403: {
    title: 'Acesso negado',
    description: 'Sua conta não tem permissão para acessar esta página.'
  },
  404: {
    title: 'Página não encontrada',
    description: 'A página ou o produto que você procura não existe ou não está disponível.'
  },
  413: {
    title: 'Dados muito grandes',
    description:
      'Os dados enviados excedem o limite permitido. Reduza o conteúdo e tente novamente.'
  },
  429: {
    title: 'Muitas tentativas',
    description: 'Aguarde alguns minutos antes de tentar novamente.'
  },
  500: {
    title: 'Erro no servidor',
    description: 'Não foi possível carregar esta página. Tente novamente mais tarde.'
  },
  503: {
    title: 'Serviço indisponível',
    description:
      'Esta funcionalidade está temporariamente indisponível. Tente novamente mais tarde.'
  }
};
function errorPages(req, res, next) {
  res.renderError = (code, description) => {
    const status = errors[code] ? code : 500;
    const error = { code: status, ...errors[status], ...(description ? { description } : {}) };
    res.status(status);
    if (req.path.startsWith('/api/')) return res.json({ error });
    return res.render(
      'pages/error',
      { headPartial: 'head/error', error },
      (renderFailure, html) => {
        if (renderFailure)
          return res.type('text').send(`${error.code} — ${error.title}\n${error.description}`);
        res.send(html);
      }
    );
  };
  next();
}
module.exports = { errorPages };
