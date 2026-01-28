import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
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
import { WaitingPage } from '@/components/WaitingPage';
import { JuryDashboard } from '@/components/JuryDashboard';
import { Case, Evidence, CaseStatus } from '@/types/court';
import { User, Friend, Notification } from '@/types/user';
import { caseService } from '@/api/caseService';
import { userService } from '@/api/userService';
import { juryService } from '@/api/juryService';
import { notificationService } from '@/api/notificationService';

export default function App() {
    const [cases, setCases] = useState<Case[]>([]);
    const [juryCases, setJuryCases] = useState<Case[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

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
                const [fetchedCases, fetchedJuryCases, fetchedFriends, fetchedRequests, fetchedNotifs] = await Promise.all([
                    caseService.getCases({ userId: String(currentUser.id) }),
                    juryService.getJuryCases(String(currentUser.id)),
                    userService.getFriends(currentUser.id),
                    userService.getFriendRequests(currentUser.id),
                    notificationService.getNotifications(currentUser.id)
                ]);

                setCases(fetchedCases);
                setJuryCases(fetchedJuryCases);
                setFriends(fetchedFriends);
                setFriendRequests(fetchedRequests);
                setNotifications(fetchedNotifs);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            }
        };

        fetchData();
    }, [currentUser]);

    // Listen for forced logout events from api/client
    useEffect(() => {
        const handleLogoutEvent = () => {
            setCurrentUser(null);
            // Optional: Show toast message?
        };
        window.addEventListener('auth:logout', handleLogoutEvent);
        return () => window.removeEventListener('auth:logout', handleLogoutEvent);
    }, []);

    // Real-time Data Polling - Check for updates every 10 seconds
    useEffect(() => {
        if (!currentUser) return;

        const pollData = async () => {
            try {
                const [fetchedCases, fetchedJuryCases, fetchedFriends, fetchedRequests, fetchedNotifs] = await Promise.all([
                    caseService.getCases({ userId: String(currentUser.id) }),
                    juryService.getJuryCases(String(currentUser.id)),
                    userService.getFriends(currentUser.id),
                    userService.getFriendRequests(currentUser.id),
                    notificationService.getNotifications(currentUser.id)
                ]);

                setCases(fetchedCases);
                setJuryCases(fetchedJuryCases);
                setFriends(fetchedFriends);
                setFriendRequests(fetchedRequests);
                setNotifications(fetchedNotifs);
            } catch (error) {
                console.error("Failed to poll data", error);
            }
        };

        // Poll every 10 seconds
        const intervalId = setInterval(pollData, 5000);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, [currentUser]);

    // Auth Guard
    // Auth Guard Logic
    if (!currentUser && location.pathname !== '/login' && location.pathname !== '/law-book' && !location.pathname.startsWith('/case/')) {
        return <Navigate to="/login" replace />;
    }

    const refreshData = async () => {
        if (!currentUser) return;
        try {
            const [fetchedCases, fetchedJuryCases, fetchedFriends, fetchedRequests, fetchedNotifs] = await Promise.all([
                caseService.getCases({ userId: String(currentUser.id) }),
                juryService.getJuryCases(String(currentUser.id)),
                userService.getFriends(currentUser.id),
                userService.getFriendRequests(currentUser.id),
                notificationService.getNotifications(currentUser.id)
            ]);
            setCases(fetchedCases);
            setJuryCases(fetchedJuryCases);
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

    const handleCreateCase = async (newCaseData: {
        title: string;
        content: string;
        plaintiffId: string | number;
        defendantId: string | number;
        juryEnabled: boolean;
        juryMode: 'RANDOM' | 'INVITE';
        lawType: string;
        evidences?: Evidence[];
        [key: string]: any
    }) => {
        if (!currentUser) return;
        try {
            console.log('Creating case with data:', {
                ...newCaseData,
                evidences: newCaseData.evidences?.map((e: Evidence) => ({
                    type: e.type,
                    contentLength: e.content?.length,
                    isKeyEvidence: e.isKeyEvidence
                }))
            });

            const result = await caseService.createCase(newCaseData);
            console.log('Case created successfully:', result);
            await refreshData();
            return result.caseId;
        } catch (error: any) {
            console.error("Create case failed", error);
            console.error("Error response:", error.response?.data);
            console.error("Error message:", error.message);

            const errorMsg = error.response?.data?.error || error.message || "사건 접수에 실패했습니다.";
            alert(`사건 접수 실패: ${errorMsg}`);
        }
    };

    const handleSubmitDefense = async (caseId: string, response: { statement: string; evidences: Evidence[] }) => {
        try {
            await caseService.submitDefense(caseId, response.statement, response.evidences);
            // Verdict is NO LONGER auto-generated.
            // User must explicitly request it now.
            await refreshData();
            // Stay on page or navigate to waiting? 
            // Logic says: if defendant submits, status becomes DEFENSE_SUBMITTED. 
            // CaseRouteHandler will show WaitingPage (since no verdict yet).
            // So navigate to main case path seems correct.
            // navigate(`/case/${caseId}`); // Navigation alone might not trigger re-render correctly
            navigate(`/case/${caseId}`);
        } catch (error: any) {
            console.error("Defense submission failed", error);
            // 만약 이미 제출된 상태라면, 성공한 것으로 간주하고 이동
            if (error.response?.data?.error === "defense already submitted" || error.message?.includes("defense already submitted")) {
                await refreshData();
                navigate(`/case/${caseId}`);
                return;
            }
            alert("변론 제출에 실패했습니다.");
        }
    };

    const handleRequestVerdict = async (caseId: string) => {
        try {
            // Trigger AI Verdict Generation manually
            await caseService.requestVerdict(caseId);
            await refreshData();
            navigate(`/case/${caseId}/verdict`);
        } catch (error) {
            console.error("Verdict request failed", error);
            alert("판결 요청에 실패했습니다.");
        }
    };

    const handleVote = async (caseId: string, vote: 'plaintiff' | 'defendant' | 'both') => {
        if (!currentUser) return;
        try {
            let apiVote: 'PLAINTIFF' | 'DEFENDANT' | 'BOTH';
            if (vote === 'plaintiff') apiVote = 'PLAINTIFF';
            else if (vote === 'defendant') apiVote = 'DEFENDANT';
            else apiVote = 'BOTH';

            await juryService.submitVote(caseId, currentUser.id, apiVote);
            await refreshData();
            // No alert needed here as UI updates to "Voted" state
        } catch (error: any) {
            console.error("Voting failed", error);
            alert(`투표에 실패했습니다: ${error.response?.data?.error || error.message}`);
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
        } catch (error) { console.error(error); }
    };

    const handleRejectFriend = async (requestId: string) => {
        // Not implemented in API spec
        setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    };

    const handleUnfollow = async (targetId: string) => {
        if (!currentUser) return;
        if (!window.confirm('정말 친구를 삭제하시겠습니까?')) return;
        try {
            // Optimistic update
            setFriends(prev => prev.filter(f => f.id !== targetId));

            await userService.deleteFriend(currentUser.id, targetId);
            await refreshData();
        } catch (error) {
            console.error(error);
            await refreshData(); // Revert on error
        }
    };

    const handleMarkNotifRead = async (id: string) => {
        try {
            await notificationService.markRead(id);
            // Refresh notifications from server to ensure persistence
            if (currentUser) {
                const fetchedNotifs = await notificationService.getNotifications(currentUser.id);
                setNotifications(fetchedNotifs);
            }
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
    const onAppealWrapper = (caseId: string, appellant: 'plaintiff' | 'defendant', data?: { reason: string; evidence: string; files: FileList | null }) => {
        if (data) {
            // If data is provided, submit directly
            // Combine reason and evidence into statement for now, as API might not accept separate evidence string field yet
            const combinedStatement = `[항소 사유]\n${data.reason}\n\n[추가 증거]\n${data.evidence}`;
            // Files are not handled yet in basic flow, passing empty array for evidences
            handleSubmitAppeal(caseId, appellant, combinedStatement, []);
        } else {
            // Fallback navigation
            navigate(`/case/${caseId}/appeal?litigant=${appellant}`);
        }
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
                <Route path="/" element={<CourtLobby onNewCase={handleNewCase} onViewCase={handleViewCase} recentCases={cases} currentUser={currentUser} />} />
                <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
                <Route path="/filing" element={<FilingPage currentUser={currentUser!} onSubmit={handleCreateCase} friends={friends} onCancel={() => navigate('/')} />} />
                <Route path="/law-book" element={<LawBook />} />

                {/* Dynamic Routes Wrapper to inject case data */}
                <Route path="/case/:id/*" element={
                    <CaseRouteHandler
                        cases={cases}
                        currentUser={currentUser}
                        handleSubmitDefense={handleSubmitDefense}
                        handleRequestVerdict={handleRequestVerdict}
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
                            onAddFriend={async (friendId) => {
                                try {
                                    await userService.requestFriend(currentUser.id, friendId);
                                    // Optimistic update or refresh? Refresh is safer given friend requests logic
                                    await refreshData();
                                    alert('친구 요청을 보냈습니다.');
                                } catch (error) {
                                    console.error(error);
                                    alert('이미 친구이거나 요청을 보낸 상태입니다.');
                                }
                            }}
                            onUnfollow={handleUnfollow}
                            onViewCase={handleViewCase}
                        />
                    ) : <div />
                } />

                <Route path="/jury" element={<JuryDashboard cases={juryCases} />} />
            </Routes>
        </div>
    );
}

// Wrapper to find case by ID and pass to sub-components
function CaseRouteHandler({
    cases,
    currentUser,
    handleSubmitDefense,
    handleRequestVerdict,
    handleVote,
    handleSelectPenalty,
    handleAppeal,
    handleSubmitAppeal
}: {
    cases: Case[],
    currentUser: User | null,
    handleSubmitDefense: any,
    handleRequestVerdict: any,
    handleVote: any,
    handleSelectPenalty: any,
    handleAppeal: any,
    handleSubmitAppeal: any
}) {
    const { id } = useParams();
    // Prefer fetching fresh data for the specific case to get full details (content, evidences, etc.)
    const [activeCase, setActiveCase] = useState<Case | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeCase) setLoading(true); // Only show full loading screen if we don't have data yet
        const fetchCase = async () => {
            if (!id) return;
            try {
                const data = await caseService.getCase(id, currentUser?.id ? String(currentUser.id) : undefined);
                setActiveCase(data);
            } catch (error) {
                console.error("Failed to fetch case details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCase();
    }, [id, cases]);

    // Fallback to case from list if fetch fails or while loading (optional, but safer to wait for full details)
    // Actually, we need full details like content/evidences for DefensePage. 
    // The list might not have them. So we wait.

    if (loading) return <div className="p-8 text-center text-gray-400">사건 정보를 불러오는 중...</div>;
    if (!activeCase) return <div className="p-8 text-center text-gray-400">사건을 찾을 수 없습니다.</div>;

    const case_ = activeCase;

    const isDefendant = currentUser?.id === case_.defendantId;
    const isPlaintiff = currentUser?.id === case_.plaintiffId;

    const isJuror = !isPlaintiff && !isDefendant;

    // ✅ Core logic: Show verdict page ONLY when verdict exists
    // otherwise: Plaintiff sees waiting, Defendant sees defense page
    // Jurors: Always redirect to Jury page for voting (or view verdict if we want, but user said "just vote")

    const hasVerdict = case_.verdictText != null && case_.verdictText !== '';
    const hasPenalty = case_.penaltySelected != null && case_.penaltySelected !== 'null' && case_.penaltySelected !== 'undefined';
    const isDefenseSubmitted = case_.status === 'DEFENSE_SUBMITTED';

    // Visibility Rule: 
    // - Defendant: Can see verdict immediately (to select penalty).
    // - Others (Plaintiff/Juror): Can ONLY see verdict after penalty is selected.
    const canViewVerdict = hasVerdict && (isDefendant || hasPenalty);

    // Debugging logs
    console.log('🔍 CaseRouteHandler Debug:', {
        caseId: case_.id,
        caseStatus: case_.status,
        currentUserId: currentUser?.id,
        isDefendant,
        isPlaintiff,
        hasVerdict,
        hasPenalty,
        canViewVerdict,
        willShow: isJuror ? 'jury page' : (canViewVerdict ? 'verdict page' : isDefendant && !hasVerdict ? 'defense page' : 'waiting page')
    });

    return (
        <Routes>
            <Route path="" element={
                isJuror ? (
                    <Navigate to="jury" replace />
                ) : canViewVerdict ? (
                    <VerdictPage
                        case_={case_}
                        currentUser={currentUser}
                        onAppeal={(appellant, data) => handleAppeal(case_.id, appellant, data)}
                        onSelectPenalty={(p) => handleSelectPenalty(case_.id, p)}
                    />
                ) : (
                    isDefendant && !hasVerdict && !case_.defendantResponse ? <Navigate to="defense" replace /> :
                        <WaitingPage
                            case_={case_}
                            currentUser={currentUser}
                            onRequestVerdict={() => handleRequestVerdict(case_.id)}
                            hasVerdict={hasVerdict} // Pass this to show "Penalty Selection Waiting" state
                        />
                )
            } />
            <Route path="defense" element={<DefensePage case_={case_} onSubmitDefense={(data) => handleSubmitDefense(case_.id, data)} />} />
            <Route path="jury" element={<JuryVotingPage case_={case_} onVote={(vote) => handleVote(case_.id, vote)} />} />
            <Route path="verdict" element={
                <VerdictPage
                    case_={case_}
                    currentUser={currentUser}
                    onAppeal={(appellant, data) => handleAppeal(case_.id, appellant, data)}
                    onSelectPenalty={(p) => handleSelectPenalty(case_.id, p)}
                />
            } />
            <Route path="appeal" element={<AppealPage case_={case_} onSubmitAppeal={handleSubmitAppeal} />} />
        </Routes>
    );
}