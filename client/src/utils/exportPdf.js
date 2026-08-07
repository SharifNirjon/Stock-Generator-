import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPdf(element, filename, title) {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: null });
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 32;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let cursorY = margin;
  if (title) {
    pdf.setFontSize(16);
    pdf.text(title, margin, cursorY);
    cursorY += 20;
  }

  pdf.addImage(imgData, 'PNG', margin, cursorY, imgWidth, imgHeight);
  pdf.save(filename);
}
