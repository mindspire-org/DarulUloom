import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getChars(value: string, length: number) {
  const v = (value || "").slice(0, length);
  const chars = v.split("");
  while (chars.length < length) chars.push("");
  return chars;
}

function joinChars(chars: string[]) {
  return chars.join("").replace(/\s+/g, "");
}

function FormattedDigitBoxes({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  // Format: ******/**/**** (6 digits / 2 digits / 4 digits = 12 total)
  const chars = getChars(value, 12);

  const updateChar = (index: number, val: string) => {
    const next = [...chars];
    next[index] = val.slice(-1);
    onChange(joinChars(next));
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-row-reverse items-center gap-0.5">
        {/* Part 3: 4 digits */}
        {chars.slice(8, 12).map((ch, i) => (
          <input
            key={i + 8}
            value={ch}
            onChange={(e) => updateChar(i + 8, e.target.value)}
            className="h-7 w-6 border border-black text-center text-xs outline-none"
            inputMode="numeric"
            maxLength={1}
          />
        ))}
        {/* Separator */}
        <span className="text-xs font-bold px-0.5">/</span>
        {/* Part 2: 2 digits */}
        {chars.slice(6, 8).map((ch, i) => (
          <input
            key={i + 6}
            value={ch}
            onChange={(e) => updateChar(i + 6, e.target.value)}
            className="h-7 w-6 border border-black text-center text-xs outline-none"
            inputMode="numeric"
            maxLength={1}
          />
        ))}
        {/* Separator */}
        <span className="text-xs font-bold px-0.5">/</span>
        {/* Part 1: 6 digits */}
        {chars.slice(0, 6).map((ch, i) => (
          <input
            key={i}
            value={ch}
            onChange={(e) => updateChar(i, e.target.value)}
            className="h-7 w-6 border border-black text-center text-xs outline-none"
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>
    </div>
  );
}

function DigitBoxesInput({
  label,
  value,
  length,
  onChange,
}: {
  label: string;
  value: string;
  length: number;
  onChange: (val: string) => void;
}) {
  const chars = getChars(value, length);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-row-reverse gap-1 flex-wrap">
        {chars.map((ch, idx) => (
          <input
            key={idx}
            value={ch}
            onChange={(e) => {
              const next = getChars(value, length);
              const raw = (e.target.value || "").slice(-1);
              next[idx] = raw;
              onChange(joinChars(next));
            }}
            className="h-8 w-8 border border-black text-center text-sm outline-none"
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>
    </div>
  );
}

function RelationDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newRelation, setNewRelation] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Default relations - والد is first (default)
  const defaultRelations = ["والد", "والدہ", "بھائی", "چچا", "ماموں", "دادا", "نانا", "استاد"];

  const [relations, setRelations] = useState<string[]>(() => {
    const saved = localStorage.getItem("guardianRelations");
    return saved ? JSON.parse(saved) : defaultRelations;
  });

  useEffect(() => {
    localStorage.setItem("guardianRelations", JSON.stringify(relations));
  }, [relations]);

  const addRelation = () => {
    if (newRelation.trim()) {
      setRelations([...relations, newRelation.trim()]);
      setNewRelation("");
    }
  };

  const deleteRelation = (index: number) => {
    const relationToDelete = relations[index];
    const newRelations = relations.filter((_, i) => i !== index);
    setRelations(newRelations);
    // If currently selected relation is deleted, reset to والد
    if (value === relationToDelete) {
      onChange("والد");
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(relations[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const oldValue = relations[editingIndex];
      const newRelations = [...relations];
      newRelations[editingIndex] = editValue.trim();
      setRelations(newRelations);
      // Update selected value if it was the one being edited
      if (value === oldValue) {
        onChange(editValue.trim());
      }
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const selectRelation = (relation: string) => {
    onChange(relation);
    setIsOpen(false);
  };

  // Set default to والد if no value
  useEffect(() => {
    if (!value && relations.length > 0) {
      onChange(relations[0]);
    }
  }, [value, relations, onChange]);

  return (
    <span className="inline-block relative mx-1">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[80px] px-2 py-0.5 border-b border-black text-center bg-transparent hover:bg-gray-50 inline-flex items-center justify-center gap-1"
      >
        <span>{value || "والد"}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-1 w-40 bg-white border border-black shadow-lg">
          {/* Relations List */}
          <div className="max-h-40 overflow-y-auto">
            {relations.map((relation, index) => (
              <div
                key={index}
                className={`px-2 py-1.5 cursor-pointer hover:bg-gray-100 text-sm flex items-center justify-between ${
                  value === relation ? "bg-gray-100 font-bold" : ""
                }`}
              >
                {editingIndex === index ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 border border-black px-1 py-0.5 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800 text-xs">✓</button>
                    <button onClick={cancelEdit} className="text-red-600 hover:text-red-800 text-xs">✕</button>
                  </div>
                ) : (
                  <>
                    <span onClick={() => selectRelation(relation)} className="flex-1 text-right">
                      {relation}
                    </span>
                    {!isManaging && (
                      <span className="text-xs text-gray-400">
                        {value === relation ? "✓" : ""}
                      </span>
                    )}
                    {isManaging && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(index); }}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRelation(index); }}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Add New Section */}
          {isManaging ? (
            <div className="p-2 space-y-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="نیا رشتہ..."
                  className="flex-1 border border-black px-1 py-0.5 text-sm text-right"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRelation();
                  }}
                />
                <button
                  onClick={addRelation}
                  className="bg-black text-white px-2 py-0.5 text-sm hover:bg-gray-800"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setIsManaging(false)}
                className="w-full text-center text-xs text-gray-600 hover:text-black border border-gray-300 py-0.5"
              >
                مکمل
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsManaging(true)}
              className="w-full px-2 py-1.5 text-sm text-center text-gray-600 hover:text-black hover:bg-gray-50"
            >
              + نیا رشتہ شامل کریں
            </button>
          )}
        </div>
      )}
    </span>
  );
}

function EducationDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [newEducation, setNewEducation] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Default education levels
  const defaultEducationLevels = ["Middle", "Matric", "FSc"];

  const [educationLevels, setEducationLevels] = useState<string[]>(() => {
    const saved = localStorage.getItem("educationLevels");
    return saved ? JSON.parse(saved) : defaultEducationLevels;
  });

  useEffect(() => {
    localStorage.setItem("educationLevels", JSON.stringify(educationLevels));
  }, [educationLevels]);

  const addEducation = () => {
    if (newEducation.trim()) {
      setEducationLevels([...educationLevels, newEducation.trim()]);
      setNewEducation("");
    }
  };

  const deleteEducation = (index: number) => {
    const educationToDelete = educationLevels[index];
    const newLevels = educationLevels.filter((_, i) => i !== index);
    setEducationLevels(newLevels);
    // If currently selected value is deleted, reset to first option
    if (value === educationToDelete) {
      onChange(newLevels[0] || "");
    }
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(educationLevels[index]);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const oldValue = educationLevels[editingIndex];
      const newLevels = [...educationLevels];
      newLevels[editingIndex] = editValue.trim();
      setEducationLevels(newLevels);
      // Update selected value if it was the one being edited
      if (value === oldValue) {
        onChange(editValue.trim());
      }
      setEditingIndex(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const selectEducation = (level: string) => {
    onChange(level);
    setIsOpen(false);
  };

  // Set default to first level if no value
  useEffect(() => {
    if (!value && educationLevels.length > 0) {
      onChange(educationLevels[0]);
    }
  }, [value, educationLevels, onChange]);

  return (
    <span className="inline-block relative mx-1">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-[100px] px-2 py-0.5 border-b border-black text-center bg-transparent hover:bg-gray-50 inline-flex items-center justify-center gap-1"
      >
        <span>{value || "Select"}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-1 w-40 bg-white border border-black shadow-lg">
          {/* Education Levels List */}
          <div className="max-h-40 overflow-y-auto">
            {educationLevels.map((level, index) => (
              <div
                key={index}
                className={`px-2 py-1.5 cursor-pointer hover:bg-gray-100 text-sm flex items-center justify-between ${
                  value === level ? "bg-gray-100 font-bold" : ""
                }`}
              >
                {editingIndex === index ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 border border-black px-1 py-0.5 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800 text-xs">✓</button>
                    <button onClick={cancelEdit} className="text-red-600 hover:text-red-800 text-xs">✕</button>
                  </div>
                ) : (
                  <>
                    <span onClick={() => selectEducation(level)} className="flex-1 text-right">
                      {level}
                    </span>
                    {!isManaging && (
                      <span className="text-xs text-gray-400">
                        {value === level ? "✓" : ""}
                      </span>
                    )}
                    {isManaging && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(index); }}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteEducation(index); }}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Add New Section */}
          {isManaging ? (
            <div className="p-2 space-y-2">
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newEducation}
                  onChange={(e) => setNewEducation(e.target.value)}
                  placeholder="نیا درجہ..."
                  className="flex-1 border border-black px-1 py-0.5 text-sm text-right"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addEducation();
                  }}
                />
                <button
                  onClick={addEducation}
                  className="bg-black text-white px-2 py-0.5 text-sm hover:bg-gray-800"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setIsManaging(false)}
                className="w-full text-center text-xs text-gray-600 hover:text-black border border-gray-300 py-0.5"
              >
                مکمل
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsManaging(true)}
              className="w-full px-2 py-1.5 text-sm text-center text-gray-600 hover:text-black hover:bg-gray-50"
            >
              + نیا درجہ شامل کریں
            </button>
          )}
        </div>
      )}
    </span>
  );
}

