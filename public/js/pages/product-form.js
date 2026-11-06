// Escolha da imagem e das categorias no cadastro de produtos.

(() => {
  const imagePicker = document.getElementById('imagePicker');
  if (imagePicker) {
    const form = imagePicker.closest('form');
    const filePanel = document.getElementById('imageFilePanel');
    const linkPanel = document.getElementById('imageLinkPanel');
    const link = document.getElementById('imageUrl');
    const selectedLink = document.getElementById('selectedImageUrl');
    const uploaded = document.getElementById('uploadedImage');
    const message = document.getElementById('imagePickerMessage');
    const status = document.getElementById('selectedImageStatus');
    const fileMode = document.getElementById('chooseImageFile');
    const linkMode = document.getElementById('chooseImageLink');
    let uploadController = null;
    const selectImageMode = (mode) => {
      uploadController?.abort();
      const useFile = mode === 'file';
      link.disabled = useFile;
      filePanel.hidden = !useFile;
      linkPanel.hidden = useFile;
      document.getElementById('uploadProductImage').hidden = !useFile;
      document.getElementById('useImageLink').hidden = useFile;
      for (const [button, selected] of [
        [fileMode, useFile],
        [linkMode, !useFile]
      ]) {
        button.classList.toggle('shopButton', selected);
        button.classList.toggle('favoriteButton', !selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      message.textContent = '';
    };
    let savedLink = link.value;
    selectImageMode(savedLink ? 'link' : 'file');
    link.disabled = true;
    document.getElementById('openImagePicker').addEventListener('click', () => {
      message.textContent = '';
      link.disabled = linkPanel.hidden;
      imagePicker.showModal();
    });
    imagePicker.addEventListener('close', () => {
      uploadController?.abort();
      link.value = savedLink;
      link.disabled = true;
    });
    fileMode.addEventListener('click', () => selectImageMode('file'));
    linkMode.addEventListener('click', () => {
      selectImageMode('link');
      link.focus();
    });
    document.getElementById('useImageLink').addEventListener('click', () => {
      try {
        if (new URL(link.value.trim()).protocol !== 'https:') throw new Error();
      } catch {
        message.textContent = 'Informe um endereço HTTPS válido.';
        return;
      }
      savedLink = link.value.trim();
      selectedLink.value = savedLink;
      uploaded.value = '';
      status.textContent = 'Imagem selecionada por link HTTPS.';
      imagePicker.close();
    });
    document.getElementById('uploadProductImage').addEventListener('click', async (event) => {
      const file = document.getElementById('imageFile').files[0];
      if (!file) {
        message.textContent = 'Selecione um arquivo.';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        message.textContent = 'O limite é de 5 MB.';
        return;
      }
      const button = event.currentTarget;
      const controller = new AbortController();
      uploadController = controller;
      button.disabled = true;
      message.textContent = 'Enviando imagem…';
      try {
        const data = new FormData();
        data.append('image', file);
        const response = await fetch('/admin/imagens', {
          method: 'POST',
          headers: { 'x-csrf-token': form.elements._csrf.value },
          body: data,
          signal: controller.signal
        });
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new Error('Não foi possível enviar a imagem. Atualize a página e tente novamente.');
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Não foi possível enviar a imagem.');
        if (controller.signal.aborted || !imagePicker.open) return;
        uploaded.value = result.image;
        savedLink = '';
        selectedLink.value = '';
        link.value = '';
        status.textContent = 'Arquivo selecionado: ' + file.name;
        imagePicker.close();
      } catch (error) {
        if (error.name !== 'AbortError')
          message.textContent = error.message || 'Não foi possível enviar a imagem.';
      } finally {
        button.disabled = false;
      }
    });
    imagePicker.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target === link) {
        event.preventDefault();
        document.getElementById('useImageLink').click();
      }
    });
  }

  const categorySelect = document.getElementById('category');
  const subcategorySelect = document.getElementById('subcategory');
  if (categorySelect && subcategorySelect) {
    const updateSubcategories = () => {
      for (const option of subcategorySelect.options)
        if (option.value) {
          option.hidden = option.dataset.category !== categorySelect.value;
          option.disabled = option.hidden;
        }
      if (subcategorySelect.selectedOptions[0]?.disabled) subcategorySelect.value = '';
    };
    categorySelect.addEventListener('change', updateSubcategories);
    updateSubcategories();
  }
})();
