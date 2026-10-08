import React from 'react';
import { Course } from '../types';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface UnitManagerProps {
  minUnits: number;
  maxUnits: number;
  onMinUnitsChange: (val: number) => void;
  onMaxUnitsChange: (val: number) => void;
  selectedCourses: Course[];
  allCourses: Course[];
}

export const UnitManager: React.FC<UnitManagerProps> = ({
  minUnits,
  maxUnits,
  onMinUnitsChange,
  onMaxUnitsChange,
  selectedCourses,
  allCourses,
}) => {
  // Unit calculations
  const totalSelectedUnits = Number(
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

  const specializedPercent =
    totalSelectedUnits > 0
      ? Math.round((specializedUnits / totalSelectedUnits) * 100)
      : 0;
  const generalPercent =
    totalSelectedUnits > 0
      ? Math.round((generalUnits / totalSelectedUnits) * 100)
      : 0;

  // Status flags
  const isUnderMin = totalSelectedUnits > 0 && totalSelectedUnits < minUnits;
  const isOverMax = totalSelectedUnits > maxUnits;
  const isValid =
    totalSelectedUnits >= minUnits && totalSelectedUnits <= maxUnits;

  // Percentage for progress bar (capped at 100% of maxUnits or slightly beyond)
  const progressRatio = Math.min(
    100,
    Math.round((totalSelectedUnits / (maxUnits || 20)) * 100)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      {/* Top row: Units overview, presets & manual limits */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Main Unit Counter */}
        <div className="md:col-span-5 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors ${
              isOverMax
                ? 'bg-rose-100 text-rose-800 border-2 border-rose-300'
                : isUnderMin
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-300'
                : isValid
                ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-300'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <span className="text-xl font-black leading-none tracking-tight">
              {totalSelectedUnits}
            </span>
            <span className="text-[10px] font-semibold mt-0.5">واحد</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                مجموع واحدهای اخذ شده
              </span>
              {isValid && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  محدوده مجاز
                </span>
              )}
              {isOverMax && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  فراتر از سقف
                </span>
              )}
              {isUnderMin && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  کمتر از کف
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              تعداد دروس انتخاب شده: {selectedCourses.length} درس از {allCourses.length} درس
            </p>
          </div>
        </div>

        {/* Universal Academic Ceiling Presets */}
        <div className="md:col-span-4 flex items-center justify-start md:justify-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 ml-1">وضعیت تحصیلی:</span>
          <button
            type="button"
            onClick={() => onMaxUnitsChange(20)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              maxUnits === 20
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="وضعیت عادی دانشگاهی: سقف ۲۰ واحد"
          >
            عادی (۲۰)
          </button>
          <button
            type="button"
            onClick={() => onMaxUnitsChange(24)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              maxUnits === 24
                ? 'bg-teal-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="معدل الف (معدل بالای ۱۷): سقف ۲۴ واحد"
          >
            معدل الف (۲۴)
          </button>
          <button
            type="button"
            onClick={() => onMaxUnitsChange(14.49)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              maxUnits === 14.49
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="مشروط: سقف ۱۴.۴۹ واحد"
          >
            مشروط (۱۴.۴۹)
          </button>
        </div>

        {/* Manual Floor/Ceiling Controls */}
        <div className="md:col-span-3 flex items-center justify-start sm:justify-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <label htmlFor="input-min-units" className="text-xs font-semibold text-slate-600">
              کف:
            </label>
            <input
              id="input-min-units"
              type="number"
              step="any"
              min="1"
              max="24"
              value={minUnits}
              onChange={(e) => onMinUnitsChange(parseFloat(e.target.value) || 0)}
              className="w-14 px-1.5 py-1 text-xs font-bold text-center bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="h-4 w-px bg-slate-300"></div>

          <div className="flex items-center gap-1.5">
            <label htmlFor="input-max-units" className="text-xs font-semibold text-slate-600">
              سقف:
            </label>
            <input
              id="input-max-units"
              type="number"
              step="any"
              min="1"
              max="24"
              value={maxUnits}
              onChange={(e) => onMaxUnitsChange(parseFloat(e.target.value) || 0)}
              className="w-16 px-1.5 py-1 text-xs font-bold text-center bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Visual Unit Progress & Distribution */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Progress against Min/Max */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>پیشرفت تکمیل ظرفیت واحد (سقف {maxUnits})</span>
            <span className="font-bold">{progressRatio}٪</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex relative">
            {/* Marker for minUnits */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
              style={{ left: `${Math.min(100, (minUnits / maxUnits) * 100)}%` }}
              title={`کف واحد مجاز: ${minUnits}`}
            ></div>
            <div
              className={`h-full transition-all duration-300 ${
                isOverMax
                  ? 'bg-rose-500'
                  : isUnderMin
                  ? 'bg-amber-400'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${progressRatio}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-medium">
            <span>۰ واحد</span>
            <span className="text-slate-600">کف مجاز: {minUnits}</span>
            <span>سقف: {maxUnits}</span>
          </div>
        </div>

        {/* Specialized vs General distribution */}
        <div>
          <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
            <span>سهم دروس تخصصی/پایه در برابر عمومی</span>
            <span className="font-bold text-slate-700">
              تخصصی {specializedPercent}٪ | عمومی {generalPercent}٪
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${specializedPercent}%` }}
              title={`دروس تخصصی/پایه: ${specializedUnits} واحد`}
            ></div>
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${generalPercent}%` }}
              title={`دروس عمومی: ${generalUnits} واحد`}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] mt-1 font-semibold text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-teal-600"></span>
              <span>تخصصی/پایه: {specializedUnits} واحد</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span>
              <span>عمومی: {generalUnits} واحد</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
