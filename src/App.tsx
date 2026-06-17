import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelect from './pages/RoleSelect';
import EnterpriseLayout from './components/EnterpriseLayout';
import ReviewerLayout from './components/ReviewerLayout';
import EnterpriseHome from './pages/enterprise/EnterpriseHome';
import ApplyPage from './pages/enterprise/ApplyPage';
import ApplicationsPage from './pages/enterprise/ApplicationsPage';
import ApplicationDetailPage from './pages/enterprise/ApplicationDetailPage';
import ReviewerHome from './pages/reviewer/ReviewerHome';
import ReviewPage from './pages/reviewer/ReviewPage';
import DisbursementPage from './pages/reviewer/DisbursementPage';
import FundPoolPage from './pages/reviewer/FundPoolPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/enterprise" element={<EnterpriseLayout />}>
          <Route index element={<EnterpriseHome />} />
          <Route path="apply" element={<ApplyPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
        </Route>
        <Route path="/reviewer" element={<ReviewerLayout />}>
          <Route index element={<ReviewerHome />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="disbursement" element={<DisbursementPage />} />
          <Route path="fund-pool" element={<FundPoolPage />} />
        </Route>
        <Route path="*" element={<RoleSelect />} />
      </Routes>
    </BrowserRouter>
  );
}
