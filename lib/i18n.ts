'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { content, type Lang, type Text } from './content';

// content.json에 없는 앱 문구. 데이터 문구는 content.json 원문을 그대로 쓴다.
const APP = {
  interpretationTitle: { ko: '내 응답을 조금 더 풀어 보면', en: 'A closer reading of your answers' },
  combinationTitle: { ko: '세 축이 함께 보여 주는 흐름', en: 'How your three priorities fit together' },
  axisReadingTitle: { ko: '축별 성향 풀이', en: 'Your tendencies by axis' },
  interpretationNote: { ko: '이번 상황에서 고른 우선 행동을 바탕으로 읽는 설명이에요. 실제 성과나 고정된 성격을 예측하지는 않아요.', en: 'These notes interpret the actions you prioritized here. They do not predict performance or a fixed personality.' },
  hostTitle: { ko: '나도 수업 방 만들기', en: 'Host your own activity' },
  hostIntro: { ko: '새 방을 만들고 QR로 참가자를 초대하세요. 만든 사람만 자기 방을 운영할 수 있어요.', en: 'Create a room and invite participants by QR. Each host manages only their own room.' },
  hostingClosed: { ko: '아직 새 방 만들기가 개방되지 않았어요. 기존 수업 참여는 방 코드로 계속할 수 있어요.', en: 'Public room creation is not open yet. You can still join an existing activity with its room code.' },
  hostingToggleTitle: { ko: '수업 후 새 방 생성 개방', en: 'Open room creation after class' },
  hostingToggleNote: { ko: '개방하면 누구나 새 방을 만들 수 있어요. 기존 방의 관리 권한은 유지돼요. 닫아도 이미 만든 방은 계속 운영할 수 있어요.', en: 'When enabled, anyone can create a room. Existing rooms keep their permissions. Disabling creation does not disable rooms already created.' },
  enableHosting: { ko: '새 방 만들기 개방', en: 'Enable room creation' },
  disableHosting: { ko: '새 방 만들기 닫기', en: 'Disable room creation' },
  hostPrivacy: { ko: '반 전체·조별 합계가 참가자에게 공개될 수 있어요. 관리 키는 이 기기에 저장되며, 따로 보관하면 다른 기기에서도 내 방을 운영할 수 있어요.', en: 'Participants may see class and group aggregates. Your host key is saved on this device; keep a copy to manage your room from another device.' },
  manageMyRoom: { ko: '내 방 운영', en: 'Manage my room' },
  hostKey: { ko: '이 방의 관리 키', en: 'Host key for this room' },
  hostKeyNote: { ko: '이 키로 이 방의 마감·공개를 바꿀 수 있어요. 참가자에게 공유하지 말고 따로 보관하세요. 분실하면 사이트 관리자에게 문의해 주세요.', en: 'This key controls closing and revealing this room. Keep it private and save a copy. Contact the site administrator if you lose it.' },
  hostRestore: { ko: '이 방을 만들 때 받은 관리 키를 입력해 주세요.', en: 'Enter the host key you received when creating this room.' },
  hostRestoreButton: { ko: '내 방 연결', en: 'Connect my room' },
  invalidHostKey: { ko: '이 방의 관리 키를 확인해 주세요.', en: 'Please check the host key for this room.' },
  hostStorageFailure: { ko: '이 기기에 관리 키를 저장하지 못했어요. 아래 방 코드와 키를 따로 보관해 주세요.', en: 'The host key could not be saved on this device. Keep the room code and key shown below.' },
  hostRateLimit: { ko: '같은 네트워크에서는 한 시간에 새 방을 3개까지 만들 수 있어요. 잠시 후 다시 시도해 주세요.', en: 'Up to three rooms can be created per network each hour. Please try again later.' },
  copyKey: { ko: '관리 키 복사', en: 'Copy host key' },
  copied: { ko: '복사했어요.', en: 'Copied.' },
  copyManually: { ko: '자동 복사가 안 돼요. 키를 직접 선택해 복사해 주세요.', en: 'Automatic copying is unavailable. Please select and copy the key manually.' },
  duration: { ko: '18문항 · 약 4–6분', en: '18 questions · about 4–6 min' },
  room: { ko: '방', en: 'Room' },
  notFound: { ko: '방을 찾을 수 없어요. 코드를 확인해 주세요.', en: 'Room not found. Please check the code.' },
  network: { ko: '서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.', en: 'Could not reach the server. Please try again shortly.' },
  serverError: { ko: '서버에 일시적인 문제가 있어요. 다시 시도해 주세요.', en: 'Temporary server problem. Please try again.' },
  dbNotConfigured: { ko: '온라인 집계 서버가 설정되지 않았어요. 데모로 화면만 확인할 수 있어요.', en: 'The online server is not configured. You can only try the demo.' },
  versionMismatch: { ko: '이 방의 질문 버전이 앱과 달라요. 발표자에게 알려 주세요.', en: "This room's question version differs from the app. Please tell the presenter." },
  roomClosed: { ko: '응답이 마감된 방이에요.', en: 'This room is closed for responses.' },
  demoBadge: { ko: '데모 · 이 기기에만 저장돼요. 반 전체 집계가 아니에요.', en: 'Demo · saved on this device only. Not a class-wide tally.' },
  chooseGroup: { ko: '조를 골라 주세요.', en: 'Please choose your group.' },
  continue: { ko: '이어서 하기', en: 'Continue' },
  myResult: { ko: '내 결과 보기', en: 'See my result' },
  editAnswers: { ko: '응답 고치기', en: 'Edit answers' },
  yourChoice: { ko: '선택', en: 'Your choice' },
  missing: { ko: '{n}번 질문에 아직 응답하지 않았어요.', en: 'Question {n} has not been answered yet.' },
  saving: { ko: '반 통계에 저장하는 중…', en: 'Saving to class statistics…' },
  savedAt: { ko: '저장 시각 {time}', en: 'Saved at {time}' },
  closedShowingSaved: { ko: '응답이 마감되어 마지막 수정은 반영되지 않았어요. 서버에 저장된 결과를 보여 드려요.', en: 'Responses have closed, so your last edit was not saved. Showing your saved result.' },
  nicknameNote: { ko: '이번 응답에 붙인 별명이에요. 성격이나 능력 판정이 아니에요.', en: 'A nickname for this set of answers, not a judgment of personality or ability.' },
  overallTitle: { ko: '전체 경향', en: 'Overall tendency' },
  overallL: { ko: '전체적으로 리더십 쪽 행동을 먼저 고른 응답이 더 뚜렷했어요.', en: 'Overall, your answers lean more clearly toward leadership actions first.' },
  overallM: { ko: '전체적으로 매니지먼트 쪽 행동을 먼저 고른 응답이 더 뚜렷했어요.', en: 'Overall, your answers lean more clearly toward management actions first.' },
  axesTitle: { ko: '세 축의 선호 위치', en: 'Preference position on three axes' },
  sideM: { ko: '매니지먼트 쪽', en: 'Management side' },
  sideL: { ko: '리더십 쪽', en: 'Leadership side' },
  distTitle: { ko: '실제 응답 분포', en: 'How you actually answered' },
  usefulWhen: { ko: '이럴 때 꺼내 보세요', en: 'Useful when' },
  watchFor: { ko: '함께 챙길 점', en: 'Watch for' },
  tryNext: { ko: '다음에 해 볼 행동', en: 'Try next' },
  myAnswers: { ko: '문항별 내 응답과 해설', en: 'My answers with notes' },
  noRight: { ko: '정답이나 오답은 없어요.', en: 'There are no right or wrong answers.' },
  statsTitle: { ko: '반 결과', en: 'Class results' },
  completed: { ko: '완료 {n}명', en: '{n} completed' },
  expected: { ko: '예상 {n}명', en: '{n} expected' },
  typesTitle: { ko: '유형별 인원', en: 'People by type' },
  patternsTitle: { ko: '혼합형의 실제 L/M/X 조합', en: 'Actual L/M/X codes in mixed preference' },
  classAxes: { ko: '세 축의 반 평균 선호 위치', en: 'Class average preference position' },
  overallRow: { ko: '전체 18문항', en: 'All 18 questions' },
  indexNote: { ko: '0은 매니지먼트 끝, 50은 중앙, 100은 리더십 끝인 행동 선호 위치예요. 퍼센트나 능력 점수가 아니에요.', en: '0 is the management end, 50 the center, 100 the leadership end. A preference position, not a percentage or ability score.' },
  groupsTitle: { ko: '조별 비교', en: 'By group' },
  noResponses: { ko: '응답 없음', en: 'No responses' },
  divisiveTitle: { ko: '가장 의견이 갈린 질문', en: 'The most divided question' },
  noDivisive: { ko: '현재 비교할 질문이 없어요.', en: 'No question to compare yet.' },
  tied: { ko: '같은 정도로 갈린 질문: {list}', en: 'Equally divided: {list}' },
  allQuestions: { ko: '질문별 1~7 분포', en: '1–7 distribution by question' },
  lPeople: { ko: '리더십 쪽 {n}명', en: 'Leadership side: {n}' },
  mPeople: { ko: '매니지먼트 쪽 {n}명', en: 'Management side: {n}' },
  midPeople: { ko: '4 선택 {n}명', en: 'Chose 4: {n}' },
  stale: { ko: '업데이트 지연 · 마지막 갱신 {time}', en: 'Update delayed · last updated {time}' },
  people: { ko: '{n}명', en: '{n}' },
  adminTitle: { ko: '관리자', en: 'Admin' },
  password: { ko: '관리자 비밀번호', en: 'Admin password' },
  login: { ko: '로그인', en: 'Log in' },
  logout: { ko: '로그아웃', en: 'Log out' },
  wrongSecret: { ko: '비밀번호가 맞지 않아요.', en: 'Wrong password.' },
  tooMany: { ko: '시도가 너무 많아요. 15분 뒤 다시 시도해 주세요.', en: 'Too many attempts. Try again in 15 minutes.' },
  newRoom: { ko: '새 방 만들기', en: 'Create a room' },
  roomTitle: { ko: '방 이름', en: 'Room name' },
  expectedOpt: { ko: '예상 인원 (선택)', en: 'Expected people (optional)' },
  create: { ko: '만들기', en: 'Create' },
  statusOpen: { ko: '응답 받는 중', en: 'Open' },
  statusClosed: { ko: '마감됨', en: 'Closed' },
  closeBtn: { ko: '응답 마감', en: 'Close responses' },
  reopenBtn: { ko: '응답 재개', en: 'Reopen responses' },
  revealBtn: { ko: '통계 공개', en: 'Reveal stats' },
  hideBtn: { ko: '통계 비공개', en: 'Hide stats' },
  revealedOn: { ko: '공개 중', en: 'Revealed' },
  revealedOff: { ko: '비공개', en: 'Hidden' },
  presentLink: { ko: '발표 화면', en: 'Projector view' },
  statsLink: { ko: '참가자 통계 화면', en: 'Participant stats' },
  noRooms: { ko: '아직 만든 방이 없어요.', en: 'No rooms yet.' },
  scanToJoin: { ko: 'QR로 참여하세요', en: 'Scan to join' },
  previewNote: { ko: '관리자 미리보기 · 참가자에게는 아직 비공개', en: 'Admin preview · not yet visible to participants' },
  roomCode: { ko: '방 코드', en: 'Room code' },
  enter: { ko: '입장', en: 'Enter' },
  tryDemo: { ko: '데모로 해 보기 (이 기기에만 저장)', en: 'Try the demo (this device only)' },
  back: { ko: '처음으로', en: 'Start page' },
} satisfies Record<string, Text>;

type Key = keyof typeof APP | keyof typeof content.ui;
const fill = (s: string, vars?: Record<string, string | number>) =>
  vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? '')) : s;

export const tx = (lang: Lang, text: Text, vars?: Record<string, string | number>) => fill(text[lang], vars);
export const t = (lang: Lang, key: Key, vars?: Record<string, string | number>) =>
  tx(lang, (APP as Record<string, Text>)[key] ?? (content.ui as Record<string, Text>)[key], vars);

const KEY = 'lg:lang';
const read = (): Lang => { try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'ko'; } catch { return 'ko'; } };
const subscribe = (cb: () => void) => {
  window.addEventListener('lg-lang', cb); window.addEventListener('storage', cb);
  return () => { window.removeEventListener('lg-lang', cb); window.removeEventListener('storage', cb); };
};
export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch {}
  window.dispatchEvent(new Event('lg-lang'));
}
export function useLang(): Lang {
  const lang = useSyncExternalStore(subscribe, read, () => 'ko' as Lang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  return lang;
}
