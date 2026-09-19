import React, { useState } from 'react';
import { Course, DayOfWeek, TimeSlot } from '../types';
import { getActiveSlotsForCourse } from '../utils/conflictDetector';
import { getShortCourseName } from '../utils/formatters';
import {
  Download,
  Printer,
  FileCode,
  Image as ImageIcon,
  Share2,
  Check,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface ExportContentProps {
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
  minUnits: number;
  maxUnits: number;
  onOpenShareModal?: () => void;
  onReturnToSchedule?: () => void;
}

const DAYS: DayOfWeek[] = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه'];
const TIME_BLOCKS = [
  { label: '۰۸:۰۰ - ۱۰:۰۰', start: '08:00', end: '10:00' },
  { label: '۱۰:۰۰ - ۱۲:۰۰', start: '10:00', end: '12:00' },
  { label: '۱۳:۰۰ - ۱۵:۰۰', start: '13:00', end: '15:00' },
  { label: '۱۵:۰۰ - ۱۷:۰۰', start: '15:00', end: '17:00' },
  { label: '۱۷:۰۰ - ۱۹:۰۰', start: '17:00', end: '19:00' },
];

export const ExportContent: React.FC<ExportContentProps> = ({
  selectedCourses,
  gender,
  selectedPracticalGroups,
  minUnits,
  maxUnits,
  onOpenShareModal,
  onReturnToSchedule,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isRenderingImage, setIsRenderingImage] = useState(false);

  const totalUnits = Number(
    selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2)
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
                  courseName: c.name,
                  groupName: s.groupName || 'عملی',
                  time: `${s.startTime}-${s.endTime}`,
                });
              } else {
                definiteMatches.push(
                  `<strong>${getShortCourseName(c.name)}</strong> (${s.startTime}-${s.endTime})`
                );
              }
            }
          }
        }

        let cellContent = '';
        if (definiteMatches.length > 0) {
          cellContent += `<div style="background: #ccfbf1; color: #0f766e; padding: 4px; border-radius: 4px; margin-bottom: 2px;">${definiteMatches.join('<br/>')}</div>`;
        }
        if (tentativeMatches.length > 0) {
          cellContent += `<div style="background: #eef2ff; color: #4338ca; border: 1px dashed #818cf8; padding: 4px; border-radius: 4px; font-size: 11px;">عملی شناور:<br/>${tentativeMatches.map((t) => `${getShortCourseName(t.courseName)} (${t.groupName})`).join('<br/>')}</div>`;
        }
        if (!cellContent) {
          cellContent = '<span style="color: #cbd5e1;">-</span>';
        }

        scheduleGridHtml += `<td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">${cellContent}</td>`;
      }
      scheduleGridHtml += '</tr>';
    }

    const htmlDoc = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>برنامه انتخاب واحد علوم پایه پزشکی - ${totalUnits} واحد</title>
  <style>
    body { font-family: Tahoma, Vazirmatn, system-ui, sans-serif; padding: 24px; color: #0f172a; background: #f8fafc; line-height: 1.6; }
    .container { max-width: 1000px; margin: 0 auto; background: #fff; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    h1 { color: #0f766e; margin-top: 0; font-size: 22px; border-bottom: 2px solid #0f766e; padding-bottom: 12px; }
    h2 { color: #1e293b; font-size: 16px; margin-top: 28px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    th { background: #0f766e; color: #fff; padding: 10px; border: 1px solid #0f766e; }
    .badge { display: inline-block; padding: 4px 10px; background: #e2e8f0; border-radius: 6px; font-weight: bold; }
    .footer { text-align: center; font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>گزارش انتخاب واحد و برنامه هفتگی علوم پایه پزشکی</h1>
    <p>
      <strong>جنسیت:</strong> ${gender === 'male' ? 'برادران' : 'خواهران'} | 
      <strong>تعداد دروس:</strong> ${selectedCourses.length} درس | 
      <strong>مجموع واحدها:</strong> <span class="badge">${totalUnits} واحد</span> (کف: ${minUnits} | سقف: ${maxUnits})
    </p>

    <h2>فهرست دروس انتخابی</h2>
    <table>
      <thead>
        <tr>
          <th>ردیف</th>
          <th>نام درس</th>
          <th>کد درس</th>
          <th>ترم</th>
          <th>واحد</th>
          <th>دسته</th>
          <th>اساتید</th>
          <th>آزمون متمرکز</th>
        </tr>
      </thead>
      <tbody>
        ${coursesRows}
      </tbody>
    </table>

    <h2>جدول برنامه هفتگی کلاسی</h2>
    <table>
      <thead>
        <tr>
          <th>ساعت</th>
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

    <h2>گاهشمار امتحانات نیمسال</h2>
    <table>
      <thead>
        <tr>
          <th>تاریخ آزمون</th>
          <th>نام درس</th>
          <th>نوع آزمون</th>
          <th>توضیحات</th>
        </tr>
      </thead>
      <tbody>
        ${examRows}
      </tbody>
    </table>

    <div class="footer">
      تولیدشده به صورت خودکار توسط سامانه هوشمند انتخاب واحد علوم پایه پزشکی • تاریخ صدور: ${new Date().toLocaleDateString('fa-IR')}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entekhab-vahed-report-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess('HTML');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // 3. High-Res Canvas PNG Export Action
  const handleExportPng = async () => {
    try {
      setIsRenderingImage(true);

      const width = 1600;
      const height = 1100;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Header Bar
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, width, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.direction = 'rtl';
      ctx.fillText(
        'سامانه هوشمند انتخاب واحد علوم پایه پزشکی - جدول هفتگی و امتحانات',
        width - 40,
        54
      );

      ctx.font = '14px Tahoma, Vazir, system-ui, sans-serif';
      ctx.fillText(
        `جنسیت: ${gender === 'male' ? 'برادران' : 'خواهران'} | ${selectedCourses.length} درس انتخابی | مجموع: ${totalUnits} واحد (کف: ${minUnits} | سقف: ${maxUnits})`,
        width - 40,
        80
      );

      // Grid geometry
      const startX = 40;
      const startY = 130;
      const gridW = width - 80;
      const colW = gridW / 6;
      const rowH = 120;

      // Draw table header
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(startX, startY, gridW, 40);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(startX, startY, gridW, 40);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'center';

      ctx.fillText('ساعت / روز', startX + colW / 2, startY + 26);
      DAYS.forEach((d, idx) => {
        const x = startX + (idx + 1) * colW;
        ctx.fillText(d, x + colW / 2, startY + 26);
      });

      const fitCanvasText = (
        context: CanvasRenderingContext2D,
        text: string,
        maxW: number
      ): string => {
        if (context.measureText(text).width <= maxW) return text;
        let truncated = text;
        while (truncated.length > 1 && context.measureText(truncated + '...').width > maxW) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
      };

      TIME_BLOCKS.forEach((block, rIdx) => {
        const y = startY + 40 + rIdx * rowH;

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(startX, y, colW, rowH);
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(startX, y, colW, rowH);

        ctx.fillStyle = '#334155';
        ctx.font = 'bold 13px Tahoma, Vazir, system-ui, sans-serif';
        ctx.fillText(block.label, startX + colW / 2, y + rowH / 2 + 5);

        DAYS.forEach((day, cIdx) => {
          const x = startX + (cIdx + 1) * colW;
          const innerW = colW - 8;

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, colW, rowH);
          ctx.strokeStyle = '#e2e8f0';
          ctx.strokeRect(x, y, colW, rowH);

          const definiteMatches: { shortName: string; time: string; instructors: string; label?: string }[] = [];
          const tentativeMatches: { shortName: string; groupName: string; time: string }[] = [];

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
                    shortName: getShortCourseName(c.name),
                    groupName: s.groupName || 'عملی',
                    time: `${s.startTime}-${s.endTime}`,
                  });
                } else {
                  definiteMatches.push({
                    shortName: getShortCourseName(c.name),
                    time: `${s.startTime}-${s.endTime}`,
                    instructors: c.instructors,
                    label: s.label,
                  });
                }
              }
            }
          }

          if (definiteMatches.length > 0) {
            const d = definiteMatches[0];
            ctx.fillStyle = '#ccfbf1';
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
          } else if (tentativeMatches.length > 0) {
            ctx.fillStyle = '#eef2ff';
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, innerW, rowH - 8, 8);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#3730a3';
            ctx.font = 'bold 11.5px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText('🌀 بازه‌های عملی شناور', x + colW / 2, y + 24);

            const t0 = tentativeMatches[0];
            ctx.fillStyle = '#1e1b4b';
            ctx.font = 'bold 12px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, t0.shortName, innerW - 16), x + colW / 2, y + 48);

            ctx.fillStyle = '#4338ca';
            ctx.font = '10.5px Tahoma, Vazir, system-ui, sans-serif';
            ctx.fillText(fitCanvasText(ctx, `(${t0.groupName}) ${t0.time}`, innerW - 16), x + colW / 2, y + 72);
          }
        });
      });

      // Bottom exams strip
      const examY = startY + 40 + TIME_BLOCKS.length * rowH + 20;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(startX, examY, gridW, 140);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(startX, examY, gridW, 140);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 14px Tahoma, Vazir, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('گاهشمار امتحانات انتخابی:', width - 55, examY + 28);

      const examBoxW = (width - 100) / 4;
      exams.slice(0, 8).forEach((e, idx) => {
        const exX = width - 40 - ((idx % 4) + 1) * examBoxW - (idx % 4) * 6;
        const exY = examY + 40 + Math.floor(idx / 4) * 44;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(exX, exY, examBoxW, 38, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = e.type.includes('میان') ? '#b45309' : '#0f766e';
        ctx.font = 'bold 11px Tahoma, Vazir, system-ui, sans-serif';
        ctx.fillText(`${e.date} (${e.type})`, exX + examBoxW - 10, exY + 16);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Tahoma, Vazir, system-ui, sans-serif';
        ctx.fillText(fitCanvasText(ctx, getShortCourseName(e.courseName), examBoxW - 20), exX + examBoxW - 10, exY + 30);
      });

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
    <div className="space-y-4">
      {/* Quick Summary Pill */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-teal-950">
        <div className="flex items-center gap-2">
          <span className="font-bold text-teal-900">{selectedCourses.length} درس</span>
          <span>در سبد انتخابی قرار دارد</span>
        </div>
        <div className="font-mono font-bold text-teal-800">
          مجموع: {totalUnits} واحد (کف: {minUnits} | سقف: {maxUnits})
        </div>
      </div>

      {/* Format Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Option 1: PDF / Print */}
        <button
          type="button"
          onClick={handlePrint}
          className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 text-right transition-all flex flex-col justify-between bg-white shadow-2xs active:scale-[0.99]"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
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
          className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-right transition-all flex flex-col justify-between bg-white shadow-2xs active:scale-[0.99]"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
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
          className="group p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-right transition-all flex flex-col justify-between bg-white shadow-2xs active:scale-[0.99] disabled:opacity-50"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
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
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                اشتراک‌گذاری لینک مستقیم و آنلاین
              </h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                ایجاد آدرس کوتاه اینترنتی حاوی دروس و گروه‌ها جهت ارسال برای دوستان بدون نیاز به ارسال فایل
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenShareModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>دریافت لینک اشتراک</span>
          </button>
        </div>
      )}

      {/* Helper navigation back to schedule for mobile */}
      {onReturnToSchedule && (
        <div className="pt-2 flex justify-center">
          <button
            type="button"
            onClick={onReturnToSchedule}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs transition-colors"
          >
            <ArrowRight className="w-4 h-4 text-teal-600" />
            <span>بازگشت به جدول هفتگی کلاس‌ها</span>
          </button>
        </div>
      )}
    </div>
  );
};
