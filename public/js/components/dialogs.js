// Abertura e fechamento das janelas de confirmação.

(() => {
  for (const action of [
    {
      dialog: 'deleteProductConfirm',
      selector: '[data-delete-product]',
      name: 'deleteProduct',
      description: 'deleteProductDescription',
      confirm: 'confirmDeleteProduct',
      text: (name) => `Excluir "${name}" do catálogo? Os pedidos anteriores serão preservados.`
    },
    {
      dialog: 'restoreProductConfirm',
      selector: '[data-restore-product]',
      name: 'restoreProduct',
      description: 'restoreProductDescription',
      confirm: 'confirmRestoreProduct',
      text: (name) =>
        `Restaurar "${name}"? O produto voltará à lista de registrados como Inativo e poderá ser ativado depois.`
    }
  ]) {
    const dialog = document.getElementById(action.dialog);
    if (!dialog) continue;
    let pendingForm = null;
    let confirmedForm = null;
    for (const form of document.querySelectorAll(action.selector))
      form.addEventListener('submit', (event) => {
        if (confirmedForm === form) {
          confirmedForm = null;
          return;
        }
        event.preventDefault();
        pendingForm = form;
        document.getElementById(action.description).textContent = action.text(
          form.dataset[action.name]
        );
        dialog.showModal();
      });
    document.getElementById(action.confirm).addEventListener('click', () => {
      if (!pendingForm) return;
      const form = pendingForm;
      confirmedForm = form;
      pendingForm = null;
      dialog.close();
      form.requestSubmit();
    });
    dialog.addEventListener('close', () => {
      pendingForm = null;
    });
  }

  for (const dialog of document.querySelectorAll('dialog')) {
    for (const close of dialog.querySelectorAll('[data-dialog-close]'))
      close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom)
      )
        dialog.close();
    });
  }

  if (window.visualViewport) {
    const updateDialogViewport = () => {
      const viewport = window.visualViewport;
      document.documentElement.style.setProperty(
        '--dialog-viewport-height',
        viewport.height + 'px'
      );
      document.documentElement.style.setProperty(
        '--dialog-viewport-center',
        viewport.offsetTop + viewport.height / 2 + 'px'
      );
      const dialog = document.querySelector('dialog[open]');
      if (
        dialog?.contains(document.activeElement) &&
        document.activeElement.matches('input,select,textarea')
      ) {
        document.activeElement.scrollIntoView({ block: 'nearest' });
      }
    };
    window.visualViewport.addEventListener('resize', updateDialogViewport);
    window.visualViewport.addEventListener('scroll', updateDialogViewport);
    updateDialogViewport();
  }
})();
