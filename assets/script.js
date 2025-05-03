document.addEventListener('DOMContentLoaded', () => {
    const tagList = document.getElementById('tag-list');
    const previewFrame = document.getElementById('preview-frame');
    const previewDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
    const settingsPanel = document.getElementById('settings-panel');
    const codeOutput = document.getElementById('code-output');
    const copyCodeButton = document.getElementById('copy-code');
    const downloadCodeButton = document.getElementById('download-code');
    const domTreeContainer = document.getElementById('dom-tree'); // Novo: Container da árvore DOM
    const tabButtons = document.querySelectorAll('.tab-button'); // Novo: Botões das abas
    const tabPanes = document.querySelectorAll('.tab-pane'); // Novo: Painéis das abas
    const openExternalPreviewButton = document.getElementById('open-external-preview'); // Novo: Botão preview externo

    let selectedElement = null;
    let elementCounter = {}; // Para gerar IDs únicos
    let dragTargetElement = null; // Novo: Para saber onde soltar
    
    // Define a function to deselect the currently selected element
    function deselectElement() {
        // Remove selection styling if there is a selected element
        if (selectedElement) {
            selectedElement.classList.remove('selected-element');
            const oldTreeItem = domTreeContainer.querySelector(`[data-element-id="${selectedElement.id}"]`);
            if (oldTreeItem) oldTreeItem.classList.remove('selected-tree-item');
        }
        
        selectedElement = null; // Clear the selected element reference
        updateSettingsPanel(); // Update the settings panel with default message
    }
    
    // Inicializa o corpo do iframe
    previewDocument.open();
    previewDocument.write('<!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>Preview</title><style>body { margin: 0; padding: 10px; min-height: 100vh; box-sizing: border-box; } .selected-element { outline: 2px dashed blue !important; } .drag-over-element { outline: 2px dashed green; } /* Novo: Feedback visual para drop */ </style></head><body></body></html>');
    previewDocument.close();

    const previewBody = previewDocument.body;

    // --- Lógica das Abas --- //
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' de todos os botões e painéis
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Adiciona 'active' ao botão clicado e ao painel correspondente
            button.classList.add('active');
            const targetTabId = button.getAttribute('data-tab');
            const targetPane = document.getElementById(targetTabId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // --- Botão Preview Externo --- //
    openExternalPreviewButton.addEventListener('click', () => {
        // Atualiza o localStorage antes de abrir, garantindo que está com a última versão
        updateExternalPreviewStorage(); 
        // Abre preview.php em uma nova aba
        window.open('preview.php', '_blank');
    });

    // --- Funcionalidade de Arrastar e Soltar --- //

    tagList.addEventListener('dragstart', (event) => {
        if (event.target.tagName === 'LI') {
            event.dataTransfer.setData('text/plain', `new:${event.target.dataset.tag}`); // Prefixo para indicar novo elemento
            // Gera um ID temporário para o LI se não tiver, para buscar os data-* no drop
            if (!event.target.id) {
                event.target.id = `dragged-${Date.now()}`;
            }
            event.dataTransfer.setData('application/dragged-element-id', event.target.id);
            event.dataTransfer.effectAllowed = 'copy';
            event.target.classList.add('dragging'); // Adiciona classe ao iniciar arraste
        }
    });

    // Removido o if redundante que estava fora do event listener

    tagList.addEventListener('dragend', (event) => {
        if (event.target.tagName === 'LI') {
            event.target.classList.remove('dragging');
        }
    });

    // Event listener no documento do iframe para capturar dragover em todos os elementos
    previewDocument.addEventListener('dragover', (event) => {
        event.preventDefault(); // Necessário para permitir o drop
        const target = event.target;

        // Remove o highlight anterior
        if (dragTargetElement && dragTargetElement !== target) {
            dragTargetElement.classList.remove('drag-over-element');
        }

        // Adiciona highlight no elemento alvo (se for um container válido ou o body)
        // Permite soltar em qualquer elemento ou no body
        if (target !== dragTargetElement) {
            target.classList.add('drag-over-element');
            dragTargetElement = target;
        }
    });

    // Limpa o highlight quando o arraste sai da área do preview
    previewDocument.addEventListener('dragleave', (event) => {
        // Verifica se o mouse está realmente saindo do iframe
        if (event.relatedTarget === null || event.relatedTarget.ownerDocument !== previewDocument) {
            if (dragTargetElement) {
                dragTargetElement.classList.remove('drag-over-element');
                dragTargetElement = null;
            }
        }
    });

    // Event listener no documento do iframe para capturar drop
    previewDocument.addEventListener('drop', (event) => {
        event.preventDefault();
        if (dragTargetElement) {
            dragTargetElement.classList.remove('drag-over-element');
        }

        const dataTransferText = event.dataTransfer.getData('text/plain');
        const draggedElementId = event.dataTransfer.getData('application/dragged-element-id');

        let dropTarget = event.target;

        // Se soltar em um elemento que não pode conter outros (ex: input, button), mirar no pai
        if (dropTarget && !['DIV', 'FORM', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'BODY'].includes(dropTarget.tagName)) {
            dropTarget = dropTarget.parentElement;
        }
        // Se ainda assim for inválido ou nulo, usar o body
        if (!dropTarget || !['DIV', 'FORM', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'BODY'].includes(dropTarget.tagName)) {
            dropTarget = previewBody;
        }

        if (dataTransferText.startsWith('new:')) {
            // Criar novo elemento (arrastado da lista)
            const tagType = dataTransferText.substring(4);
            const originalLiElement = document.getElementById(draggedElementId);
            const draggedElementData = originalLiElement ? { ...originalLiElement.dataset } : null;
            createElementInPreview(tagType, dropTarget, draggedElementData);
        } else if (dataTransferText.startsWith('move:')) {
            // Mover elemento existente dentro do preview
            const elementToMoveId = dataTransferText.substring(5);
            const elementToMove = previewDocument.getElementById(elementToMoveId);
            if (elementToMove && dropTarget) {
                // Evitar soltar um elemento dentro dele mesmo
                if (!elementToMove.contains(dropTarget)) {
                    dropTarget.appendChild(elementToMove);
                    selectElement(elementToMove); // Seleciona o elemento movido
                    updateCodeOutput();
                    updateDomTree();
                }
            }
        }

        dragTargetElement = null; // Reseta o alvo
    });

    // Modificado: Aceita o elemento pai como argumento
    function createElementInPreview(tagType, parentElement, draggedElementData) {
        const newElement = previewDocument.createElement(tagType);

        // Aplica atributos data-* extras do elemento arrastado
        if (draggedElementData) {
            for (const key in draggedElementData) {
                // Ignora atributos internos e 'tag'
                if (!['tag', 'editableText'].includes(key)) {
                    const attributeName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    newElement.setAttribute(attributeName, draggedElementData[key]);
                }
            }
        }

        // Gera um ID único para o elemento
        if (!elementCounter[tagType]) {
            elementCounter[tagType] = 0;
        }
        elementCounter[tagType]++;
        const elementId = `${tagType}-${elementCounter[tagType]}`;
        newElement.id = elementId;

        // Define conteúdo inicial ou placeholders
        switch (tagType) {
            case 'h1':
            case 'p':
                newElement.textContent = `Elemento ${tagType.toUpperCase()}`;
                break;
            case 'div':
                newElement.textContent = `Div ${elementCounter[tagType]}`;
                newElement.style.border = '1px solid #ccc';
                newElement.style.padding = '10px';
                newElement.style.minHeight = '50px'; // Altura mínima para facilitar drop
                break;
            case 'form':
                newElement.textContent = `Form ${elementCounter[tagType]}`;
                newElement.style.border = '1px dashed #aaa';
                newElement.style.padding = '15px';
                newElement.style.minHeight = '70px';
                break;
            case 'input':
                // Tipo definido pelo data-type, se existir
                newElement.type = draggedElementData?.type || 'text';
                if (newElement.type === 'text') {
                    newElement.placeholder = 'Campo de texto';
                }
                // Nome para radio buttons
                if (draggedElementData?.name) {
                    newElement.name = draggedElementData.name;
                }
                break;
            case 'button':
                newElement.textContent = 'Botão';
                break;
            case 'img':
                newElement.src = draggedElementData?.src || 'https://via.placeholder.com/150';
                newElement.alt = draggedElementData?.alt || 'Descrição da imagem';
                newElement.style.maxWidth = '100%';
                newElement.style.display = 'block';
                break;
            // Adicionar mais casos conforme necessário
        }

        // Adiciona listener para seleção
        newElement.addEventListener('click', (event) => {
            event.stopPropagation(); // Impede que o clique se propague para o pai
            selectElement(newElement);
        });

        // --- Novo: Edição de Texto Inline ---
        if (draggedElementData?.editableText === 'true') {
            newElement.addEventListener('dblclick', handleDoubleClickToEdit);
        }

        // --- Novo: Tornar elemento arrastável dentro do preview ---
        newElement.setAttribute('draggable', 'true');
        newElement.addEventListener('dragstart', handlePreviewDragStart);
        newElement.addEventListener('dragend', handlePreviewDragEnd);
        // -----------------------------------------------------------

        parentElement.appendChild(newElement);
        updateCodeOutput(); // Atualiza código e localStorage
        updateDomTree(); // Atualiza a árvore DOM
        selectElement(newElement); // Seleciona o novo elemento
    }

    // --- Funções para Arrastar Elementos do Preview ---
    let draggedPreviewElement = null;

    function handlePreviewDragStart(event) {
        // Impede que o drag do pai (iframe) interfira
        event.stopPropagation();

        draggedPreviewElement = event.target;
        event.dataTransfer.setData('text/plain', `move:${draggedPreviewElement.id}`);
        event.dataTransfer.effectAllowed = 'move';
        // Adiciona uma classe para feedback visual (opcional)
        // setTimeout necessário para que a classe seja aplicada antes do 'screenshot' do drag
        setTimeout(() => {
            draggedPreviewElement.classList.add('dragging-preview');
        }, 0);
    }

    function handlePreviewDragEnd(event) {
        event.stopPropagation();
        if (draggedPreviewElement) {
            draggedPreviewElement.classList.remove('dragging-preview');
        }
        draggedPreviewElement = null;

        // Limpa o highlight de drop target se ainda existir
        if (dragTargetElement) {
            dragTargetElement.classList.remove('drag-over-element');
            dragTargetElement = null;
        }
    }
    // --------------------------------------------------------

    // --- Novo: Função para Atualizar a Árvore DOM ---
    function updateDomTree() {
        domTreeContainer.innerHTML = ''; // Limpa a árvore atual
        
        // Cria o item raiz para o body
        const bodyItem = createTreeItem(previewBody, true);
        domTreeContainer.appendChild(bodyItem);
        
        // Constrói o restante da árvore como filhos do body
        const childrenContainer = document.createElement('ul');
        Array.from(previewBody.children).forEach(child => {
            const childTree = buildTree(child);
            if (childTree) {
                childrenContainer.appendChild(childTree);
            }
        });
        
        if (childrenContainer.children.length > 0) {
            bodyItem.appendChild(childrenContainer);
        }
        
        // Adiciona suporte para arrastar e soltar na árvore DOM
        setupDomTreeDragAndDrop();
    }
    
    // Configura eventos de arrastar e soltar na árvore DOM
    function setupDomTreeDragAndDrop() {
        // Adiciona eventos de dragover e drop no container da árvore DOM
        domTreeContainer.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessário para permitir o drop
            
            // Encontra o item da árvore mais próximo
            const target = findClosestTreeItem(event.target);
            
            // Remove a classe de destino de drop de todos os itens
            domTreeContainer.querySelectorAll('li.dom-tree-drop-target').forEach(item => {
                item.classList.remove('dom-tree-drop-target');
            });
            
            // Se encontrou um alvo válido, adiciona a classe de destino de drop
            if (target && !target.classList.contains('dragging-tree-item')) {
                target.classList.add('dom-tree-drop-target');
            }
        });
        
        domTreeContainer.addEventListener('dragleave', (event) => {
            // Remove a classe de destino de drop quando o arrasto sai da área
            domTreeContainer.querySelectorAll('li.dom-tree-drop-target').forEach(item => {
                item.classList.remove('dom-tree-drop-target');
            });
        });
        
        domTreeContainer.addEventListener('drop', (event) => {
            event.preventDefault();
            
            // Remove a classe de destino de drop de todos os itens
            domTreeContainer.querySelectorAll('li.dom-tree-drop-target').forEach(item => {
                item.classList.remove('dom-tree-drop-target');
            });
            
            const dataTransferText = event.dataTransfer.getData('text/plain');
            if (!dataTransferText.startsWith('move:')) return;
            
            // Obtém o ID do elemento a ser movido
            const elementToMoveId = dataTransferText.substring(5);
            const elementToMove = previewDocument.getElementById(elementToMoveId);
            
            // Encontra o elemento alvo mais próximo
            const targetTreeItem = findClosestTreeItem(event.target);
            if (!targetTreeItem || !elementToMove) return;
            
            // Obtém o ID do elemento alvo
            const targetElementId = targetTreeItem.dataset.elementId;
            const targetElement = previewDocument.getElementById(targetElementId);
            
            if (!targetElement || elementToMove.contains(targetElement)) return;
            
            // Move o elemento no documento do preview
            targetElement.appendChild(elementToMove);
            
            // Atualiza o código e a árvore DOM
            updateCodeOutput();
            updateDomTree();
            
            // Seleciona o elemento movido
            selectElement(elementToMove);
        });
    }
    
    // Função auxiliar para encontrar o item da árvore mais próximo
    function findClosestTreeItem(element) {
        if (!element) return null;
        
        // Verifica se o elemento atual é um item da árvore
        if (element.tagName === 'LI' && element.closest('#dom-tree')) {
            return element;
        }
        
        // Verifica os elementos pai até encontrar um item da árvore
        return element.closest('#dom-tree li');
    }
    
    // Retorna o ícone apropriado para cada tipo de elemento
    function getElementIcon(tagName) {
        const iconMap = {
            'div': 'crop_square',
            'form': 'assignment',
            'input': 'input',
            'button': 'smart_button',
            'h1': 'title',
            'h2': 'title',
            'h3': 'title',
            'h4': 'title',
            'h5': 'title', 
            'h6': 'title',
            'p': 'text_fields',
            'a': 'link',
            'img': 'image',
            'ul': 'format_list_bulleted',
            'ol': 'format_list_numbered',
            'li': 'arrow_right',
            'table': 'table_view',
            'tr': 'table_rows',
            'td': 'table_cell',
            'th': 'table_chart',
            'body': 'web_asset'
        };
        
        return iconMap[tagName.toLowerCase()] || 'code';
    }
    
    // Cria um item da árvore para o elemento
    function createTreeItem(element, isBody = false) {
        const li = document.createElement('li');
        li.dataset.elementId = element.id; // Adiciona atributo data para identificação
        
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('dom-tree-tag');
        
        // Adiciona ícone representativo do elemento
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('material-icons');
        iconSpan.textContent = getElementIcon(element.tagName);
        tagSpan.appendChild(iconSpan);
        
        // Adiciona o nome da tag com ID se disponível
        const tagText = document.createElement('span');
        tagText.textContent = `${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`;
        tagSpan.appendChild(tagText);
        
        li.appendChild(tagSpan);
        
        // Estiliza o item se for o elemento selecionado
        if (selectedElement === element) {
            li.classList.add('selected-tree-item');
        }
        
        // Adiciona evento de clique para selecionar o elemento
        li.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que cliques em itens filhos selecionem o pai
            selectElement(element);
        });
        
        // Torna o item da árvore DOM arrastável
        li.setAttribute('draggable', 'true');
        li.addEventListener('dragstart', (event) => {
            event.stopPropagation();
            // Armazena o ID do elemento sendo arrastado para usar no drop
            event.dataTransfer.setData('text/plain', `move:${element.id}`);
            event.dataTransfer.effectAllowed = 'move';
            li.classList.add('dragging-tree-item');
        });
        
        li.addEventListener('dragend', (event) => {
            li.classList.remove('dragging-tree-item');
        });
        
        return li;
    }

    // Função auxiliar recursiva para construir a árvore
    function buildTree(element) {
        if (element.nodeType !== Node.ELEMENT_NODE) { 
            // Ignora nós não-elementos
            return null;
        }

        const li = createTreeItem(element);

        // Se o elemento tiver filhos, constrói a subárvore
        if (element.children.length > 0) {
            const ul = document.createElement('ul');
            Array.from(element.children).forEach(child => {
                const childTree = buildTree(child);
                if (childTree) {
                    ul.appendChild(childTree);
                }
            });
            if (ul.children.length > 0) {
                li.appendChild(ul);
            }
        }

        return li;
    }
    // --------------------------------------------------

    // --- Novo: Funções para Edição de Texto Inline ---
    let currentlyEditingElement = null;

    function handleDoubleClickToEdit(event) {
        event.stopPropagation();
        const element = event.target;

        // Se já estiver editando outro, finaliza a edição anterior
        if (currentlyEditingElement && currentlyEditingElement !== element) {
            finishEditing(currentlyEditingElement);
        }

        // Permite edição apenas se for o elemento clicado (não um filho)
        // e se não estiver já em modo de edição
        if (element === event.currentTarget && !element.isContentEditable) {
            currentlyEditingElement = element;
            element.contentEditable = true;
            element.focus();
            // Seleciona o texto para facilitar a edição
            const range = document.createRange();
            range.selectNodeContents(element);
            const selection = previewFrame.contentWindow.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);

            element.addEventListener('blur', handleBlurToSave);
            element.addEventListener('keydown', handleKeydownToSaveOrCancel);
            element.style.outline = '1px solid yellow'; // Feedback visual de edição
        }
    }

    function handleBlurToSave(event) {
        finishEditing(event.target);
    }

    function handleKeydownToSaveOrCancel(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Evita nova linha em alguns casos
            finishEditing(event.target);
        } else if (event.key === 'Escape') {
            // Cancela a edição (reverte para o texto original - precisa guardar o original)
            // Por simplicidade, vamos apenas finalizar a edição sem reverter
            event.target.blur(); // Isso vai chamar o handleBlurToSave
        }
    }

    function finishEditing(element) {
        if (element.isContentEditable) {
            element.contentEditable = false;
            element.removeEventListener('blur', handleBlurToSave);
            element.removeEventListener('keydown', handleKeydownToSaveOrCancel);
            element.style.outline = ''; // Remove feedback visual
            currentlyEditingElement = null;
            updateCodeOutput(); // Atualiza o código HTML
            updateDomTree(); // Atualiza a árvore DOM (se o texto for exibido lá)
        }
    }
    // ---------------------------------------------------

    // --- Seleção de Elemento e Configurações --- //

    // Listener no body para desselecionar ao clicar fora
    previewDocument.addEventListener('click', (event) => {
        if (event.target === previewBody) {
            deselectElement();
        }
    });

    function selectElement(element) {
        // Remove a seleção anterior no preview e na árvore
        if (selectedElement) {
            selectedElement.classList.remove('selected-element');
            const oldTreeItem = domTreeContainer.querySelector(`[data-element-id="${selectedElement.id}"]`);
            if (oldTreeItem) {
                oldTreeItem.classList.remove('selected-tree-item');
                const oldTreeTagSpan = oldTreeItem.querySelector('.dom-tree-tag');
                if (oldTreeTagSpan) {
                    oldTreeTagSpan.classList.remove('selected-tag');
                }
            }
        }

        // Seleciona o novo elemento no preview e na árvore
        selectedElement = element;
        if (selectedElement) {
            selectedElement.classList.add('selected-element');
            const newTreeItem = domTreeContainer.querySelector(`[data-element-id="${selectedElement.id}"]`);
            if (newTreeItem) {
                newTreeItem.classList.add('selected-tree-item');
                const treeTagSpan = newTreeItem.querySelector('.dom-tree-tag');
                if (treeTagSpan) {
                    treeTagSpan.classList.add('selected-tag');
                }
                
                // Garante que o item selecionado esteja visível na árvore
                newTreeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            // Atualiza o painel de configurações conforme o elemento selecionado
            function updateSettingsPanel() {
                settingsPanel.innerHTML = '';
                if (!selectedElement) {
                    settingsPanel.innerHTML = '<p>Selecione um elemento para configurar.</p>';
                    return;
                }
                const tag = selectedElement.tagName.toLowerCase();
                const panelTitle = document.createElement('h3');
                panelTitle.textContent = `Configurações de <${tag}>`;
                settingsPanel.appendChild(panelTitle);
                // Configurações específicas para cada tipo de elemento
                if (tag === 'img') {
                    // Campo para editar src
                    const srcLabel = document.createElement('label');
                    srcLabel.textContent = 'URL da Imagem:';
                    const srcInput = document.createElement('input');
                    srcInput.type = 'text';
                    srcInput.value = selectedElement.src;
                    srcInput.addEventListener('input', (e) => {
                        selectedElement.src = e.target.value;
                        updateCodeOutput();
                    });
                    settingsPanel.appendChild(srcLabel);
                    settingsPanel.appendChild(srcInput);
                    // Campo para editar alt
                    const altLabel = document.createElement('label');
                    altLabel.textContent = 'Texto Alternativo (alt):';
                    const altInput = document.createElement('input');
                    altInput.type = 'text';
                    altInput.value = selectedElement.alt;
                    altInput.addEventListener('input', (e) => {
                        selectedElement.alt = e.target.value;
                        updateCodeOutput();
                    });
                    settingsPanel.appendChild(altLabel);
                    settingsPanel.appendChild(altInput);
                } else if (tag === 'input') {
                    // ... configurações para input ...
                } else if (tag === 'button') {
                    // ... configurações para button ...
                } else if (tag === 'div' || tag === 'p' || tag === 'h1') {
                    // ... configurações para texto ...
                }
                // ... outros tipos ...
            }

            // Adiciona configurações comuns (ex: CSS)
            addCssSetting('background-color', 'Cor de Fundo', 'color');
            addCssSetting('color', 'Cor do Texto', 'color');
            addCssSetting('margin', 'Margem (ex: 10px)');
            addCssSetting('padding', 'Padding (ex: 10px)');
            addCssSetting('border', 'Borda (ex: 1px solid black)');
            addCssSetting('font-size', 'Tam. Fonte (ex: 16px)');
            addCssSetting('width', 'Largura (ex: 100px ou 50%)');
            addCssSetting('height', 'Altura (ex: 50px)');
            // Adicionar mais propriedades CSS comuns

            // Adiciona configurações específicas da tag
            if (tagType === 'input') {
                addInputSetting('type', 'Tipo', ['text', 'password', 'email', 'number', 'checkbox', 'radio', 'submit', 'reset', 'button']);
                addInputSetting('placeholder', 'Placeholder');
                addInputSetting('value', 'Valor');
                addInputSetting('name', 'Name'); // Atributo name é útil
            }
            if (tagType === 'form') { // Novo: form
                addInputSetting('action', 'Action (URL)');
                addInputSetting('method', 'Method', ['GET', 'POST']);
            }
            if (['h1', 'p', 'button', 'div', 'form'].includes(tagType)) { // Adicionado form aqui
                addContentSetting(); // Permitir editar conteúdo de texto do form (útil para placeholders iniciais)
            }

            // Botão para remover elemento
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remover Elemento';
            removeButton.style.marginTop = '15px';
            removeButton.style.backgroundColor = '#dc3545';
            removeButton.addEventListener('click', () => {
                if (selectedElement) {
                    const parent = selectedElement.parentElement;
                    selectedElement.remove();
                    selectElement(null); // Desseleciona
                    updateCodeOutput(); // Atualiza código e localStorage
                    updateDomTree(); // Atualiza a árvore
                }
            });
            settingsPanel.appendChild(removeButton);
        }
    }

    function updateSettingsPanel() {
        settingsPanel.innerHTML = ''; // Limpa o painel

        if (!selectedElement) {
            settingsPanel.innerHTML = '<p>Selecione um elemento para configurar.</p>';
            return;
        }

        const tagType = selectedElement.tagName.toLowerCase();
        settingsPanel.innerHTML = `<h3>Configurações para ${tagType.toUpperCase()} #${selectedElement.id}</h3>`;

        // Adiciona configurações comuns (ex: CSS)
        addCssSetting('background-color', 'Cor de Fundo', 'color');
        addCssSetting('color', 'Cor do Texto', 'color');
        addCssSetting('margin', 'Margem (ex: 10px)');
        addCssSetting('padding', 'Padding (ex: 10px)');
        addCssSetting('border', 'Borda (ex: 1px solid black)');
        addCssSetting('font-size', 'Tam. Fonte (ex: 16px)');
        addCssSetting('width', 'Largura (ex: 100px ou 50%)');
        addCssSetting('height', 'Altura (ex: 50px)');
        // Adicionar mais propriedades CSS comuns

        // Adiciona configurações específicas da tag
        if (tagType === 'input') {
            addInputSetting('type', 'Tipo', ['text', 'password', 'email', 'number', 'checkbox', 'radio', 'submit', 'reset', 'button']);
            addInputSetting('placeholder', 'Placeholder');
            addInputSetting('value', 'Valor');
            addInputSetting('name', 'Name'); // Atributo name é útil
        }
        if (tagType === 'form') { // Novo: form
            addInputSetting('action', 'Action (URL)');
            addInputSetting('method', 'Method', ['GET', 'POST']);
        }
        if (['h1', 'p', 'button', 'div', 'form'].includes(tagType)) { // Adicionado form aqui
            addContentSetting(); // Permitir editar conteúdo de texto do form (útil para placeholders iniciais)
        }

        // Botão para remover elemento
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remover Elemento';
        removeButton.style.marginTop = '15px';
        removeButton.style.backgroundColor = '#dc3545';
        removeButton.addEventListener('click', () => {
            if (selectedElement) {
                const parent = selectedElement.parentElement;
                selectedElement.remove();
                selectElement(null); // Desseleciona
                updateCodeOutput(); // Atualiza código e localStorage
                updateDomTree(); // Atualiza a árvore
            }
        });
        settingsPanel.appendChild(removeButton);
    }

    function addCssSetting(property, label, inputType = 'text') {
        const settingDiv = document.createElement('div');
        // settingDiv.style.marginBottom = '10px';
        settingDiv.classList.add('settingDiv');


        const labelElement = document.createElement('label');
        labelElement.textContent = `${label}: `;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '3px';

        const inputElement = document.createElement('input');
        inputElement.type = inputType;
        inputElement.value = selectedElement.style[property] || '';
        inputElement.style.width = 'calc(100% - 10px)'; // Ajusta largura

        inputElement.addEventListener('input', (event) => {
            selectedElement.style[property] = event.target.value;
            updateCodeOutput(); // Atualiza código e localStorage
        });

        settingDiv.appendChild(labelElement);
        settingDiv.appendChild(inputElement);
        settingsPanel.appendChild(settingDiv);
    }

    function addInputSetting(attribute, label, options = null) {
        const settingDiv = document.createElement('div');
        settingDiv.style.marginBottom = '10px';

        const labelElement = document.createElement('label');
        labelElement.textContent = `${label}: `;
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '3px';

        let inputElement;
        if (options && Array.isArray(options)) {
            inputElement = document.createElement('select');
            inputElement.style.width = '100%';
            options.forEach(optionValue => {
                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionValue.charAt(0).toUpperCase() + optionValue.slice(1);
                if (selectedElement.getAttribute(attribute) === optionValue) {
                    option.selected = true;
                }
                inputElement.appendChild(option);
            });
            inputElement.addEventListener('change', (event) => {
                selectedElement.setAttribute(attribute, event.target.value);
                updateCodeOutput(); // Atualiza código e localStorage
            });
        } else {
            inputElement = document.createElement('input');
            inputElement.type = 'text';
            inputElement.value = selectedElement.getAttribute(attribute) || '';
            inputElement.style.width = 'calc(100% - 10px)';
            inputElement.addEventListener('input', (event) => {
                selectedElement.setAttribute(attribute, event.target.value);
                updateCodeOutput(); // Atualiza código e localStorage
            });
        }

        settingDiv.appendChild(labelElement);
        settingDiv.appendChild(inputElement);
        settingsPanel.appendChild(settingDiv);
    }

    function addContentSetting() {
        const settingDiv = document.createElement('div');
        settingDiv.style.marginBottom = '10px';

        const labelElement = document.createElement('label');
        labelElement.textContent = 'Conteúdo:';
        labelElement.style.display = 'block';
        labelElement.style.marginBottom = '3px';

        const inputElement = document.createElement('textarea');
        inputElement.value = selectedElement.textContent || '';
        inputElement.style.width = 'calc(100% - 10px)';
        inputElement.rows = 3;

        inputElement.addEventListener('input', (event) => {
            selectedElement.textContent = event.target.value;
            updateCodeOutput(); // Atualiza código e localStorage
        });

        settingDiv.appendChild(labelElement);
        settingDiv.appendChild(inputElement);
        settingsPanel.appendChild(settingDiv);
    }

// --- Visualização e Exportação de Código --- //

    function updateCodeOutput() {
        let { htmlCode, cssCode } = generateCodeRecursive(previewBody);

        const fullCode = `<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Documento Gerado</title>
<style>
    body { margin: 0; padding: 10px; min-height: 100vh; box-sizing: border-box; }
    ${cssCode}
</style>
</head>
<body>
${htmlCode}
</body>
</html>`;

        codeOutput.value = fullCode;
    }

    // Novo: Função recursiva para gerar HTML e CSS
    function generateCodeRecursive(parentElement, indent = '    ') {
        let htmlCode = '';
        let cssCode = '';

        for (const element of parentElement.children) {
            if (element.id && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE') { // Processa apenas elementos com ID criados pelo editor
                const cleanElement = element.cloneNode(false); // Clona sem filhos inicialmente
                cleanElement.classList.remove('selected-element', 'drag-over-element');
                cleanElement.removeAttribute('style');

                // Gera CSS para o elemento atual
                if (element.style.cssText) {
                    cssCode += `${indent}#${element.id} {\n`;
                    for (let i = 0; i < element.style.length; i++) {
                        const prop = element.style[i];
                        const value = element.style.getPropertyValue(prop);
                        cssCode += `${indent}    ${prop}: ${value};\n`;
                    }
                    cssCode += `${indent}}\n`;
                }

                // Gera HTML recursivamente para os filhos
                let innerHtml = '';
                let innerCss = '';
                if (element.hasChildNodes()) {
                    const result = generateCodeRecursive(element, indent + '    ');
                    innerHtml = result.htmlCode;
                    innerCss = result.cssCode;
                }

                // Monta o HTML do elemento atual
                htmlCode += `${indent}${cleanElement.outerHTML.replace(/><\/.*>$/, '>')}`; // Abre a tag
                if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                        // Se o único filho for texto, coloca na mesma linha
                        htmlCode += element.textContent.trim();
                } else if (innerHtml) {
                    htmlCode += `\n${innerHtml}${indent}`; // Adiciona filhos
                }
                htmlCode += `</${element.tagName.toLowerCase()}>\n`; // Fecha a tag

                cssCode += innerCss; // Acumula CSS dos filhos
            }
        }
        return { htmlCode, cssCode };
    }

    // Atualiza o código inicial e a árvore DOM
    updateCodeOutput();
    updateDomTree();
});

