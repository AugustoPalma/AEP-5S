document.addEventListener('DOMContentLoaded', () => {
    // DEBUG: Ponto de verificação 1 - Confirma que o script começou a ser executado.
    console.log('DEBUG: DOM carregado, script.js está a executar...');

    const API_URL = 'http://localhost:8080/api';

    const physicalButtons = document.querySelectorAll('.physical-button');
    const screenLabels = document.querySelectorAll('.screen-button-labels div');
    const screenContents = document.querySelectorAll('.screen-content');
    const userIdDisplay = document.getElementById('user-id-display');
    const bottleCountDisplay = document.getElementById('bottle-count');
    const recycleMessage = document.getElementById('recycle-message');
    const progressBar = document.querySelector('.loading-bar .progress');
    const listaCuponsDiv = document.getElementById('lista-cupons');

    // DEBUG: Ponto de verificação 2 - Verifica se os elementos dos botões foram encontrados.
    console.log('DEBUG: Botões físicos encontrados no HTML:', physicalButtons.length);

    const audioButtonClick = document.getElementById('audio-botaoG');
    const audioAguardeCupom = document.getElementById('audio-aguardeCupom');
    const audioGarrafaSucesso = document.getElementById('audio-garrafaSucesso');
    const audioLoginSucesso = document.getElementById('audio-loginSucesso');
    const audioError = document.getElementById('audio-error');
    const audioComeco = document.getElementById('audio-comeco');
    const audioLoginPrompt = document.getElementById('audio-login');
    const audioVoltar = document.getElementById('audio-voltar');
    const audioFim = document.getElementById('audio-fim');

    const state = {
        loggedInUser: null,
        currentScreen: 'welcome'
    };
    let currentInputId = '';
    let bottlesInserted = 0;
    let pressTimer;
    const LONG_PRESS_DURATION = 1500;

    const playAudio = (audio) => { if (audio) audio.play().catch(console.error); };

    const showMessage = (elementId, message, type, audioToPlay = null) => {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.textContent = message;
        element.className = `message ${type}`;
        if (audioToPlay) playAudio(audioToPlay);
        setTimeout(() => {
            if (element) {
                element.textContent = '';
                element.className = 'message';
            }
        }, 5000);
    };

    const renderMenu = (menuName, narration = null) => {
        const menuConfig = menus[menuName];
        if (!menuConfig) return;
        state.currentScreen = menuName;
        screenContents.forEach(content => content.classList.add('hidden'));
        document.getElementById(menuConfig.screenId).classList.remove('hidden');
        screenLabels.forEach(label => {
            label.innerHTML = '';
            label.classList.remove('active');
        });
        for (const index in menuConfig.actions) {
            const labelDiv = document.querySelector(`.label-${index}`);
            if (labelDiv) {
                labelDiv.innerHTML = menuConfig.actions[index].label;
                labelDiv.classList.add('active');
            }
        }
        if (narration) playAudio(narration);
    };

    const handleLoginConfirm = async () => {
        if (!currentInputId) {
            showMessage('login-message', 'Por favor, digite o seu ID.', 'error', audioError);
            return;
        }
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentInputId })
            });
            if (!response.ok) {
                throw new Error('Utilizador não encontrado');
            }
            const user = await response.json();
            state.loggedInUser = user;
            showMessage('login-message', `Bem-vindo(a), ${user.name}!`, 'success', audioLoginSucesso);
            setTimeout(() => renderMenu('main'), 2000);
        } catch (error) {
            showMessage('login-message', 'ID de utilizador inválido.', 'error', audioError);
        } finally {
            currentInputId = '';
            userIdDisplay.textContent = '_';
        }
    };

    const finalizeRecycle = async (printCoupon) => {
        if (bottlesInserted === 0) {
            showMessage('recycle-message', 'Nenhuma garrafa inserida.', 'error', audioError);
            return;
        }
        recycleMessage.textContent = 'A processar as suas embalagens... Aguarde.';
        progressBar.style.width = '100%';
        try {
            const response = await fetch(`${API_URL}/recycle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: state.loggedInUser.id,
                    bottles: bottlesInserted,
                    printCoupon: printCoupon
                })
            });
            if (!response.ok) {
                throw new Error('Erro ao processar reciclagem');
            }
            state.loggedInUser = await response.json();
            const valorAdicionado = bottlesInserted * 0.50;
            const msg = printCoupon
                ? `Cupom de R$ ${valorAdicionado.toFixed(2)} gerado! Retire-o.`
                : `Ganhou R$ ${valorAdicionado.toFixed(2)} de saldo!`;
            const audio = printCoupon ? audioAguardeCupom : audioGarrafaSucesso;
            showMessage('recycle-message', msg, 'success', audio);
        } catch (error) {
            showMessage('recycle-message', 'Erro no processamento.', 'error', audioError);
        } finally {
            bottlesInserted = 0;
            bottleCountDisplay.textContent = '0';
            progressBar.style.width = '0%';
            setTimeout(() => renderMenu('main'), 4000);
        }
    };

    const renderCupons = () => {
        listaCuponsDiv.innerHTML = '';
        if (state.loggedInUser && state.loggedInUser.cupons.length > 0) {
            state.loggedInUser.cupons.forEach(cupom => {
                const p = document.createElement('p');
                p.innerHTML = `<strong>${cupom.code}</strong> - R$ ${cupom.couponValue.toFixed(2)} (${cupom.status})`;
                listaCuponsDiv.appendChild(p);
            });
        } else {
            listaCuponsDiv.innerHTML = '<p class="no-cupons">Nenhum cupom gerado.</p>';
        }
    };

    const deactivateAllCoupons = async () => {
        if (!state.loggedInUser) {
            alert('Nenhum utilizador com sessão iniciada');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/users/${state.loggedInUser.id}/deactivate-coupons`, {
                method: 'POST'
            });
            if (!response.ok) {
                throw new Error('Falha ao desativar cupons');
            }
            state.loggedInUser = await response.json();
            renderCupons();
            alert('Cupons desativados com sucesso!');
        } catch(error) {
            alert(error.message);
        }
    };

    const handleViewCoupons = () => {
        if (!state.loggedInUser) {
            showMessage('main-menu', 'Faça login primeiro.', 'error', audioError);
            return;
        }
        renderMenu('viewCoupons');
        renderCupons();
    };
    
    const handleLogout = () => {
        state.loggedInUser = null;
        showMessage('main-menu', 'Sessão terminada. Até breve!', 'success', audioFim);
        setTimeout(() => renderMenu('welcome'), 2000);
    };

    const handleLoginBack = () => {
        currentInputId = '';
        userIdDisplay.textContent = '_';
        renderMenu('main', audioVoltar);
    };
    
    const appendToInput = (digit) => {
        if (currentInputId.length < 10) {
            currentInputId += digit;
            userIdDisplay.textContent = currentInputId;
        }
    };

    const menus = {
        welcome: {
            screenId: 'welcome-screen',
            actions: {
                1: { label: 'INICIAR', action: () => renderMenu('main', audioComeco) },
                4: { label: 'INICIAR', action: () => renderMenu('main', audioComeco) },
                5: { label: 'INICIAR', action: () => renderMenu('main', audioComeco) },
                8: { label: 'INICIAR', action: () => renderMenu('main', audioComeco) }
            }
        },
        main: {
            screenId: 'main-menu',
            actions: {
                1: { label: 'LOGIN', action: () => renderMenu('login', audioLoginPrompt) },
                4: { label: 'RECICLAR', action: () => state.loggedInUser ? renderMenu('recycle') : showMessage('main-menu', 'Faça login primeiro.', 'error', audioError) },
                5: { label: 'MEUS CUPONS', action: handleViewCoupons },
                8: { label: 'SAIR /<br>TERMINAR SESSÃO', action: handleLogout }
            }
        },
        login: {
            screenId: 'login-screen',
            actions: {
                1: { label: '1/4', action: () => appendToInput('1') },
                4: { label: '2/5', action: () => appendToInput('2') },
                5: { label: '3/6', action: () => appendToInput('3') },
                8: { label: 'CONFIRMAR/VOLTAR', action: handleLoginConfirm }
            }
        },
        recycle: {
            screenId: 'recycle-screen',
            actions: {
                1: { label: 'FINALIZAR', action: () => finalizeRecycle(false) },
                4: { label: 'FINALIZAR E<br>IMPRIMIR CUPOM', action: () => finalizeRecycle(true) },
                5: { label: 'DEBUG:<br>ADD 1', action: () => { bottlesInserted++; bottleCountDisplay.textContent = bottlesInserted; } },
                8: { label: 'VOLTAR', action: handleLoginBack }
            }
        },
        viewCoupons: {
            screenId: 'view-coupons-screen',
            actions: {
                8: { label: 'VOLTAR', action: handleLoginBack }
            }
        }
    };

    physicalButtons.forEach(button => {
        // DEBUG: Ponto de verificação 3 - Confirma que o listener está sendo adicionado a cada botão.
        console.log('DEBUG: A adicionar listener ao botão:', button);

        button.addEventListener('mousedown', (e) => {
            // DEBUG: Ponto de verificação 4 - Confirma que o clique está sendo registado.
            console.log('DEBUG: Clique registado no botão!', e.target);
            playAudio(audioButtonClick);
            const index = parseInt(e.target.dataset.index);
            pressTimer = undefined;
            let isLongPressable = (state.currentScreen === 'login' && [1, 4, 5, 8].includes(index)) ||
                                (['recycle', 'viewCoupons', 'message'].includes(state.currentScreen) && index === 8);
            if (isLongPressable) {
                pressTimer = setTimeout(() => {
                    if (state.currentScreen === 'login') {
                        if (index === 1) appendToInput('4', audioQuatro);
                        else if (index === 4) appendToInput('5', audioCinco);
                        else if (index === 5) appendToInput('6', audioSeis);
                        else if (index === 8) handleLoginBack();
                    } else {
                        handleLoginBack();
                    }
                    pressTimer = null;
                }, LONG_PRESS_DURATION);
            }
        });
        button.addEventListener('mouseup', (e) => {
            if (pressTimer === null) return;
            if (pressTimer) clearTimeout(pressTimer);
            const index = parseInt(e.target.dataset.index);
            const menuConfig = menus[state.currentScreen];
            const actionEntry = menuConfig ? menuConfig.actions[index] : undefined;
            if (actionEntry) {
                actionEntry.action();
            } else if (state.currentScreen === 'welcome') {
                renderMenu('main', audioMainMenuNarration);
            }
        });
        button.addEventListener('contextmenu', (e) => e.preventDefault());
    });

    document.getElementById('debug-deactivate-coupons').addEventListener('click', deactivateAllCoupons);
    
    renderMenu('welcome');
});
