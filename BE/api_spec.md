# Gosomi.com API Specification (Comprehensive & Page-by-Page)

본 문서는 **Gosomi.com** 프론트엔드 개발을 위해 API를 **페이지별**로 그룹화하여 정의한 최종 명세서입니다.

- **Base URL**: `https://gosomi-com.onrender.com`
- **Auth**: `Authorization: Bearer <JWT_TOKEN>` 헤더 필수 (로그인 제외)

---

## 🏠 1. Landing & Home Page (메인 / 통계 / 검색)

서비스의 첫 얼굴로, 전체적인 활동 수치와 사건 목록을 보여줍니다.

### 📊 사이트 전체 통계 조회
- **Endpoint**: `GET /api/cases/stats`
- **Response**:
    ```json
    {
      "ok": true,
      "stats": {
        "total": 150,        // 역대 총 사건 수 (Integer)
        "todayVerdict": 5,   // 오늘 내려진 판결 수 (1심/재심 포함)
        "ongoing": 23        // 현재 진행 중인 사건 수 (FILED, SUMMONED, DEFENSE_SUBMITTED, VERDICT_READY, UNDER_APPEAL)
      }
    }
    ```

### 🔍 사건 리스트 및 검색
- **Endpoint**: `GET /api/cases`
- **Query Params**:
    - `q`: 검색어 (String - 사건번호, 제목, 유저 닉네임)
    - `userId`: 특정 유저 관련 사건만 (Integer)
    - `status`: 필터 (String - `ONGOING`: 진행 중, `COMPLETED`: 벌칙 선택까지 완료)
- **Response**:
    ```json
    {
      "ok": true,
      "data": [
        {
          "id": 10,
          "caseNumber": "2026-GOSOMI-010",
          "title": "탕수육 찍먹 부먹 논쟁",
          "displayStatus": "재판중", // 프론트 표시용 한글 상태
          "plaintiffName": "김민서",
          "defendantName": "이몽룡",
          "createdAt": "2026-01-26T15:00:00Z"
        }
      ]
    }
    ```

---

## 🔑 2. Login Page (인증)

카카오 계정을 통해 서비스에 입장하며 프로필 정보를 자동으로 연동합니다.

### 🟡 카카오 로그인 / 회원가입
- **Endpoint**: `POST /api/auth/kakao`
- **Body**: `{ "code": "KAKAO_AUTHORIZATION_CODE" }`
- **Response**:
    ```json
    {
      "ok": true,
      "token": "JWT_ACCESS_TOKEN",
      "user": {
        "id": 1,
        "nickname": "고소왕", // 카카오 닉네임 자동 반영
        "profileImage": "https://k.kakaocdn.net/..." // 카카오 프로필 사진 URL
      }
    }
    ```

---

## ✍️ 3. Case Filing Page (고소장 작성)

### 👥 배심원 후보(친구) 목록
- **Endpoint**: `GET /api/friends?userId={내ID}`
- **Response**: 
    ```json
    {
      "ok": true, 
      "data": [
        { 
          "id": 2, 
          "nickname": "친구1", 
          "profileImage": "...",
          "total_resolved": 10,  // 해당 친구의 통계 포함
          "wins": 8,
          "winningRate": 80.0 
        }
      ] 
    }
    ```

### 📝 고소장 최종 접수
- **Endpoint**: `POST /api/cases`
- **Body**:
    ```json
    {
      "title": "사건 제목",
      "content": "사건 상세 내용",
      "plaintiffId": 1,
      "defendantId": 2,
      "juryEnabled": true,
      "juryMode": "INVITE", // "RANDOM"(전체 유저 중) 또는 "INVITE"(친구 초대)
      "juryInvitedUserIds": [3, 4, 5] // "INVITE" 모드 시 필수 (최대 5명)
    }
    ```
- **Response**: `{ "ok": true, "caseId": 10, "caseNumber": "2026-GOSOMI-010" }`

### 📸 증거 이미지 업로드
- **Endpoint**: `POST /api/evidence/upload`
- **Content-Type**: `multipart/form-data`
- **Body**: 
    - `caseId`: (Integer)
    - `userId`: (Integer)
    - `images`: (File Array)
- **Response**: `{ "ok": true, "count": 2 }`

---

## ⚖️ 4. Case Detail & Trial Page (사건 상세 / 재판)

