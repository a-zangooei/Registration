import React from 'react';
import { Course, ConflictReason } from '../types';
import {
  Check,
  AlertTriangle,
  BookOpen,
  Calendar,
  Layers,
  Users,
  Search,
  Filter,
  Info,
  ChevronDown,
  ChevronUp,
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
  const [expandedPracticalMap, setExpandedPracticalMap] = React.useState<Record<string, boolean>>({});

  const togglePracticalExpand = (courseId: string) => {
    setExpandedPracticalMap((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

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
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                categoryFilter === 'all'
                  ? 'bg-white text-teal-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              همه
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('specialized')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                categoryFilter === 'specialized'
                  ? 'bg-white text-teal-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              پایه/تخصصی
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('general')}
              className={`px-2.5 py-1 rounded-lg transition-all font-medium ${
                categoryFilter === 'general'
                  ? 'bg-white text-amber-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              عمومی
            </button>
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
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
          const isPracticalExpanded = !!expandedPracticalMap[course.id];

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
                isPracticalExpanded ? 'z-30' : 'z-10'
              } ${
                isSelected
                  ? hasOwnConflict
                    ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-400/30 shadow-xs'
                    : 'bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                  : hasInstantConflict || isHoverConflicted
                  ? 'bg-rose-50/25 border-rose-300 ring-1 ring-rose-300/40 shadow-2xs hover:border-rose-400'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCourse(course.id);
                      }}
                      className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        isSelected
                          ? hasOwnConflict
                            ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                            : 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                          : showRedAlert
                          ? 'border-rose-400 bg-white hover:border-rose-600 hover:bg-rose-50'
                          : 'border-slate-300 bg-white hover:border-teal-500 hover:bg-teal-50/40'
                      }`}
                      aria-label={isSelected ? 'حذف درس از برنامه' : 'اخذ درس'}
                      title={isSelected ? 'برای حذف از برنامه کلیک کنید' : 'برای اخذ و افزودن به برنامه کلیک کنید'}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : null}
                    </button>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCourse(course.id);
                          }}
                          className={`text-sm font-bold cursor-pointer transition-colors leading-tight ${
                            isSelected
                              ? hasOwnConflict
                                ? 'text-rose-950'
                                : 'text-slate-900 hover:text-teal-700'
                              : hasInstantConflict
                              ? 'text-rose-900 hover:text-rose-950'
                              : 'text-slate-900 hover:text-teal-700'
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
                  <div className={`mt-3 p-2 rounded-xl text-xs flex items-start gap-2 animate-fadeIn ${
                    isSelected
                      ? 'bg-rose-100/90 border border-rose-300 text-rose-900'
                      : 'bg-rose-50/90 border border-rose-200 text-rose-900'
                  }`}>
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-[11px]">
                          {isSelected ? displayConflicts[0].title : `تداخل بالقوه: ${displayConflicts[0].title}`}
                        </p>
                        {!isSelected && (
                          <span className="text-[10px] bg-rose-200/80 text-rose-900 font-bold px-1.5 py-0.5 rounded">
                            در صورت اخذ
                          </span>
                        )}
                      </div>
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

                  {/* Theory times */}
                  {course.theorySchedule.length > 0 && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="flex-1 flex flex-wrap gap-1">
                        {course.theorySchedule.map((s, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono"
                          >
                            {s.day} {s.startTime}-{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Gender-specific schedules (e.g. general courses with separate male/female groups) */}
                  {course.genderSchedules && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-500 ml-1">گروه انتخابی ({gender === 'male' ? 'برادران' : 'خواهران'}):</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(course.genderSchedules[gender] || []).map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-teal-50 border border-teal-200 text-teal-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
                            >
                              {s.day} {s.startTime}-{s.endTime}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final Exam Status */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{course.examStatusDescription}</span>
                  </div>
                </div>

                {/* Practical Groups Selector (Collapsible Overlay / کشویی بازشونده روی کادر) */}
                {course.practicalGroups && course.practicalGroups.length > 0 && (
                  (() => {
                    const selectedGroupId = selectedPracticalGroups[course.id];
                    const selectedGroup = course.practicalGroups.find((g) => g.id === selectedGroupId);

                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 relative">
                        {/* Collapsible Trigger Bar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePracticalExpand(course.id);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs border transition-all cursor-pointer ${
                            selectedGroup
                              ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-semibold'
                              : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="font-bold text-slate-700 text-[11px] shrink-0">گروه عملی:</span>
                            {selectedGroup ? (
                              <span className="bg-teal-600 text-white font-bold px-2 py-0.5 rounded-md text-[10px] truncate shadow-2xs">
                                {selectedGroup.name}
                              </span>
                            ) : (
                              <span className="bg-amber-100/90 text-amber-900 border border-amber-200/80 font-medium px-1.5 py-0.5 rounded-md text-[10px] truncate">
                                شناور ({course.practicalGroups.length} گروه)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0 text-slate-400 mr-1">
                            <span className="text-[10px] hidden sm:inline font-normal">
                              {isPracticalExpanded ? 'بستن' : 'تغییر گروه'}
                            </span>
                            {isPracticalExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Popup Menu / منوی کشویی به صورت اورلی روی کادر بدون تغییر سایز کادر */}
                        {isPracticalExpanded && (
                          <>
                            {/* Backdrop to dismiss when clicking outside */}
                            <div
                              className="fixed inset-0 z-30 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePracticalExpand(course.id);
                              }}
                            />

                            <div className="absolute top-full right-0 left-0 mt-1 z-40 space-y-1.5 bg-white p-2 rounded-xl border border-slate-200 shadow-xl max-h-60 overflow-y-auto animate-fadeIn">
                              <div className="px-1 py-0.5 text-[10px] font-bold text-slate-400 flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                                <span>انتخاب گروه عملی</span>
                                <span className="text-[9px] text-slate-400 font-normal">بستن با کلیک بیرون</span>
                              </div>

                              {/* Option 1: Floating Mode */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPracticalGroup(course.id, '');
                                  togglePracticalExpand(course.id);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs border cursor-pointer transition-all ${
                                  !selectedGroupId
                                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400/40'
                                    : 'bg-white hover:bg-amber-50/40 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    !selectedGroupId ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                                  }`}>
                                    {!selectedGroupId && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                  <span className="text-[11px] font-medium">حالت شناور (بدون انتخاب گروه ثابت)</span>
                                </div>
                                <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.5 rounded">
                                  {course.practicalGroups.length} گروه فعال
                                </span>
                              </button>

                              {/* Options: Individual Groups */}
                              {course.practicalGroups.map((pg) => {
                                const isChosen = selectedGroupId === pg.id;
                                return (
                                  <button
                                    key={pg.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isChosen) {
                                        onSelectPracticalGroup(course.id, '');
                                      } else {
                                        onSelectPracticalGroup(course.id, pg.id);
                                      }
                                      togglePracticalExpand(course.id);
                                    }}
                                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs border cursor-pointer transition-all ${
                                      isChosen
                                        ? 'bg-teal-50 border-teal-500 text-teal-950 font-bold ring-1 ring-teal-500/40'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                        isChosen ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                                      }`}>
                                        {isChosen && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </div>
                                      <span className="text-[11px] truncate">{pg.name}</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                      {pg.slots.map((s) => `${s.day.replace('شنبه', '')} ${s.startTime}-${s.endTime}`).join('، ')}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600">درسی با این مشخصات یافت نشد.</p>
          <p className="text-xs text-slate-400 mt-1">لطفاً عبارت جستجو یا فیلترها را بررسی کنید.</p>
        </div>
      )}
    </div>
  );
};
