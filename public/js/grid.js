document.addEventListener('DOMContentLoaded', function() {

  const grid = GridStack.init({
    column: 8,
    minRow: 6,
    maxRow: 6,
    cellHeight: 'auto', // Auto-calculate to match column width for square cells
    acceptWidgets: true,
    removable: false,
    float: true,
    disableOneColumnMode: true,
    margin: 10,
    resizable: {
      handles: 'e, se, s, sw, w'
    }
  });

  // Debounce function to avoid too many API calls
  let saveTimeout;
  function debounce(func, delay) {
    return function() {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(func, delay);
    };
  }

  // Save widgets to database
  async function saveWidgets(items) {
    try {
      const widgets = items.map(item => ({
        _id: item.el.getAttribute('data-widget-id'),
        type: item.el.getAttribute('data-widget-type') || 'text',
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h
      }));

      const response = await fetch('/api/widgets/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ widgets })
      });

      if (!response.ok) {
        throw new Error('Failed to save widgets');
      }

      console.log('Widgets saved successfully');
    } catch (err) {
      console.error('Error saving widgets:', err);
    }
  }

  async function deleteWidget(widgetId, element) {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method:"DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Unable to delete widget");
      }
      
      grid.removeWidget(element);
      console.log("Widget deleted successfully")
    } catch (err) {
      console.error("Error:", err);
    }
  }

  // Handle add widget form submission
  const addWidgetForm = document.getElementById('add-widget-form');
  if (addWidgetForm) {
    addWidgetForm.addEventListener('submit', async (evt) => {
      evt.preventDefault();

      const widgetType = document.getElementById('widget-type').value;
      if (!widgetType) return;

      try {
        const response = await fetch('/api/widgets/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: widgetType })
        });

        if (!response.ok) {
          throw new Error('Failed to add widget');
        }

        const newWidget = await response.json();

        // Create the widget element structure
        const widgetEl = document.createElement('div');
        widgetEl.className = 'grid-stack-item';
        widgetEl.setAttribute('data-widget-id', newWidget._id);
        widgetEl.setAttribute('data-widget-type', newWidget.type);
        widgetEl.setAttribute('gs-x', newWidget.x);
        widgetEl.setAttribute('gs-y', newWidget.y);
        widgetEl.setAttribute('gs-w', newWidget.w);
        widgetEl.setAttribute('gs-h', newWidget.h);

        const contentEl = document.createElement('div');
        contentEl.className = `grid-stack-item-content widget-${newWidget.type}`;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.setAttribute('data-id', newWidget._id);
        deleteBtn.textContent = '×';

        const title = document.createElement('h3');
        title.textContent = newWidget.title;

        const description = document.createElement('p');
        description.textContent = newWidget.description;

        contentEl.appendChild(deleteBtn);
        contentEl.appendChild(title);
        contentEl.appendChild(description);
        widgetEl.appendChild(contentEl);

        // Add to GridStack
        grid.makeWidget(widgetEl);

        // Reset form
        addWidgetForm.reset();
        console.log('Widget added successfully');

      } catch (err) {
        console.error('Error adding widget:', err);
        alert('Failed to add widget. Please try again.');
      }
    });
  }

  document.addEventListener("click", (evt) => {
    if (evt.target.classList.contains("delete-btn")) {
      evt.stopPropagation();
      evt.preventDefault();
      const widgetId = evt.target.getAttribute('data-id');
      const gridItem = evt.target.closest('.grid-stack-item');

      if (gridItem && !gridItem.classList.contains('ui-draggable-dragging')) {
        deleteWidget(widgetId, gridItem);
      }
    }
  })

  document.addEventListener("click", async (evt) => {
    if (evt.target.closest('.widget-text') && !evt.target.classList.contains('delete-btn')) {
      const widgetContent = evt.target.closest('.grid-stack-item-content');
      const widgetId = evt.target.closest('.grid-stack-item').getAttribute('data-widget-id');

      if (widgetContent.querySelector('textarea')) return;

      const currentText = widgetContent.querySelector('p')?.textContent || 'Edit Text';

      const textarea = document.createElement('textarea');
      textarea.className = 'widget-text-editor';
      textarea.value = currentText === 'Edit Text' ? '' : currentText;
      textarea.maxLength = 500;
      textarea.placeholder = 'Enter text (max 500 characters)...';

      const charCounter = document.createElement('div');
      charCounter.className = 'char-counter';
      charCounter.textContent = `${textarea.value.length}/500`;

      textarea.addEventListener('input', () => {
        charCounter.textContent = `${textarea.value.length}/500`;
      });

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'btn btn-sm save-text-btn';
      saveBtn.type = 'button';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'btn btn-sm cancel-text-btn';
      cancelBtn.type = 'button';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'text-widget-buttons';
      buttonContainer.appendChild(saveBtn);
      buttonContainer.appendChild(cancelBtn);

      const originalContent = widgetContent.innerHTML;
      widgetContent.innerHTML = '';
      widgetContent.appendChild(textarea);
      widgetContent.appendChild(charCounter);
      widgetContent.appendChild(buttonContainer);

      textarea.focus();
      textarea.select();

      cancelBtn.addEventListener('click', () => {
        widgetContent.innerHTML = originalContent;
      });

      saveBtn.addEventListener('click', async () => {
        try {
          const response = await fetch(`/api/widgets/${widgetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: { content: textarea.value }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save text');
          }

          const deleteBtn = widgetContent.querySelector('.delete-btn') ||
                           document.createElement('button');
          if (!deleteBtn.classList.contains('delete-btn')) {
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('data-id', widgetId);
            deleteBtn.textContent = '×';
          }

          const newContent = document.createElement('p');
          newContent.textContent = textarea.value || 'Edit Text';

          widgetContent.innerHTML = '';
          widgetContent.appendChild(deleteBtn);
          widgetContent.appendChild(newContent);

          console.log('Text saved successfully');
        } catch (err) {
          console.error('Error saving text:', err);
          alert('Failed to save text. Please try again.');
        }
      });

      textarea.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          saveBtn.click();
        }
        if (e.key === 'Escape') {
          cancelBtn.click();
        }
      });
    }

    if (evt.target.closest('.widget-video') && !evt.target.classList.contains('delete-btn')) {
      const widgetContent = evt.target.closest('.grid-stack-item-content');
      const widgetId = evt.target.closest('.grid-stack-item').getAttribute('data-widget-id');

      if (widgetContent.querySelector('input')) return;

      function extractYouTubeId(url) {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
        return null;
      }

      const currentIframe = widgetContent.querySelector('iframe');
      let currentUrl = '';
      if (currentIframe) {
        const src = currentIframe.src;
        const videoId = extractYouTubeId(src);
        if (videoId) {
          currentUrl = `https://www.youtube.com/watch?v=${videoId}`;
        }
      }

      const input = document.createElement('input');
      input.type = 'url';
      input.className = 'widget-video-input';
      input.value = currentUrl;
      input.placeholder = 'Paste YouTube URL here...';

      const helperText = document.createElement('div');
      helperText.className = 'video-helper-text';
      helperText.textContent = 'Supported: youtube.com/watch?v=... or youtu.be/...';

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.className = 'btn btn-sm save-video-btn';
      saveBtn.type = 'button';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'btn btn-sm cancel-video-btn';
      cancelBtn.type = 'button';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'video-widget-buttons';
      buttonContainer.appendChild(saveBtn);
      buttonContainer.appendChild(cancelBtn);

      const originalContent = widgetContent.innerHTML;

      widgetContent.innerHTML = '';
      widgetContent.appendChild(input);
      widgetContent.appendChild(helperText);
      widgetContent.appendChild(buttonContainer);

      input.focus();
      input.select();

      cancelBtn.addEventListener('click', () => {
        widgetContent.innerHTML = originalContent;
      });

      saveBtn.addEventListener('click', async () => {
        const url = input.value.trim();

        if (!url) {
          alert('Please enter a YouTube URL');
          return;
        }

        const videoId = extractYouTubeId(url);

        if (!videoId) {
          alert('Invalid YouTube URL. Please use a valid YouTube link.');
          return;
        }

        try {
          const response = await fetch(`/api/widgets/${widgetId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: { videoId: videoId }
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save video');
          }

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.setAttribute('data-id', widgetId);
          deleteBtn.textContent = '×';

          const iframeContainer = document.createElement('div');
          iframeContainer.className = 'video-container';

          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
          iframe.allowFullscreen = true;

          iframeContainer.appendChild(iframe);

          widgetContent.innerHTML = '';
          widgetContent.appendChild(deleteBtn);
          widgetContent.appendChild(iframeContainer);

          console.log('Video saved successfully');
        } catch (err) {
          console.error('Error saving video:', err);
          alert('Failed to save video. Please try again.');
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveBtn.click();
        }
        if (e.key === 'Escape') {
          cancelBtn.click();
        }
      });
    }

    if (evt.target.closest('.widget-image') && !evt.target.classList.contains('delete-btn')) {
      const widgetContent = evt.target.closest('.grid-stack-item-content');
      const widgetId = evt.target.closest('.grid-stack-item').getAttribute('data-widget-id');

      if (widgetContent.querySelector('input[type="file"]')) return;

      const currentImage = widgetContent.querySelector('img');
      const currentUrl = currentImage ? currentImage.src : '';

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.className = 'widget-image-input';

      const helperText = document.createElement('div');
      helperText.className = 'image-helper-text';
      helperText.textContent = 'Choose an image (max 5MB)';

      const uploadBtn = document.createElement('button');
      uploadBtn.textContent = 'Upload';
      uploadBtn.className = 'btn btn-sm upload-image-btn';
      uploadBtn.type = 'button';
      uploadBtn.disabled = true;

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'btn btn-sm cancel-image-btn';
      cancelBtn.type = 'button';

      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'image-widget-buttons';
      buttonContainer.appendChild(uploadBtn);
      buttonContainer.appendChild(cancelBtn);

      const originalContent = widgetContent.innerHTML;

      widgetContent.innerHTML = '';
      widgetContent.appendChild(fileInput);
      widgetContent.appendChild(helperText);
      widgetContent.appendChild(buttonContainer);

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          uploadBtn.disabled = false;
          helperText.textContent = `Selected: ${e.target.files[0].name}`;
        }
      });

      cancelBtn.addEventListener('click', () => {
        widgetContent.innerHTML = originalContent;
      });

      uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
          alert('Please select an image');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert('Image must be less than 5MB');
          return;
        }

        try {
          uploadBtn.disabled = true;
          helperText.textContent = 'Uploading...';

          const formData = new FormData();
          formData.append('image', file);

          const response = await fetch(`/api/widgets/${widgetId}/upload`, {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Failed to upload image');
          }

          const data = await response.json();

          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.setAttribute('data-id', widgetId);
          deleteBtn.textContent = '×';

          const img = document.createElement('img');
          img.src = data.imageUrl;
          img.alt = 'Uploaded image';

          widgetContent.innerHTML = '';
          widgetContent.appendChild(deleteBtn);
          widgetContent.appendChild(img);

          console.log('Image uploaded successfully');
        } catch (err) {
          console.error('Error uploading image:', err);
          alert('Failed to upload image. Please try again.');
          uploadBtn.disabled = false;
          helperText.textContent = 'Upload failed. Try again.';
        }
      });
    }
  })

  grid.on('change', debounce(function(_event, items) {
    if (!items) {
      items = grid.getGridItems().map(el => {
        const node = el.gridstackNode;
        return {
          el: el,
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h
        };
      });
      console.log('Manually retrieved items:', items);
    }

    if (items && items.length > 0) {
      console.log("Saving widgets after change")
      saveWidgets(items);
    }
  }, 500)); // Wait 500ms after last change before saving

  function updateGridState() {
    const serializedData = grid.save();
    console.log('Current grid state:', serializedData);
    return serializedData;
  }

  window.mosaicGrid = grid;
  window.getGridState = updateGridState;
});
