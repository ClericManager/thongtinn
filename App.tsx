import React, { useState, useEffect, useMemo } from 'react';
import { ClergyMember, MOCK_INITIAL_DATA, ClergyCategory } from './types';
import LoginModal from './components/LoginModal';
import ClergyModal from './components/ClergyModal';
import AoSInfoModal from './components/AoSInfoModal';
import { subscribeToClergy, addClergyMember, updateClergyMember, deleteClergyMember } from './services/clergyService';
import { isConfigured } from './firebaseConfig';

// ============================================================================
// STATUS HELPERS
// ============================================================================
const STATUS_CONFIG = {
  DANG_MUC_VU: {
    label: 'Đang Mục Vụ',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgLight: 'bg-green-100'
  },
  W1: {
    label: 'W1',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgLight: 'bg-yellow-100'
  },
  W2: {
    label: 'W2',
    color: 'bg-red-300',
    textColor: 'text-red-600',
    bgLight: 'bg-red-100'
  },
  W3: {
    label: 'W3',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgLight: 'bg-red-200'
  },
  TAM_HOAN: {
    label: 'Tạm hoãn mục vụ',
    color: 'bg-red-700',
    textColor: 'text-red-800',
    bgLight: 'bg-red-300'
  },
  VE_HUU: {
    label: 'Về hưu',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-100'
  }
};

const getStatusConfig = (status: string) => {
  return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DANG_MUC_VU;
};

// ============================================================================
// STATUS CHANGE MODAL COMPONENT
// ============================================================================
interface StatusModalProps {
  isOpen: boolean;
  currentStatus: string;
  clergyName: string;
  onConfirm: (newStatus: string) => void;
  onCancel: () => void;
}

const StatusModal: React.FC<StatusModalProps> = ({ isOpen, currentStatus, clergyName, onConfirm, onCancel }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    if (isOpen) setSelectedStatus(currentStatus);
  }, [isOpen, currentStatus]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          <i className="fas fa-sync-alt text-aosGreen mr-2"></i>
          Thay đổi Trạng Thái
        </h2>
        
        <p className="text-gray-600 mb-4">
          Giáo sĩ: <span className="font-bold text-aosGreen">{clergyName}</span>
        </p>

        <div className="space-y-2 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <label 
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                selectedStatus === key 
                  ? 'border-aosGreen bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={key}
                checked={selectedStatus === key}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-4 h-4"
              />
              <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
              <span className="font-medium text-gray-700">{config.label}</span>
            </label>
          ))}
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(selectedStatus)}
            className="px-6 py-2 bg-aosGreen text-white rounded-lg hover:bg-green-800 font-bold transition"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CUSTOM CONFIRM MODAL COMPONENT
// ============================================================================
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        </div>
        
        <p className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition flex items-center gap-2"
          >
            <i className="fas fa-trash-alt"></i>
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CUSTOM ALERT MODAL COMPONENT
// ============================================================================
interface AlertModalProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, type, message, onClose }) => {
  if (!isOpen) return null;

  const config = {
    success: {
      icon: 'fa-check-circle',
      color: 'text-green-600',
      bg: 'bg-green-100',
      title: 'Thành công'
    },
    error: {
      icon: 'fa-times-circle',
      color: 'text-red-600',
      bg: 'bg-red-100',
      title: 'Lỗi'
    },
    warning: {
      icon: 'fa-exclamation-circle',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      title: 'Cảnh báo'
    }
  };

