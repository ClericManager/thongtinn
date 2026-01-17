import React, { useState, useEffect, useRef } from 'react';
import { ClergyMember, TimelineEvent } from '../types';

interface ClergyModalProps {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'add';
  data: ClergyMember | null;
  onClose: () => void;
  onSave: (data: ClergyMember, isAutoSave: boolean) => Promise<void>;
  isSaving?: boolean; 
}

const EMPTY_CLERGY: ClergyMember = {
  fullName: '',
  imageUrl: 'https://picsum.photos/300',
  profileLink: '',
  role: 'Linh Mục',
  currentLocation: '',
  ordinationDate: '',
  birthDate: '',
  patronSaint: '',
  tenure: '',
  category: 'GIAO_XU',
  status: 'DANG_MUC_VU',
  timeline: []
};

const ROLE_OPTIONS = [
  "Tổng Giám Mục",
  "Phó Tổng Giám Mục",
  "Giám Mục Phụ Tá",
  "Linh Mục Chánh Xứ",
  "Linh Mục Phó Xứ",
  "Linh Mục Dòng",
  "Linh Mục Tòa",
  "Phó tế",
  "Về Hưu"
];

const ClergyModal: React.FC<ClergyModalProps> = ({ 
  isOpen, 
  mode, 
  data, 
  onClose, 
  onSave,
  isSaving = false 
}) => {
  const [formData, setFormData] = useState<ClergyMember>(EMPTY_CLERGY);
  
  // Auto-save Status: 'idle' | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  // Initialize Data
  useEffect(() => {
    if (isOpen) {
      if (mode === 'add') {
        setFormData(EMPTY_CLERGY);
        setSaveStatus('idle');
      } else if (data) {
        setFormData(data);
        setSaveStatus('saved');
      }
      isFirstRender.current = true;
    }
  }, [isOpen, mode, data]);

  // --------------------------------------------------------
  // AUTO-SAVE LOGIC (Debounce 1.5s) - ONLY FOR EDIT MODE
  // --------------------------------------------------------
  useEffect(() => {
    // Only run auto-save if open, in edit mode, and not the initial render
    if (!isOpen || mode !== 'edit') return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveStatus('saving');

    const timer = setTimeout(async () => {
      try {
        await onSave(formData, true); // true = isAutoSave
        setSaveStatus('saved');
      } catch (error) {
        console.error("Auto-save failed", error);
        setSaveStatus('error');
      }
    }, 1500); // 1.5 Seconds Debounce

    return () => clearTimeout(timer);
  }, [formData, isOpen, mode]); // Dependencies: whenever formData changes

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTimelineChange = (index: number, field: keyof TimelineEvent, value: string) => {
    const newTimeline = [...formData.timeline];
    newTimeline[index] = { ...newTimeline[index], [field]: value };
    setFormData(prev => ({ ...prev, timeline: newTimeline }));
  };

  const addTimelineEvent = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, { year: '', description: '' }]
    }));
  };

  const removeTimelineEvent = (index: number) => {
    const newTimeline = formData.timeline.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, timeline: newTimeline }));
  };

  // Manual Submit for ADD Mode
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData, false); // false = not auto save, is manual
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 overflow-y-auto py-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col">
        
        {/* Header */}
        <div className="bg-aosGreen p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white uppercase">
              {isViewMode ? 'Chi Tiết Hồ Sơ' : isAddMode ? 'Thêm Giáo Sĩ Mới' : 'Chỉnh Sửa Hồ Sơ'}
            </h2>
            
            {/* STATUS INDICATOR FOR EDIT MODE */}
            {isEditMode && (
              <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                {saveStatus === 'saving' && (
                  <>
                    <i className="fas fa-spinner fa-spin text-yellow-300"></i>
                    <span className="text-yellow-300 text-sm font-bold animate-pulse">Đang lưu...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <i className="fas fa-check-circle text-green-300"></i>
                    <span className="text-green-300 text-sm font-bold">Đã lưu</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <i className="fas fa-exclamation-triangle text-red-400"></i>
                    <span className="text-red-400 text-sm font-bold">Lỗi lưu!</span>
                  </>
                )}
              </div>
            )}
          </div>

          <button onClick={onClose} className="text-white hover:text-yellow-400 transition">
            <i className="fas fa-times text-2xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <form onSubmit={handleManualSubmit}>
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Left Column: Image & Links */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-aosGreen shadow-lg mb-4">
                   <img 
                    src={formData.imageUrl} 
                    alt={formData.fullName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                   />
                </div>
                {!isViewMode && (
                  <div className="w-full space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh (URL)</label>
                      <input
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-aosGreen focus:outline-none"
                        placeholder="http://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link Profile (URL)</label>
                      <input
                        type="text"
                        name="profileLink"
                        value={formData.profileLink}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-aosGreen focus:outline-none"
                        placeholder="Link chi tiết..."
                      />
                    </div>
                  </div>
                )}
                {isViewMode && formData.profileLink && (
                  <a href={formData.profileLink} target="_blank" rel="noreferrer" className="text-aosGreen hover:underline mt-2 flex items-center">
                    <i className="fas fa-external-link-alt mr-1"></i> Xem Profile gốc
                  </a>
                )}
              </div>

              {/* Right Column: Info */}
              <div className="w-full md:w-2/3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-600">Họ và Tên</label>
                    {isViewMode ? (
                      <p className="text-xl font-bold text-aosGreen">{formData.fullName}</p>
                    ) : (
                      <input
                        required
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>

                  {/* Patron Saint */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600">Ngày Quan Thầy</label>
                    {isViewMode ? (
                      <p className="text-lg">{formData.patronSaint}</p>
                    ) : (
                      <input
                        type="text"
                        name="patronSaint"
                        value={formData.patronSaint}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>

                   {/* Birth Date */}
                   <div>
                    <label className="block text-sm font-bold text-gray-600">Ngày sinh</label>
                    {isViewMode ? (
                      <p className="text-lg">{formData.birthDate}</p>
                    ) : (
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>

                  {/* Role - Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600">Sứ vụ</label>
                    {isViewMode ? (
                      <span className="inline-block bg-yellow-100 text-yellow-800 rounded px-2 py-1 text-sm font-semibold">
                        {formData.role}
                      </span>
                    ) : (
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      >
                        {ROLE_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Category - Strict Options */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600">Phân loại</label>
                    {isViewMode ? (
                      <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                        {formData.category === 'TGM_DCV' ? 'TGM & ĐCV' : formData.category === 'GIAO_XU' ? 'Giáo Xứ' : 'Dòng Tu'}
                      </span>
                    ) : (
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      >
                        <option value="GIAO_XU">Giáo Xứ</option>
                        <option value="TGM_DCV">TGM & ĐCV</option>
                        <option value="DONG">Dòng Tu</option>
                      </select>
                    )}
                  </div>

                  {/* Location */}
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-600">Nơi Mục Vụ Hiện Tại</label>
                    {isViewMode ? (
                      <p className="text-lg">{formData.currentLocation}</p>
                    ) : (
                      <input
                        type="text"
                        name="currentLocation"
                        value={formData.currentLocation}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>

                  {/* Ordination Date */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600">Ngày Thụ Phong</label>
                    {isViewMode ? (
                      <p className="text-lg">{formData.ordinationDate}</p>
                    ) : (
                      <input
                        type="date"
                        name="ordinationDate"
                        value={formData.ordinationDate}
                        onChange={handleInputChange}
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>

                  {/* Tenure */}
                  <div>
                    <label className="block text-sm font-bold text-gray-600">Thời gian tại nhiệm</label>
                    {isViewMode ? (
                      <p className="text-lg">{formData.tenure}</p>
                    ) : (
                      <input
                        type="text"
                        name="tenure"
                        value={formData.tenure}
                        onChange={handleInputChange}
                        placeholder="VD: 2020 - Nay"
                        className="w-full border p-2 rounded focus:border-aosGreen outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Section */}
            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-aosGreen">
                  <i className="fas fa-history mr-2"></i>Lịch Sử Mục Vụ
                </h3>
                {!isViewMode && (
                  <button 
                    type="button"
                    onClick={addTimelineEvent}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    + Thêm mốc
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {(formData.timeline || []).map((event, idx) => (
                  <div key={idx} className="flex gap-4 items-start relative border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-aosGreen border-2 border-white"></div>
                    {isViewMode ? (
                      <div>
                        <span className="font-bold text-aosGreen block">{event.year}</span>
                        <span className="text-gray-700">{event.description}</span>
                      </div>
                    ) : (
                      <div className="flex gap-2 w-full items-start">
                        <input
                          type="text"
                          placeholder="Năm (VD: 2010-2015)"
                          value={event.year}
                          onChange={(e) => handleTimelineChange(idx, 'year', e.target.value)}
                          className="border p-2 rounded w-1/3 focus:border-aosGreen outline-none"
                        />
                         <input
                          type="text"
                          placeholder="Mô tả sự kiện"
                          value={event.description}
                          onChange={(e) => handleTimelineChange(idx, 'description', e.target.value)}
                          className="border p-2 rounded w-full focus:border-aosGreen outline-none"
                        />
                        <button 
                          type="button"
                          onClick={() => removeTimelineEvent(idx)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: ONLY FOR ADD MODE */}
            {isAddMode && (
              <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-bold"
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-2 bg-aosGreen text-white rounded font-bold transition flex items-center ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-800'}`}
                >
                  {isSaving ? (
                    <>
                       <i className="fas fa-spinner fa-spin mr-2"></i> Đang lưu...
                    </>
                  ) : (
                    'Thêm giáo sĩ'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClergyModal;