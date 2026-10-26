# 팀플에서 나는 무엇부터 할까?

**What do I do first in a team?** — 한국어·영어로 진행하는 리더십·매니지먼트 수업 활동.

학생들이 QR로 접속해 18개 상황에 1~7로 응답하고, 개인 결과와 반 전체·조별 통계를 함께 살펴봅니다. BTM101의 John P. Kotter, *What Leaders Really Do* 토론을 위해 만들었습니다. 다른 수업에서도 새 방을 만들어 재사용하거나 코드를 복제해 운영할 수 있습니다.

## 활동 개요

| 축 | 리더십 행동 | 매니지먼트 행동 |
|---|---|---|
| 방향 | 추구할 방향을 먼저 정하기 | 시간·자원·실행 계획을 먼저 세우기 |
| 사람 | 공동의 목표에 뜻을 모으기 | 역할·책임·협업 구조를 정리하기 |
| 실행 | 의미·참여 의욕을 북돋우기 | 진행을 점검하고 문제를 해결하기 |

- 축마다 6문항, 총 18문항. 예상 4–6분이며 수업 전에 실제 시간을 확인하세요.
- 1은 왼쪽 행동을 확실히 먼저, 4는 우선순위가 비슷함, 7은 오른쪽 행동을 확실히 먼저입니다. 문항별 L/M 방향은 좌우가 달라집니다.
- 8가지 대표 유형 또는 혼합형으로 결과를 보여 줍니다. 개인 페이지에는 축별 성향 풀이, 활용 상황, 함께 챙길 점, 다음에 해 볼 행동이 있습니다.
- 혼합형에서는 모두 중간값을 골랐는지, 상황마다 양쪽을 골랐는지 구분해 설명합니다.
- 결과는 이 질문에서 먼저 하려는 행동을 돌아보는 장치입니다. 검증된 성격·능력 검사나 Kotter의 공식 검사로 소개하지 마세요.

## 교수자 빠른 시작

이미 운영 중인 사이트에서는:

1. 기존 수업은 `/admin`에서 방을 만들고 QR 또는 참여 링크를 공유합니다.
2. `/present/<방코드>`에서 완료 인원을 확인하고, 응답을 마감한 다음 통계를 공개합니다.
3. 수업 후 `/admin`의 **새 방 만들기 개방** 버튼을 누르면 누구나 `/host`에서 자기 방을 만들 수 있습니다.
4. 공개 방을 만든 사람에게 해당 방만 관리하는 키가 발급됩니다. `/host/<방코드>`에서 QR, 마감·재개, 공개·비공개를 조작합니다.
5. 관리 키를 별도로 보관하면 다른 기기에서도 같은 관리 페이지에 입력해 운영할 수 있습니다. 참가자에게는 참여 링크만 공유하세요.

**새 방 생성은 기본적으로 닫혀 있습니다.** 개방해도 기존 수업 방의 관리자 권한은 풀리지 않습니다. 다시 닫으면 신규 생성만 중단하고 이미 만든 방은 계속 운영할 수 있습니다. 별도 사이트를 복제하는 경우에도 같은 방식입니다.

## 로컬 실행

Node.js 24 이상과 npm이 필요합니다.

```bash
npm ci
cp .env.example .env.local
# .env.local에 아래 환경 변수 입력
npm run dev
```

DB 없이 화면을 확인하려면 `/s/DEMO`를 사용하세요. 이 기기에만 저장되는 데모이며 반 전체 온라인 집계는 하지 않습니다.

### 환경 변수

