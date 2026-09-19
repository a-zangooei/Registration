import React, { useState } from 'react';
import { Course, DayOfWeek, TimeSlot } from '../types';
import { getActiveSlotsForCourse } from '../utils/conflictDetector';
import {
  getShortCourseName,
  getShortGroupLabel,
  fitCanvasText,
} from '../utils/formatters';
import {
  Printer,
  FileCode,
  Image as ImageIcon,
  X,
  Download,
  CheckCircle,
  FileText,
  Calendar,
  Clock,
  Check,
  Share2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
  minUnits: number;
  maxUnits: number;
  onOpenShareModal?: () => void;
}

const DAYS: DayOfWeek[] = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
const TIME_BLOCKS = [
  { start: '08:00', end: '10:00', label: '۰۸:۰۰ - ۱۰:۰۰' },
  { start: '10:00', end: '12:00', label: '۱۰:۰۰ - ۱۲:۰۰' },
  { start: '12:00', end: '14:00', label: '۱۲:۰۰ - ۱۴:۰۰' },
  { start: '14:00', end: '16:00', label: '۱۴:۰۰ - ۱۶:۰۰' },
  { start: '16:00', end: '18:00', label: '۱۶:۰۰ - ۱۸:۰۰' },
  { start: '18:00', end: '20:00', label: '۱۸:۰۰ - ۲۰:۰۰' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedCourses,
  gender,
  selectedPracticalGroups,
  minUnits,
  maxUnits,
  onOpenShareModal,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isRenderingImage, setIsRenderingImage] = useState(false);

  if (!isOpen) return null;

  const totalUnits = Number(
    selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
  );
  const specializedUnits = Number(
    selectedCourses
      .filter((c) => c.category === 'specialized')
      .reduce((sum, c) => sum + c.units.total, 0)
      .toFixed(2)
  );
  const generalUnits = Number(
    selectedCourses
      .filter((c) => c.category === 'general')
      .reduce((sum, c) => sum + c.units.total, 0)
      .toFixed(2)
  );

  // All exams sorted
  const exams: {
    courseName: string;
    courseCode: string;
    date: string;
    type: string;
    notes?: string;
  }[] = [];

  for (const c of selectedCourses) {
    if (c.midtermExam) {
      exams.push({
        courseName: c.name,
        courseCode: c.code,
        date: c.midtermExam.date,
        type: c.midtermExam.isFullDeletion ? 'حذفی کامل' : 'میان‌ترم',
        notes: c.midtermExam.notes,
      });
    }
    if (c.finalExam) {
      exams.push({
        courseName: c.name,
        courseCode: c.code,
        date: c.finalExam.date,
        type: 'پایان‌ترم متمرکز',
        notes: c.finalExam.notes,
      });
    }
  }
  exams.sort((a, b) => a.date.localeCompare(b.date));

  // 1. PDF / Print Action
  const handlePrint = () => {
    window.print();
  };

  // 2. Standalone HTML Export Action
  const handleExportHtml = () => {
    const coursesRows = selectedCourses
      .map(
        (c, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${c.name}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${c.code}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${c.term}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${c.units.total} (${c.units.theory} ن + ${c.units.practical} ع)</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${c.category === 'specialized' ? 'تخصصی/پایه' : 'عمومی'}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${c.instructors}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${c.finalExam ? c.finalExam.date : 'فاقد آزمون متمرکز'}</td>
      </tr>
    `
      )
      .join('');

    const examRows = exams
      .map(
        (e) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; font-family: monospace;">${e.date}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${e.courseName}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${e.type}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;">${e.notes || '-'}</td>
      </tr>
    `
      )
      .join('');

    // Weekly schedule table cells
    let scheduleGridHtml = '';
    for (const block of TIME_BLOCKS) {
      scheduleGridHtml += `<tr><td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; background: #f8fafc;">${block.label}</td>`;

      for (const day of DAYS) {
        const definiteMatches: string[] = [];
        const tentativeMatches: { courseName: string; groupName: string; time: string }[] = [];

        for (const c of selectedCourses) {
          const slots = getActiveSlotsForCourse(
            c,
            gender,
            selectedPracticalGroups[c.id]
          );
          for (const s of slots) {
            if (s.day === day && s.startTime < block.end && block.start < s.endTime) {
              if (s.isTentative) {
                tentativeMatches.push({
                  courseName: getShortCourseName(c.name),
                  groupName: s.groupName || s.label || 'عملی',
                  time: `${s.startTime}-${s.endTime}`,
                });
              } else {
                definiteMatches.push(`<div style="margin-bottom: 4px; padding: 5px; background: #ccfbf1; border: 1px solid #14b8a6; border-radius: 4px; font-size: 11px; color: #0f766e;">
                  <strong>${getShortCourseName(c.name)}</strong><br/>
                  <span style="font-size: 10px; color: #475569;">${s.startTime}-${s.endTime} ${s.label || ''}</span>
                </div>`);
              }
            }
          }
        }

        let cellContent = definiteMatches.join('');
        if (tentativeMatches.length > 0) {
          cellContent += `<div style="margin-top: 4px; padding: 5px; background: #eef2ff; border: 1px dashed #818cf8; border-radius: 4px; font-size: 10px; color: #312e81;">
            <strong style="color: #4338ca; display: block; margin-bottom: 3px;">🌀 بازه‌های عملی شناور (انتخاب در آینده):</strong>
            ${tentativeMatches.map(t => `<div style="margin-bottom: 2px;">• <b>${t.courseName}</b> (${t.groupName} | ${t.time})</div>`).join('')}
          </div>`;
        }

        scheduleGridHtml += `<td style="padding: 6px; border: 1px solid #cbd5e1; vertical-align: top;">${cellContent}</td>`;
      }

      scheduleGridHtml += '</tr>';
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>برنامه انتخاب واحد و تقویم آموزشی</title>
  <style>
    body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Tahoma", "Vazir", sans-serif; direction: rtl; padding: 25px; background: #fff; color: #1e293b; line-height: 1.5; }
    h1, h2, h3 { color: #0f172a; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
    th { background: #0d9488; color: white; padding: 10px; border: 1px solid #0f766e; text-align: center; }
    .header-box { border: 2px solid #0d9488; border-radius: 12px; padding: 15px; margin-bottom: 20px; background: #f0fdfa; display: flex; justify-content: space-between; align-items: center; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-weight: bold; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header-box">
    <div>
      <h2 style="margin-bottom: 4px;">سامانه انتخاب واحد علوم پایه پزشکی</h2>
      <p style="margin: 0; font-size: 13px; color: #334155;">گزارش جامع انتخاب واحد، برنامه هفتگی و گاهشمار امتحانات نیمسال</p>
    </div>
    <div style="text-align: left; font-size: 12px;">
      <p style="margin: 2px 0;"><strong>مجموع واحد اخذ شده:</strong> ${totalUnits} واحد</p>
      <p style="margin: 2px 0;">(تخصصی/پایه: ${specializedUnits} | عمومی: ${generalUnits})</p>
      <p style="margin: 2px 0;"><strong>جنسیت برنامه عمومی:</strong> ${gender === 'male' ? 'برادران' : 'خواهران'}</p>
    </div>
  </div>

  <h3>۱. فهرست دروس انتخابی (${selectedCourses.length} درس)</h3>
  <table>
    <thead>
      <tr>
        <th>ردیف</th>
        <th>نام درس</th>
        <th>کد درس</th>
        <th>ترم</th>
        <th>تعداد واحد</th>
        <th>نوع</th>
        <th>مدرس / اساتید</th>
        <th>تاریخ امتحان پایان‌ترم</th>
      </tr>
    </thead>
    <tbody>
      ${coursesRows}
    </tbody>
  </table>

  <h3>۲. جدول برنامه هفتگی کلاس‌ها (شنبه تا چهارشنبه)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 120px;">ساعت / روز</th>
        <th>شنبه</th>
        <th>یکشنبه</th>
        <th>دوشنبه</th>
        <th>سه‌شنبه</th>
        <th>چهارشنبه</th>
      </tr>
    </thead>
    <tbody>
      ${scheduleGridHtml}
    </tbody>
  </table>

  <h3>۳. گاهشمار امتحانات (میان‌ترم و پایان‌ترم)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 130px;">تاریخ آزمون</th>
        <th>نام درس</th>
        <th style="width: 140px;">نوع آزمون</th>
        <th>توضیحات و سرفصل</th>
      </tr>
    </thead>
    <tbody>
      ${examRows}
    </tbody>
  </table>

  <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    تولید شده توسط سامانه هوشمند انتخاب واحد علوم پایه پزشکی • کاملاً آفلاین و محلی
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entekhab-vahed-medical-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('HTML');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. Pure Canvas PNG Image Export Action (100% Offline, no CDN!)
  const handleExportPng = () => {
    setIsRenderingImage(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 1600;
      const rowH = 124;
      const headerH = 45;
      const gridX = 40;
      const gridY = 150;
      const gridW = width - 80;
      const colW = gridW / 6;

      const examY = gridY + headerH + TIME_BLOCKS.length * rowH + 25;
      const height = examY + 200; // Exact, proportional total height

      canvas.width = width;
      canvas.height = height;

      // Background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Header Banner
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(40, 30, width - 80, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('برنامه هفتگی و گزارش انتخاب واحد علوم پایه پزشکی', width - 70, 75);

      ctx.font = '18px Tahoma, Vazir, system-ui, sans-serif';
      ctx.fillText(
        `مجموع واحد: ${totalUnits} (پایه: ${specializedUnits} | عمومی: ${generalUnits})  •  تعداد دروس: ${selectedCourses.length}  •  جنسیت: ${
          gender === 'male' ? 'برادران' : 'خواهران'
        }`,
        width - 70,
        108
      );

      // Weekly Schedule Grid
      // Header Row
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(gridX, gridY, gridW, headerH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText('ساعت / روز', gridX + colW * 5.5, gridY + 28);
      DAYS.forEach((day, idx) => {
        ctx.fillText(day, gridX + colW * (4.5 - idx), gridY + 28);
      });

      // Time Blocks and Grid lines
      TIME_BLOCKS.forEach((block, rowIdx) => {
        const y = gridY + headerH + rowIdx * rowH;

        // Row background
        ctx.fillStyle = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
        ctx.fillRect(gridX, y, gridW, rowH);

        // Block Label Cell (Rightmost column)
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px Tahoma, Vazir, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(block.label, gridX + colW * 5.5, y + rowH / 2 + 5);

        // Draw slots for each day
        DAYS.forEach((day, dayIdx) => {
          const x = gridX + colW * (4 - dayIdx);

          const cellDefinite: {
            courseId: string;
            courseName: string;
            shortName: string;
            time: string;
            label: string;
            instructors: string;
          }[] = [];

          const cellTentative: {
            courseId: string;
            courseName: string;
            shortName: string;
            groupLabel: string;
            time: string;
          }[] = [];

          selectedCourses.forEach((c) => {
            const slots = getActiveSlotsForCourse(
              c,
              gender,
              selectedPracticalGroups[c.id]
            );
            slots.forEach((s) => {
              if (
                s.day === day &&
                s.startTime < block.end &&
                block.start < s.endTime
              ) {
                const shortName = getShortCourseName(c.name);
                if (s.isTentative) {
                  cellTentative.push({
                    courseId: c.id,
                    courseName: c.name,
                    shortName,
                    groupLabel: getShortGroupLabel(s.groupName, s.label),
                    time: `${s.startTime}-${s.endTime}`,
                  });
                } else {
                  cellDefinite.push({
                    courseId: c.id,
                    courseName: c.name,
                    shortName,
                    time: `${s.startTime}-${s.endTime}`,
                    label: s.label || '',
                    instructors: c.instructors,
                  });
                }
              }
            });
          });

          // Group tentative practicals by courseId so multiple groups or labs don't explode the box
          const tentativeMap = new Map<string, { shortName: string; groups: string[]; time: string }>();
          cellTentative.forEach((item) => {
            const existing = tentativeMap.get(item.courseId);
            if (existing) {
              if (!existing.groups.includes(item.groupLabel)) {
                existing.groups.push(item.groupLabel);
              }
            } else {
              tentativeMap.set(item.courseId, {
                shortName: item.shortName,
                groups: [item.groupLabel],
                time: item.time,
              });
            }
          });
          const groupedTentative = Array.from(tentativeMap.values());

          // CRITICAL: Cell Clipping boundary - guarantees zero overflow outside the cell
          ctx.save();
          ctx.beginPath();
          ctx.rect(x + 2, y + 2, colW - 4, rowH - 4);
          ctx.clip();

          const innerW = colW - 8;

          // Render Logic:
          // Case 1: Both Definite and Tentative
          if (cellDefinite.length > 0 && groupedTentative.length > 0) {
            const d = cellDefinite[0];
            const defH = 54;
            ctx.fillStyle = '#ccfbf1';
            ctx.strokeStyle = '#0d9488';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 3, innerW, defH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0f766e';
            ctx.font = 'bold 12px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, d.shortName, innerW - 14), x + colW / 2, y + 20);

            ctx.fillStyle = '#334155';
            ctx.font = '10px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, `${d.time} • ${d.label || 'نظری'}`, innerW - 14), x + colW / 2, y + 36);

            ctx.fillStyle = '#64748b';
            ctx.font = '9px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, d.instructors.split('(')[0], innerW - 14), x + colW / 2, y + 49);

            // Tentative box
            const tentY = y + 60;
            const tentH = rowH - 64;
            ctx.fillStyle = '#eef2ff';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(x + 4, tentY, innerW, tentH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#3730a3';
            ctx.font = 'bold 10px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText('🌀 عملی شناور (انتخاب در آینده)', x + colW / 2, tentY + 14);

            if (groupedTentative.length === 1) {
              const g0 = groupedTentative[0];
              ctx.fillStyle = '#1e1b4b';
              ctx.font = 'bold 10.5px Tahoma, Vazir, system-ui, sans-serif';
              ctx.fillText(fitCanvasText(ctx, `• ${g0.shortName}`, innerW - 14), x + colW / 2, tentY + 29);

              ctx.fillStyle = '#4f46e5';
              ctx.font = '9.5px Tahoma, Vazir, system-ui, sans-serif';
              ctx.fillText(fitCanvasText(ctx, `(${g0.groups.join('، ')}) ${g0.time}`, innerW - 14), x + colW / 2, tentY + 44);
            } else {
              groupedTentative.slice(0, 2).forEach((g, idx) => {
                ctx.fillStyle = '#1e1b4b';
                ctx.font = '9.5px Tahoma, Vazir, system-ui, sans-serif';
                const label = `• ${g.shortName} (${g.groups[0] || 'عملی'})`;
                ctx.fillText(fitCanvasText(ctx, label, innerW - 14), x + colW / 2, tentY + 28 + idx * 16);
              });
            }
          }
          // Case 2: Only Definite
          else if (cellDefinite.length > 0) {
            const d = cellDefinite[0];
            ctx.fillStyle = '#f0fdfa';
            ctx.strokeStyle = '#0d9488';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, innerW, rowH - 8, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#0f766e';
            ctx.font = 'bold 13px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, d.shortName, innerW - 16), x + colW / 2, y + 28);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 11px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(`${d.time} • ${d.label || 'نظری'}`, x + colW / 2, y + 50);

            ctx.fillStyle = '#475569';
            ctx.font = '10px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, d.instructors, innerW - 16), x + colW / 2, y + 72);

            ctx.fillStyle = '#0d9488';
            ctx.font = 'bold 10px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText('✓ کلاس ثابت انتخابی', x + colW / 2, y + 94);
          }
          // Case 3: Only Tentative (No definite slot)
          else if (groupedTentative.length > 0) {
            ctx.fillStyle = '#eef2ff';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, innerW, rowH - 8, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#3730a3';
            ctx.font = 'bold 11.5px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText('🌀 بازه‌های عملی شناور (انتخاب آتی)', x + colW / 2, y + 23);

            if (groupedTentative.length === 1) {
              const g0 = groupedTentative[0];
              ctx.fillStyle = '#1e1b4b';
              ctx.font = 'bold 12.5px Tahoma, Vazir, system-ui, sans-serif';
              ctx.fillText(fitCanvasText(ctx, g0.shortName, innerW - 16), x + colW / 2, y + 46);

              ctx.fillStyle = '#4338ca';
              ctx.font = '10.5px Tahoma, Vazir, system-ui, sans-serif';
              ctx.fillText(fitCanvasText(ctx, `گروه‌ها: ${g0.groups.join('، ')}`, innerW - 16), x + colW / 2, y + 68);

              ctx.fillStyle = '#64748b';
              ctx.font = '10px Tahoma, Vazir, system-ui, sans-serif';
              ctx.fillText(`ساعت: ${g0.time}`, x + colW / 2, y + 88);
            } else if (groupedTentative.length === 2) {
              groupedTentative.forEach((g, idx) => {
                const itemY = y + 44 + idx * 34;
                ctx.fillStyle = '#1e1b4b';
                ctx.font = 'bold 11px Tahoma, Vazir, system-ui, sans-serif';
                ctx.fillText(fitCanvasText(ctx, `• ${g.shortName}`, innerW - 16), x + colW / 2, itemY);

                ctx.fillStyle = '#4338ca';
                ctx.font = '10px Tahoma, Vazir, system-ui, sans-serif';
                ctx.fillText(fitCanvasText(ctx, `(${g.groups.join('، ')}) ${g.time}`, innerW - 16), x + colW / 2, itemY + 16);
              });
            } else {
              groupedTentative.slice(0, 3).forEach((g, idx) => {
                ctx.fillStyle = '#1e1b4b';
                ctx.font = '10px Tahoma, Vazir, system-ui, sans-serif';
                ctx.fillText(fitCanvasText(ctx, `• ${g.shortName} (${g.groups[0] || 'عملی'})`, innerW - 16), x + colW / 2, y + 44 + idx * 20);
              });
              if (groupedTentative.length > 3) {
                ctx.fillStyle = '#6366f1';
                ctx.font = '9px Tahoma, Vazir, system-ui, sans-serif';
                ctx.fillText(`+ ${groupedTentative.length - 3} درس عملی دیگر`, x + colW / 2, y + 104);
              }
            }
          }

          ctx.restore(); // Restore context to remove clipping

          // Cell borders
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, colW, rowH);
        });

        // Left cell border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(gridX + colW * 5, y, colW, rowH);
      });

      // Exams Section at the bottom of the image
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 20px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('گاهشمار امتحانات نیمسال (میان‌ترم و پایان‌ترم):', width - 40, examY);

      const examBoxW = (width - 100) / 4;
      exams.slice(0, 8).forEach((e, idx) => {
        const exX = width - 40 - (idx % 4 + 1) * examBoxW - (idx % 4) * 6;
        const exY = examY + 15 + Math.floor(idx / 4) * 64;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(exX, exY, examBoxW, 56, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = e.type === 'midterm' ? '#b45309' : '#0f766e';
        ctx.font = 'bold 12px Tahoma, Vazir, system-ui, sans-serif';
        const typeLabel = e.type === 'midterm' ? 'میان‌ترم' : 'پایان‌ترم';
        ctx.fillText(`${e.date} (${typeLabel})`, exX + examBoxW - 10, exY + 22);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px Tahoma, Vazir, system-ui, sans-serif';
        const shortExamName = getShortCourseName(e.courseName);
        ctx.fillText(fitCanvasText(ctx, shortExamName, examBoxW - 20), exX + examBoxW - 10, exY + 42);
      });

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `entekhab-vahed-schedule-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess('PNG');
      setTimeout(() => setDownloadSuccess(null), 3000);
    } catch (err) {
      console.error('Error rendering PNG:', err);
    } finally {
      setIsRenderingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              ماژول خروجی‌گرفتن جامع (Export Engine)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            شما می‌توانید برنامه انتخاب واحد خود را به همراه لیست کامل دروس، جدول هفتگی و گاهشمار امتحانات با کیفیت بالا و به صورت ۱۰۰٪ آفلاین ذخیره نمایید.
          </p>

          {/* Quick Summary Pill */}
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-teal-950">
            <div>
              <span className="font-bold">{selectedCourses.length} درس</span> در سبد انتخابی شما قرار دارد
            </div>
            <div className="font-mono font-bold">
              مجموع: {totalUnits} واحد (کف {minUnits} | سقف {maxUnits})
            </div>
          </div>

          {/* Format Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Option 1: PDF / Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-right transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-1">
                  خروجی PDF / پرینت
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  استفاده از CSS اختصاصی چاپ A4 افقی، حذف کلیدها و کنترل‌ها.
                </p>
              </div>
              <span className="mt-4 text-[11px] font-bold text-teal-700 flex items-center gap-1">
                <span>چاپ یا ذخیره PDF</span>
                <span>←</span>
              </span>
            </button>

            {/* Option 2: Standalone HTML */}
            <button
              type="button"
              onClick={handleExportHtml}
              className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-right transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-1">
                  فایل HTML خودکفا
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  تولید یک فایل وب کامل با استایل درون‌خطی و قابل اجرا در هر دستگاه بدون اینترنت.
                </p>
              </div>
              <span className="mt-4 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                {downloadSuccess === 'HTML' ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> دانلود شد
                  </span>
                ) : (
                  <>
                    <span>دانلود فایل HTML</span>
                    <span>←</span>
                  </>
                )}
              </span>
            </button>

            {/* Option 3: PNG Image */}
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isRenderingImage}
              className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-right transition-all flex flex-col justify-between disabled:opacity-50"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-slate-900 mb-1">
                  عکس باکیفیت (PNG)
                </h4>
                <p className="text-[11px] text-slate-500 leading-snug">
                  رندر محلی روی Canvas رزولوشن بالا مناسب برای اشتراک در تلگرام و ذخیره در گالری.
                </p>
              </div>
              <span className="mt-4 text-[11px] font-bold text-amber-700 flex items-center gap-1">
                {isRenderingImage ? (
                  <span>در حال ساخت عکس...</span>
                ) : downloadSuccess === 'PNG' ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> دانلود شد
                  </span>
                ) : (
                  <>
                    <span>دانلود عکس PNG</span>
                    <span>←</span>
                  </>
                )}
              </span>
            </button>

          </div>

          {/* Option 4: Shareable Link Banner */}
          {onOpenShareModal && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    اشتراک‌گذاری لینک مستقیم و قابل ویرایش
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    ایجاد آدرس کوتاه اینترنتی حاوی دروس و گروه‌ها جهت ارسال برای دوستان بدون نیاز به ارسال فایل
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShareModal();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>دریافت لینک اشتراک</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
