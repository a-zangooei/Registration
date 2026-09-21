import React from 'react';
import { Course, ConflictReason } from '../types';
import {
  Check,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  Search,
  Filter,
  Info,
} from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  selectedCourseIds: string[];
  selectedPracticalGroups: Record<string, string>;
  conflictMap: Record<string, ConflictReason[]>;
  hoveredCourseId: string | null;
  conflictingCourseIds: Set<string>;
  hoverConflictReasons: ConflictReason[];
  instantUnselectedConflicts?: Record<string, ConflictReason[]>;
  gender: 'male' | 'female';
  onToggleCourse: (courseId: string) => void;
  onSelectPracticalGroup: (courseId: string, groupId: string) => void;
  onHoverCourse: (courseId: string | null) => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  selectedCourseIds,
  selectedPracticalGroups,
  conflictMap,
  hoveredCourseId,
  conflictingCourseIds,
  hoverConflictReasons,
  instantUnselectedConflicts = {},
  gender,
  onToggleCourse,
  onSelectPracticalGroup,
  onHoverCourse,
}) => {
  const [selectedTermTab, setSelectedTermTab] = React.useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<'all' | 'specialized' | 'general'>('all');

  // Dynamically compute term counts without hardcoding
  const termCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (const c of courses) {
      counts[c.term] = (counts[c.term] || 0) + 1;
    }
    return counts;
  }, [courses]);

  // Unique sorted terms from the dataset
  const availableTerms = React.useMemo(() => {
    const termSet = new Set<number>();
    for (const c of courses) {
      termSet.add(c.term);
    }
    return Array.from(termSet).sort((a, b) => a - b);
  }, [courses]);

  // Filter courses based on user input
  const filteredCourses = courses.filter((c) => {
    if (selectedTermTab !== 'all' && c.term !== selectedTermTab) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchCode = c.code.toLowerCase().includes(q);
      const matchInst = c.instructors.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchInst) return false;
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      
      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-4 border-b border-slate-200">
        
        {/* Term Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedTermTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
              selectedTermTab === 'all'
                ? 'bg-white text-teal-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            همه دروس ({courses.length})
          </button>
          {availableTerms.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setSelectedTermTab(term)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                selectedTermTab === term
                  ? 'bg-white text-teal-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ترم {term} ({termCounts[term] || 0} درس)
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجوی نام، کد یا استاد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">همه دسته‌ها</option>
            <option value="specialized">تخصصی / پایه</option>
            <option value="general">شناور عمومی</option>
          </select>
        </div>

      </div>

      {/* Courses Grid / Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredCourses.map((course) => {
          const isSelected = selectedCourseIds.includes(course.id);
          const activeConflicts = conflictMap[course.id] || [];
          const hasOwnConflict = isSelected && activeConflicts.length > 0;
          
          // Instant potential conflicts when course is unselected
          const unselectedConflicts = !isSelected ? (instantUnselectedConflicts[course.id] || []) : [];
          const hasInstantConflict = !isSelected && unselectedConflicts.length > 0;

          // Hover state: Is this course conflicting with the hovered course?
          const isHoverConflicted = conflictingCourseIds.has(course.id);
          const isCurrentHoverTarget = hoveredCourseId === course.id;

          // Compute specific conflicts to show in tooltip/badge
          const displayConflicts = isSelected
            ? activeConflicts
            : isCurrentHoverTarget
            ? (hoverConflictReasons.length > 0 ? hoverConflictReasons : unselectedConflicts)
            : isHoverConflicted
            ? hoverConflictReasons.filter(
                (r) => r.conflictingWithCourseId === course.id
              )
            : unselectedConflicts;

          const showRedAlert = hasOwnConflict || hasInstantConflict || isHoverConflicted || (isCurrentHoverTarget && hoverConflictReasons.length > 0);

          return (
            <div
              key={course.id}
              id={`course-card-${course.id}`}
              onMouseEnter={() => onHoverCourse(course.id)}
              onMouseLeave={() => onHoverCourse(null)}
              onClick={() => {
                // On mobile devices, tapping the card toggles hover preview state if not clicking actions
                if (hoveredCourseId === course.id) {
                  onHoverCourse(null);
                } else {
                  onHoverCourse(course.id);
                }
              }}
              className={`rounded-2xl p-4 border transition-all duration-200 relative group flex flex-col justify-between cursor-pointer sm:cursor-default ${
                showRedAlert
                  ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                  : isSelected
                  ? 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                  : isCurrentHoverTarget
                  ? 'bg-slate-50 border-slate-300 shadow-xs ring-2 ring-teal-500/30'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                
                {/* Header: Checkbox + Name + Term badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      id={`check-course-${course.id}`}
                      type="button"
                      onClick={() => onToggleCourse(course.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : showRedAlert
                          ? 'border-rose-400 bg-white text-rose-600'
                          : 'border-slate-300 bg-white hover:border-teal-500 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          onClick={() => onToggleCourse(course.id)}
                          className={`text-sm font-bold cursor-pointer transition-colors leading-tight ${
                            showRedAlert ? 'text-rose-950' : 'text-slate-900 hover:text-teal-700'
                          }`}
                        >
                          {course.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {course.code}
                        </span>
                        <span>ترم {course.term}</span>
                        <span>•</span>
                        <span className={course.category === 'general' ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                          {course.courseTypeString}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Units Badge */}
                  <div className="text-left shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                      {course.units.total} واحد
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 text-center font-medium">
                      ن: {course.units.theory} | ع: {course.units.practical}
                    </p>
                  </div>
                </div>

                {/* Conflict Alert Banner / Tooltip Trigger */}
                {displayConflicts.length > 0 && (
                  <div className="mt-3 p-2 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-900 text-xs flex items-start gap-2 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[11px]">
                        {displayConflicts[0].title}
                      </p>
                      <p className="text-[11px] text-rose-800/90 mt-0.5 leading-relaxed">
                        {displayConflicts[0].description}
                      </p>
                      {displayConflicts.length > 1 && (
                        <p className="text-[10px] font-semibold text-rose-700 mt-1">
                          + {displayConflicts.length - 1} تداخل دیگر با این درس
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Instructors & Schedule Info */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex flex-col gap-1.5">
                  
                  {/* Instructor */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.instructors}</span>
                  </div>

                  {/* Theory timeslot */}
                  {course.theorySchedule.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>نظری:</span>
                      {course.theorySchedule.map((s, idx) => (
                        <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                          {s.day} {s.startTime} تا {s.endTime}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Gender Specific Schedule (for general courses) */}
                  {course.genderSchedules && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                      <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-amber-800 font-semibold">
                        ساعت انتخابی ({gender === 'male' ? 'برادران' : 'خواهران'}):
                      </span>
                      {course.genderSchedules[gender]?.map((s, idx) => (
                        <span key={idx} className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {s.day} {s.startTime} تا {s.endTime}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Prerequisites info */}
                  {course.prerequisites.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      <span>پیش‌نیاز:</span>
                      <span className="font-mono">{course.prerequisites.join('، ')}</span>
                      {course.code === '110614752' && (
                        <span className="text-rose-600 font-bold mr-1">
                          (شامل ایمنی‌شناسی در گزارش!)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Corequisite info */}
                  {course.corequisites && course.corequisites.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                      <Layers className="w-3 h-3" />
                      <span>هم‌نیاز: کد {course.corequisites.join('، ')} (پاتولوژی نظری)</span>
                    </div>
                  )}

                  {/* Exam Schedule snippet */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                    {course.finalExam && (
                      <span className="bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded border border-teal-200">
                        پایان‌ترم: {course.finalExam.date}
                      </span>
                    )}
                    {course.midtermExam && (
                      <span className="bg-rose-50 text-rose-800 px-1.5 py-0.5 rounded border border-rose-200">
                        {course.midtermExam.isFullDeletion ? 'حذفی کامل: ' : 'میان‌ترم: '}
                        {course.midtermExam.date}
                      </span>
                    )}
                  </div>

                </div>

              </div>

              {/* Practical Group Selector (if course has practical groups) */}
              {course.practicalGroups.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`select-practical-${course.id}`}
                        className="text-[11px] font-bold text-indigo-900 flex items-center gap-1 shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        انتخاب گروه عملی:
                      </label>

                      {selectedPracticalGroups[course.id] &&
                        selectedPracticalGroups[course.id] !== 'ALL_TENTATIVE' && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectPracticalGroup(course.id, 'ALL_TENTATIVE')
                            }
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium"
                          >
                            بازگشت به بازه‌های شناور
                          </button>
                        )}
                    </div>

                    <select
                      id={`select-practical-${course.id}`}
                      value={
                        selectedPracticalGroups[course.id] || 'ALL_TENTATIVE'
                      }
                      onChange={(e) =>
                        onSelectPracticalGroup(course.id, e.target.value)
                      }
                      className={`w-full text-[11px] rounded-lg px-2 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium transition-all ${
                        selectedPracticalGroups[course.id] &&
                        selectedPracticalGroups[course.id] !== 'ALL_TENTATIVE'
                          ? 'bg-indigo-50 text-indigo-950 border border-indigo-300 font-bold'
                          : 'bg-slate-50 text-slate-800 border border-slate-200'
                      }`}
                    >
                      <option value="ALL_TENTATIVE">
                        🌀 تمام بازه‌ها (پیش‌فرض شناور / هاشورخورده)
                      </option>
                      {course.practicalGroups.map((grp) => (
                        <option key={grp.id} value={grp.id}>
                          ✅ {grp.name}
                        </option>
                      ))}
                    </select>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      {selectedPracticalGroups[course.id] &&
                      selectedPracticalGroups[course.id] !== 'ALL_TENTATIVE' ? (
                        <span className="text-emerald-700 font-semibold">
                          گروه مشخص تثبیت شد؛ سایر بازه‌های این درس از جدول پاک شدند.
                        </span>
                      ) : (
                        <span>
                          پیش‌فرض: تمام بازه‌های عملی این درس در جدول به‌صورت نیمه‌شفاف/هاشورخورده نمایش داده می‌شوند.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