  const currentConfig = config[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 animate-scale-up">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full ${currentConfig.bg} flex items-center justify-center`}>
            <i className={`fas ${currentConfig.icon} ${currentConfig.color} text-2xl`}></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{currentConfig.title}</h2>
        </div>
        
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-aosGreen text-white rounded-lg hover:bg-green-800 font-bold transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
const App: React.FC = () => {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // Data State
  const [clergyList, setClergyList] = useState<ClergyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error'>('connected');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedClergy, setSelectedClergy] = useState<ClergyMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Info Modal State
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | undefined>(undefined);

  // Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [alertMessage, setAlertMessage] = useState('');

  // Status Change State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [clergyToUpdateStatus, setClergyToUpdateStatus] = useState<ClergyMember | null>(null);

  // Firestore Subscription
  useEffect(() => {
    const unsubscribe = subscribeToClergy(
      (data) => {
        setLoading(false);
        if (data.length === 0) {
             setClergyList([]); 
        } else {
            setClergyList(data);
        }
        setConnectionStatus('connected');
      },
      (error) => {
        setLoading(false);
        setConnectionStatus('error');
        setClergyList(MOCK_INITIAL_DATA); 
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter Logic
  const filteredList = useMemo(() => {
    return clergyList.filter(item => {
      const matchesSearch = item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());
      
      // LOGIC CŨ (CHỈ SO SÁNH BẰNG) - XOÁ DÒNG NÀY
      // const matchesRole = filterRole === 'ALL' || item.role === filterRole; 

      // LOGIC MỚI (HỖ TRỢ GỘP NHÓM)
      let matchesRole = false;
      if (filterRole === 'ALL') {
          matchesRole = true;
      } else if (filterRole.includes('|')) {
          // Nếu value có dấu | (VD: "Tổng Giám Mục|Phó...") thì tách ra và kiểm tra
          const roles = filterRole.split('|');
          matchesRole = roles.includes(item.role);
      } else {
          // So sánh bình thường
          matchesRole = item.role === filterRole;
      }

      const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
      return matchesSearch && matchesRole && matchesCategory;
    });
  }, [clergyList, searchTerm, filterRole, filterCategory]);

  // Helper: Show Alert
  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertOpen(true);
  };

  // Handlers
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const openViewModal = (member: ClergyMember) => {
    setSelectedClergy(member);
    setModalMode('view');
    setModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, member: ClergyMember) => {
    e.stopPropagation();
    setSelectedClergy(member);
    setModalMode('edit');
    setModalOpen(true);
  };

  const openAddModal = () => {
    setSelectedClergy(null);
    setModalMode('add');
    setModalOpen(true);
  };

  // --------------------------------------------------------------------------
  // SAVE HANDLER (AUTO & MANUAL)
  // --------------------------------------------------------------------------
  const handleSaveClergy = async (data: ClergyMember, isAutoSave: boolean) => {
    if (!isConfigured) {
        if (!isAutoSave) showAlert('error', "Lỗi: Chưa có Config Firebase! Vui lòng cập nhật firebaseConfig.ts");
        throw new Error("Missing Config");
    }

    if (!isAutoSave) setIsSaving(true);
    
    try {
      const operation = modalMode === 'add' ? addClergyMember(data) : updateClergyMember(data.id!, data);
      
      if (!isAutoSave) {
         await operation;
         showAlert('success', "Thêm giáo sĩ thành công!");
         setModalOpen(false);
      } else {
         await operation;
      }
      
    } catch (error: any) {
      console.error("Lỗi khi lưu:", error);
      if (!isAutoSave) showAlert('error', "Lỗi: " + (error.message || "Không thể lưu"));
      throw error; 
    } finally {
      if (!isAutoSave) setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // DELETE HANDLER (WITH CUSTOM MODAL)
  // --------------------------------------------------------------------------
  const handleDeleteClick = (e: React.MouseEvent, id: string | undefined) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🗑️ Delete button clicked for ID:", id);

    // Validation: Check if ID exists
    if (!id) {
        showAlert('warning', "Đây là dữ liệu mẫu (Mock Data).\nBạn không thể xóa dữ liệu này vì nó chỉ hiển thị tạm thời.");
        return;
    }

    // Validation: Check Config
    if (!isConfigured) {
        showAlert('error', "Lỗi: Chưa kết nối Firebase.\nVui lòng kiểm tra file firebaseConfig.ts");
        return;
    }

    // Open confirm modal
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    console.log("🔄 Deleting document with ID:", itemToDelete);

    try {
        await deleteClergyMember(itemToDelete);
        console.log("✅ Delete successful!");
        showAlert('success', "Đã xóa giáo sĩ thành công!");
        setDeleteConfirmOpen(false);
        setItemToDelete(undefined);
    } catch (error: any) {
        console.error("❌ Delete error:", error);
        const errorMsg = error.code === 'permission-denied' 
            ? "Lỗi: Bạn không có quyền xóa dữ liệu này.\nVui lòng kiểm tra Firebase Security Rules."
            : `Lỗi khi xóa: ${error.message || "Lỗi không xác định"}`;
        showAlert('error', errorMsg);
        setDeleteConfirmOpen(false);
        setItemToDelete(undefined);
    }
  };

  const cancelDelete = () => {
    console.log("❌ User cancelled delete");
    setDeleteConfirmOpen(false);
    setItemToDelete(undefined);
  };

  // --------------------------------------------------------------------------
  // STATUS CHANGE HANDLER
  // --------------------------------------------------------------------------
  const handleStatusClick = (e: React.MouseEvent, clergy: ClergyMember) => {
    e.stopPropagation();
    if (!isLoggedIn) return;
    
    setClergyToUpdateStatus(clergy);
    setStatusModalOpen(true);
  };

  const confirmStatusChange = async (newStatus: string) => {
    if (!clergyToUpdateStatus || !clergyToUpdateStatus.id) {
      showAlert('error', 'Không thể cập nhật trạng thái của dữ liệu mẫu');
      setStatusModalOpen(false);
      return;
    }

    try {
      const updatedClergy = { ...clergyToUpdateStatus, status: newStatus as any };
      await updateClergyMember(clergyToUpdateStatus.id, updatedClergy);
      showAlert('success', 'Cập nhật trạng thái thành công!');
      setStatusModalOpen(false);
      setClergyToUpdateStatus(null);
    } catch (error: any) {
      console.error("Status update error:", error);
      showAlert('error', `Lỗi khi cập nhật trạng thái: ${error.message}`);
    }
  };

  const cancelStatusChange = () => {
    setStatusModalOpen(false);
    setClergyToUpdateStatus(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-aosGreen shadow-lg text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div id="aos-logo" className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-yellow-400 overflow-hidden">
               <img 
                 src="https://i.postimg.cc/Y9dzZtm7/logoaos.png" 
                 alt="AoS Logo" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none';
                   (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-aosGreen font-bold text-xs">AoS</span>';
                 }}
               />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-wide uppercase">Thông Tin Giáo Sĩ AoS</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* NEW: AoS Info Button */}
            <button 
                onClick={() => setIsInfoModalOpen(true)}
                className="bg-yellow-400 text-aosGreen px-3 py-2 rounded-md font-bold hover:bg-yellow-300 transition duration-200 text-sm md:text-base shadow-md border border-transparent flex items-center"
            >
                <i className="fas fa-info-circle mr-2"></i>
                <span className="hidden md:inline">Thông tin AoS</span>
                <span className="md:hidden">AoS</span>
            </button>

            {isLoggedIn ? (
              <button 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-bold transition duration-200 text-sm md:text-base shadow-md"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>Đăng xuất
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-white text-aosGreen px-4 py-2 rounded-md font-bold hover:bg-gray-100 transition duration-200 text-sm md:text-base shadow-md border border-aosGreen"
              >
                <i className="fas fa-user-shield mr-2"></i>Đăng nhập
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        
        {/* Title & Status */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-6 border-b pb-4">
          <div>
             <h2 className="text-3xl font-bold text-gray-800 mb-2">DANH SÁCH GIÁO SĨ</h2>
             <div className="flex items-center gap-2 text-sm">
                <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-gray-600 font-medium">
                  {connectionStatus === 'connected' ? '“Không có ơn gọi nào mà không có sứ mạng.” -Đức Thánh Cha Phanxicô-' : 'Ngoại tuyến'}
                </span>
             </div>
          </div>
          
          {isLoggedIn && (
            <button 
              onClick={openAddModal}
              className="mt-4 md:mt-0 bg-aosGreen text-white px-4 py-2 rounded shadow hover:bg-green-800 transition flex items-center"
            >
              <i className="fas fa-plus-circle mr-2"></i> Thêm Giáo Sĩ Mới
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative w-full md:col-span-1">
            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-aosGreen"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-aosGreen bg-white"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="ALL">Sứ vụ</option>
            <option value="Tổng Giám Mục|Phó Tổng Giám Mục|Giám Mục Phụ Tá">Giám Mục</option>
            <option value="Linh Mục Chánh Xứ">Linh Mục Chánh Xứ</option>
            <option value="Linh Mục Phó Xứ">Linh Mục Phó Xứ</option>
            <option value="Linh Mục Dòng">Linh Mục Dòng</option>
            <option value="Linh Mục Tòa">Linh Mục Tòa</option>
            <option value="Phó tế">Phó tế</option>
            <option value="Về Hưu">Về Hưu</option>
          </select>

           <select 
            className="w-full border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-aosGreen bg-white"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">Nơi Mục Vụ</option>
            <option value="GIAO_XU">Giáo Xứ</option>
            <option value="TGM_DCV">TGM & ĐCV</option>
            <option value="DONG">Dòng Tu</option>
          </select>
          
          <button className="w-full bg-aosGreen text-white rounded-lg py-2 hover:bg-green-800 transition font-medium">
            Tìm kiếm
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold border-b-2 border-aosGreen">
                <tr>
                  <th className="p-4 w-12 text-center">STT</th>
                  <th className="p-4 w-24 text-center">
                    <div>Profile</div>
                    <div className="ml-1 text-[7px] italic text-gray-400">
                      Click ảnh
                    </div>
                  </th>
                  <th className="p-4">Tên Thánh Họ và Tên</th>
                  <th className="p-4">Nơi Mục Vụ</th>
                  <th className="p-4">Sứ Vụ</th>
                  <th className="p-4">Ngày Chịu Chức</th>
                  <th className="p-4">Thời Gian</th>
                  <th className="p-4 text-center">Trạng Thái</th>
                  <th className="p-4 text-center">Xem thêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      <i className="fas fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      Không tìm thấy dữ liệu giáo sĩ nào.
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, index) => (
                    <tr 
                      key={item.id || index} 
                      onClick={() => openViewModal(item)}
                      className="hover:bg-green-50 cursor-pointer transition duration-150"
                    >
                      <td className="p-4 text-center font-medium text-gray-500">{index + 1}</td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <a 
                          href={item.profileLink || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-block"
                          title="Xem chi tiết trên Web AoS"
                        >
                          <img 
                            src={item.imageUrl} 
                            alt="Avatar" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-aosGreen hover:scale-110 transition-transform shadow-sm"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'; }}
                          />
                        </a>
                      </td>
                      <td className="p-4 font-bold text-aosGreen">{item.fullName}</td>
                      <td className="p-4 text-gray-700">{item.currentLocation}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                          {item.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{item.ordinationDate}</td>
                      <td className="p-4 text-gray-600 text-sm">{item.tenure}</td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const statusConfig = getStatusConfig(item.status || 'DANG_MUC_VU');
                          return (
                            <button
                              onClick={(e) => handleStatusClick(e, item)}
                              disabled={!isLoggedIn}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full transition ${
                                isLoggedIn 
                                  ? `${statusConfig.bgLight} ${statusConfig.textColor} hover:opacity-80 cursor-pointer` 
                                  : `${statusConfig.bgLight} ${statusConfig.textColor} cursor-default`
                              }`}
                              title={isLoggedIn ? "Click để thay đổi trạng thái" : "Đăng nhập để thay đổi trạng thái"}
                            >
                              <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.color}`}></span>
                              <span className="text-xs font-semibold">{statusConfig.label}</span>
                            </button>
                          );
                        })()}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isLoggedIn ? (
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(e, item);
                              }}
                              className="w-8 h-8 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 flex items-center justify-center transition"
                              title="Sửa (Auto-Save)"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              onClick={(e) => handleDeleteClick(e, item.id)}
                              className="w-8 h-8 rounded bg-red-100 text-red-700 hover:bg-red-200 flex items-center justify-center transition"
                              title="Xóa"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="text-aosGreen hover:text-green-800 font-medium text-sm"
                          >
                            Xem
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-3 border-t text-xs text-gray-500 text-right">
             Hiển thị {filteredList.length} kết quả
          </div>
        </div>
      </main>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

      <ClergyModal
        isOpen={modalOpen}
        mode={modalMode}
        data={selectedClergy}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveClergy}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn giáo sĩ này?\n\nHành động này KHÔNG THỂ hoàn tác!`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Status Change Modal */}
      <StatusModal
        isOpen={statusModalOpen}
        currentStatus={clergyToUpdateStatus?.status || 'DANG_MUC_VU'}
        clergyName={clergyToUpdateStatus?.fullName || ''}
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
      />

      {/* NEW: AoS Info Modal */}
      <AoSInfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        isLoggedIn={isLoggedIn}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertOpen}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      {/* CSS Animation */}
      <style>{`
        @keyframes scale-up {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-up {
          animation: scale-up 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default App;
