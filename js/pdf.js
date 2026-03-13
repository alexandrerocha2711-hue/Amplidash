import { formatNumber, getInitials } from './utils.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generatePDF(creators, currentFilterName) {
    const btnText = document.querySelector('#download-pdf-btn .btn-text');
    const originalText = btnText.textContent;
    btnText.textContent = 'Gerando...';

    try {
        // 1. Prepare Data & DOM Elements
        const container = document.getElementById('pdf-report-container');
        const dateRangeEl = document.getElementById('pdf-date-range-text');
        
        // General Campaign Info
        let totalPoints = 0;
        let totalReferrals = 0;
        let totalPosts = 0;
        let totalDouble = 0;

        creators.forEach(c => {
            totalPoints += c.totalPoints || 0;
            totalReferrals += c.referrals || 0;
            totalPosts += c.posts || 0;
            totalDouble += c.double || 0;
        });

        document.getElementById('pdf-total-points').textContent = formatNumber(totalPoints);
        document.getElementById('pdf-total-referrals').textContent = formatNumber(totalReferrals);
        document.getElementById('pdf-total-posts').textContent = formatNumber(totalPosts);
        document.getElementById('pdf-total-double').textContent = formatNumber(totalDouble);

        // Date and Title info
        dateRangeEl.textContent = `Período: ${currentFilterName}`;
        
        const now = new Date();
        document.getElementById('pdf-generation-date').textContent = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // Build Top 3 List
        const top3Container = document.getElementById('pdf-top3-container');
        top3Container.innerHTML = '';
        const top3 = creators.slice(0, 3);
        
        top3.forEach((c, index) => {
            const rank = index + 1;
            top3Container.innerHTML += `
                <div class="pdf-creator-card">
                    <div class="pdf-rank-badge rank-${rank}">${rank}º</div>
                    <div class="pdf-creator-info">
                        <div class="pdf-creator-name">${c.name}</div>
                        <div class="pdf-creator-stats">
                            <span>Indicações: <strong>${formatNumber(c.referrals||0)}</strong></span>
                            <span>Posts: <strong>${formatNumber(c.posts||0)}</strong></span>
                            <span>Double: <strong>${formatNumber(c.double||0)}</strong></span>
                        </div>
                    </div>
                    <div class="pdf-creator-total">${formatNumber(c.totalPoints)} pts</div>
                </div>
            `;
        });

        // 2. Render Chart for Top 10
        const chartCtx = document.getElementById('pdf-ranking-chart').getContext('2d');
        const top10 = creators.slice(0, 10);
        
        const chart = new Chart(chartCtx, {
            type: 'bar',
            data: {
                labels: top10.map(c => c.name),
                datasets: [{
                    label: 'Pontuação',
                    data: top10.map(c => c.totalPoints),
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Must be disabled for synchronous rendering before HTML2Canvas
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: '#ffffff', font: { weight: 'bold' } }
                    }
                }
            }
        });

        // 3. Make container visible temporarily to take picture
        container.style.zIndex = '9999';
        container.style.top = '0';
        container.style.left = '0';
        
        // Force layout calculations
        await new Promise(resolve => setTimeout(resolve, 500));

        // 4. Capture with html2canvas
        const canvas = await html2canvas(container, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#1E4DD1'
        });

        // 5. Generate PDF
        // A4 landscape dimensions: 297mm x 210mm
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgData = canvas.toDataURL('image/png');
        // A4 inside PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Amplify_Ranking_${now.getTime()}.pdf`);

        // 6. Cleanup
        chart.destroy();
        container.style.zIndex = '-100';
        container.style.top = '-9999px';
        container.style.left = '-9999px';

    } catch (error) {
        console.error('Failed to generate PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Tente novamente.');
    } finally {
        btnText.textContent = originalText;
    }
}
