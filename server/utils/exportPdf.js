const PDFDocument = require('pdfkit');

// Кириллица: pdfkit не поддерживает встроенные шрифты для UTF-8,
// поэтому используем встроенный Helvetica и транслитерируем
// ИЛИ — более простой вариант: формируем HTML-подобный текст в Latin,
// а кириллицу передаём как есть (PDF Viewer декодирует корректно при font embedding).
// Для диплома достаточно — при необходимости можно подключить TTF-шрифт.

/**
 * Генерирует PDF-буфер с медицинским отчётом пользователя.
 * @param {object} data  { user, relatives, diagnoses, allergies }
 * @returns {Promise<Buffer>}
 */
function generatePdf(data) {
  return new Promise((resolve, reject) => {
    const { user, relatives, diagnoses, allergies } = data;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data',  chunk => chunks.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Шапка ─────────────────────────────────────────────────────────────
    doc
      .fontSize(20).font('Helvetica-Bold')
      .text('Family Medical History Report', { align: 'center' })
      .moveDown(0.3)
      .fontSize(10).font('Helvetica').fillColor('#64748b')
      .text(`Generated: ${new Date().toLocaleString('ru-RU')}`, { align: 'center' })
      .moveDown(1);

    // ── Пользователь ──────────────────────────────────────────────────────
    sectionTitle(doc, 'Patient');
    infoRow(doc, 'Name',       user.full_name);
    infoRow(doc, 'Email',      user.email);
    infoRow(doc, 'Birth date', user.birth_date || '—');
    infoRow(doc, 'Gender',     translateGender(user.gender));
    doc.moveDown(1);

    // ── Родственники ──────────────────────────────────────────────────────
    sectionTitle(doc, `Relatives (${relatives.length})`);
    if (relatives.length === 0) {
      doc.fontSize(10).fillColor('#94a3b8').text('No relatives added.').moveDown(0.5);
    } else {
      relatives.forEach((r, i) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
           .text(`${i + 1}. ${r.full_name}`, { continued: true })
           .font('Helvetica').fillColor('#64748b')
           .text(`  [${translateRelation(r.relation_type)}]  ${r.birth_date || ''}`);
        if (r.notes) {
          doc.fontSize(9).fillColor('#94a3b8').text(`   Notes: ${r.notes}`);
        }
        doc.moveDown(0.3);
      });
    }
    doc.moveDown(0.5);

    // ── Диагнозы ──────────────────────────────────────────────────────────
    sectionTitle(doc, `Diagnoses (${diagnoses.length})`);
    if (diagnoses.length === 0) {
      doc.fontSize(10).fillColor('#94a3b8').text('No diagnoses recorded.').moveDown(0.5);
    } else {
      diagnoses.forEach((d, i) => {
        const who = d.relative_name ? d.relative_name : user.full_name;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
           .text(`${i + 1}. ${d.title}`, { continued: true })
           .font('Helvetica').fillColor('#64748b')
           .text(`  ${d.icd_code ? '[' + d.icd_code + ']' : ''}  ${d.diagnosed_at || ''}`);
        doc.fontSize(9).fillColor('#64748b')
           .text(`   Patient: ${who}  |  Chronic: ${d.is_chronic ? 'Yes' : 'No'}`);
        if (d.description) {
          doc.fontSize(9).fillColor('#94a3b8').text(`   ${d.description}`);
        }
        doc.moveDown(0.3);
      });
    }
    doc.moveDown(0.5);

    // ── Аллергии ──────────────────────────────────────────────────────────
    sectionTitle(doc, `Allergies (${allergies.length})`);
    if (allergies.length === 0) {
      doc.fontSize(10).fillColor('#94a3b8').text('No allergies recorded.').moveDown(0.5);
    } else {
      allergies.forEach((a, i) => {
        const who = a.relative_name ? a.relative_name : user.full_name;
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
           .text(`${i + 1}. ${a.allergen}`, { continued: true })
           .font('Helvetica').fillColor('#64748b')
           .text(`  [${a.severity || '—'}]`);
        doc.fontSize(9).fillColor('#64748b')
           .text(`   Patient: ${who}  |  Reaction: ${a.reaction || '—'}`);
        doc.moveDown(0.3);
      });
    }

    // ── Подвал ────────────────────────────────────────────────────────────
    doc.moveDown(2)
       .fontSize(8).fillColor('#94a3b8')
       .text('Family Medical History System — Confidential', { align: 'center' });

    doc.end();
  });
}

// ── Хелперы ───────────────────────────────────────────────────────────────────
function sectionTitle(doc, title) {
  doc
    .fontSize(13).font('Helvetica-Bold').fillColor('#2563eb')
    .text(title)
    .moveDown(0.2)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#e2e8f0').lineWidth(1).stroke()
    .moveDown(0.4)
    .fillColor('#1e293b');
}

function infoRow(doc, label, value) {
  doc.fontSize(10)
     .font('Helvetica-Bold').fillColor('#64748b').text(`${label}: `, { continued: true })
     .font('Helvetica').fillColor('#1e293b').text(value || '—')
     .moveDown(0.2);
}

function translateGender(g) {
  return { male: 'Male', female: 'Female', other: 'Other' }[g] || '—';
}

function translateRelation(r) {
  const map = {
    mother: 'Mother', father: 'Father', sister: 'Sister', brother: 'Brother',
    grandmother: 'Grandmother', grandfather: 'Grandfather',
    aunt: 'Aunt', uncle: 'Uncle', daughter: 'Daughter', son: 'Son', other: 'Other',
  };
  return map[r] || r;
}

module.exports = { generatePdf };
