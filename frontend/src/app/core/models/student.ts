export interface DepartmentSummary {
  _id: string;
  name: string;
  code: string;
}

export interface StudentProfile {
  id: string;
  studentNumber: string;
  level: number;
  department: DepartmentSummary;
}

export interface StudentProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  student: StudentProfile;
}

export interface ProfileUpdateResponse {
  message: string;
  user: StudentProfileResponse['user'];
}
