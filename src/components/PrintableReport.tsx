import React from 'react';
import { Course, DayOfWeek } from '../types';
import { getActiveSlotsForCourse } from '../utils/conflictDetector';
import { getShortCourseName } from '../utils/formatters';

interface PrintableReportProps {
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
  minUnits: number;
  maxUnits: number;
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

export const PrintableReport: React.FC<PrintableReportProps> = ({
  selectedCourses,
  gender,
  selectedPracticalGroups,
  minUnits,
  maxUnits,
}) => {
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

  // Sorted exams
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

  return (
    <div id="unified-printable-report" className="hidden print:block p-6 text-black bg-white">
      
      {/* Header Banner */}
      <div className="border-2 border-teal-800 rounded-xl p-4 mb-6 flex justify-between items-center print-force-bg bg-teal-50">
        <div>
          <h1 className="text-xl font-black text-teal-950 mb-1">
            برنامه رسمی انتخاب واحد علوم پایه پزشکی
          </h1>
          <p className="text-xs text-slate-700">
            گزارش جامع شامل فهرست دروس اخذ شده، جدول هفتگی و تقویم امتحانات نیمسال
          </p>
        </div>
        <div className="text-left text-xs font-medium space-y-0.5">
          <p><strong>مجموع واحد اخذ شده:</strong> {totalUnits} واحد</p>
          <p><strong>تخصصی/پایه:</strong> {specializedUnits} واحد | <strong>عمومی:</strong> {generalUnits} واحد</p>
          <p><strong>محدوده مجاز:</strong> کف {minUnits} تا سقف {maxUnits} واحد</p>
          <p><strong>برنامه عمومی:</strong> تفکیک {gender === 'male' ? 'برادران' : 'خواهران'}</p>
        </div>
      </div>

      {/* Section 1: Selected Courses */}
      <div className="mb-6 print-break-inside-avoid">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1">
          ۱. فهرست دروس انتخابی ({selectedCourses.length} درس)
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 print-force-bg">
              <th className="border border-slate-300 p-1.5 w-8 text-center">#</th>
              <th className="border border-slate-300 p-1.5 text-right">نام درس</th>
              <th className="border border-slate-300 p-1.5 text-center w-24">کد درس</th>
              <th className="border border-slate-300 p-1.5 text-center w-12">ترم</th>
              <th className="border border-slate-300 p-1.5 text-center w-24">واحد (ن+ع)</th>
              <th className="border border-slate-300 p-1.5 text-center w-24">نوع</th>
              <th className="border border-slate-300 p-1.5 text-right">مدرسین</th>
              <th className="border border-slate-300 p-1.5 text-center w-28">آزمون پایان‌ترم</th>
            </tr>
          </thead>
          <tbody>
            {selectedCourses.map((c, idx) => (
              <tr key={c.id} className="border-b border-slate-200">
                <td className="border border-slate-300 p-1.5 text-center font-mono">{idx + 1}</td>
                <td className="border border-slate-300 p-1.5 font-bold">{c.name}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono text-[11px]">{c.code}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono">{c.term}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono">
                  {c.units.total} ({c.units.theory}+{c.units.practical})
                </td>
                <td className="border border-slate-300 p-1.5 text-center">
                  {c.category === 'specialized' ? 'پایه/تخصصی' : 'عمومی'}
                </td>
                <td className="border border-slate-300 p-1.5 text-[11px]">{c.instructors}</td>
                <td className="border border-slate-300 p-1.5 text-center font-mono text-[11px]">
                  {c.finalExam ? c.finalExam.date : 'فاقد کتبی'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 2: Weekly Schedule Table */}
      <div className="mb-6 print-break-inside-avoid">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1">
          ۲. جدول برنامه هفتگی کلاسی (شنبه تا چهارشنبه)
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 print-force-bg">
              <th className="border border-slate-300 p-2 text-center w-28">ساعت / روز</th>
              {DAYS.map((d) => (
                <th key={d} className="border border-slate-300 p-2 text-center">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_BLOCKS.map((block) => (
              <tr key={block.start} className="border-b border-slate-200 min-h-12">
                <td className="border border-slate-300 p-1.5 text-center font-bold font-mono bg-slate-50 print-force-bg">
                  {block.label}
                </td>
                {DAYS.map((day) => {
                  const definiteSlots: { courseName: string; time: string; label?: string }[] = [];
                  const tentativeSlots: { courseName: string; time: string; label?: string; groupName?: string }[] = [];

                  for (const c of selectedCourses) {
                    const slots = getActiveSlotsForCourse(
                      c,
                      gender,
                      selectedPracticalGroups[c.id]
                    );
                    for (const s of slots) {
                      if (s.day === day && s.startTime < block.end && block.start < s.endTime) {
                        if (s.isTentative) {
                          tentativeSlots.push({
                            courseName: c.name,
                            time: `${s.startTime}-${s.endTime}`,
                            label: s.label,
                            groupName: s.groupName,
                          });
                        } else {
                          definiteSlots.push({
                            courseName: c.name,
                            time: `${s.startTime}-${s.endTime}`,
                            label: s.label,
                          });
                        }
                      }
                    }
                  }

                  return (
                    <td key={day} className="border border-slate-300 p-1.5 align-top text-[11px]">
                      {/* Definite confirmed classes */}
                      {definiteSlots.map((item, i) => (
                        <div
                          key={i}
                          className="mb-1.5 p-1 rounded border bg-teal-50 border-teal-300 text-teal-950"
                        >
                          <div className="font-bold">{getShortCourseName(item.courseName)}</div>
                          <div className="text-[10px] text-slate-600">
                            {item.time} {item.label ? `(${item.label})` : ''}
                          </div>
                        </div>
                      ))}

                      {/* Grouped tentative practical classes */}
                      {tentativeSlots.length > 0 && (
                        <div className="p-1.5 rounded border border-dashed border-indigo-400 bg-indigo-50/70 text-indigo-950">
                          <div className="font-bold text-[10px] text-indigo-900 mb-1 border-b border-indigo-200 pb-0.5">
                            🌀 بازه‌های عملی شناور (انتخاب در آینده):
                          </div>
                          <div className="space-y-1">
                            {tentativeSlots.map((item, i) => (
                              <div key={i} className="text-[10px] leading-tight">
                                <span className="font-semibold text-indigo-950">{getShortCourseName(item.courseName)}</span>
                                <span className="text-slate-600 mr-1">[{item.groupName || item.label || 'عملی'}]</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 3: Exam Timeline Table */}
      <div className="print-break-inside-avoid">
        <h2 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1">
          ۳. گاهشمار امتحانات میان‌ترم و پایان‌ترم
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 print-force-bg">
              <th className="border border-slate-300 p-1.5 text-center w-32">تاریخ امتحان</th>
              <th className="border border-slate-300 p-1.5 text-right">نام درس</th>
              <th className="border border-slate-300 p-1.5 text-center w-36">نوع آزمون</th>
              <th className="border border-slate-300 p-1.5 text-right">توضیحات آزمون</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-teal-900">
                  {e.date}
                </td>
                <td className="border border-slate-300 p-1.5 font-bold">{e.courseName}</td>
                <td className="border border-slate-300 p-1.5 text-center">{e.type}</td>
                <td className="border border-slate-300 p-1.5 text-slate-600 text-[11px]">{e.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 text-center text-[10px] text-slate-500 border-t border-slate-300 pt-2">
        سامانه هوشمند و تعاملی انتخاب واحد علوم پایه پزشکی • خروجی یکپارچه و استاندارد
      </div>
    </div>
  );
};
