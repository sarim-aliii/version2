import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, StudyProject } from '../types';

export const generateUserReport = (user: User, projects: StudyProject[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // --- Header ---
  doc.setFontSize(22);
  doc.setTextColor(220, 38, 38); // Red-600
  doc.text('Kairon AI - Study Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

  // --- User Profile ---
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Student Profile', 14, 40);
  
  doc.setFontSize(11);
  doc.setTextColor(80);
  doc.text(`Name: ${user.name}`, 14, 50);
  doc.text(`Email: ${user.email}`, 14, 56);
  doc.text(`Level: ${user.level || 1}  |  XP: ${user.xp || 0}  |  Streak: ${user.currentStreak || 0} Days`, 14, 62);

  let finalY = 70;

  // --- Projects Loop ---
  projects.forEach((project, index) => {
    // Add new page if we are too close to the bottom
    if (finalY > 250) {
      doc.addPage();
      finalY = 20;
    }

    // Divider
    doc.setDrawColor(200);
    doc.line(14, finalY, pageWidth - 14, finalY);
    finalY += 10;

    // Project Title
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 38);
    doc.text(`Project: ${project.name}`, 14, finalY);
    finalY += 8;

    // Summary (if exists)
    if (project.summary) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Summary', 14, finalY);
      finalY += 6;

      doc.setFontSize(10);
      doc.setTextColor(60);
      // Split text to fit page width
      const summaryLines = doc.splitTextToSize(project.summary, pageWidth - 28);
      doc.text(summaryLines, 14, finalY);
      finalY += (summaryLines.length * 5) + 5;
    }

    // Flashcards Table (if exists)
    if (project.srsFlashcards && project.srsFlashcards.length > 0) {
      if (finalY > 240) { doc.addPage(); finalY = 20; }
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Flashcards (${project.srsFlashcards.length})`, 14, finalY);
      finalY += 4;

      const tableBody = project.srsFlashcards.map(fc => [fc.question, fc.answer]);

      autoTable(doc, {
        startY: finalY,
        head: [['Question', 'Answer']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [220, 38, 38] }, // Red header
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: { 0: { cellWidth: 80 } }, // Force question width
        margin: { top: 20 },
        // Update finalY after table is drawn
        didDrawPage: (data) => {
             // Optional: Header on new pages
        }
      });
      
      // @ts-ignore
      finalY = doc.lastAutoTable.finalY + 15;
    } else {
        finalY += 10;
    }
  });

  // Save
  doc.save(`Kairon_Report_${user.name.replace(/\s+/g, '_')}.pdf`);
};