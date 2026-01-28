import kakaoIcon from '@/assets/카톡매너법.png';
import friendshipIcon from '@/assets/우정법.png';
import timeIcon from '@/assets/시간준수법.png';
import moneyIcon from '@/assets/금전정산법.png';
import foodIcon from '@/assets/식탐방지법.png';
import gameIcon from '@/assets/게임법.png';
import spoilerIcon from '@/assets/스포방지법.png';
import coupleIcon from '@/assets/커플평화협정법.png';

// 사건 상태 타입
export type CaseStatus =
  | 'SUMMONED' // 소환 완료 (피고에게 소환장 발송됨)
  | 'DEFENSE_SUBMITTED' // 변론 제출 완료
  | 'VERDICT_READY' // 판결(벌칙선택 대기)
  | 'UNDER_APPEAL' // 항소 진행 중
  | 'APPEAL_VERDICT_READY' // 항소심 판결 완료
  | 'COMPLETED'; // 종료

// 법률 종류
export type LawType =
  | 'kakao' // 카톡매너법
  | 'friendship' // 우정법
  | 'time' // 시간준수법
  | 'money' // 금전정산법
  | 'food' // 식탐방지법
  | 'game' // 게임법
  | 'spoiler' // 스포방지법
  | 'couple' // 커플평화협정법
  | 'relationship'; // 관계법

// 벌칙 강도
export type PenaltySeverity = 'low' | 'medium' | 'high';

// 법률 정보
// 법률 정보
export interface Law {
  id: LawType;
  title: string;
  description: string; // 요약 (목적 등)
  content?: string; // 상세 조항 (제1조 ~ 제N조)
  icon: string;
  severityCriteria: {
    low: string;
    medium: string;
    high: string;
  };
  penalties: {
    low: { serious: string; funny: string };
    medium: { serious: string; funny: string };
    high: { serious: string; funny: string };
  };
}

// 증거
export interface Evidence {
  id: string;
  type: 'image' | 'text';
  content: string;
  isKeyEvidence?: boolean;
  submittedAt?: Date;
}

// 사건
export interface Case {
  id: string;
  caseNumber: string; // 제 2026-GOSOMI-001호
  title: string;
  plaintiff: string; // 원고 (ID might be better, but keeping string for simple display if no user obj)
  defendant: string; // 피고
  plaintiffId: string;
  defendantId: string;

  lawType: LawType;
  description?: string; // Deprecated, use content instead
  content?: string; // Main content from API
  evidences: Evidence[]; // Always returned as array from API

  status: CaseStatus;
  displayStatus?: string; // e.g. "재판중"

  createdAt: Date;

  defenseContent?: string; // 피고 변론 내용
  defendantResponse?: { // Keeping this structure for internal state if needed, or flattening?
    // API Spec has "defenseContent" string.
    // But frontend might want structured response with evidences.
    // Let's keep `defenseContent` for the text matching spec, and `defendantResponse` for backward compat or richer data if needed.
    // actually, let's try to match spec. Spec has "defenseContent".
    // But for evidence? Spec says "defenseContent" is string. 
    // Implementation plan said "Add defenseContent".
    // I will keep defendantResponse for now to not break too much logic, but map `defenseContent` to it.
    statement: string;
    evidences: Evidence[];
    submittedAt: Date;
  };

  juryEnabled?: boolean; // 배심원 투표 활성화 여부
  juryMode?: 'invite' | 'random'; // 배심원 모드: 초대 또는 랜덤
  juryInviteLink?: string; // 배심원 초대 링크
  juryInvitedUserIds?: number[];

  juryVotes?: {
    plaintiffWins: number;
    defendantWins: number;
    bothGuilty: number;
    totalJurors?: number;
  };

  // Flattened Verdict Fields
  verdictText?: string;
  faultRatio?: {
    plaintiff: number;
    defendant: number;
  };
  penaltySelected?: string;
  penaltyChoice?: string; // "SERIOUS" | "FUNNY" from DB
  penalties?: {
    serious: string[];
    funny: string[]
  };

  // Appeal
  appealStatus?: 'NONE' | 'REQUESTED' | 'RESPONDED' | 'DONE';
  appeal?: {
    requester: 'plaintiff' | 'defendant';
    reason: string;
    defenseContent?: string;
  };
}

