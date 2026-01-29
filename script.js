document.addEventListener('DOMContentLoaded', () => {

    // Atualiza campos de texto
    window.update = function (id, value) {
        const el = document.getElementById(id);
        if (el) el.innerText = value;
    };

    // Atualiza QR Code
    //

    // Foto
    const fileInput = document.getElementById('file-photo');
    if (fileInput) {
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = ev => {
                const img = document.getElementById('img-photo');
                if (img) img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // PDF
    window.downloadPDF = function () {
        const element = document.getElementById('card-wrapper');

        if (!element) {
            alert('Erro: card-wrapper não encontrado');
            return;
        }

        html2pdf().set({
            margin: 0,
            filename: 'DNE-Estudante.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true },
            jsPDF: {
                unit: 'px',
                format: [element.offsetWidth, element.offsetHeight],
                orientation: 'portrait'
            }
        }).from(element).save();
    };

});
