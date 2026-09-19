/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { COURSES_DATA } from './data/courses';
import { Course, StudentSelections } from './types';
import { evaluateAllConflicts, getHoverConflicts } from './utils/conflictDetector';
import { Navbar } from './components/Navbar';
import { UnitManager } from './components/UnitManager';
import { WeeklySchedule } from './components/WeeklySchedule';
import { CourseList } from './components/CourseList';
import { ExamTimeline } from './components/ExamTimeline';
import { ConflictSummary } from './components/ConflictSummary';
import { SchemaAndAlgorithmModal } from './components/SchemaAndAlgorithmModal';
import { ExportModal } from './components/ExportModal';
import { PrintableReport } from './components/PrintableReport';
import { ShareModal } from './components/ShareModal';
import { BottomNav, ActiveMobileTab } from './components/BottomNav';
import { decodeScheduleFromParams, syncScheduleToUrl } from './utils/urlSharing';
import { Calendar, Clock, BookOpen, Download, AlertOctagon, Sparkles } from 'lucide-react';

// Recommended starter combo (within 12 to 14.49 units)
const DEFAULT_SELECTED_IDS = ['c1', 'c2', 'c4', 'c6', 'c7', 'c8', 'c9', 'c10'];

// Default practical groups: Empty record by default so ALL practical groups appear as tentative/hatched ranges!
const DEFAULT_PRACTICAL_GROUPS: Record<string, string> = {};

