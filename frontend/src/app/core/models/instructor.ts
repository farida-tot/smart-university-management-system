export interface InstructorDashboardResponse {
  instructor: InstructorProfile;
  totalSections: number;
  totalStudents: number;
  courses: number;
  sections: InstructorSection[];
}

export interface InstructorProfile {
  _id: string;
  employeeNumber: string;
  userId: { _id: string; name: string; email: string; role: 'instructor' };
  departmentId: { _id: string; name: string; code: string };
}

export interface InstructorSection {
  section: {
    _id: string;
    semester: string;
    sectionNumber: string;
    capacity: number;
    schedule: ScheduleEntry[];
    courseId: CourseSummary;
  };
  students: EnrollmentSummary[];
  attendance: AttendanceRecord[];
  courseworkGrades: CourseworkGrade[];
  assignments: AssignmentSummary[];
}

export interface CourseSummary { _id: string; code: string; name: string; creditHours: number; }
export interface ScheduleEntry { day: string; startTime: string; endTime: string; room: string; }
export interface EnrollmentSummary {
  _id: string;
  studentId: { _id: string; studentNumber: string; userId: { name: string; email: string } };
}
export interface AttendanceRecord { studentId: string; sectionId: string; date: string; status: 'present' | 'absent' | 'late'; }
export interface CourseworkGrade { studentId: string; sectionId: string; marks: number; }
export interface AssignmentSummary { _id: string; title: string; description: string; originalName: string; createdAt: string; }
