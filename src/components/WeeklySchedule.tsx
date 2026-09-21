import React from 'react';
import { Course, DayOfWeek, TimeSlot } from '../types';
import { getActiveSlotsForCourse, doSlotsOverlap } from '../utils/conflictDetector';
import { getShortCourseName } from '../utils/formatters';
import { AlertCircle, Clock, MapPin, User, Share2, BookmarkCheck, Smartphone, CheckCircle2 } from 'lucide-react';

interface WeeklyScheduleProps {
  selectedCourses: Course[];
  gender: 'male' | 'female';
  selectedPracticalGroups: Record<string, string>;
  hoveredCourseId: string | null;
  conflictingCourseIds: Set<string>;
  onCourseClick?: (courseId: string) => void;
  onCourseHover?: (courseId: string | null) => void;
  onOpenShareModal?: () => void;
  onOpenSemesterModal?: () => void;
  hasSavedSemesterSchedule?: boolean;
  isCurrentMatchingSaved?: boolean;
  isOpenedFromShortcut?: boolean;
  savedScheduleDate?: string | null;
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

interface RenderedSlot {
  course: Course;
  slot: TimeSlot;
  hasConflict: boolean;
  conflictingWithNames: string[];
}

export const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({
  selectedCourses,
  gender,
  selectedPracticalGroups,
  hoveredCourseId,
  conflictingCourseIds,
  onCourseClick,
  onCourseHover,
  onOpenShareModal,
  onOpenSemesterModal,
  hasSavedSemesterSchedule = false,
  isCurrentMatchingSaved = false,
  isOpenedFromShortcut = false,
  savedScheduleDate = null,
}) => {
  // Collect all active slots for all selected courses
  const allActiveSlots: { course: Course; slot: TimeSlot }[] = [];
  for (const course of selectedCourses) {
    const slots = getActiveSlotsForCourse(
      course,
      gender,
      selectedPracticalGroups[course.id]
    );
    for (const slot of slots) {
      allActiveSlots.push({ course, slot });
    }
  }

  // Helper to find slots belonging to a day and overlapping a given time block
  const getSlotsForCell = (day: DayOfWeek, blockStart: string, blockEnd: string): RenderedSlot[] => {
    const matching = allActiveSlots.filter(({ slot }) => {
      if (slot.day !== day) return false;
      return doSlotsOverlap(slot, { day, startTime: blockStart, endTime: blockEnd });
    });

    // Check overlaps within this cell or with other slots
    // Tentative practical slots are NOT counted as conflicts because they will be selected later
    return matching.map(({ course, slot }) => {
      const overlapsWith = slot.isTentative
        ? []
        : matching.filter(
            (m) =>
              m.course.id !== course.id &&
              !m.slot.isTentative &&
              doSlotsOverlap(slot, m.slot)
          );

      return {
        course,
        slot,
        hasConflict: overlapsWith.length > 0,
        conflictingWithNames: overlapsWith.map((o) => o.course.name),
      };
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      
      {/* Android Shortcut Notification Banner */}
      {isOpenedFromShortcut && (
        <div className="px-4 py-2.5 bg-linear-to-r from-teal-700 to-teal-800 text-white flex items-center justify-between gap-2 text-xs border-b border-teal-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="font-black">
              برنامه هفتگی قطعی ترم (فراخوانی‌شده از میانبر اندروید)
            </span>
            {savedScheduleDate && (
              <span className="text-[11px] text-teal-100/90 hidden sm:inline">
                ({savedScheduleDate})
              </span>
            )}
          </div>
          {onOpenSemesterModal && (
            <button
              type="button"
              onClick={onOpenSemesterModal}
              className="text-[11px] font-bold bg-white/15 hover:bg-white/25 px-2 py-1 rounded-md transition-colors"
            >
              مدیریت برنامه
            </button>
          )}
        </div>
      )}

      {/* Header bar of schedule */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-800">
            برنامه هفتگی کلاسی (شنبه تا چهارشنبه | ۰۸:۰۰ الی ۲۰:۰۰)
          </h2>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500"></span>
            کلاس قطعی
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-100 border border-dashed border-indigo-400"></span>
            بازه شناور عملی
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500"></span>
            تداخل زمانی
          </span>

          {onOpenSemesterModal && (
            <button
              type="button"
              onClick={onOpenSemesterModal}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors shadow-2xs mr-1 ${
                hasSavedSemesterSchedule
                  ? isCurrentMatchingSaved
                    ? 'text-teal-800 bg-teal-50 border-teal-300 hover:bg-teal-100'
                    : 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                  : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-50'
              }`}
              title="مدیریت برنامه قطعی ترم و میانبر اندروید"
            >
              <BookmarkCheck className={`w-3.5 h-3.5 ${hasSavedSemesterSchedule ? 'text-teal-600' : 'text-slate-500'}`} />
              <span>
                {hasSavedSemesterSchedule
                  ? isCurrentMatchingSaved
                    ? 'برنامه ترم ذخیره است ✓'
                    : 'برنامه ترم (تغییر یافته)'
                  : 'ذخیره به عنوان برنامه ترم'}
              </span>
            </button>
          )}

          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs mr-1"
              title="اشتراک‌گذاری لینک مستقیم این برنامه هفتگی"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>اشتراک چینش</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile horizontal scroll hint */}
      <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-teal-50/70 border-b border-teal-100 text-[11px] text-teal-800">
        <span className="flex items-center gap-1.5">
          <span>👈</span>
          <span>برای دیدن تمام روزها، جدول را به چپ بکشید</span>
        </span>
        <span className="font-mono text-[10px] bg-white border border-teal-200 px-1.5 py-0.5 rounded-full font-bold">
          شنبه تا چهارشنبه
        </span>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto touch-auto overscroll-x-contain">
        <div className="min-w-[760px]">
          
          {/* Days Header */}
          <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-700 text-center">
            <div className="py-2.5 px-2 border-l border-slate-200 text-slate-600">
              ساعت / روز
            </div>
            {DAYS.map((day) => (
              <div key={day} className="py-2.5 px-2 border-l last:border-l-0 border-slate-200">
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          {TIME_BLOCKS.map((block) => (
            <div
              key={block.start}
              className="grid grid-cols-6 border-b last:border-b-0 border-slate-200 min-h-[90px]"
            >
              {/* Time Label */}
              <div className="py-2 px-2 border-l border-slate-200 bg-slate-50/50 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-bold text-slate-700">
                  {block.label}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  ۲ ساعت
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((day) => {
                const cellSlots = getSlotsForCell(day, block.start, block.end);
                const hasDefiniteConflict = cellSlots.some((cs) => cs.hasConflict);
                const hasMultipleTentative = cellSlots.filter((cs) => cs.slot.isTentative).length > 1;

                return (
                  <div
                    key={`${day}-${block.start}`}
                    className={`p-1.5 border-l last:border-l-0 border-slate-200 flex flex-col gap-1.5 transition-colors relative ${
                      hasDefiniteConflict
                        ? 'bg-rose-50/60 ring-1 ring-inset ring-rose-200'
                        : hasMultipleTentative
                        ? 'bg-indigo-50/20'
                        : cellSlots.length > 0
                        ? 'bg-slate-50/30'
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {cellSlots.map(({ course, slot, hasConflict, conflictingWithNames }) => {
                      const isHovered = hoveredCourseId === course.id;
                      const isConflictingWithHover = conflictingCourseIds.has(course.id);

                      return (
                        <div
                          key={`${course.id}-${slot.startTime}-${slot.endTime}-${slot.label}`}
                          id={`sched-item-${course.id}`}
                          onClick={() => onCourseClick?.(course.id)}
                          onMouseEnter={() => onCourseHover?.(course.id)}
                          onMouseLeave={() => onCourseHover?.(null)}
                          className={`group p-2 rounded-xl text-xs transition-all cursor-pointer border relative overflow-hidden ${
                            hasConflict || isConflictingWithHover
                              ? 'bg-rose-100 border-rose-400 text-rose-950 shadow-xs ring-2 ring-rose-400/40'
                              : isHovered
                              ? 'ring-2 ring-teal-500 shadow-md scale-[1.02] bg-white'
                              : slot.isTentative
                              ? 'tentative-slot-pattern border-indigo-300/80 text-indigo-950 hover:bg-indigo-50/50'
                              : `${course.colorBadge.lightBg} ${course.colorBadge.border}`
                          }`}
                        >
                          {/* Top row: Name and conflict icon */}
                          <div className="flex items-start justify-between gap-1">
                            <span
                              title={course.name}
                              className={`font-bold leading-snug line-clamp-2 ${
                                hasConflict
                                  ? 'text-rose-900'
                                  : slot.isTentative
                                  ? 'text-indigo-950'
                                  : 'text-slate-900'
                              }`}
                            >
                              {getShortCourseName(course.name)}
                            </span>
                            {hasConflict && (
                              <span
                                className="shrink-0 text-rose-600 animate-pulse"
                                title={`تداخل زمانی با: ${conflictingWithNames.join('، ')}`}
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          {/* Details row: time, label, group/room */}
                          <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-slate-600 font-medium">
                            <span className="bg-white/80 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200/50">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {slot.isTentative ? (
                              <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                شناور: {slot.groupName?.split(':')[0] || 'عملی'}
                              </span>
                            ) : slot.label ? (
                              <span
                                className={`px-1 py-0.5 rounded text-[10px] font-semibold ${
                                  slot.label.includes('عملی') || slot.label.includes('بافت') || slot.label.includes('تشریح')
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {slot.label}
                              </span>
                            ) : null}
                            {slot.location && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="w-2.5 h-2.5" />
                                {slot.location}
                              </span>
                            )}
                          </div>

                          {/* Instructor snippet on hover */}
                          <div className="mt-1 text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{course.instructors.split('(')[0]}</span>
                          </div>

                          {/* Hover warning popup if conflicting */}
                          {hasConflict && (
                            <div className="hidden group-hover:block absolute inset-0 bg-rose-950/90 text-white p-2 rounded-xl z-20 text-[10px] leading-tight">
                              <p className="font-bold text-rose-200 mb-0.5">⚠️ تداخل همزمانی با:</p>
                              <p className="text-white/90">{conflictingWithNames.join('، ')}</p>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}

        </div>
      </div>

    </div>
  );
};
