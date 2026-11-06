// Janelas de atualização de status e histórico dos pedidos.

(() => {
  for (const button of document.querySelectorAll('[data-open-status]')) {
    const dialog = document.getElementById(button.dataset.openStatus);
    const form = dialog.querySelector('form');
    const message = dialog.querySelector('[data-status-message]');
    const updateMessage = () => {
      const allowed = ['Entregue', 'Cancelado'].includes(form.elements.status.value);
      message.hidden = !allowed;
      form.elements.note.disabled = !allowed;
      if (!allowed) form.elements.note.value = '';
    };
    button.addEventListener('click', () => {
      form.reset();
      updateMessage();
      dialog.showModal();
    });
    form.elements.status.addEventListener('change', updateMessage);
    dialog.addEventListener('close', () => {
      form.reset();
      updateMessage();
    });
    updateMessage();
  }
  for (const button of document.querySelectorAll('[data-open-history]')) {
    const dialog = document.getElementById(button.dataset.openHistory);
    button.addEventListener('click', () => dialog.showModal());
  }

  const statusSaved = document.querySelector('[data-status-saved]');
  if (statusSaved) {

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('atualizado');
    window.history.replaceState(
      window.history.state,
      '',
      currentUrl.pathname + currentUrl.search + currentUrl.hash
    );
  }
})();
