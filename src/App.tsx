/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Course, StudentSelections } from './types';
import { evaluateAllConflicts, getHoverConflicts, getInstantUnselectedConflicts } from './utils/conflictDetector';
import { Navbar } from './components/Navbar';
import { UnitManager } from './components/UnitManager';
import { WeeklySchedule } from './components/WeeklySchedule';
import { CourseList } from './components/CourseList';
import { ExamTimeline } from './components/ExamTimeline';
import { ConflictSummary } from './components/ConflictSummary';
import { SchemaAndAlgorithmModal } from './components/SchemaAndAlgorithmModal';
import { ExportModal } from './components/ExportModal';
import { CalendarExportModal } from './components/CalendarExportModal';
import { PrintableReport } from './components/PrintableReport';
import { ShareModal } from './components/ShareModal';
import { ExportContent } from './components/ExportContent';
import { BottomNav, ActiveMobileTab } from './components/BottomNav';
import { OfflineManagerModal } from './components/OfflineManagerModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { decodeScheduleFromParams, syncScheduleToUrl } from './utils/urlSharing';
import { Calendar, Clock, BookOpen, Download, AlertOctagon } from 'lucide-react';
import { CurriculumDataset } from './types';
import { DEFAULT_CURRICULUM } from './data/courses';

const OFFLINE_STORAGE_KEY = 'medical_schedule_offline_state_v1';

export default function App() {
  // Modular Curriculum dataset
  const [curriculum, setCurriculum] = useState<CurriculumDataset>(DEFAULT_CURRICULUM);
  const coursesData = curriculum.courses;

  // Initialize state from URL query parameters or fallback to offline local storage
  const savedState = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const fromUrl = decodeScheduleFromParams(window.location.search);
      if (fromUrl) return fromUrl;
    }
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not read offline state:', e);
      }
    }
    return null;
  }, []);

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(
    savedState?.courseIds || []
  );
  const [selectedPracticalGroups, setSelectedPracticalGroups] = useState<Record<string, string>>(
    savedState?.practicalGroups || {}
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    savedState?.gender || 'male'
  );
  const [minUnits, setMinUnits] = useState<number>(curriculum.minUnits || 12);
  const [maxUnits, setMaxUnits] = useState<number>(curriculum.maxUnits || 14.49);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  
  // Desktop tab: schedule vs exams
  const [desktopView, setDesktopView] = useState<'schedule' | 'exams'>('schedule');

  // Mobile navigation tab
  const [mobileTab, setMobileTab] = useState<ActiveMobileTab>('courses');

  // Modals
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);

  // Synchronize browser URL query parameters and local offline persistence
  React.useEffect(() => {
    syncScheduleToUrl({
      courseIds: selectedCourseIds,
      practicalGroups: selectedPracticalGroups,
      gender,
    });
    try {
      localStorage.setItem(
        OFFLINE_STORAGE_KEY,
        JSON.stringify({
          courseIds: selectedCourseIds,
          practicalGroups: selectedPracticalGroups,
          gender,
        })
      );
    } catch (e) {
      console.warn('Could not persist offline state:', e);
    }
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
    () => coursesData.filter((c) => selectedCourseIds.includes(c.id)),
    [coursesData, selectedCourseIds]
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

  // Instant conflicts for all unselected courses against selected courses (immediate on mobile and desktop)
  const instantUnselectedConflicts = useMemo(() => {
    return getInstantUnselectedConflicts(selections);
  }, [selections]);

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

  const handleReset = () => {
    setSelectedCourseIds([]);
    setSelectedPracticalGroups({});
  };

  const handleMobileTabChange = (tab: ActiveMobileTab) => {
    setMobileTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-28 sm:pb-24 lg:pb-12">
      
      {/* Top Navigation */}
      <Navbar
        gender={gender}
        onGenderChange={setGender}
        conflictCount={totalConflictCount}
        selectedCount={selectedCourseIds.length}
        totalUnits={Number(selectedCourses.reduce((sum, c) => sum + c.units.total, 0).toFixed(2))}
        onReset={handleReset}
        onOpenSchemaModal={() => setIsSchemaModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenOfflineModal={() => setIsOfflineModalOpen(true)}
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
          allCourses={coursesData}
        />

        {/* Live Conflict Summary Banner */}
        <ConflictSummary
          conflictMap={conflictMap}
          courses={coursesData}
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
                <span>خروجی تقویم .ics / PDF / تصویر</span>
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
              allCourses={coursesData}
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
              courses={coursesData}
              selectedCourseIds={selectedCourseIds}
              selectedPracticalGroups={selectedPracticalGroups}
              conflictMap={conflictMap}
              hoveredCourseId={hoveredCourseId}
              conflictingCourseIds={conflictingCourseIds}
              hoverConflictReasons={hoverConflictReasons}
              instantUnselectedConflicts={instantUnselectedConflicts}
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
                courses={coursesData}
                selectedCourseIds={selectedCourseIds}
                selectedPracticalGroups={selectedPracticalGroups}
                conflictMap={conflictMap}
                hoveredCourseId={hoveredCourseId}
                conflictingCourseIds={conflictingCourseIds}
                hoverConflictReasons={hoverConflictReasons}
                instantUnselectedConflicts={instantUnselectedConflicts}
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
                allCourses={coursesData}
              />
            </div>
          )}

          {mobileTab === 'export' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs animate-fadeIn">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">
                      خروجی و چاپ انتخاب واحد
                    </h2>
                    <p className="text-[10px] text-slate-500">
                      ذخیره آفلاین بدون سرور در قالب‌های مختلف
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                  {selectedCourseIds.length} درس انتخابی
                </span>
              </div>

              <ExportContent
                selectedCourses={selectedCourses}
                gender={gender}
                selectedPracticalGroups={selectedPracticalGroups}
                minUnits={minUnits}
                maxUnits={maxUnits}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onReturnToSchedule={() => setMobileTab('schedule')}
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

      {/* Comprehensive Export Modal (PDF, HTML, PNG, Calendar) */}
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

      {/* Dedicated Calendar Export Modal (Samsung Calendar, Google, Apple) */}
      <CalendarExportModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        selectedCourses={selectedCourses}
        gender={gender}
        selectedPracticalGroups={selectedPracticalGroups}
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

      {/* Offline PWA & Cache Download Manager Modal */}
      <OfflineManagerModal
        isOpen={isOfflineModalOpen}
        onClose={() => setIsOfflineModalOpen(false)}
      />

      {/* Persistent Offline Status Floating Indicator */}
      <OfflineIndicator onOpenManager={() => setIsOfflineModalOpen(true)} />

    </div>
  );
}