// 8가지 생활분쟁 통합법전
export const LAWS: Law[] = [
  {
    id: 'kakao',
    title: '카톡매너법',
    description: '메신저 소통 중 발생하는 읽씹, 안읽씹 및 기타 매너 위반 행위를 규율한다.',
    content: `제1조(목적)
본 법은 메신저 소통 중 발생하는 읽씹, 안읽씹 및 기타 매너 위반 행위를 규율함을 목적으로 한다.

제2조(정의)
① “안읽씹”이란 상대의 메시지를 확인하지 않은 상태로 답변을 지연하거나 회피하는 행위를 말한다.
② “읽씹”이란 상대의 메시지를 확인한 뒤 답변하지 아니하는 행위를 말한다.
③ “무성의한 단답”이란 대화의 진행을 현저히 저해하는 수준의 단문·형식적 답변을 말한다.

제3조(위반행위의 유형)
다음 각 호의 어느 하나에 해당하는 경우 카톡매너법 위반으로 본다.
1. 안읽씹
2. 읽씹
3. 무성의한 단답
4. 중요한 논의 중 무단 이탈

제5조(판정 및 과실 경감)
① 본 법 위반 사건의 전형적 판정은 쌍방과실(BOTH_AT_FAULT) 또는 유죄(GUILTY)로 한다.
② 업무·학업·긴급상황 등 불가피한 사정이 인정되는 경우 과실은 감경할 수 있다.`,
    icon: kakaoIcon,
    severityCriteria: {
      low: '안읽씹 1일 이상 지속 또는 무성의한 단답',
      medium: '읽씹 1일 이상 유지',
      high: '중요한 논의 중 무단 이탈 및 3일 이상 무응답'
    },
    penalties: {
      low: {
        serious: '사과 메시지 작성 (5줄 이상)',
        funny: '애교 음성 메시지 1회'
      },
      medium: {
        serious: '커피 사주기',
        funny: '판결문 낭독 녹음'
      },
      high: {
        serious: '일주일 동안 선톡해주기',
        funny: '릴스/숏츠 따라 찍기'
      }
    }
  },
  {
    id: 'friendship',
    title: '우정법',
    description: '친구 사이의 신뢰, 비밀 유지 및 의리 위반 행위를 규율한다.',
    content: `제1조(목적)
본 법은 친구 사이의 신뢰, 비밀 유지 및 의리 위반 행위를 규율함을 목적으로 한다.

제2조(보호법익)
① 본 법은 친구 사이의 신뢰 관계 및 정서적 안전을 보호한다.
② “비밀”과 “신뢰”는 당사자 간 합의 또는 사회통념상 보호 가치가 있는 정보를 포함한다.

제3조(위반행위)
다음 각 호의 어느 하나에 해당하면 우정법 위반으로 본다.
1. 의리 위반 또는 배신 행위
2. 비밀 누설 또는 신뢰 훼손
3. 뒷담화, 공개적 망신 등 관계 훼손 행위
4. 약속 파기 또는 반복적 서운함 유발 행위

제5조(판정 가이드 및 가중 사유)
① 전형적 판정은 쌍방과실(BOTH_AT_FAULT), 유죄(GUILTY), 화해권고(SETTLEMENT) 중 하나로 한다.
② 고의·반복·공개망신이 인정되는 경우 강도는 상(HIGH)으로 상향할 수 있다.`,
    icon: friendshipIcon,
    severityCriteria: {
      low: '사소한 오해 또는 말실수',
      medium: '감정 상함이 명확한 비매너 행위',
      high: '중대한 신뢰 훼손 및 약속 파기'
    },
    penalties: {
      low: {
        serious: '칭찬 메시지 3줄',
        funny: '애교 음성'
      },
      medium: {
        serious: '커피 또는 간식',
        funny: '엉덩이로 이름 쓰기'
      },
      high: {
        serious: '진심 어린 사과 편지',
        funny: '사과 영상 촬영'
      }
    }
  },
  {
    id: 'time',
    title: '시간준수법',
    description: '약속 시간 지각 및 무단 불참(노쇼) 행위를 규율한다.',
    content: `제1조(목적)
본 법은 약속 시간 지각 및 무단 불참(노쇼) 행위를 규율함을 목적으로 한다.

제2조(정의)
① “지각”이란 합의된 약속 시간 이후에 도착하는 행위를 말한다.
② “당일 취소”이란 약속일에 취소 의사를 통보하는 행위를 말한다.
③ “노쇼”란 사전 연락 없이 약속 장소에 나타나지 않는 행위를 말한다.

제4조(판정 및 정상참작)
① 전형적 판정은 쌍방과실(BOTH_AT_FAULT) 또는 유죄(GUILTY)로 한다.
② 사전연락 또는 긴급상황의 객관적 사정이 있는 경우 과실은 감경할 수 있다.
③ 반복성이 인정되는 경우 과실은 가중할 수 있다.`,
    icon: timeIcon,
    severityCriteria: {
      low: '15분 이내의 단순 지각',
      medium: '30분 이상의 반복적 지각 또는 당일 취소',
      high: '사전 연락 없는 무단 불참(노쇼)'
    },
    penalties: {
      low: {
        serious: '다음 약속 계획 짜서 제안하기',
        funny: '사과 음성 보내기'
      },
      medium: {
        serious: '커피 사주기',
        funny: '지각 변명 연기 영상'
      },
      high: {
        serious: '밥 사주기',
        funny: '"시간의 소중함" 1분 발표 영상'
      }
    }
  },
  {
    id: 'money',
    title: '금전정산법',
    description: '모임 비용 정산 지연 및 미입금 행위를 규율한다.',
    content: `제1조(목적)
본 법은 모임 비용 정산 지연 및 미입금 행위를 규율함을 목적으로 한다.

제2조(정의)
① “정산”이란 공동 비용에 대한 당사자별 부담액을 확정하고 지급하는 행위를 말한다.
② “미입금”이란 확정된 정산금이 지급되지 않은 상태를 말한다.
③ “연락 두절”이란 독촉 또는 확인 요청에 응답하지 않는 상태가 지속되는 것을 말한다.

제4조(판정 가이드)
① 전형적 판정은 유죄(GUILTY) 또는 쌍방과실(BOTH_AT_FAULT)로 한다.
② 정산 의사 표명 및 실제 입금 완료가 확인되는 경우 화해권고(SETTLEMENT)로 종결할 수 있다.`,
    icon: moneyIcon,
    severityCriteria: {
      low: '단순 건망증으로 인한 짧은 지연',
      medium: '독촉에도 불구하고 정산을 회피하는 경우',
      high: '고의적 미정산 및 연락 두절'
    },
    penalties: {
      low: {
        serious: '금액을 천원 단위로 깔끔하게 맞춰 정산',
        funny: '정산 인증 사진 찍기'
      },
      medium: {
        serious: '커피 사주기',
        funny: '정산 과정 설명 음성'
      },
      high: {
        serious: '밥 사주기',
        funny: '"정산의 중요성" 발표'
      }
    }
  },
  {
    id: 'food',
    title: '식탐방지법',
    description: '공동 음식의 무단 취식 및 식사 매너 위반을 규율한다.',
    content: `제1조(목적)
본 법은 공동 음식의 무단 취식 및 식사 매너 위반을 규율함을 목적으로 한다.

제2조(정의)
① “공동 음식”이란 함께 구매·공유하기로 한 음식 또는 사회통념상 공유 전제가 있는 음식을 말한다.
② “무단 취식”이란 사전 합의 없이 타인의 음식 또는 공동 음식의 지분을 침해하여 섭취하는 행위를 말한다.

제4조(판정 및 고려요소)
① 전형적 판정은 유죄(GUILTY) 또는 쌍방과실(BOTH_AT_FAULT)로 한다.
② 사전 합의(공유 여부) 및 반복성에 따라 강도를 조정한다.`,
    icon: foodIcon,
    severityCriteria: {
      low: '무의식적인 ‘한입만’ 행위',
      medium: '반복적으로 맛있는 부위(예: 닭다리 등) 독점',
      high: '합의 없이 타인의 음식을 무단으로 전부 섭취'
    },
    penalties: {
      low: {
        serious: '음료 사주기',
        funny: '음식에게 사과 음성'
      },
      medium: {
        serious: '디저트 사주기',
        funny: '요즘 유행 릴스 따라 찍기'
      },
      high: {
        serious: '밥 사주기',
        funny: '엉덩이 이름쓰기'
      }
    }
  },
  {
    id: 'game',
    title: '게임법',
    description: '게임 중 트롤링, 탈주 및 매너 위반 행위를 규율한다.',
    content: `제1조(목적)
본 법은 게임 중 트롤링, 탈주 및 매너 위반 행위를 규율함을 목적으로 한다.

제2조(정의)
① “정치질”이란 팀 분위기를 저해하는 비난·책임전가 등 행위를 말한다.
② “던짐”이란 고의적으로 패배를 유도하는 플레이를 말한다.
③ “탈주”란 정당한 사유 없이 게임 진행 중 이탈하는 행위를 말한다.

제4조(판정 가이드)
① 전형적 판정은 유죄(GUILTY)로 한다.
② 고의성·반복성·탈주 여부는 상(HIGH) 판단의 핵심 요소로 한다.`,
    icon: gameIcon,
    severityCriteria: {
      low: '집중력 부족으로 인한 가벼운 실수',
      medium: '고의적 팀 분위기 저해(정치질)',
      high: '고의적 패배 유도(던짐) 및 무단 탈주'
    },
    penalties: {
      low: {
        serious: '하고 싶을 때 무조건 같이 해주기',
        funny: '판결문 낭독하기'
      },
      medium: {
        serious: '다음 판 서포트·보조 역할 우선 수행',
        funny: '패배 해설 영상 촬영하기 (10분)'
      },
      high: {
        serious: '게임 스킨 사주기',
        funny: '캐릭터 목소리로 사과'
      }
    }
  },
  {
    id: 'spoiler',
    title: '스포방지법',
    description: '콘텐츠의 주요 내용을 사전 동의 없이 유출하는 행위를 규율한다.',
    content: `제1조(목적)
본 법은 영화·드라마·웹툰 등 콘텐츠의 주요 내용을 사전 동의 없이 유출하는 행위를 규율함을 목적으로 한다.

제2조(정의)
① “스포일러”이란 결말·반전·핵심 전개 등 감상의 본질을 훼손할 수 있는 정보를 말한다.
② “사전 동의”란 상대가 해당 정보 제공을 명시적으로 허용한 경우를 말한다.

제4조(판정 및 고려요소)
① 전형적 판정은 유죄(GUILTY) 또는 쌍방과실(BOTH_AT_FAULT)로 한다.
② 사전 동의 여부와 고의성(반복)은 상(HIGH) 판단의 핵심 요소로 한다.`,
    icon: spoilerIcon,
    severityCriteria: {
      low: '말실수로 인한 가벼운 정보 유출',
      medium: '명확하고 중요한 반전 내용 유출',
      high: '상대의 거부에도 불구하고 고의적·반복적 스포일러'
    },
    penalties: {
      low: {
        serious: '사과 메시지',
        funny: '스포 방지 선언'
      },
      medium: {
        serious: '간식 사주기',
        funny: '판결문 낭독 영상'
      },
      high: {
        serious: '드라마/OTT: 다음달 OTT 결제 / 영화: 다음 영화 쏘기 / 스포츠: 중계 플랫폼 구독료 1달치',
        funny: '드라마/OTT/영화: 무스포 리뷰 영상 / 스포츠: 경기 리뷰 영상 찍기'
      }
    }
  },
  {
    id: 'couple',
    title: '커플평화협정법',
    description: '연인 사이의 사소한 약속 위반 및 서운함 유발 행위를 규율한다.',
    content: `제1조(목적)
본 법은 연인 사이의 사소한 약속 위반 및 서운함 유발 행위를 규율함을 목적으로 한다.

제2조(정의)
① “서운함 유발”이란 상대의 정서적 안정 또는 관계 만족도를 저해하는 언행을 말한다.
② “반복적 갈등”이란 유사한 원인으로 갈등이 재발하는 상태를 말한다.

제4조(판정 가이드)
① 전형적 판정은 쌍방과실(BOTH_AT_FAULT), 화해권고(SETTLEMENT), 유죄(GUILTY) 중 하나로 한다.
② 자존감·신뢰 훼손 및 반복성 여부는 상(HIGH) 판단의 핵심 요소로 한다.`,
    icon: coupleIcon,
    severityCriteria: {
      low: '단순 오해로 인한 투덜거림',
      medium: '반복되는 사소한 비매너로 인한 감정 소모',
      high: '자존감을 해치거나 신뢰를 깨는 반복적 갈등'
    },
    penalties: {
      low: {
        serious: '원하는 메뉴 맛있게 먹어주기',
        funny: '－용체 일주일 쓰기'
      },
      medium: {
        serious: '카카오톡 프로필을 상대가 꾸미기 (1주일)',
        funny: '엉덩이 이름쓰기 / 배방구 해주기'
      },
      high: {
        serious: '하루 원하는 거 다 들어주기 (공주님/왕자님 대접)',
        funny: '"사과해요 나한테" 영상 찍기'
      }
    }
  }
];