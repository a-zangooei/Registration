import React from 'react';
import { BookOpen, Clock, Calendar, Download, AlertCircle } from 'lucide-react';

export type ActiveMobileTab = 'courses' | 'schedule' | 'exams' | 'export';

interface BottomNavProps {
  activeTab: ActiveMobileTab;
  onChangeTab: (tab: ActiveMobileTab) => void;
  selectedCount: number;
  conflictCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  selectedCount,
  conflictCount,
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 lg:hidden no-print shadow-lg">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        
        {/* Tab 1: Courses */}
        <button
          type="button"
          onClick={() => onChangeTab('courses')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'courses'
              ? 'text-teal-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <BookOpen className="w-5 h-5" />
            {selectedCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-teal-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                {selectedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">لیست دروس</span>
          {activeTab === 'courses' && (
            <span className="w-4 h-0.5 bg-teal-600 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* Tab 2: Weekly Schedule */}
        <button
          type="button"
          onClick={() => onChangeTab('schedule')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'schedule'
              ? 'text-teal-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {conflictCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                !
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">جدول هفتگی</span>
          {activeTab === 'schedule' && (
            <span className="w-4 h-0.5 bg-teal-600 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* Tab 3: Exams */}
        <button
          type="button"
          onClick={() => onChangeTab('exams')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'exams'
              ? 'text-teal-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">امتحانات</span>
          {activeTab === 'exams' && (
            <span className="w-4 h-0.5 bg-teal-600 rounded-full mt-0.5"></span>
          )}
        </button>

        {/* Tab 4: Export */}
        <button
          type="button"
          onClick={() => onChangeTab('export')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
            activeTab === 'export'
              ? 'text-teal-700 font-black'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] mt-1">خروجی و چاپ</span>
          {activeTab === 'export' && (
            <span className="w-4 h-0.5 bg-teal-600 rounded-full mt-0.5"></span>
          )}
        </button>

      </div>
    </div>
  );
};