function updateCodeOutput() {
    const previewContent = previewDocument.body.innerHTML;
    // Formata o HTML para exibição (indentação básica)
    const formattedHtml = formatHtml(previewContent);
    codeOutput.value = formattedHtml;

    // Atualiza o localStorage para o preview externo
    updateExternalPreviewStorage();
}

// Nova função para centralizar a atualização do localStorage
function updateExternalPreviewStorage() {
    const currentHtml = previewDocument.body.innerHTML;
    // Poderíamos extrair e salvar CSS também se necessário
    // const currentCss = getAllComputedStyles(); // Exemplo complexo
    localStorage.setItem('externalPreviewContent', currentHtml);
    // localStorage.setItem('externalPreviewCss', currentCss); // Se implementado
}

// Função auxiliar para formatar HTML (simplificada)
function formatHtml(html) {
    // Implementação básica de formatação ou usar uma biblioteca
    // Esta é uma versão muito simples, pode ser melhorada
    let indentLevel = 0;
    const indentSize = 2;
    return html.split(/>\s*</).map(element => {
        let indent = '';
        if (element.match(/^\/\w/)) { // Tag de fechamento
            indentLevel--;
        }
        indent = ' '.repeat(indentLevel * indentSize);
        if (element.match(/^\w/) && !element.match(/\/$/)) { // Tag de abertura (não self-closing)
            indentLevel++;
        }
        // Adiciona a indentação e reconstrói a tag
        if (!element.startsWith('<')) element = '<' + element;
        if (!element.endsWith('>')) element = element + '>';
        return indent + element;
    }).join('\n');
    // Nota: Esta formatação é rudimentar e pode falhar com HTML complexo.
    // Para uma solução robusta, considere bibliotecas como prettier.
    // Por enquanto, retornamos o HTML bruto para garantir funcionalidade.
    // return previewDocument.body.innerHTML; // Retorna bruto temporariamente
}