모두 서버 전용입니다. `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

| 이름 | 용도 |
|---|---|
| `SUPABASE_URL` | 본인이 운영할 Supabase 프로젝트 주소 |
| `SUPABASE_SECRET_KEY` | 해당 프로젝트의 서버 secret key |
| `ADMIN_SECRET` | 사이트 전체 관리자 비밀번호 |
| `ADMIN_COOKIE_SECRET` | 관리자 쿠키 서명·IP 해시용 난수. 예: `openssl rand -hex 32` |
| `APP_URL` | QR과 참여 링크에 사용할 실제 공개 주소 |

실제 비밀키, 관리 키, `.env.local`, 참가자 응답은 저장소에 포함하지 않습니다. 교수자가 별도 배포할 때에는 본인의 프로젝트와 새 비밀키를 사용하세요.

## DB 설정

Supabase CLI에서 본인의 프로젝트를 연결하고 **두 migration을 모두** 적용하세요.

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

- `20261026000000_init.sql`: 방, 참가자, 응답, 관리자 인증 실패 제한, 입장·제출 트랜잭션.
- `20261026010000_public_hosting.sql`: 기본 비공개인 새 방 생성 설정, 방별 관리 키 해시, 공개 생성 RPC와 속도 제한.

RLS를 활성화하고 브라우저의 직접 테이블·RPC 접근은 차단합니다. 모든 DB 접근은 서버에서 합니다. 공개 방 생성은 네트워크당 시간당 3개로 제한합니다. 사이트 전체 관리자의 방 생성에는 이 제한을 적용하지 않습니다. Vercel 이외 환경은 신뢰할 수 있는 프록시에서 실제 IP 헤더를 설정하도록 구성하세요.

기존 배포를 업데이트할 때에는 두 번째 migration을 먼저 적용한 다음 앱을 배포하세요. SQL의 기본값이 `false`라서 업데이트만으로 새 방 생성이 자동 개방되지는 않습니다.

## Vercel 배포

이 저장소 자체가 앱 루트입니다. 상위 수업 폴더나 PDF는 필요하지 않습니다.

1. 이 저장소를 본인 GitHub 계정으로 Fork하거나 복제합니다.
2. Vercel에서 Next.js 프로젝트로 가져옵니다. Root Directory는 저장소 루트입니다.
3. 위 환경 변수 5개를 설정하고 `APP_URL`에 실제 배포 주소를 입력합니다.
4. 본인의 Supabase에 migration을 적용하고 배포합니다.
5. 관리자 로그인 → 테스트 방 생성 → 서로 다른 두 기기로 제출·통계 공개까지 확인합니다.

CLI 배포도 가능합니다.

```bash
vercel link
vercel deploy --prod
```

## 질문과 풀이 수정

독립적으로 복제한 저장소의 기준 데이터는 `lib/brief/content.json`과 `lib/brief/scoring.mjs`입니다. 개인 결과의 확장 풀이는 `lib/interpretation.ts`, 화면 추가 문구는 `lib/i18n.ts`에 있습니다.

원래 수업 작업 공간에서는 상위 `leadership-game-brief/`가 기준이며 `npm run dev/build` 전에 `scripts/sync-content.mjs`가 최신 JSON과 채점 코드를 복사합니다. 상위 폴더가 없는 독립 저장소에서는 커밋된 사본을 그대로 쓰므로 외부 폴더를 만들 필요가 없습니다.

질문·매핑·채점 기준을 바꿀 때에는 콘텐츠 버전을 갱신하고 **새 방**을 만드세요. 응답 중인 기존 방의 질문을 교체하거나 이전 응답을 새 버전으로 재표기하지 마세요. 현재 앱은 활성 콘텐츠 버전과 다른 방에서의 신규 응답을 거부합니다. 과거 버전을 계속 운영하려면 해당 버전 배포를 따로 유지해야 합니다.

## 채점과 공개 통계

오른쪽이 L이면 `응답-4`, 왼쪽이 L이면 `4-응답`으로 채점합니다. 축별 평균이 +0.5 초과면 L, -0.5 미만이면 M, 그 사이면 X입니다. 경계는 X에 포함합니다. 이 구간은 수업용 임시 표시 규칙이고 검증된 진단 절단점이 아닙니다.

같은 방·같은 참가 토큰은 응답 1건으로 upsert합니다. 공개 전에는 관리자 또는 그 방의 소유자만 분포를 볼 수 있습니다. 공개 통계에는 이름·토큰·개인 응답 목록을 보내지 않습니다. 조별 소수 집계로 개인을 짐작할 수 있으므로 조 미지정도 허용합니다.

## 검증

네트워크 없이 실행하는 검사:

```bash
npm run check
npm run build -- --webpack
```

`check`는 린트, 축별 7⁶ 응답 패턴 검증, 방 소유권 격리, 실제 개인 풀이 컴포넌트의 27개 결과 × 한영 렌더링을 확인합니다. 전체 18문항의 모든 조합을 전수 검증하거나 검사 타당도를 입증한 것은 아닙니다.

DB와 실행 서버를 포함한 종단 검사:

```bash
npm run start
# 다른 터미널에서 실행. 실제 테스트 방을 만들므로 본 수업 응답 중에는 피하세요.
node scripts/verify-app.mjs http://localhost:3000
```

인증, 중복 제출, 공개 전 차단, 조 변경, 마감 경쟁, 공개 방의 소유권 격리와 개방 스위치를 확인합니다. 제목이 `TEST `로 시작하는 방을 생성합니다. 공개 생성 스위치를 검사 전 상태로 복원합니다.

## 수업 후 데이터 정리

Supabase SQL Editor에서 **삭제할 방을 정확히 확인한 뒤** 실행하세요. 참가자·응답은 해당 방과 함께 삭제됩니다.

```sql
-- 특정 방만 삭제
 delete from public.sessions where code = 'YOUR_ROOM_CODE';
-- 테스트 방만 삭제
 delete from public.sessions where title like 'TEST %';
```

새 방 생성 개방과 원시 응답 삭제는 별개입니다. 기존 방의 참가자 데이터가 필요 없으면 먼저 정리한 뒤 재사용하세요. 새 운영자가 관리 키를 잃으면 사이트 관리자가 그 방을 대신 운영할 수 있습니다. 원래 키는 서버에 해시로만 저장하므로 복원할 수 없습니다.

## English quick start

This is a bilingual classroom activity about which leadership or management action participants would prioritize. It includes 18 questions, individual interpretations, and anonymous class/group aggregates. It is not a validated personality or ability assessment.

Use Node.js 24+, run `npm ci`, copy `.env.example` to `.env.local`, configure your own Supabase project, apply both SQL migrations, and deploy as a Next.js app. No files from the original course folder are required.

Admins create protected class rooms at `/admin`. After class, they can enable public creation. Anyone can then create a room at `/host`; the returned private key grants control of that room only. Save the key privately and use `/host/<code>` to manage the room. Closing public creation does not disable existing rooms.

## 출처와 라이선스

개념적 출발점: John P. Kotter, [What Leaders Really Do](https://store.hbr.org/product/what-leaders-really-do/r0111f), HBR, 1990 초출·2001 재수록. 문항·채점·별명·풀이 문구는 이 활동을 위해 작성했습니다. HBR 원문, 수업 PDF, 학생 응답은 배포하지 않습니다.

직접 작성한 앱 코드와 콘텐츠는 [MIT License](LICENSE)로 재사용할 수 있습니다. 외부 라이브러리와 인용 자료의 권리는 각각의 저작자에게 있습니다.
