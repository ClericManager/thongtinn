export type ClergyCategory = 'ALL' | 'TGM_DCV' | 'GIAO_XU' | 'DONG' | 'HUU' | 'QUA_DOI';

export type ClergyStatus = 
  | 'DANG_MUC_VU'      // Đang Mục Vụ (xanh lá)
  | 'W1'               // W1 (vàng)
  | 'W2'               // W2 (đỏ nhạt)
  | 'W3'               // W3 (đỏ đậm hơn)
  | 'TAM_HOAN'         // Tạm hoãn mục vụ (đỏ đậm nhất)
  | 'VE_HUU';          // Về hưu (xám)

export interface TimelineEvent {
  year: string;
  description: string;
}

export interface ClergyMember {
  id?: string;
  fullName: string;
  imageUrl: string;
  profileLink: string; // Link liên kết chi tiết
  role: string; // "Hồng y", "Giám mục", "Linh Mục", "Phó tế", "Tu sĩ", "Về Hưu"
  currentLocation: string; // Nơi mục vụ
  ordinationDate: string; // Ngày thụ phong
  birthDate: string;
  patronSaint: string; // Tên thánh quan thầy
  tenure: string; // Thời gian mục vụ (e.g., 2020 - Nay)
  category: ClergyCategory;
  status: ClergyStatus; // THÊM TRẠNG THÁI
  timeline: TimelineEvent[];
}

export interface AoSDocument {
  id: string | number;
  title: string;
  type: string;
  size: string;
  url: string;
}

export interface SocialLinks {
  facebook: string;
  website: string;
  youtube: string;
}

export interface AoSInfoData {
  introduction: string;
  documents: AoSDocument[];
  socialLinks: SocialLinks;
}

export const MOCK_INITIAL_DATA: ClergyMember[] = [
  {
    fullName: "Phêrô Nguyễn Văn A",
    imageUrl: "https://picsum.photos/200",
    profileLink: "https://example.com/cha-a",
    role: "Linh Mục",
    currentLocation: "Giáo xứ Chính Tòa",
    ordinationDate: "2010-06-29",
    birthDate: "1980-05-15",
    patronSaint: "Thánh Phêrô",
    tenure: "2018 - Nay",
    category: "GIAO_XU",
    status: "DANG_MUC_VU",
    timeline: [
      { year: "2010-2014", description: "Phó xứ Giáo xứ A" },
      { year: "2014-2018", description: "Du học Roma" }
    ]
  },
  {
    fullName: "Giuse Trần Văn B",
    imageUrl: "https://picsum.photos/201",
    profileLink: "https://example.com/cha-b",
    role: "Giám mục",
    currentLocation: "Đại Chủng Viện",
    ordinationDate: "2005-06-29",
    birthDate: "1975-12-20",
    patronSaint: "Thánh Giuse",
    tenure: "2015 - Nay",
    category: "TGM_DCV",
    status: "DANG_MUC_VU",
    timeline: [
        { year: "2005-2010", description: "Phó xứ Giáo xứ B" }
    ]
  }
];
