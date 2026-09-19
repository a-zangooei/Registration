import React, { useState, useEffect } from 'react';
import {
  X,
  Code,
  ShieldAlert,
  BookOpen,
  Copy,
  Check,
  Download,
  FileCode,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface SchemaAndAlgorithmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaAndAlgorithmModal: React.FC<SchemaAndAlgorithmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'dataset' | 'algorithm' | 'schema'>('dataset');
  const [copiedDataset, setCopiedDataset] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // ESC key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sample full Curriculum JSON
  const sampleCurriculumJson = `{
  "id": "med-term5-fall-1403",
  "title": "نیمسال پنجم علوم پایه پزشکی (ورودی ۱۴۰۲/۱۴۰۳)",
  "academicYear": "۱۴۰۳-۱۴۰۴",
  "termNumber": 5,
  "minUnits": 12,
  "maxUnits": 14.49,
  "description": "چارت دروس، ساعات نظری و عملی، تفکیک جنسیتی و تاریخ امتحانات",
  "externalPassedCourses": [
    "1106101",
    "110611100",
    "1106145",
    "1106001"
  ],
  "courses": [
    {
      "id": "c1",
      "code": "110611000",
      "name": "علوم تشریح سیستم ادراری - تناسلی",
      "term": 3,
      "courseTypeString": "الزامی پایه",
      "category": "specialized",
      "units": {
        "total": 1.1,
        "theory": 0.85,
        "practical": 0.25
      },
      "instructors": "خانم دکتر مقدم (نظری و عملی)",
      "prerequisites": ["1106101"],
      "corequisites": [],
      "theorySchedule": [
        {
          "day": "یکشنبه",
          "startTime": "10:00",
          "endTime": "12:00",
          "label": "نظری"
        }
      ],
      "genderSchedules": {
        "male": [],
        "female": []
      },
      "practicalGroups": [
        {
          "id": "c1_p1",
          "name": "تشریح: دوشنبه ۱۸:۰۰ - ۲۰:۰۰",
          "slots": [
            {
              "day": "دوشنبه",
              "startTime": "18:00",
              "endTime": "20:00",
              "label": "عملی تشریح"
            }
          ]
        },
        {
          "id": "c1_p2",
          "name": "تشریح: سه‌شنبه ۱۲:۰۰ - ۱۴:۰۰",
          "slots": [
            {
              "day": "سه‌شنبه",
              "startTime": "12:00",
              "endTime": "14:00",
              "label": "عملی تشریح"
            }
          ]
        }
      ],
      "midtermExam": null,
      "finalExam": {
        "date": "1405/11/06",
        "time": "08:30",
        "type": "final",
        "notes": "پایان‌ترم تشریح ادراری تناسلی"
      },
      "examStatusDescription": "فقط پایان‌ترم",
      "colorBadge": {
        "bg": "bg-emerald-600",
        "border": "border-emerald-500",
        "text": "text-emerald-700",
        "lightBg": "bg-emerald-50"
      }
    }
  ]
}`;

  // Formal JSON Schema
  const sampleJsonSchema = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CurriculumDatasetSchema",
  "type": "object",
  "required": ["id", "title", "academicYear", "termNumber", "minUnits", "maxUnits", "courses"],
  "properties": {
    "id": { "type": "string", "description": "شناسه لاتین و یکتای دوره تحصیلی" },
    "title": { "type": "string", "description": "عنوان کامل و فارسی نیمسال" },
    "academicYear": { "type": "string", "description": "سال تحصیلی، مثلا ۱۴۰۳-۱۴۰۴" },
    "termNumber": { "type": "integer", "description": "شماره ترم اصلی" },
    "minUnits": { "type": "number", "description": "کف مجاز اخذ واحد" },
    "maxUnits": { "type": "number", "description": "سقف مجاز اخذ واحد" },
    "externalPassedCourses": {
      "type": "array",
      "items": { "type": "string" },
      "description": "کد دروسی که قبلاً پاس شده فرض می‌شوند"
    },
    "courses": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "code", "name", "term", "category", "units", "theorySchedule"],
        "properties": {
          "id": { "type": "string" },
          "code": { "type": "string" },
          "name": { "type": "string" },
          "term": { "type": "integer" },
          "courseTypeString": { "type": "string" },
          "category": { "type": "string", "enum": ["specialized", "general"] },
          "units": {
            "type": "object",
            "required": ["total", "theory", "practical"],
            "properties": {
              "total": { "type": "number" },
              "theory": { "type": "number" },
              "practical": { "type": "number" }
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
                "startTime": { "type": "string", "example": "08:00" },
                "endTime": { "type": "string", "example": "10:00" },
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
              "required": ["id", "name", "slots"],
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "slots": { "type": "array" }
              }
            }
          },
          "midtermExam": { "type": ["object", "null"] },
          "finalExam": { "type": ["object", "null"] }
        }
      }
    }
  }
}`;

  const handleCopyDataset = () => {
    navigator.clipboard.writeText(sampleCurriculumJson);
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sampleJsonSchema);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCurriculumJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'curriculum-template.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90dvh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                مستندات ساخت فایل داده‌های نیمسال تحصیلی (JSON) و الگوریتم تداخلات
              </h3>
              <p className="text-[11px] text-slate-500">
                راهنمای جامع توسعه، افزودن دوره‌های تحصیلی جدید و تشریح موتور پردازش قوانین
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100/80 border-b border-slate-200 shrink-0 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('dataset')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'dataset'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-teal-600" />
            <span>فرمت فایل دوره تحصیلی (Curriculum JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('algorithm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'algorithm'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>الگوریتم سنجش تداخلات کلاسی و امتحانی</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'schema'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>اسکیما رسمی (JSON Schema)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* TAB 1: CURRICULUM DATASET FORMAT & GUIDE */}
          {activeTab === 'dataset' && (
            <div className="space-y-4">
              
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-teal-950 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-700" />
                  چگونه فایل دوره تحصیلی جدید بسازیم؟ (سازگار با GitHub Pages)
                </h4>
                <p className="text-[11px] text-teal-900 leading-relaxed mb-3">
                  تمام داده‌های دروس، ساعات تشکیل، گروه‌های عملی، امتحانات و سقف واحدها در قالب یک فایل <strong>JSON</strong> ذخیره می‌شوند. برای اضافه کردن هر ترم جدید (مثلاً ترم ۶، دانشگاه دیگر یا سال بعد) کافی است این فایل را ایجاد کرده و در مسیر <code className="bg-teal-100 px-1.5 py-0.5 rounded font-mono text-teal-950">public/datasets/</code> گیت‌هاب قرار دهید.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-white p-3 rounded-xl border border-teal-200">
                    <span className="font-bold text-teal-900 block mb-1">فیلدهای اصلی دوره (Root Fields):</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      <li><code className="font-mono text-teal-800 font-bold">id</code>: شناسه انگلیسی یکتا (مثال: term-06-spring-1404)</li>
                      <li><code className="font-mono text-teal-800 font-bold">title</code>: عنوان رسمی دوره تحصیلی</li>
                      <li><code className="font-mono text-teal-800 font-bold">academicYear</code>: سال تحصیلی (مثال: ۱۴۰۳-۱۴۰۴)</li>
                      <li><code className="font-mono text-teal-800 font-bold">minUnits / maxUnits</code>: کف و سقف مجاز اخذ واحد</li>
                      <li><code className="font-mono text-teal-800 font-bold">courses</code>: آرایه دروس دوره با جزئیات کامل</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-teal-200">
                    <span className="font-bold text-teal-900 block mb-1">فیلدهای مهم هر درس (Course Object):</span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600">
                      <li><code className="font-mono text-teal-800 font-bold">theorySchedule</code>: زمان‌بندی ساعات نظری (شنبه تا چهارشنبه)</li>
                      <li><code className="font-mono text-teal-800 font-bold">practicalGroups</code>: گروه‌های عملی با شناسه‌های مجزا</li>
                      <li><code className="font-mono text-teal-800 font-bold">genderSchedules</code>: کلاس‌های تفکیک‌شده (خواهران/برادران)</li>
                      <li><code className="font-mono text-teal-800 font-bold">midtermExam / finalExam</code>: تاریخ آزمون به فرمت شمسی (1405/11/06)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions & Code Preview */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-teal-600" />
                  نمونه کامل فایل JSON یک دوره تحصیلی (آماده استفاده و کپی):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>دانلود قالب خام JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyDataset}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 font-bold transition-colors"
                  >
                    {copiedDataset ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDataset ? 'کپی شد!' : 'کپی نمونه JSON'}</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-96 dir-ltr text-left leading-relaxed shadow-inner">
                {sampleCurriculumJson}
              </pre>

            </div>
          )}

          {/* TAB 2: ALGORITHM */}
          {activeTab === 'algorithm' && (
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                الگوریتم جامع بررسی تداخلات (Conflict Detection Algorithm)
              </h4>
              
              <div className="space-y-3 text-slate-700">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1 text-xs">۱. تداخل کلاسی (Time Slot Collision):</strong>
                  <p className="text-[11px] text-slate-600 mb-2">
                    به ازای هر دو درس انتخابی <span className="font-mono text-teal-800 font-bold">A</span> و <span className="font-mono text-teal-800 font-bold">B</span>، ساعت شروع و پایان بر حسب دقیقه تبدیل شده و در صورت یکسان بودن روز هفته، شرط اشتراک بازه زمانی محاسبه می‌شود:
                  </p>
                  <div className="font-mono bg-slate-900 text-teal-300 p-2 rounded-lg text-xs dir-ltr text-left">
                    slotA.startTime &lt; slotB.endTime &amp;&amp; slotB.startTime &lt; slotA.endTime
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1 text-xs">۲. تداخل امتحانی (Exam Overlap Detector):</strong>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                    <li><strong>پایان‌ترم:</strong> مقایسه فیلد <span className="font-mono text-teal-700">finalExam.date</span>؛ چنانچه دو درس انتخابی در یک روز آزمون داشته باشند، هشدار همزمانی آزمون پایان‌ترم صادر می‌شود.</li>
                    <li><strong>میان‌ترم / حذفی:</strong> بررسی همزمانی تاریخ‌های <span className="font-mono text-teal-700">midtermExam.date</span> در روزهای شنبه نیمسال.</li>
                  </ul>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                  <strong className="text-slate-900 block mb-1 text-xs">۳. اعتبارسنجی پیش‌نیازها و هم‌نیازها:</strong>
                  <p className="text-[11px] text-slate-600">
                    دروس موجود در آرایه <span className="font-mono text-teal-700">externalPassedCourses</span> به عنوان دروس از پیش پاس‌شده محاسبه می‌شوند. هر پیش‌نیازی که خارج از این لیست باشد و در ترم‌های قبل پاس نشده باشد خطای عدم رعایت پیش‌نیاز خواهد گرفت.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JSON SCHEMA SPECIFICATION */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  اسکیما رسمی اعتبارسنجی (JSON Schema Draft-07):
                </span>
                <button
                  type="button"
                  onClick={handleCopySchema}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-300 font-bold transition-colors"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'کپی شد!' : 'کپی اسکیما'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-96 dir-ltr text-left leading-relaxed shadow-inner">
                {sampleJsonSchema}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            فرمت JSON مستقل از سرور است و مستقیماً روی GitHub Pages اجرا می‌شود.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs"
          >
            متوجه شدم و بستن
          </button>
        </div>

      </div>
    </div>
  );
};
