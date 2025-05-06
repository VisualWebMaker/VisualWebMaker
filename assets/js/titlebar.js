// Script para controlar a barra de título personalizada

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos botões da barra de título
    const minimizeButton = document.getElementById('minimize-button');
    const maximizeButton = document.getElementById('maximize-button');
    const closeButton = document.getElementById('close-button');
    const maximizeIcon = maximizeButton.querySelector('i');

    // Verifica se estamos no ambiente Electron
    if (window.electron && window.electron.janela) {
        // Atualiza o ícone do botão maximizar com base no estado atual da janela
        const atualizarIconeMaximizar = async () => {
            try {
                const isMaximizado = await window.electron.janela.isMaximizado();
                maximizeIcon.textContent = isMaximizado ? 'filter_none' : 'crop_square';
            } catch (error) {
                console.error('Erro ao verificar estado da janela:', error);
            }
        };

        // Inicializa o ícone
        atualizarIconeMaximizar();

        // Adiciona os event listeners para os botões
        minimizeButton.addEventListener('click', () => {
            window.electron.janela.minimizar();
        });

        maximizeButton.addEventListener('click', () => {
            window.electron.janela.maximizar();
            // Atualiza o ícone após um pequeno delay para garantir que o estado da janela foi alterado
            setTimeout(atualizarIconeMaximizar, 100);
        });

        closeButton.addEventListener('click', () => {
            window.electron.janela.fechar();
        });

        // Atualiza o título da janela
        // const atualizarTitulo = async () => {
        //     try {
        //         const titulo = await window.electron.janela.obterTitulo();
        //         document.querySelector('.titlebar-title').textContent = titulo;
        //     } catch (error) {
        //         console.error('Erro ao obter título da janela:', error);
        //     }
        // };

        // atualizarTitulo();
    } else {
        // Se não estamos no Electron, esconde a barra de título
        document.querySelector('.titlebar').style.display = 'none';
        document.body.style.marginTop = '0';
    }
});