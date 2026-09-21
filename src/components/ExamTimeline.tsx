import React from 'react';
import { Course } from '../types';
import { Calendar, AlertCircle, Clock, CheckCircle, FileText, ChevronRight } from 'lucide-react';

interface ExamTimelineProps {
  selectedCourses: Course[];
  allCourses: Course[];
}

interface ExamEntry {
  courseId: string;
  courseName: string;
  courseCode: string;
  term: number;
  date: string;
  time?: string;
  type: 'midterm' | 'final';
  isFullDeletion?: boolean;
  notes?: string;
  isSelected: boolean;
}

export const ExamTimeline: React.FC<ExamTimelineProps> = ({
  selectedCourses,
  allCourses,
}) => {
  const [filterMode, setFilterMode] = React.useState<'selected' | 'all'>('selected');

  // Extract all exams
  const targetCourses = filterMode === 'selected' ? selectedCourses : allCourses;

  const exams: ExamEntry[] = [];
  for (const course of targetCourses) {
    const isSelected = selectedCourses.some((sc) => sc.id === course.id);

    if (course.midtermExam) {
      exams.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        term: course.term,
        date: course.midtermExam.date,
        time: course.midtermExam.time,
        type: 'midterm',
        isFullDeletion: course.midtermExam.isFullDeletion,
        notes: course.midtermExam.notes,
        isSelected,
      });
    }

    if (course.finalExam) {
      exams.push({
        courseId: course.id,
        courseName: course.name,
        courseCode: course.code,
        term: course.term,
        date: course.finalExam.date,
        time: course.finalExam.time,
        type: 'final',
        notes: course.finalExam.notes,
        isSelected,
      });
    }
  }

  // Sort exams chronologically by date
  exams.sort((a, b) => a.date.localeCompare(b.date));

  // Group by date to detect exam collisions
  const groupedByDate: Record<string, ExamEntry[]> = {};
  for (const exam of exams) {
    if (!groupedByDate[exam.date]) {
      groupedByDate[exam.date] = [];
    }
    groupedByDate[exam.date].push(exam);
  }

  const sortedDates = Object.keys(groupedByDate).sort();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              گاهشمار امتحانات (میان‌ترم‌های حذفی و پایان‌ترم متمرکز)
            </h2>
            <p className="text-xs text-slate-500">
              مرتب‌شده بر اساس تقویم زمانی نیمسال با ردیابی هوشمند همزمانی آزمون‌ها
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterMode('selected')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterMode === 'selected'
                ? 'bg-white text-teal-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            دروس انتخابی ({selectedCourses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              filterMode === 'all'
                ? 'bg-white text-teal-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            همه آزمون‌ها ({allCourses.length} درس)
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      {sortedDates.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">هیچ امتحانی در لیست انتخابی شما قرار ندارد.</p>
        </div>
      ) : (
        <div className="mt-5 relative">
          
          {/* Vertical line running through the timeline */}
          <div className="absolute top-2 bottom-2 right-[27px] w-0.5 bg-slate-200 hidden sm:block"></div>

          <div className="space-y-4">
            {sortedDates.map((date) => {
              const dayExams = groupedByDate[date];
              const hasCollision = dayExams.length > 1;

              return (
                <div
                  key={date}
                  className={`flex flex-col sm:flex-row gap-3 sm:gap-6 items-start relative ${
                    hasCollision ? 'p-3 bg-rose-50/50 rounded-2xl border border-rose-200' : ''
                  }`}
                >
                  
                  {/* Date Badge / Dot */}
                  <div className="flex items-center gap-3 shrink-0 sm:w-36">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-mono text-xs font-bold shadow-xs ${
                        hasCollision
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                          : 'bg-teal-600 text-white ring-4 ring-teal-50'
                      }`}
                    >
                      {hasCollision ? '!' : '📅'}
                    </div>

                    <div>
                      <span className="text-xs font-mono font-black text-slate-900 block tracking-tight">
                        {date}
                      </span>
                      {hasCollision ? (
                        <span className="text-[10px] font-bold text-rose-600 block">
                          ⚠️ {dayExams.length} امتحان در یک روز!
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 block">
                          تک‌آزمون
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cards for exams on this date */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2.5 w-full">
                    {dayExams.map((exam, idx) => (
                      <div
                        key={`${exam.courseId}-${exam.type}-${idx}`}
                        className={`p-3 rounded-xl border text-xs transition-all shadow-2xs ${
                          hasCollision
                            ? 'bg-white border-rose-300 ring-1 ring-rose-200'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900 leading-tight">
                              {exam.courseName}
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              کد {exam.courseCode} • ترم {exam.term}
                            </p>
                          </div>

                          {/* Type badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                              exam.isFullDeletion
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : exam.type === 'midterm'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-teal-100 text-teal-900 border border-teal-200'
                            }`}
                          >
                            {exam.isFullDeletion
                              ? 'حذفی کامل'
                              : exam.type === 'midterm'
                              ? 'میان‌ترم'
                              : 'پایان‌ترم'}
                          </span>
                        </div>

                        {exam.notes && (
                          <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{exam.notes}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
