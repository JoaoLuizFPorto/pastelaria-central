// Controle de quantidade e confirmação do endereço na compra.

(() => {
  function updateQuantityButtons(input) {
    for (const button of input.closest('.quantityStepper').querySelectorAll('button')) {
      const delta = Number(button.dataset.quantityChange ?? button.dataset.productQuantityChange);
      button.disabled = delta < 0 ? Number(input.value) <= 1 : Number(input.value) >= 99;
    }
  }
  function changeQuantity(input, delta) {
    const current = Number(input.value);
    input.value = Math.min(
      99,
      Math.max(1, (Number.isFinite(current) ? Math.trunc(current) : 1) + delta)
    );
    updateQuantityButtons(input);
  }
  for (const input of document.querySelectorAll('.quantityStepper input')) {
    updateQuantityButtons(input);
    input.addEventListener('input', () => updateQuantityButtons(input));
    window.addEventListener('pageshow', () => updateQuantityButtons(input));
  }
  for (const form of document.querySelectorAll('form.quantityForm')) {
    const input = form.elements.quantity;
    let timer;
    let submitting = false;
    window.addEventListener('pageshow', () => {
      submitting = false;
    });
    form.addEventListener('submit', (event) => {
      clearTimeout(timer);
      if (submitting) event.preventDefault();
      else submitting = true;
    });
    input.addEventListener('change', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!submitting) form.requestSubmit();
      }, 250);
    });
    for (const button of form.querySelectorAll('[data-quantity-change]')) {
      button.addEventListener('click', () => {
        clearTimeout(timer);
        if (submitting) return;
        const previous = input.value;
        changeQuantity(input, Number(button.dataset.quantityChange));
        if (input.value !== previous) form.requestSubmit();
      });
    }
  }

  for (const button of document.querySelectorAll('[data-product-quantity-change]')) {
    button.addEventListener('click', () => {
      const input = button.closest('form').elements.quantity;
      changeQuantity(input, Number(button.dataset.productQuantityChange));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  const checkoutAddressDialog = document.getElementById('checkoutAddressDialog');
  if (checkoutAddressDialog) {
    for (const form of document.querySelectorAll('[data-checkout-address-required]')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        checkoutAddressDialog.showModal();
      });
    }
    if (checkoutAddressDialog.hasAttribute('data-open-on-load')) checkoutAddressDialog.showModal();
  }
})();
