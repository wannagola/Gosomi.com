import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { CourtHeader } from '@/components/CourtHeader';
import { CourtLobby } from '@/components/CourtLobby';
import { LawBook } from '@/components/LawBook';
import { FilingPage } from '@/components/FilingPage';
import { DefensePage } from '@/components/DefensePage';
import { JuryVotingPage } from '@/components/JuryVotingPage';
import { VerdictPage } from '@/components/VerdictPage';
import { MyCasesPage } from '@/components/MyCasesPage';
import { AppealPage } from '@/components/AppealPage';
import { MyPage } from '@/components/MyPage';
import { LoginPage } from '@/components/LoginPage';
import { JuryDashboard } from '@/components/JuryDashboard';
import { Case, Evidence, CaseStatus } from '@/types/court';
import { User, Friend, Notification } from '@/types/user';
import { caseService } from '@/api/caseService';
import { userService } from '@/api/userService';
import { juryService } from '@/api/juryService';
import { notificationService } from '@/api/notificationService';

export default function App() {
  const [cases, setCases] = useState<Case[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('currentUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user from local storage", e);
      return null;
    }
  });

  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // Load Initial Data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        const [fetchedCases, fetchedFriends, fetchedRequests, fetchedNotifs] = await Promise.all([
            caseService.getCases(),
            userService.getFriends(currentUser.id),
            userService.getFriendRequests(currentUser.id),
            notificationService.getNotifications(currentUser.id)
        ]);

        setCases(fetchedCases);
        setFriends(fetchedFriends);
        setFriendRequests(fetchedRequests);
        setNotifications(fetchedNotifs);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };

    fetchData();
  }, [currentUser]);

  // Auth Guard
  useEffect(() => {
    if (!currentUser && location.pathname !== '/login' && location.pathname !== '/law-book' && !location.pathname.startsWith('/case/')) {
        // Allow shared links (case details) to be viewed without login? 
        // Spec implies Auth header required (except login).
        // For now, let's enforce login for everything except maybe /login.
        // If the user lands on '/', redirect to login.
        navigate('/login');
    }
  }, [currentUser, location, navigate]);

  const refreshData = async () => {
      if (!currentUser) return;
      try {
        const [fetchedCases, fetchedFriends, fetchedRequests, fetchedNotifs] = await Promise.all([
            caseService.getCases(),
            userService.getFriends(currentUser.id),
            userService.getFriendRequests(currentUser.id),
            notificationService.getNotifications(currentUser.id)
        ]);
        setCases(fetchedCases);
        setFriends(fetchedFriends);
        setFriendRequests(fetchedRequests);
        setNotifications(fetchedNotifs);
      } catch (error) {
          console.error("Failed to refresh data", error);
      }
  };

  // --- Handlers ---

  const handleLogin = (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
    navigate('/');
  };

  const handleNewCase = () => {
    navigate('/filing');
  };

  const handleCreateCase = async (newCaseData: any) => {
    if (!currentUser) return;
    try {
        const result = await caseService.createCase(newCaseData);
        await refreshData();
        navigate(`/case/${result.caseId}`);
    } catch (error) {
        console.error("Create case failed", error);
        alert("사건 접수에 실패했습니다.");
    }
  };

  const handleSubmitDefense = async (caseId: string, response: { statement: string; evidences: Evidence[] }) => {
    try {
        await caseService.submitDefense(caseId, response.statement);
        await caseService.requestVerdict(caseId);
        await refreshData();
        navigate(`/case/${caseId}/verdict`);
    } catch (error) {
        console.error("Defense submission failed", error);
        alert("변론 제출에 실패했습니다.");
    }
  };

  const handleVote = async (caseId: string, vote: 'plaintiff' | 'defendant') => {
      if (!currentUser) return;
      try {
          const apiVote = vote === 'plaintiff' ? 'PLAINTIFF' : 'DEFENDANT';
          await juryService.submitVote(caseId, currentUser.id, apiVote);
          await refreshData();
          alert("투표가 완료되었습니다.");
      } catch (error) {
          console.error("Voting failed", error);
          alert("투표에 실패했습니다.");
      }
  };

  const handleSelectPenalty = async (caseId: string, penalty: 'serious' | 'funny') => {
     try {
         const apiChoice = penalty === 'serious' ? 'SERIOUS' : 'FUNNY';
         await caseService.selectPenalty(caseId, apiChoice);
         await refreshData();
     } catch (error) {
         console.error("Penalty selection failed", error);
         alert("벌칙 선택에 실패했습니다.");
     }
  };

  const handleAppeal = async (caseId: string, appellantId: string, reason: string) => {
      try {
          await caseService.submitAppeal(caseId, appellantId, reason);
          await refreshData();
          navigate(`/case/${caseId}/appeal?litigant=defendant`); // Assuming opposite party needs to respond? Or refresh handles status
      } catch (error) {
          console.error("Appeal failed", error);
          alert("항소에 실패했습니다.");
      }
  };

  const handleSubmitAppeal = async (caseId: string, litigant: 'plaintiff' | 'defendant', statement: string, evidences: Evidence[]) => {
      try {
          // Determine if Request or Defense based on current status or Appeal object
          // For simplicity, we try submitAppeal first, if it fails (already exists), try Defense
          // OR better: Check case status
          const targetCase = cases.find(c => c.id === caseId);
          if (!targetCase) return;

          if (!targetCase.appealStatus || targetCase.appealStatus === 'NONE') {
               await caseService.submitAppeal(caseId, currentUser?.id || '', statement);
          } else if (targetCase.appealStatus === 'REQUESTED') {
              await caseService.submitAppealDefense(caseId, statement);
              await caseService.requestAppealVerdict(caseId);
          }
          
          await refreshData();
          navigate(`/case/${caseId}/verdict`);
      } catch (error) {
          console.error("Appeal submission failed", error);
          alert("항소 처리에 실패했습니다.");
      }
  };

  const handleAcceptFriend = async (requestId: string) => {
      try {
          await userService.acceptFriendRequest(requestId);
          await refreshData();
          // Mock notification local update if needed, or rely on fetch
      } catch (error) {console.error(error);}
  };
  
  const handleRejectFriend = async (requestId: string) => {
      // Not implemented in API spec
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
  };
  
  const handleUnfollow = async (targetId: string) => {
      if (!currentUser) return;
      if(!window.confirm('정말 친구를 삭제하시겠습니까?')) return;
      try {
          await userService.deleteFriend(currentUser.id, targetId);
          await refreshData();
      } catch (error) {console.error(error);}
  };

  const handleMarkNotifRead = async (id: string) => {
      try {
          await notificationService.markRead(id);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      } catch (error) { console.error(error); }
  };

  const handleLogout = () => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      setCurrentUser(null);
      navigate('/login');
  };
  
  const handleViewCase = (caseId: string) => {
      navigate(`/case/${caseId}`);
  };

  // Logic to determine appeal handler arguments in route
  const onAppealWrapper = (caseId: string, appellant: 'plaintiff' | 'defendant') => {
      // In VerdictPage, 'appellant' is passed. 
      // We pass it to handleAppeal.
      // handleAppeal signature: (caseId, appellantId, reason)
      // Verdict Page just triggers the intent. The actual Reason input is in AppealPage?
      // Wait, `VerdictPage` usually has an "Appeal" button that redirects to `AppealPage`.
      // If `VerdictPage` calls `onAppeal`, it might expect a redirect.
      
      // Let's check VerdictPage usage:
      // it calls `onAppeal(userRole)`
      
      // In Mock: 
      // setCases(...)
      // navigate(...)
      
      // Here:
      navigate(`/case/${caseId}/appeal?litigant=${appellant}`);
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-white">
      {location.pathname !== '/login' && currentUser && (
        <CourtHeader 
          user={currentUser} 
          notifications={notifications}
          onMarkNotificationsAsRead={handleMarkNotifRead}
          onLogout={handleLogout}
        />
      )}
      
      <Routes>
        <Route path="/" element={<CourtLobby onNewCase={handleNewCase} onViewCase={handleViewCase} recentCases={cases} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/filing" element={<FilingPage currentUser={currentUser!} onSubmit={handleCreateCase} friends={friends} onCancel={() => navigate('/')} />} />
        <Route path="/law-book" element={<LawBook />} />
        
        {/* Dynamic Routes Wrapper to inject case data */}
        <Route path="/case/:id/*" element={
            <CaseRouteHandler 
                cases={cases} 
                currentUser={currentUser} 
                handleSubmitDefense={handleSubmitDefense} 
                handleVote={handleVote} 
                handleSelectPenalty={handleSelectPenalty} 
                handleAppeal={onAppealWrapper} 
                handleSubmitAppeal={handleSubmitAppeal} 
            />
        } />

        <Route path="/mycases" element={<MyCasesPage cases={cases} onViewCase={handleViewCase} />} />
        <Route path="/mypage" element={
            currentUser ? (
                <MyPage 
                    user={currentUser} 
                    friends={friends} 
                    friendRequests={friendRequests}
                    cases={cases}
                    onAcceptFriend={handleAcceptFriend}
                    onRejectFriend={handleRejectFriend}
                    onUnfollow={handleUnfollow}
                    onViewCase={handleViewCase} 
                />
            ) : <div/>
        } />
        
        <Route path="/jury" element={<JuryDashboard cases={cases} />} />
      </Routes>
    </div>
  );
}