export function PaperFormEditor({
  formData,
  setFormData,
}: {
  formData: any;
  setFormData: (data: any) => void;
}) {
  const set = (key: string, val: any) => setFormData({ ...formData, [key]: val });
  const [page, setPage] = useState<"front" | "back">("front");

  const frontInstructions: string[] = [
    "طالب علم/ولی اس امر کی تصدیق کرتے ہیں کہ تمام درج معلومات درست ہیں۔",
    "ادارہ کے قواعد و ضوابط کی مکمل پابندی کی جائے گی۔",
    "بلا اجازت غیر حاضری/چھٹی کی صورت میں ادارہ کارروائی کا مجاز ہوگا۔",
    "ادارہ کی املاک کو نقصان نہیں پہنچایا جائے گا۔",
    "نظم و ضبط، حاضری اور اوقات کی پابندی لازم ہوگی۔",
    "غیر متعلقہ/غیر اخلاقی مواد اور موبائل وغیرہ کی پابندی کی جائے گی۔",
    "طلبہ میں لڑائی جھگڑا/بدتمیزی کی صورت میں داخلہ منسوخ ہو سکتا ہے۔",
    "ادارہ میں رہائش/کھانے پینے کے ضوابط کی پابندی لازم ہوگی۔",
    "امتحانات/سبق/حفظ کے اہداف کے مطابق محنت کی جائے گی۔",
    "اساتذہ/منتظمین کے ساتھ ادب و احترام کا معاملہ کیا جائے گا۔",
    "کسی بھی قسم کی بد نظمی/غلط سرگرمی پر ادارہ فیصلہ کرنے کا مجاز ہوگا۔",
    "والدین/سرپرست ادارہ کی طرف سے بلانے پر بروقت حاضر ہوں گے۔",
    "فیس/اخراجات کی ادائیگی طے شدہ وقت پر کی جائے گی۔",
    "داخلہ کے بعد ضوابط کی خلاف ورزی پر ادارہ فیصلہ کرنے کا مجاز ہوگا۔",
    "طالب علم کے سامان/قیمتی اشیاء کی ذمہ داری طالب علم کی اپنی ہوگی۔",
    "یہ عہد نامہ مکمل رضامندی کے ساتھ قبول کیا جاتا ہے۔",
    "میں/ہم ادارہ کے فیصلوں کو تسلیم کرنے کا اقرار کرتے ہیں۔",
  ];

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex justify-center">
      <div className="bg-black text-white px-6 py-2 rounded-full font-bold text-sm">
        {title}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPage("front")}
          className={`flex-1 border border-black px-4 py-2 font-semibold ${page === "front" ? "bg-black text-white" : "bg-white text-black"
            }`}
        >
          Front Page
        </button>
        <button
          type="button"
          onClick={() => setPage("back")}
          className={`flex-1 border border-black px-4 py-2 font-semibold ${page === "back" ? "bg-black text-white" : "bg-white text-black"
            }`}
        >
          Back Page
        </button>
      </div>

      <div className={`${page === "front" ? "block" : "hidden"}`}>
        <div className="border border-black bg-white text-black p-4 font-urdu">

          {/* Header Section */}
          <div className="grid grid-cols-[120px_1fr_120px] gap-4 mb-6">
            {/* Photo (Left in Code, Right in RTL?) - Image 2 shows Photo on Right (Urdu Right), Logo Left. 
                 But wait, Urdu is RTL. So first col is Right? No, grid is LTR. 
                 Code: cols-[100px_1fr_110px].
                 Image 2: Photo on RIGHT (since text is Urdu/RTL). Logo on LEFT.
                 Let's stick to the visual: Photo is on the side where text starts? No, text starts from Right in Urdu.
                 Usually Photo is Top Left or Top Right.
                 Let's look at Image 2 again. It has Logo on Left (English side) and Photo on Right (Urdu side).
                 So Grid: [Logo, Text, Photo].
             */}

            <div className="flex flex-col items-center justify-center">
              <img 
                src={`/logo.png?v=${Date.now()}`}
                alt="جامعہ دارالعلوم سرحد"
                className="h-28 w-28 object-contain"
              />
            </div>

            <div className="text-center pt-2">
              <div className="text-2xl font-bold mb-1">جامعہ اسلامیہ دارالعلوم سرحد (پشاور)</div>
              <div className="text-sm font-bold mb-3">ملحق وفاق المدارس العربیہ پاکستان</div>
              <div className="text-3xl font-bold mb-4">داخلہ فارم</div>
              <div className="inline-block border-2 border-black rounded-full px-8 py-1 font-bold text-lg">
                عہد نامہ از طالب علم
              </div>
              <div className="w-full border-b-2 border-black mt-3"></div>
            </div>

            <div className="flex items-center justify-center">
              <div className="border border-black h-32 w-28 flex items-center justify-center text-sm font-bold overflow-hidden bg-white">
                {formData.photoUrl ? (
                  <img src={String(formData.photoUrl)} alt="تصویر" className="h-full w-full object-cover" />
                ) : (
                  "تصویر"
                )}
              </div>
            </div>
          </div>

          {/* Instructions / Undertaking List */}
          <div className="space-y-1 text-sm text-right leading-relaxed" dir="rtl">
            {frontInstructions.map((text, index) => (
              <div key={index} className="flex gap-2 items-start text-justify">
                <span className="font-bold ml-1">({index + 1})</span>
                <span className="flex-1">
                  {text}
                  {/* Specific checkboxes for point 15 (hypothetically matches Matbakh/Nal context) */}
                  {index === 14 && (
                    <span className="inline-flex gap-6 mr-4 align-middle">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={formData.matbakh === true} onChange={(e) => set('matbakh', e.target.checked)} className="h-4 w-4 border border-black rounded-none" />
                        <span className="font-bold">مطبخ</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={formData.nal === true} onChange={(e) => set('nal', e.target.checked)} className="h-4 w-4 border border-black rounded-none" />
                        <span className="font-bold">نال</span>
                      </label>
                    </span>
                  )}
                  {/* Specific checkboxes for point 16 (hypothetically matches acceptance) */}
                  {index === 16 && (
                    <span className="inline-flex gap-4 mr-4 align-middle">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={formData.undertakingAccepted === true} onChange={(e) => set('undertakingAccepted', e.target.checked)} className="h-4 w-4 border border-black rounded-none" />
                        <span className="font-bold">قبول ہے</span>
                      </label>
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Declaration Statement & Signatures */}
          <div className="mt-4 mb-2">
            <div className="text-center font-bold text-base mb-6 mt-6">
              میں داخلہ دی جانے والی طالبہ / سرپرست اقرار کرتی ہوں کہ میں نے بالا ہدایات کو پڑھ لیا ہے اور میں ان پر عمل کرنے کی پابند رہوں گی۔
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end" dir="rtl">
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">دستخط طالب علم:</span>
                <input
                  value={formData.studentSign || ""}
                  onChange={(e) => set("studentSign", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2"
                />
              </div>
              <div className="text-[10px] text-center max-w-[200px] leading-tight text-gray-600 px-2">
                (نوٹ: ہر طالب علم کے لئے ضروری ہے کہ وہ مندرجہ بالا "عہد نامہ" مجوز کے سامنے پڑھے اور مجوز ہی کے سامنے اپنا دستخط ثبت کرے)
              </div>
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">دستخط سرپرست:</span>
                <input
                  value={formData.guardianSign || ""}
                  onChange={(e) => set("guardianSign", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2"
                />
              </div>
            </div>
          </div>

          {/* Footer - Resident Details & Office Use */}
          <div className="border-2 border-black p-3 mt-8 relative">
            <div className="grid grid-cols-3 gap-4 items-end mt-4 text-sm" dir="rtl">
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">وفاقی کا آخری پاس کردہ درجہ:</span>
                <input
                  value={formData.footerWafaqClass || ""}
                  onChange={(e) => set("footerWafaqClass", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-center"
                />
              </div>
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">حاصل کردہ نمبرات:</span>
                <input
                  value={formData.footerWafaqMarks || ""}
                  onChange={(e) => set("footerWafaqMarks", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-center"
                />
              </div>
              <div className="flex gap-2 items-end">
                <span className="font-bold whitespace-nowrap">تقدیر:</span>
                <input
                  value={formData.footerWafaqGrade || ""}
                  onChange={(e) => set("footerWafaqGrade", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-center"
                />
              </div>
            </div>

            <div className="flex justify-center mt-6 mb-4 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black"></div>
              </div>
              <div className="bg-black text-white px-8 py-1 rounded-full font-bold text-sm relative z-10">دفتری کارروائی</div>
            </div>

            <div className="flex gap-8 items-end justify-between px-4 pb-2 text-sm" dir="rtl">
              <div className="flex gap-2 items-end flex-1">
                <span className="font-bold whitespace-nowrap">احاطہ:</span>
                <input
                  value={formData.roomArea || ""}
                  onChange={(e) => set("roomArea", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-center"
                />
              </div>
              <div className="flex gap-2 items-end flex-1">
                <span className="font-bold whitespace-nowrap">کمرہ نمبر:</span>
                <input
                  value={formData.roomNumber || ""}
                  onChange={(e) => set("roomNumber", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-center"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className={`${page === "back" ? "block" : "hidden"}`}>
        <div className="border border-black bg-white text-black p-4 font-urdu">

          {/* Section 1: Kawaif Nama */}
          <div className="border border-black p-2 mb-4 mt-4">
            <div className="flex justify-center mb-2 relative">
              <div className="absolute top-[-22px] bg-white px-2">
                <div className="bg-black text-white px-8 py-1 rounded-full font-bold text-lg">
                  کوائف نامہ
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">نام:</span>
                  <input
                    value={formData.fullName || ""}
                    onChange={(e) => set("fullName", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">ولدیت:</span>
                  <input
                    value={formData.guardianName || ""}
                    onChange={(e) => set("guardianName", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">تاریخ پیدائش:</span>
                  <input
                    value={formData.dob2 || ""}
                    onChange={(e) => set("dob2", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">مطلوبہ درجہ:</span>
                  <input
                    value={formData.studentClass || ""}
                    onChange={(e) => set("studentClass", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap font-bold">موجودہ پتہ:</span>
                <input
                  value={formData.currentAddress2 || ""}
                  onChange={(e) => set("currentAddress2", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-right"
                />
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-[2] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">مستقل پتہ:</span>
                  <input
                    value={formData.permanentAddress2 || ""}
                    onChange={(e) => set("permanentAddress2", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2 text-right"
                  />
                </div>
                <div className="flex-1 flex items-center justify-end gap-2 border-b border-black pb-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLocal === true}
                      onChange={(e) => set("isLocal", e.target.checked)}
                      className="h-4 w-4 border border-black"
                    />
                    <span>ملکی</span>
                  </label>
                  <div className="h-4 w-px bg-black mx-2"></div>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isForeign === true}
                      onChange={(e) => set("isForeign", e.target.checked)}
                      className="h-4 w-4 border border-black"
                    />
                    <span>غیر ملکی</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 items-end pt-2">
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">ٹوکن نمبر:</span>
                  <input
                    value={formData.formTokenNumber || ""}
                    onChange={(e) => set("formTokenNumber", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-4 items-end pt-2">
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">رابطہ نمبر:</span>
                  <DigitBoxesInput
                    label=""
                    value={formData.phone || ""}
                    length={11}
                    onChange={(val) => set("phone", val)}
                  />
                </div>
                <div className="flex-[1.5]">
                  <DigitBoxesInput
                    label="شناختی کارڈ نمبر / ب فارم"
                    value={formData.idNumber || ""}
                    length={13}
                    onChange={(val) => set("idNumber", val)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Sabqa Karkardagi */}
          <div className="border border-black p-2 mb-4 mt-8">
            <div className="flex justify-center mb-2 relative">
              <div className="absolute top-[-22px] bg-white px-2">
                <div className="bg-black text-white px-8 py-1 rounded-full font-bold text-lg">
                  سابقہ کارکردگی
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex gap-4 items-end">
                <div className="flex-[2] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">درس نظامی کا آخری پاس کردہ درجہ:</span>
                  <input
                    value={formData.lastDarsClass || ""}
                    onChange={(e) => set("lastDarsClass", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">حاصل کردہ نمبرات:</span>
                  <input
                    value={formData.lastDarsMarks || ""}
                    onChange={(e) => set("lastDarsMarks", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-[0.5] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">تقدیر:</span>
                  <input
                    value={formData.lastDarsGrade || ""}
                    onChange={(e) => set("lastDarsGrade", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap font-bold">نام مدرسہ / جامعہ مع مکمل پتہ:</span>
                <input
                  value={formData.prevMadrasaStart || ""}
                  onChange={(e) => set("prevMadrasaStart", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-right"
                />
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-[2] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">وفاقی کا آخری پاس کردہ درجہ:</span>
                  <input
                    value={formData.lastWafaqClass || ""}
                    onChange={(e) => set("lastWafaqClass", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">حاصل کردہ نمبرات:</span>
                  <input
                    value={formData.lastWafaqMarks || ""}
                    onChange={(e) => set("lastWafaqMarks", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-[0.5] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold text-sm">تقدیر:</span>
                  <input
                    value={formData.lastWafaqGrade || ""}
                    onChange={(e) => set("lastWafaqGrade", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-[1.5fr_0.8fr_1fr_1.2fr] gap-3 items-end">
                <div className="flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">وفاقی رقم الجلوس:</span>
                  <DigitBoxesInput
                    label=""
                    value={formData.wafaqRollNo2 || ""}
                    length={4}
                    onChange={(val) => set("wafaqRollNo2", val)}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">سال:</span>
                  <input
                    value={formData.wafaqYear || ""}
                    onChange={(e) => set("wafaqYear", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2 min-w-[60px]"
                  />
                </div>
                <div className="flex flex-col items-center border border-black p-1 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={formData.wafaqExamType === 'annual'} onChange={() => set('wafaqExamType', 'annual')} /> سالانہ
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={formData.wafaqExamType === 'supply'} onChange={() => set('wafaqExamType', 'supply')} /> ضمنی
                  </label>
                </div>
                <div className="flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">رقم التسجیل:</span>
                  <FormattedDigitBoxes
                    label=""
                    value={formData.wafaqRegNo || ""}
                    onChange={(val) => set("wafaqRegNo", val)}
                  />
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">عصری تعلیم:</span>
                  <EducationDropdown
                    value={formData.contemporaryEducation || ""}
                    onChange={(val) => set("contemporaryEducation", val)}
                  />
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <span className="font-bold">اضافی تعلیم:</span>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={formData.addEduHifz === true} onChange={(e) => set('addEduHifz', e.target.checked)} className="h-4 w-4 border border-black" /> حافظ قرآن
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={formData.addEduNazra === true} onChange={(e) => set('addEduNazra', e.target.checked)} className="h-4 w-4 border border-black" /> ناظرہ قرآن
                  </label>
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap font-bold text-sm">غیر مقیم طالب علم کی اضافی مصروفیت:</span>
                <input
                  value={formData.nonResidentActivity || ""}
                  onChange={(e) => set("nonResidentActivity", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-right"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kawaif Nama Baraye Sarparast */}
          <div className="border border-black p-2 mb-4 mt-8">
            <div className="flex justify-center mb-2 relative">
              <div className="absolute top-[-22px] bg-white px-2">
                <div className="bg-black text-white px-8 py-1 rounded-full font-bold text-lg">
                  کوائف نامہ برائے سرپرست
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {/* Row 1: Name (Right) | FatherName (Center) | Contact (Left) */}
              <div className="flex gap-4">
                <div className="flex-[1.5] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">نام:</span>
                  <input
                    value={formData.guardianNameSection || ""}
                    onChange={(e) => set("guardianNameSection", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-[1.5] flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">ولدیت:</span>
                  <input
                    value={formData.guardianFatherName || ""}
                    onChange={(e) => set("guardianFatherName", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">رابطہ نمبر:</span>
                  <DigitBoxesInput
                    label=""
                    value={formData.guardianContactSection || ""}
                    length={11}
                    onChange={(val) => set("guardianContactSection", val)}
                  />
                </div>
              </div>

              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap font-bold">موجودہ پتہ:</span>
                <input
                  value={formData.guardianCurrentAddress || ""}
                  onChange={(e) => set("guardianCurrentAddress", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-right"
                />
              </div>

              <div className="flex gap-2 items-end">
                <span className="whitespace-nowrap font-bold">مستقل پتہ:</span>
                <input
                  value={formData.guardianPermanentAddress || ""}
                  onChange={(e) => set("guardianPermanentAddress", e.target.value)}
                  className="flex-1 border-b border-black outline-none px-2 text-right"
                />
              </div>

              {/* Row: CNIC (Right side in RTL) and Nation/Profession */}
              <div className="flex gap-6 items-end">
                <div className="flex-[1.5]">
                  <DigitBoxesInput
                    label="شناختی کارڈ"
                    value={formData.guardianCnic || ""}
                    length={13}
                    onChange={(val) => set("guardianCnic", val)}
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end">
                  <span className="whitespace-nowrap font-bold">پیشہ:</span>
                  <input
                    value={formData.guardianProfession || ""}
                    onChange={(e) => set("guardianProfession", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
                <div className="flex-1 flex gap-2 items-end border-b border-black pb-1">
                  <span className="whitespace-nowrap font-bold">پیشہ:</span>
                  <input
                    value={formData.guardianProfession || ""}
                    onChange={(e) => set("guardianProfession", e.target.value)}
                    className="flex-1 border-b border-black outline-none px-2"
                  />
                </div>
              </div>

              <div className="mt-4 text-right leading-8 text-sm border border-black p-3 rounded">
                <span className="font-bold underline">وعدہ نامہ: </span>
                میں طالب علم نام
                <input value={formData.pledgeStudentName2 || ""} onChange={(e) => set("pledgeStudentName2", e.target.value)} className="w-40 border-b border-black mx-1 text-center outline-none bg-transparent" />
                ولدیت
                <input value={formData.pledgeFatherName2 || ""} onChange={(e) => set("pledgeFatherName2", e.target.value)} className="w-40 border-b border-black mx-1 text-center outline-none bg-transparent" />
                جو کہ رشتہ میں میرا
                <RelationDropdown
                  value={formData.guardianRelation || ""}
                  onChange={(val) => set("guardianRelation", val)}
                />
                ہے، میں وعدہ کرتا ہوں کہ:
                <br />
                1) فارم ہذا پر تحریر قواعد و ضوابط کی خلاف ورزی کرنے پر اگر جامعہ مذکورہ طالب علم کے خلاف کوئی تادیبی کاروائی عمل میں لائے تو مجھے کوئی شکایت نہیں ہوگی۔
                <br />
                2) میں اس کی بھرپور اعانت کروں گا علم دین کے حصول میں۔
                <br />
                3) جامعہ کے علاوہ فارغ اوقات میں اس کی کڑی نگرانی کرکے بری صحبتوں سے محفوظ رکھوں گا۔
                <br />
                4) جامعہ کے مہتمم/منتظمین جب بھی بلائیں تو حاضر ہوں گا۔

                <div className="flex justify-end items-end mt-8">
                  <div className="flex gap-2 items-end">
                    <span className="font-bold">دستخط سرپرست:</span>
                    <input
                      className="border-b border-black w-48 outline-none px-1"
                      placeholder="یہاں دستخط کریں"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Daftari Karwari - Only Signatures */}
          <div className="mt-4 border border-black p-4">
            <div className="flex justify-center mb-4">
              <div className="bg-black text-white px-8 py-1 rounded-tl-xl rounded-br-xl font-bold text-lg">
                دفتری کارروائی
              </div>
            </div>

            <div className="flex justify-between items-end px-8">
              <div className="flex flex-col items-center gap-1">
                <input
                  value={formData.officeClerkSign || ""}
                  onChange={(e) => set("officeClerkSign", e.target.value)}
                  className="border-b border-black w-40 text-center outline-none"
                />
                <div className="font-bold">دستخط ناظم</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <input
                  value={formData.officePrincipalSign || ""}
                  onChange={(e) => set("officePrincipalSign", e.target.value)}
                  className="border-b border-black w-40 text-center outline-none"
                />
                <div className="font-bold">دستخط مہتمم / نائب مہتمم</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="border border-black w-24 h-24 rounded-full flex items-center justify-center mb-1">
                  <span className="text-xs text-gray-400">مہر</span>
                </div>
                <div className="font-bold">مہر جامعہ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
