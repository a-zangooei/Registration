import React from 'react';
import { X, Code, CheckCircle, ShieldAlert, BookOpen, Copy, Check } from 'lucide-react';

interface SchemaAndAlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaAndAlgorithmModal: React.FC<SchemaAndAlgorithmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const sampleJsonSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "MedicalBasicScienceCourse",
  "type": "object",
  "required": ["id", "code", "name", "term", "category", "units"],
  "properties": {
    "id": { "type": "string", "example": "c1" },
    "code": { "type": "string", "example": "110611000" },
    "name": { "type": "string", "example": "علوم تشریح سیستم ادراری - تناسلی" },
    "term": { "type": "integer", "enum": [3, 4, 5] },
    "courseTypeString": { "type": "string", "example": "الزامی پایه" },
    "category": { "type": "string", "enum": ["specialized", "general"] },
    "units": {
      "type": "object",
      "required": ["total", "theory", "practical"],
      "properties": {
        "total": { "type": "number", "example": 1.1 },
        "theory": { "type": "number", "example": 0.85 },
        "practical": { "type": "number", "example": 0.25 }
      }
    },
    "instructors": { "type": "string" },
    "prerequisites": { "type": "array", "items": { "type": "string" } },
    "corequisites": { "type": "array", "items": { "type": "string" } },
    "theorySchedule": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["day", "startTime", "endTime"],
        "properties": {
          "day": { "type": "string", "enum": ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه"] },
          "startTime": { "type": "string", "format": "time", "example": "10:00" },
          "endTime": { "type": "string", "format": "time", "example": "12:00" },
          "location": { "type": "string" },
          "label": { "type": "string" }
        }
      }
    },
    "genderSchedules": {
      "type": "object",
      "properties": {
        "male": { "type": "array" },
        "female": { "type": "array" }
      }
    },
    "practicalGroups": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "slots": { "type": "array" }
        }
      }
    },
    "midtermExam": {
      "type": "object",
      "properties": {
        "date": { "type": "string", "example": "1405/08/30" },
        "time": { "type": "string", "example": "10:00" },
        "isFullDeletion": { "type": "boolean" },
        "type": { "type": "string", "enum": ["midterm"] }
      }
    },
    "finalExam": {
      "type": "object",
      "properties": {
        "date": { "type": "string", "example": "1405/11/06" },
        "time": { "type": "string", "example": "08:30" },
        "type": { "type": "string", "enum": ["final"] }
      }
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleJsonSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Code className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">
              مستندات الگوریتم بررسی تداخلات و ساختار داده (JSON Schema)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* Section 1: Conflict Detection Algorithm */}
          <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
            <h4 className="text-sm font-bold text-teal-900 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              الگوریتم جامع بررسی تداخلات (Conflict Detection Algorithm)
            </h4>
            <div className="space-y-2 text-slate-700">
              <p>
                <strong>۱. تداخل کلاسی (Time Slot Collision):</strong> به ازای هر دو درس انتخابی <span className="font-mono text-teal-800">A</span> و <span className="font-mono text-teal-800">B</span>:
              </p>
              <ul className="list-disc list-inside space-y-1 mr-2 text-[11px]">
                <li>ساعت شروع و پایان به دقایق از مبدا روز (<span className="font-mono">minutes = hours * 60 + mins</span>) تبدیل می‌شود.</li>
                <li>برای هر بازه کلاسی فعال درس A و B، چنانچه روز یکسان باشد (<span className="font-mono">slotA.day === slotB.day</span>)، شرط اشتراک بازه زمانی اعتبارسنجی می‌شود:</li>
                <li className="font-mono bg-white p-1.5 rounded border border-teal-200 text-teal-900">
                  slotA.startTime &lt; slotB.endTime &amp;&amp; slotB.startTime &lt; slotA.endTime
                </li>
                <li>در صورت برقراری شرط، تداخل زمانی ثبت و بلاک‌های متناظر در تقویم هفتگی با حاشیه قرمز و برچسب هشدار نمایش داده می‌شوند.</li>
              </ul>

              <p className="mt-2">
                <strong>۲. تداخل امتحانی (Exam Overlap Detector):</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mr-2 text-[11px]">
                <li><strong>پایان‌ترم:</strong> مقایسه تاریخ <span className="font-mono">finalExam.date</span> دروس انتخابی؛ چنانچه دو درس در یک روز باشند، هشدار تداخل تاریخ پایان‌ترم فعال می‌شود.</li>
                <li><strong>میان‌ترم / حذفی:</strong> بررسی همزمانی تاریخ‌های <span className="font-mono">midtermExam.date</span> در روزهای شنبه نیمسال.</li>
              </ul>

              <p className="mt-2">
                <strong>۳. اعتبارسنجی پیش‌نیازها و هم‌نیازها (Prerequisite Graph):</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mr-2 text-[11px]">
                <li>تمام دروس لیست‌شده در گزارش پاس‌نشده فرض شده‌اند. بنابراین دروسی نظیر <strong>پاتولوژی عمومی نظری</strong> که به ایمنی‌شناسی وابسته هستند، تا زمان پاس‌نشدن ایمنی‌شناسی خطای پیش‌نیاز می‌گیرند.</li>
                <li>دروس هم‌نیاز نظیر <strong>پاتولوژی عمومی عملی</strong> ملزم به انتخاب همزمان پاتولوژی نظری در سبد واحد هستند.</li>
              </ul>
            </div>
          </div>

          {/* Section 2: JSON Schema */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-teal-600" />
                ساختار داده استاندارد دروس (JSON Schema)
              </h4>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی اسکیما'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-72 dir-ltr text-left leading-relaxed">
              {sampleJsonSchema}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
          >
            متوجه شدم و بستن
          </button>
        </div>

      </div>
    </div>
  );
};