export default function App() {
  // Initialize state directly from URL query parameters if present
  const initialUrlState = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      return decodeScheduleFromParams(window.location.search);
    }
    return null;
  }, []);

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    initialUrlState?.courseIds && initialUrlState.courseIds.length > 0
      ? initialUrlState.courseIds
      : DEFAULT_SELECTED_IDS
  );
  const [selectedPracticalGroups, setSelectedPracticalGroups] = useState<Record<string, string>>(
    initialUrlState?.practicalGroups || DEFAULT_PRACTICAL_GROUPS
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    initialUrlState?.gender || 'male'
  );
  const [minUnits, setMinUnits] = useState<number>(12);
  const [maxUnits, setMaxUnits] = useState<number>(14.49);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  
  // Desktop tab: schedule vs exams
  const [desktopView, setDesktopView] = useState<'schedule' | 'exams'>('schedule');

  // Mobile navigation tab
  const [mobileTab, setMobileTab] = useState<ActiveMobileTab>('courses');

  // Modals
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Synchronize browser URL query parameters whenever selections change
  React.useEffect(() => {
    syncScheduleToUrl({
      courseIds: selectedCourseIds,
      practicalGroups: selectedPracticalGroups,
      gender,
    });
  }, [selectedCourseIds, selectedPracticalGroups, gender]);

  // Selections object for calculation
  const selections: StudentSelections = useMemo(
    () => ({
      selectedCourseIds,
      selectedPracticalGroups,
      gender,
      minUnits,
      maxUnits,
    }),
    [selectedCourseIds, selectedPracticalGroups, gender, minUnits, maxUnits]
  );

  // Selected course objects
  const selectedCourses = useMemo(
    () => COURSES_DATA.filter((c) => selectedCourseIds.includes(c.id)),
    [selectedCourseIds]
  );

  // Evaluate conflicts for all selected courses
  const conflictMap = useMemo(() => evaluateAllConflicts(selections), [selections]);

  // Total active conflicts count
  const totalConflictCount = useMemo(() => {
    let count = 0;
    for (const cId of selectedCourseIds) {
      if (conflictMap[cId] && conflictMap[cId].length > 0) {
        count += conflictMap[cId].length;
      }
    }
    return count;
  }, [selectedCourseIds, conflictMap]);

  // Real-time hover conflicts
  const { conflictingCourseIds, reasons: hoverConflictReasons } = useMemo(() => {
    if (!hoveredCourseId) {
      return { conflictingCourseIds: new Set<string>(), reasons: [] };
    }
    return getHoverConflicts(hoveredCourseId, selections);
  }, [hoveredCourseId, selections]);

  // Handlers
  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleSelectPracticalGroup = (courseId: string, groupId: string) => {
    setSelectedPracticalGroups((prev) => ({
      ...prev,
      [courseId]: groupId,
    }));
  };

  const handleSelectRecommended = () => {
    setSelectedCourseIds(DEFAULT_SELECTED_IDS);
    // Lock specific non-overlapping groups for the recommended combo
    setSelectedPracticalGroups({
      c1: 'c1_p2',
      c2: 'c2_p1',
      c4: 'c4_p3',
      c6: 'c6_p4',
      c7: 'c7_p5',
    });
  };

  const handleReset = () => {
    setSelectedCourseIds([]);
    setSelectedPracticalGroups({});
  };

  const handleMobileTabChange = (tab: ActiveMobileTab) => {
    if (tab === 'export') {
      setIsExportModalOpen(true);
    } else {
      setMobileTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-20 lg:pb-12">
      
      {/* Top Navigation */}
      <Navbar
        gender={gender}
        onGenderChange={setGender}
        conflictCount={totalConflictCount}
        selectedCount={selectedCourseIds.length}
        totalUnits={Number(selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2))}
        onSelectRecommended={handleSelectRecommended}
        onReset={handleReset}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-4 sm:mt-5 space-y-4 sm:space-y-5 no-print">
        
        {/* Unit Manager and Rules Bar */}
        <UnitManager
          minUnits={minUnits}
          maxUnits={maxUnits}
          onMinUnitsChange={setMinUnits}
          onMaxUnitsChange={setMaxUnits}
          selectedCourses={selectedCourses}
          allCourses={COURSES_DATA}
        />

        {/* Live Conflict Summary Banner */}
        <ConflictSummary
          conflictMap={conflictMap}
          courses={COURSES_DATA}
          selectedCourseIds={selectedCourseIds}
        />

        {/* ========================================================================= */}
        {/* DESKTOP VIEW (lg:block): Wide view with schedule/exams switcher and catalog */}
        {/* ========================================================================= */}
        <div className="hidden lg:block space-y-5">
          
          {/* Top Switcher Bar on Desktop */}
          <div className="flex items-center justify-between">
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                id="tab-btn-schedule"
                type="button"
                onClick={() => setDesktopView('schedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  desktopView === 'schedule'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>برنامه هفتگی کلاس‌ها</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
                  {selectedCourseIds.length} درس
                </span>
              </button>

              <button
                id="tab-btn-exams"
                type="button"
                onClick={() => setDesktopView('exams')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  desktopView === 'exams'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>گاهشمار امتحانات نیمسال</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-teal-800 shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>خروجی PDF / HTML / تصویر</span>
              </button>
              <div className="text-xs text-slate-500 font-medium">
                💡 هاور روی هر درس: نمایش بلادرنگ تداخلات با رنگ قرمز
              </div>
            </div>
          </div>

          {/* Schedule or Exam Timeline */}
          {desktopView === 'schedule' ? (
            <WeeklySchedule
              selectedCourses={selectedCourses}
              gender={gender}
              selectedPracticalGroups={selectedPracticalGroups}
              hoveredCourseId={hoveredCourseId}
              conflictingCourseIds={conflictingCourseIds}
              onCourseHover={setHoveredCourseId}
              onOpenShareModal={() => setIsShareModalOpen(true)}
            />
          ) : (
            <ExamTimeline
              selectedCourses={selectedCourses}
              allCourses={COURSES_DATA}
            />
          )}

          {/* Courses Selection Catalog */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-700" />
                <h2 className="text-base font-black text-slate-900">
                  فهرست کامل دروس ارائه‌شده (ترم‌های ۳، ۴ و ۵)
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                کلیک روی عنوان یا تیک هر درس برای اخذ یا حذف • انتخاب گروه عملی برای تثبیت بازه
              </span>
            </div>

            <CourseList
              courses={COURSES_DATA}
              selectedCourseIds={selectedCourseIds}
              selectedPracticalGroups={selectedPracticalGroups}
              conflictMap={conflictMap}
              hoveredCourseId={hoveredCourseId}
              conflictingCourseIds={conflictingCourseIds}
              hoverConflictReasons={hoverConflictReasons}
              gender={gender}
              onToggleCourse={handleToggleCourse}
              onSelectPracticalGroup={handleSelectPracticalGroup}
              onHoverCourse={setHoveredCourseId}
            />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MOBILE & TABLET VIEW (lg:hidden): Tabbed Navigation */}
        {/* ========================================================================= */}
        <div className="block lg:hidden space-y-4">
          
          {/* Active Tab Content */}
          {mobileTab === 'courses' && (
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-700" />
                  <h2 className="text-sm font-black text-slate-900">
                    فهرست دروس و انتخاب واحد
                  </h2>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {selectedCourseIds.length} درس انتخاب شده
                </span>
              </div>

              <CourseList
                courses={COURSES_DATA}
                selectedCourseIds={selectedCourseIds}
                selectedPracticalGroups={selectedPracticalGroups}
                conflictMap={conflictMap}
                hoveredCourseId={hoveredCourseId}
                conflictingCourseIds={conflictingCourseIds}
                hoverConflictReasons={hoverConflictReasons}
                gender={gender}
                onToggleCourse={handleToggleCourse}
                onSelectPracticalGroup={handleSelectPracticalGroup}
                onHoverCourse={setHoveredCourseId}
              />
            </div>
          )}

          {mobileTab === 'schedule' && (
            <div>
              <WeeklySchedule
                selectedCourses={selectedCourses}
                gender={gender}
                selectedPracticalGroups={selectedPracticalGroups}
                hoveredCourseId={hoveredCourseId}
                conflictingCourseIds={conflictingCourseIds}
                onCourseHover={setHoveredCourseId}
                onOpenShareModal={() => setIsShareModalOpen(true)}
              />
            </div>
          )}

          {mobileTab === 'exams' && (
            <div>
              <ExamTimeline
                selectedCourses={selectedCourses}
                allCourses={COURSES_DATA}
              />
            </div>
          )}

        </div>

      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={mobileTab}
        onChangeTab={handleMobileTabChange}
        selectedCount={selectedCourseIds.length}
        conflictCount={totalConflictCount}
      />

      {/* Unified Printable Report (visible only during @media print) */}
      <PrintableReport
        selectedCourses={selectedCourses}
        gender={gender}
        selectedPracticalGroups={selectedPracticalGroups}
        minUnits={minUnits}
        maxUnits={maxUnits}
      />

      {/* Comprehensive Export Modal (PDF, HTML, PNG) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedCourses={selectedCourses}
        gender={gender}
        selectedPracticalGroups={selectedPracticalGroups}
        minUnits={minUnits}
        maxUnits={maxUnits}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Shareable Link Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        selectedCourses={selectedCourses}
        selectedPracticalGroups={selectedPracticalGroups}
        gender={gender}
      />

      {/* Interactive Schema & Algorithm Modal */}
      <SchemaAndAlgorithmModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

    </div>
  );
}
