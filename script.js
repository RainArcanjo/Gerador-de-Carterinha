// Função para atualizar dados em tempo real
function update(id, value) {
    document.getElementById(id).textContent = value.toUpperCase();
}

// Upload de foto
document.getElementById('file-photo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('img-photo').src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Função para garantir que todas as imagens estão carregadas
function waitForImages(element) {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 5000);
        });
    });
    return Promise.all(promises);
}

// Função para aplicar escala dinâmica aos elementos antes da captura
function applyDynamicScale(card) {
    // Pega a largura atual do card
    const currentWidth = card.offsetWidth;
    
    // Largura de referência (desktop)
    const referenceWidth = 375;
    
    // Calcula o fator de escala
    const scaleFactor = currentWidth / referenceWidth;
    
    console.log('🔧 Escala dinâmica:', {
        currentWidth,
        referenceWidth,
        scaleFactor: scaleFactor.toFixed(3)
    });
    
    // Se já está na largura de referência, não precisa ajustar
    if (Math.abs(scaleFactor - 1) < 0.01) {
        console.log('✅ Já está na escala correta');
        return () => {}; // Retorna função vazia de cleanup
    }
    
    // Aplica transform scale no card inteiro
    const originalTransform = card.style.transform;
    const originalTransformOrigin = card.style.transformOrigin;
    const originalWidth = card.style.width;
    
    card.style.transformOrigin = 'top left';
    card.style.transform = `scale(1)`;
    card.style.width = `${referenceWidth}px`;
    
    console.log('✅ Escala aplicada temporariamente');
    
    // Retorna função para restaurar estado original
    return () => {
        card.style.transform = originalTransform;
        card.style.transformOrigin = originalTransformOrigin;
        card.style.width = originalWidth;
        console.log('↩️ Estado original restaurado');
    };
}

// Função principal para gerar PDF
async function downloadPDF() {
    const button = document.getElementById('btn-download');
    const card = document.getElementById('card-wrapper');
    
    if (!card) {
        alert('❌ Erro: Cartão não encontrado');
        return;
    }

    const originalText = button.textContent;
    const originalDisabled = button.disabled;
    let restoreScale = null;

    try {
        // Feedback visual
        button.disabled = true;
        button.textContent = '⏳ Preparando...';

        // 1. Aguarda todas as imagens carregarem
        await waitForImages(card);
        
        button.textContent = '📍 Ajustando escala...';
        
        // 2. Aplica escala dinâmica temporária
        restoreScale = applyDynamicScale(card);
        
        // 3. Aguarda renderização com nova escala
        await new Promise(resolve => setTimeout(resolve, 300));

        button.textContent = '📸 Capturando...';

        // 4. Pega dimensões após ajuste
        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;

        console.log('📐 Dimensões para captura:', {
            width: cardWidth,
            height: cardHeight
        });

        // 5. Captura com html2canvas
        const canvas = await html2canvas(card, {
            scale: 3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#D9D8ED',
            logging: false,
            width: cardWidth,
            height: cardHeight,
            windowWidth: cardWidth,
            windowHeight: cardHeight,
            scrollY: 0,
            scrollX: 0,
            onclone: (clonedDoc) => {
                // Garante que o clone também tenha as medidas corretas
                const clonedCard = clonedDoc.getElementById('card-wrapper');
                if (clonedCard) {
                    clonedCard.style.width = `${cardWidth}px`;
                    clonedCard.style.transform = 'none';
                }
            }
        });

        button.textContent = '📄 Gerando PDF...';

        console.log('🖼️ Canvas gerado:', { 
            width: canvas.width, 
            height: canvas.height
        });

        // 6. Restaura escala ANTES de continuar
        if (restoreScale) {
            restoreScale();
            restoreScale = null;
        }

        // 7. Verifica canvas
        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error(`Canvas vazio: ${canvas.width}x${canvas.height}`);
        }

        // 8. Converte para imagem
        const imgData = canvas.toDataURL('image/jpeg', 0.98);

        // 9. Calcula dimensões do PDF
        const aspectRatio = canvas.width / canvas.height;
        const pdfWidth = 100;
        const pdfHeight = pdfWidth / aspectRatio;

        console.log('📄 PDF:', { 
            width: pdfWidth.toFixed(2), 
            height: pdfHeight.toFixed(2),
            ratio: aspectRatio.toFixed(4)
        });

        // 10. Cria PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
            unit: 'mm',
            format: [pdfWidth, pdfHeight],
            compress: true
        });

        // 11. Adiciona imagem
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // 12. Salva
        pdf.save('Carteirinha-DNE-FESN.pdf');

        // 13. Feedback sucesso
        button.textContent = '✅ PDF Salvo!';
        button.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            button.disabled = originalDisabled;
            button.textContent = originalText;
            button.style.backgroundColor = '';
        }, 2500);

    } catch (error) {
        console.error('❌ ERRO:', error);
        
        // Garante que restaura a escala mesmo em caso de erro
        if (restoreScale) {
            restoreScale();
        }
        
        alert('❌ Erro ao gerar PDF:\n' + error.message);
        
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.style.backgroundColor = '';
    }
}

// Pre-load
window.addEventListener('load', async () => {
    console.log('🚀 Página carregada');
    
    const card = document.getElementById('card-wrapper');
    if (card) {
        await waitForImages(card);
        console.log('✅ Pronto para gerar PDF');
    }
});

// Fontes
document.addEventListener('DOMContentLoaded', () => {
    if (document.fonts) {
        document.fonts.ready.then(() => console.log('✅ Fontes carregadas'));
    }
});