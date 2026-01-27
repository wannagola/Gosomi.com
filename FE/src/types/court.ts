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
export interface Law {
  id: LawType;
  title: string;
  description: string;
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
  };

  // Flattened Verdict Fields
  verdictText?: string;
  faultRatio?: {
    plaintiff: number;
    defendant: number;
  };
  penaltySelected?: string; 
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
    description: '카카오톡 대화 예절을 준수하고, 읽씹·안읽씹·단답 등으로 상대를 불편하게 하지 않는다.',
    icon: kakaoIcon,
    severityCriteria: {
      low: '안읽씹 1일 이상 / 할말없게하는거(단답)',
      medium: '읽씹 1일 이상',
      high: '지속적이고 반복적인 읽씹·무시'
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
    description: '친구 관계에서 상호 존중과 배려를 실천하며, 신뢰를 훼손하는 행위를 금지한다.',
    icon: friendshipIcon,
    severityCriteria: {
      low: '오해 수준',
      medium: '감정 상함 명확',
      high: '신뢰 훼손 (전적으로 책임이 있는 경우)'
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
    description: '약속 시간을 엄수하며, 지각·당일 취소·노쇼 등으로 상대의 시간을 낭비하지 않는다.',
    icon: timeIcon,
    severityCriteria: {
      low: '단순 지각',
      medium: '반복 지각·당일 취소',
      high: '노쇼'
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
    description: '더치페이·빌린 돈 등 금전 관계를 명확히 정산하며, 지연·회피하지 않는다.',
    icon: moneyIcon,
    severityCriteria: {
      low: '실수',
      medium: '지연·회피',
      high: '고의적 미정산'
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
    description: '공유 음식을 공정하게 나누며, 무단으로 독점하거나 과도하게 섭취하지 않는다.',
    icon: foodIcon,
    severityCriteria: {
      low: '무의식적 위반',
      medium: '반복',
      high: '독점·무단 섭취'
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
    description: '게임 내 매너를 지키고, 팀원을 존중하며, 던짐·탈주·욕설 등을 금지한다.',
    icon: gameIcon,
    severityCriteria: {
      low: '매너 부족',
      medium: '팀 기여 저해',
      high: '고의 던짐·탈주'
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
    description: '드라마·영화·스포츠 등의 내용을 미리 누설하지 않으며, 상대의 관람 경험을 존중한다.',
    icon: spoilerIcon,
    severityCriteria: {
      low: '실수',
      medium: '명확한 스포',
      high: '반복·조롱'
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
    description: '연인 간 갈등을 평화롭게 해결하고, 상대를 배려하며 존중한다.',
    icon: coupleIcon,
    severityCriteria: {
      low: '오해',
      medium: '감정 소모',
      high: '반복 갈등'
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