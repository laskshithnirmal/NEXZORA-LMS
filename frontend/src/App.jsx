import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { PageLoader } from './components/ui'
import { homePath, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import AnnouncementsPage from './pages/AnnouncementsPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageClasses from './pages/admin/ManageClasses'
import Enrollments from './pages/admin/Enrollments'
import Payments from './pages/admin/Payments'

import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherClasses from './pages/teacher/TeacherClasses'
import TeacherClassDetail from './pages/teacher/TeacherClassDetail'

import StudentDashboard from './pages/student/StudentDashboard'
import BrowseClasses from './pages/student/BrowseClasses'
import StudentClasses from './pages/student/StudentClasses'
import StudentClassDetail from './pages/student/StudentClassDetail'
import StudentPayments from './pages/student/StudentPayments'

function RootRedirect() {
  const { user, checking } = useAuth()
  if (checking) return <PageLoader />
  return <Navigate to={user ? homePath(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<ManageUsers key="students" role="STUDENT" />} />
          <Route path="teachers" element={<ManageUsers key="teachers" role="TEACHER" />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="enrollments" element={<Enrollments />} />
          <Route path="payments" element={<Payments />} />
          <Route path="announcements" element={<AnnouncementsPage scope="admin" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['TEACHER']} />}>
        <Route path="/teacher" element={<Layout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="classes/:id" element={<TeacherClassDetail />} />
          <Route path="announcements" element={<AnnouncementsPage scope="teacher" />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['STUDENT']} />}>
        <Route path="/student" element={<Layout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="browse" element={<BrowseClasses />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="classes/:id" element={<StudentClassDetail />} />
          <Route path="announcements" element={<AnnouncementsPage scope="student" />} />
          <Route path="payments" element={<StudentPayments />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