### 📖 사건 상세 정보 로드
- **Endpoint**: `GET /api/cases/:id`
- **Response**:
    ```json
    {
      "id": 10,
      "caseNumber": "2026-GOSOMI-010",
      "title": "...",
      "content": "...",
      "status": "SUMMONED", // FILED, SUMMONED, DEFENSE_SUBMITTED, VERDICT_READY, UNDER_APPEAL, COMPLETED
      "plaintiffId": 1,
      "defendantId": 2,
      "defenseContent": "피고의 변론 내용...", 
      "verdictText": "...",
      "faultRatio": { "plaintiff": 20, "defendant": 80 },
      "penalties": { "serious": ["...", "..."], "funny": ["...", "..."] },
      "penaltySelected": "...", 
      "appealStatus": "NONE" // NONE, REQUESTED, RESPONDED, DONE
    }
    ```

### 🛡️ 피고 변론 제출
- **Endpoint**: `POST /api/cases/:id/defense`
- **Body**: `{ "content": "나는 억울하다..." }`
- **Response**: `{ "ok": true, "caseId": 10 }`

### 🗳️ 배심원 투표 (배심원 전용)
- **Endpoint**: `POST /api/cases/:id/jury/vote`
- **Body**: `{ "userId": 3, "vote": "PLAINTIFF" }` // PLAINTIFF(원고 잘못) / DEFENDANT(피고 잘못)

### 🤖 AI 판결 요청 (원고/피고 전용)
- **Endpoint**: `POST /api/cases/:id/verdict`
- **Response**: `{ "ok": true, "verdictText": "...", "faultRatio": { ... } }`

### 🎁 벌칙 선택 (최종 승소자 전용)
- **Endpoint**: `POST /api/cases/:id/penalty`
- **Body**: `{ "choice": "FUNNY" }` 

---

## ⚖️ 6. Appeal Page (항소 / 재심)

판결에 불복하여 항소를 진행하고, 재심 판결을 받는 프로세스입니다.

### 🚩 항소 신청 (원고/피고)
- **Endpoint**: `POST /api/cases/:id/appeal`
- **Body**: 
    ```json
    {
      "appellantId": 1,
      "reason": "배심원 투표 결과가 편향적입니다."
    }
    ```
- **Response**: `{ "ok": true, "caseId": 10, "status": "REQUESTED" }`

### 🛡️ 항소 답변 제출 (상대방)
- **Endpoint**: `POST /api/cases/:id/appeal/defense`
- **Body**: `{ "content": "항소 이유가 타당하지 않습니다." }`
- **Response**: `{ "ok": true, "caseId": 10, "status": "RESPONDED" }`

### 🤖 재심 판결 요청 (AI 판사)
- **Endpoint**: `POST /api/cases/:id/appeal/verdict`
- **Response**: 
    ```json
    {
      "ok": true,
      "verdictText": "[재심 판결]\n...",
      "faultRatio": { "plaintiff": 30, "defendant": 70 }
    }
    ```

---

## 🔔 5. My Page & Notifications (마이페이지 / 알림)

### 🏆 나의 승소율 통계
- **Endpoint**: `GET /api/cases/user/:userId/stats`
- **Response**:
    ```json
    {
      "ok": true,
      "stats": {
        "totalResolved": 10, 
        "wins": 7,          
        "losses": 2,
        "ties": 1,
        "winningRate": 70.0  
      }
    }
    ```

### 🤝 친구 관리
- **친구 요청**: `POST /api/friends/request` (Body: `{ "userId": 1, "friendId": 2 }`)
- **요청 리스트**: `GET /api/friends/requests?userId=1` (나에게 온 요청 확인)
- **요청 수락**: `POST /api/friends/accept` (Body: `{ "requestId": 5 }`)
- **친구 삭제**: `DELETE /api/friends` (Body: `{ "userId": 1, "friendId": 2 }` - 양방향 자동 삭제)

### 🔔 알림 목록 조회
- **Endpoint**: `GET /api/notifications`
- **Query Params**: `userId={내ID}`
- **Response**:
    ```json
    {
      "ok": true,
      "data": [
        {
          "id": 100,
          "type": "SUMMON", // SUMMON, VERDICT, APPEAL, FRIEND_REQUEST, FRIEND_ACCEPT
          "message": "소환장이 발부되었습니다.",
          "case_id": 10, // 관련 사건 ID (있는 경우)
          "is_read": false,
          "created_at": "..."
        }
      ]
    }
    ```
- **읽음 표시**: `POST /api/notifications/:id/read`