// Wrapper to find case by ID and pass to sub-components
function CaseRouteHandler({ 
    cases, 
    currentUser,
    handleSubmitDefense,
    handleVote,
    handleSelectPenalty,
    handleAppeal,
    handleSubmitAppeal
}: { 
    cases: Case[], 
    currentUser: User | null,
    handleSubmitDefense: any,
    handleVote: any,
    handleSelectPenalty: any,
    handleAppeal: any,
    handleSubmitAppeal: any
}) {
    const { id } = useParams();
    const case_ = cases.find(c => c.id === id || c.id.toString() === id);

    if (!case_) return <div className="p-8 text-center text-gray-400">사건을 찾을 수 없습니다.</div>;

    return (
        <Routes>
            <Route path="" element={<VerdictPage case_={case_} onAppeal={handleAppeal} onSelectPenalty={handleSelectPenalty} />} /> 
            <Route path="defense" element={<DefensePage case_={case_} onSubmitDefense={(data) => handleSubmitDefense(case_.id, data)} />} />
            <Route path="jury" element={<JuryVotingPage case_={case_} onVote={(vote) => handleVote(case_.id, vote)} />} />
            <Route path="verdict" element={<VerdictPage case_={case_} onAppeal={handleAppeal} onSelectPenalty={(p) => handleSelectPenalty(case_.id, p)} />} />
            <Route path="appeal" element={<AppealPage case_={case_} onSubmitAppeal={handleSubmitAppeal} />} />
        </Routes>
    );
}