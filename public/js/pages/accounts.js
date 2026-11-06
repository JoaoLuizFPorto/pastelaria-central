// Validação dos formulários de conta e exibição das senhas.

(() => {
  const profileForm = document.getElementById('profileForm');
  const profileDialog = document.getElementById('profileConfirm');
  if (profileForm && profileDialog) {
    const password = document.getElementById('currentPassword');
    const notice = document.getElementById('profileNotice');
    let confirmed = false;
    profileForm.addEventListener('submit', (event) => {
      if (confirmed) return;
      event.preventDefault();
      const newPassword = profileForm.elements.newPassword;
      const confirmation = profileForm.elements.confirmPassword;
      confirmation.setCustomValidity(
        newPassword.value === confirmation.value ? '' : 'As novas senhas não coincidem.'
      );
      if (!profileForm.reportValidity()) return;
      const changed =
        [...profileForm.querySelectorAll('[data-original]')].some((input) => {
          const normalize = (value) =>
            ['phone', 'address_postal_code'].includes(input.name)
              ? value.replace(/\D/g, '')
              : input.name === 'email'
                ? value.trim().toLowerCase()
                : input.name === 'address_state'
                  ? value.trim().toUpperCase()
                  : value.trim();
          return normalize(input.value) !== normalize(input.dataset.original);
        }) || Boolean(newPassword.value);
      notice.hidden = changed;
      if (!changed) return;
      password.disabled = false;
      profileDialog.showModal();
      password.focus();
    });
    profileForm.elements.confirmPassword.addEventListener('input', () =>
      profileForm.elements.confirmPassword.setCustomValidity('')
    );
    profileForm.elements.newPassword.addEventListener('input', () =>
      profileForm.elements.confirmPassword.setCustomValidity('')
    );
    document.getElementById('confirmProfile').addEventListener('click', () => {
      if (!password.reportValidity()) return;
      confirmed = true;
      profileForm.requestSubmit();
      confirmed = false;
    });
    password.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('confirmProfile').click();
      }
    });
    const resetConfirmation = () => {
      password.value = '';
      password.disabled = true;
      password.type = 'password';
      const toggle = profileDialog.querySelector('[data-toggle-password]');
      toggle.setAttribute('aria-label', 'Mostrar senha');
      toggle.setAttribute('aria-pressed', 'false');
    };
    profileDialog.addEventListener('close', resetConfirmation);
    window.addEventListener('pageshow', () => {
      if (profileDialog.open) profileDialog.close();
      resetConfirmation();
    });
  }

  for (const button of document.querySelectorAll('[data-toggle-password]')) {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
      button.setAttribute('aria-pressed', String(show));
    });
  }
  for (const form of document.querySelectorAll('[data-confirm-password]')) {
    const validate = () =>
      form.elements.confirmPassword.setCustomValidity(
        form.elements.password.value === form.elements.confirmPassword.value
          ? ''
          : 'As senhas não coincidem.'
      );
    form.elements.password.addEventListener('input', validate);
    form.elements.confirmPassword.addEventListener('input', validate);
  }

  const skipAddressButton = document.getElementById('skipAddress');
  const skipAddressDialog = document.getElementById('skipAddressDialog');
  if (skipAddressButton && skipAddressDialog) {
    skipAddressButton.addEventListener('click', () => skipAddressDialog.showModal());
  }
})();
