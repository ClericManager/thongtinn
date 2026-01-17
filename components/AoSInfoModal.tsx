import React, { useEffect, useState } from 'react';
import { AoSInfoData, AoSDocument } from '../types';
import { getAoSInfo, updateAoSInfo } from '../services/clergyService';
import { isConfigured } from '../firebaseConfig';

interface AoSInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

// Default Data (used if nothing in DB)
const DEFAULT_INFO: AoSInfoData = {
  introduction: AOS là cộng đồng truyền giáo qua nền tảng game Roblox, nơi đức tin Công giáo được gieo mầm giữa không gian sáng tạo và kết nối của giới trẻ. Qua các hoạt động trong game, sinh hoạt cộng đồng và tinh thần bác ái, AOS mong muốn mang Tin Mừng đến gần hơn với mọi người bằng ngôn ngữ của thời đại số. 
Cộng đồng chọn chân phước Carlo Acutis làm thánh bổn mạng – người trẻ đã dùng công nghệ và internet để loan báo đức tin. Noi gương ngài, AOS khao khát trở thành một môi trường lành mạnh, yêu thương và đầy hy vọng, nơi mỗi người có thể vừa chơi game, vừa lớn lên trong đức tin và tình huynh đệ.`,
  documents: [
    { id: 1, title: "Quy chế Hoạt động AoS 2024", type: "PDF", size: "2.5 MB", url: "#" },
    { id: 2, title: "Mẫu đơn xin gia nhập", type: "DOCX", size: "500 KB", url: "#" },
    { id: 3, title: "Lịch Phụng vụ & Sự kiện 2026", type: "XLSX", size: "1.2 MB", url: "#" },
    { id: 4, title: "Hướng dẫn Mục vụ Di dân", type: "PDF", size: "3.0 MB", url: "#" },
  ],
  socialLinks: {
    facebook: "#",
    website: "#",
    youtube: "#"
  }
};

const AoSInfoModal: React.FC<AoSInfoModalProps> = ({ isOpen, onClose, isLoggedIn }) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  
  // Data State
  const [infoData, setInfoData] = useState<AoSInfoData>(DEFAULT_INFO);
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<AoSInfoData>(DEFAULT_INFO);
  const [isSaving, setIsSaving] = useState(false);

  // Load Data on Open
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsFadingIn(true), 10);
      
      // Fetch latest data
      if (isConfigured) {
        setIsLoading(true);
        getAoSInfo().then(data => {
            if (data) {
                 // Ensure socialLinks exists by merging with defaults
                const completeData = { 
                    ...DEFAULT_INFO, 
                    ...data, 
                    socialLinks: { ...DEFAULT_INFO.socialLinks, ...(data.socialLinks || {}) } 
                };
                setInfoData(completeData);
                setEditForm(completeData);
            } else {
                setInfoData(DEFAULT_INFO);
                setEditForm(DEFAULT_INFO);
            }
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load info", err);
            setIsLoading(false);
        });
      }
    } else {
      setIsFadingIn(false);
      setIsEditing(false); // Reset edit mode on close
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Close
  const handleClose = () => {
    if (isEditing) {
        if (!window.confirm("Bạn có chắc muốn đóng? Các thay đổi chưa lưu sẽ bị mất.")) return;
    }
    onClose();
  };

  // --- EDIT HANDLERS ---

  const handleStartEdit = () => {
    setEditForm(infoData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(infoData);
  };

  const handleIntroChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditForm(prev => ({ ...prev, introduction: e.target.value }));
  };

  const handleSocialChange = (key: keyof typeof DEFAULT_INFO.socialLinks, value: string) => {
     setEditForm(prev => ({
        ...prev,
        socialLinks: {
            ...prev.socialLinks,
            [key]: value
        }
     }));
  };

  const handleSave = async () => {
    if (!isConfigured) {
        alert("Chưa cấu hình Firebase. Không thể lưu.");
        return;
    }

    setIsSaving(true);
    try {
        await updateAoSInfo(editForm);
        setInfoData(editForm);
        setIsEditing(false);
        alert("Đã cập nhật thông tin thành công!");
    } catch (error) {
        console.error("Save error", error);
        alert("Lỗi khi lưu thông tin.");
    } finally {
        setIsSaving(false);
    }
  };

  // Document Handlers
  const handleDeleteDoc = (index: number) => {
    setEditForm(prev => ({
        ...prev,
        documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleAddDoc = () => {
    const newDoc: AoSDocument = {
        id: Date.now(),
        title: "Tài liệu mới",
        type: "PDF",
        size: "0 KB",
        url: "#"
    };
    setEditForm(prev => ({
        ...prev,
        documents: [newDoc, ...prev.documents]
    }));
  };

  const handleDocChange = (index: number, field: keyof AoSDocument, value: string) => {
    const newDocs = [...editForm.documents];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setEditForm(prev => ({ ...prev, documents: newDocs }));
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300 ease-in-out ${
        isFadingIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div 
        className={`relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col max-h-[90vh] ${
            isFadingIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Header */}
        <div className="bg-aosGreen p-5 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-aosGreen font-bold border-2 border-yellow-400">
                AoS
             </div>
             <h2 className="text-xl font-bold uppercase tracking-wide">Thông Tin AoS</h2>
          </div>
          <div className="flex items-center gap-3">
             {/* Edit Button Logic */}
             {isLoggedIn && !isEditing && !isLoading && (
                 <button 
                    onClick={handleStartEdit}
                    className="bg-yellow-400 text-aosGreen px-3 py-1 rounded text-sm font-bold hover:bg-yellow-300 transition shadow"
                 >
                    <i className="fas fa-edit mr-1"></i> Chỉnh sửa
                 </button>
             )}
             <button 
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition duration-200"
             >
                <i className="fas fa-times text-xl"></i>
             </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
            
            {isLoading ? (
                <div className="flex justify-center items-center py-20 text-gray-500">
                    <i className="fas fa-spinner fa-spin mr-2"></i> Đang tải thông tin...
                </div>
            ) : (
                <>
                    {/* Introduction */}
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 border-l-4 border-yellow-400 pl-3">
                            Giới thiệu
                        </h3>
                        {isEditing ? (
                            <textarea
                                className="w-full h-32 border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-aosGreen text-sm"
                                value={editForm.introduction}
                                onChange={handleIntroChange}
                                placeholder="Nhập nội dung giới thiệu..."
                            />
                        ) : (
                            <p className="text-gray-600 text-sm leading-relaxed text-justify whitespace-pre-line">
                                {infoData.introduction}
                            </p>
                        )}
                    </div>

                    {/* Documents Section */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-bold text-gray-800 border-l-4 border-aosGreen pl-3 flex items-center">
                                <span>Tài liệu & Văn bản</span>
                            </h3>
                            {isEditing && (
                                <button 
                                    onClick={handleAddDoc}
                                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                                >
                                    + Thêm tài liệu
                                </button>
                            )}
                            {!isEditing && (
                                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Cập nhật bởi Admin</span>
                            )}
                        </div>
                        
                        <div className="grid gap-3">
                            {(isEditing ? editForm.documents : infoData.documents).map((doc, idx) => (
                                <div key={doc.id || idx} className={`flex flex-col sm:flex-row items-center justify-between p-3 border rounded-lg transition ${isEditing ? 'bg-gray-50 border-gray-300' : 'hover:bg-green-50 hover:border-green-200 border-gray-200'}`}>
                                    {isEditing ? (
                                        <div className="w-full space-y-2">
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Tên tài liệu" 
                                                    value={doc.title}
                                                    onChange={(e) => handleDocChange(idx, 'title', e.target.value)}
                                                    className="border p-1 rounded w-full text-sm font-bold"
                                                />
                                                <select
                                                    value={doc.type}
                                                    onChange={(e) => handleDocChange(idx, 'type', e.target.value)}
                                                    className="border p-1 rounded text-xs font-bold w-20"
                                                >
                                                    <option value="PDF">PDF</option>
                                                    <option value="DOCX">DOCX</option>
                                                    <option value="XLSX">XLSX</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="URL (Link tải)" 
                                                    value={doc.url}
                                                    onChange={(e) => handleDocChange(idx, 'url', e.target.value)}
                                                    className="border p-1 rounded w-full text-xs text-blue-600"
                                                />
                                                <input 
                                                    type="text" 
                                                    placeholder="Size" 
                                                    value={doc.size}
                                                    onChange={(e) => handleDocChange(idx, 'size', e.target.value)}
                                                    className="border p-1 rounded w-20 text-xs text-gray-500"
                                                />
                                                <button 
                                                    onClick={() => handleDeleteDoc(idx)}
                                                    className="text-red-500 hover:text-red-700 px-2"
                                                    title="Xóa tài liệu này"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 overflow-hidden w-full">
                                                <div className={`w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 ${
                                                    doc.type === 'PDF' ? 'bg-red-500' : 
                                                    doc.type === 'DOCX' ? 'bg-blue-500' : 
                                                    'bg-green-600'
                                                }`}>
                                                    {doc.type}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-gray-800 truncate pr-2">{doc.title}</span>
                                                    <span className="text-xs text-gray-400">{doc.size}</span>
                                                </div>
                                            </div>
                                            <a 
                                                href={doc.url} 
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-gray-400 hover:text-aosGreen px-3 py-2 transition transform hover:scale-110 ml-auto sm:ml-0"
                                            >
                                                <i className="fas fa-download text-lg"></i>
                                            </a>
                                        </>
                                    )}
                                </div>
                            ))}
                            {isEditing && editForm.documents.length === 0 && (
                                <div className="text-center text-gray-400 text-sm py-2 border border-dashed rounded">
                                    Chưa có tài liệu nào.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3">
                            Kết nối với chúng tôi
                        </h3>
                        {isEditing ? (
                             <div className="space-y-3 bg-gray-50 p-3 rounded border">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center text-[#1877F2]"><i className="fab fa-facebook-f text-xl"></i></div>
                                    <input 
                                        type="text"
                                        value={editForm.socialLinks.facebook}
                                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                        placeholder="Link Facebook Fanpage"
                                        className="flex-1 border p-2 rounded text-sm focus:border-aosGreen outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center text-gray-800"><i className="fas fa-globe text-xl"></i></div>
                                    <input 
                                        type="text"
                                        value={editForm.socialLinks.website}
                                        onChange={(e) => handleSocialChange('website', e.target.value)}
                                        placeholder="Link Website Chính thức"
                                        className="flex-1 border p-2 rounded text-sm focus:border-aosGreen outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 flex justify-center text-red-600"><i className="fab fa-youtube text-xl"></i></div>
                                    <input 
                                        type="text"
                                        value={editForm.socialLinks.youtube}
                                        onChange={(e) => handleSocialChange('youtube', e.target.value)}
                                        placeholder="Link kênh Youtube"
                                        className="flex-1 border p-2 rounded text-sm focus:border-aosGreen outline-none"
                                    />
                                </div>
                             </div>
                        ) : (
                            <div className="flex gap-4">
                                <a href={infoData.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex-1 bg-[#1877F2] text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow">
                                    <i className="fab fa-facebook-f"></i> Facebook
                                </a>
                                <a href={infoData.socialLinks.website} target="_blank" rel="noreferrer" className="flex-1 bg-gray-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow">
                                    <i className="fas fa-globe"></i> Website
                                </a>
                                <a href={infoData.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex-1 bg-red-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition shadow">
                                    <i className="fab fa-youtube"></i> Youtube
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}

        </div>

        {/* Footer Actions (Only when Editing) */}
        {isEditing && (
            <div className="bg-gray-100 p-4 border-t flex justify-end gap-3 shrink-0">
                <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 font-bold transition text-sm"
                    disabled={isSaving}
                >
                    Hủy bỏ
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-aosGreen text-white rounded hover:bg-green-800 font-bold transition text-sm flex items-center"
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i> Đang lưu...</>
                    ) : (
                        <><i className="fas fa-save mr-2"></i> Lưu thay đổi</>
                    )}
                </button>
            </div>
        )}

        {/* Standard Footer */}
        {!isEditing && (
            <div className="bg-gray-50 p-4 text-center border-t border-gray-100 shrink-0">
                <p className="text-xs text-gray-400">© 2026 Quoc Dev.</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default AoSInfoModal;
