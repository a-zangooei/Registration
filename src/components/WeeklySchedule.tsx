import React, { useState, useMemo } from 'react';
import { Course, DayOfWeek, TimeSlot } from '../types';
import { getActiveSlotsForCourse, doSlotsOverlap } from '../utils/conflictDetector';
import { getShortCourseName } from '../utils/formatters';
import {
  AlertCircle,
  Clock,
  MapPin,
  User,
  Share2,
  BookmarkCheck,
  Smartphone,
  CheckCircle2,
  Calendar,
  LayoutGrid,
  ListFilter,
  BookOpen,
} from 'lucide-react';

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
  onNavigateToCourses?: () => void;
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
  onNavigateToCourses,
}) => {
  // Mobile-first responsive view mode: Agenda (list) vs Grid (timetable)
  const [viewMode, setViewMode] = useState<'agenda' | 'grid'>('agenda');
  const [selectedDayFilter, setSelectedDayFilter] = useState<DayOfWeek | 'all'>('all');

  // Detect current day in Persian week (Saturday = 6, Sunday = 0, ..., Wednesday = 3)
  const todayDayName = useMemo<DayOfWeek | null>(() => {
    const dayIndex = new Date().getDay();
    const map: Record<number, DayOfWeek> = {
      6: 'شنبه',
      0: 'یکشنبه',
      1: 'دوشنبه',
      2: 'سه‌شنبه',
      3: 'چهارشنبه',
    };
    return map[dayIndex] || null;
  }, []);

  // Collect all active slots for all selected courses
  const allActiveSlots: { course: Course; slot: TimeSlot }[] = useMemo(() => {
    const list: { course: Course; slot: TimeSlot }[] = [];
    for (const course of selectedCourses) {
      const slots = getActiveSlotsForCourse(
        course,
        gender,
        selectedPracticalGroups[course.id]
      );
      for (const slot of slots) {
        list.push({ course, slot });
      }
    }
    return list;
  }, [selectedCourses, gender, selectedPracticalGroups]);

  // Helper to find slots belonging to a day and overlapping a given time block
  const getSlotsForCell = (day: DayOfWeek, blockStart: string, blockEnd: string): RenderedSlot[] => {
    const matching = allActiveSlots.filter(({ slot }) => {
      if (slot.day !== day) return false;
      return doSlotsOverlap(slot, { day, startTime: blockStart, endTime: blockEnd });
    });

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

  // Group slots by day for Agenda view
  const agendaByDay = useMemo(() => {
    const grouped: Record<DayOfWeek, RenderedSlot[]> = {
      'شنبه': [],
      'یکشنبه': [],
      'دوشنبه': [],
      'سه‌شنبه': [],
      'چهارشنبه': [],
    };

    for (const day of DAYS) {
      const daySlots = allActiveSlots.filter(({ slot }) => slot.day === day);

      // Sort chronologically by start time
      daySlots.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime));

      grouped[day] = daySlots.map(({ course, slot }) => {
        const overlapsWith = slot.isTentative
          ? []
          : daySlots.filter(
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
    }

    return grouped;
  }, [allActiveSlots]);

  // Total conflicts in schedule
  const totalScheduleConflicts = useMemo(() => {
    let count = 0;
    for (const day of DAYS) {
      count += agendaByDay[day].filter((s) => s.hasConflict).length;
    }
    return count;
  }, [agendaByDay]);

  // Empty state if no courses are selected
  if (selectedCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1.5">
          هنوز درسی به برنامه هفتگی اضافه نشده است
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
          برای چیدمان ساعات کلاسی و بررسی خودکار تداخلات، به بخش فهرست دروس رفته و واحدهای درسی مدنظرتان را تیک بزنید.
        </p>
        {onNavigateToCourses && (
          <button
            type="button"
            onClick={onNavigateToCourses}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>مشاهده و انتخاب دروس ارائه‌شده</span>
          </button>
        )}
      </div>
    );
  }

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
      <div className="px-3.5 sm:px-5 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Title and stats */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900">
                برنامه کلاسی هفتگی
              </h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {selectedCourses.length} درس انتخاب‌شده • شنبه تا چهارشنبه (۰۸:۰۰ الی ۲۰:۰۰)
              </p>
            </div>
          </div>

          {/* Quick conflict pill */}
          {totalScheduleConflicts > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>{totalScheduleConflicts} تداخل زمانی</span>
            </span>
          )}
        </div>

        {/* View mode switcher + action buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          
          {/* Segmented Control: Agenda (list) vs Grid */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>نمای روزانه</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>جدول کامل</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {onOpenSemesterModal && (
              <button
                type="button"
                onClick={onOpenSemesterModal}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-colors shadow-2xs cursor-pointer ${
                  hasSavedSemesterSchedule
                    ? isCurrentMatchingSaved
                      ? 'text-teal-800 bg-teal-50 border-teal-300 hover:bg-teal-100'
                      : 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                    : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                }`}
                title="مدیریت برنامه قطعی ترم و میانبر اندروید"
              >
                <BookmarkCheck className={`w-3.5 h-3.5 ${hasSavedSemesterSchedule ? 'text-teal-600' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">
                  {hasSavedSemesterSchedule
                    ? isCurrentMatchingSaved
                      ? 'برنامه ترم ✓'
                      : 'برنامه ترم (ویرایش‌شده)'
                    : 'ذخیره برای میانبر'}
                </span>
              </button>
            )}

            {onOpenShareModal && (
              <button
                type="button"
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                title="اشتراک‌گذاری لینک مستقیم این برنامه هفتگی"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">اشتراک</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Legend Bar */}
      <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 shrink-0"></span>
            <span>کلاس قطعی</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-100 border border-dashed border-indigo-400 shrink-0"></span>
            <span>بازه شناور عملی</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 shrink-0"></span>
            <span>تداخل همزمانی</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-600 hidden md:block">
          💡 برای تثبیت بازه عملی هر درس، از لیست دروس گروه مورد نظر را انتخاب کنید.
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODE 1: DAY-BY-DAY AGENDA VIEW (Thumb-friendly & Easy on any device)  */}
      {/* ===================================================================== */}
      {viewMode === 'agenda' && (
        <div className="p-3 sm:p-5 space-y-4">
          
          {/* Day Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedDayFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              همه روزها ({DAYS.reduce((sum, d) => sum + agendaByDay[d].length, 0)} جلسه)
            </button>
            {DAYS.map((day) => {
              const count = agendaByDay[day].length;
              const isToday = todayDayName === day;
              const hasConflictInDay = agendaByDay[day].some((s) => s.hasConflict);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDayFilter(day)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedDayFilter === day
                      ? 'bg-teal-600 text-white shadow-xs'
                      : isToday
                      ? 'bg-teal-50 text-teal-800 border border-teal-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span className="text-[9px] px-1 py-0.2 rounded-full bg-teal-200 text-teal-900 font-black">
                      امروز
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedDayFilter === day
                        ? 'bg-white/25 text-white'
                        : hasConflictInDay
                        ? 'bg-rose-100 text-rose-800 font-black'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Agenda Days Container */}
          <div className="space-y-4">
            {DAYS.filter((d) => selectedDayFilter === 'all' || selectedDayFilter === d).map((day) => {
              const daySlots = agendaByDay[day];
              const isToday = todayDayName === day;

              return (
                <div
                  key={day}
                  className={`rounded-2xl border p-3 sm:p-4 transition-all ${
                    isToday
                      ? 'border-teal-300 bg-teal-50/20 shadow-2xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isToday ? 'bg-teal-500 ring-4 ring-teal-100' : 'bg-slate-400'}`}></div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {day}
                      </h3>
                      {isToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                          امروز
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">
                      {daySlots.length > 0 ? `${daySlots.length} کلاس` : 'بدون کلاس'}
                    </span>
                  </div>

                  {/* Day Slots or Empty Day Note */}
                  {daySlots.length === 0 ? (
                    <div className="py-5 text-center text-slate-600 bg-slate-50/60 rounded-xl border border-dashed border-slate-200 text-xs">
                      ☕ روز آزاد — در این روز کلاسی در برنامه شما قرار ندارد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {daySlots.map(({ course, slot, hasConflict, conflictingWithNames }, idx) => {
                        const isHovered = hoveredCourseId === course.id;
                        const isConflictingWithHover = conflictingCourseIds.has(course.id);

                        return (
                          <div
                            key={`${course.id}-${slot.startTime}-${idx}`}
                            onClick={() => onCourseClick?.(course.id)}
                            onMouseEnter={() => onCourseHover?.(course.id)}
                            onMouseLeave={() => onCourseHover?.(null)}
                            className={`p-3 rounded-xl border text-xs transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                              hasConflict || isConflictingWithHover
                                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
                                : isHovered
                                ? 'bg-white ring-2 ring-teal-500 border-teal-500 shadow-md'
                                : slot.isTentative
                                ? 'tentative-slot-pattern border-indigo-200 hover:bg-indigo-50/40'
                                : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                            }`}
                          >
                            <div>
                              {/* Top Bar: Time pill + Badges */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-2xs">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{slot.startTime} تا {slot.endTime}</span>
                                </span>

                                <div className="flex items-center gap-1 shrink-0">
                                  {slot.isTentative ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                                      بازه شناور عملی
                                    </span>
                                  ) : slot.label ? (
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        slot.label.includes('عملی') || slot.label.includes('بافت') || slot.label.includes('تشریح')
                                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                          : 'bg-teal-100 text-teal-900 border border-teal-200'
                                      }`}
                                    >
                                      {slot.label}
                                    </span>
                                  ) : null}

                                  {hasConflict && (
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                                      تداخل!
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Course Title */}
                              <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug mb-1">
                                {course.name}
                              </h4>

                              {/* Instructor & Location */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 mt-2">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{course.instructors.split('(')[0]}</span>
                                </span>
                                {slot.location && (
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{slot.location}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Conflict Warning Details */}
                            {hasConflict && (
                              <div className="mt-2.5 p-2 rounded-lg bg-rose-100/90 border border-rose-300 text-rose-950 text-[11px] flex items-start gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">همزمانی ساعت با: </span>
                                  <span>{conflictingWithNames.join('، ')}</span>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE 2: FULL TIMETABLE GRID (Panoramic Weekly View)                   */}
      {/* ===================================================================== */}
      {viewMode === 'grid' && (
        <div>
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
                {DAYS.map((day) => {
                  const isToday = todayDayName === day;
                  return (
                    <div
                      key={day}
                      className={`py-2.5 px-2 border-l last:border-l-0 border-slate-200 relative ${
                        isToday ? 'bg-teal-50/80 text-teal-900 font-black' : ''
                      }`}
                    >
                      <span>{day}</span>
                      {isToday && (
                        <span className="mr-1 text-[9px] px-1 py-0.2 rounded-full bg-teal-200 text-teal-900">
                          امروز
                        </span>
                      )}
                    </div>
                  );
                })}
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
                    const isToday = todayDayName === day;

                    return (
                      <div
                        key={`${day}-${block.start}`}
                        className={`p-1.5 border-l last:border-l-0 border-slate-200 flex flex-col gap-1.5 transition-colors relative ${
                          hasDefiniteConflict
                            ? 'bg-rose-50/60 ring-1 ring-inset ring-rose-200'
                            : isToday
                            ? 'bg-teal-50/15'
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
      )}

    </div>
  );
};
