export type Notice = {
  id: string;
  title: string;
  body: string;
  /** ISO date — 최신순 정렬·작성일 표시 기준 */
  publishedAt: string;
  /** 본문 내 노출 이미지 (선택) */
  imageUrls?: string[];
};

/** 등록된 공지글 (최신 등록순으로 정렬해 노출) */
export const NOTICES: Notice[] = [
  {
    id: "n1",
    title: "(예시) ANA 업데이트 v1 > v2 수정사항",
    body: `안녕하세요, ANA입니다.

ANA 서비스가 v1에서 v2로 업데이트되었습니다.
주요 수정 사항은 다음과 같습니다.

1. 마이페이지·설정 화면 개선
2. 회원탈퇴 및 계정 관련 정책 안내 보완
3. 안정성 및 사용성 개선

이용해 주셔서 감사합니다.`,
    publishedAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "n2",
    title: "(예시) 최근 신고내역 관련 처리내역",
    body: `안녕하세요, ANA입니다.

최근 스킨노트 내 홍보성 게시물 및 근거 없는 효과 단정 표현에 대한 신고가 다수 접수되어, 운영 정책에 따라 검토를 진행했습니다.

검토 결과, 서비스 이용 규칙에 위반되는 게시물 일부가 확인되어 삭제 조치하였으며, 반복 위반이 확인된 계정에 대해 7일간 이용 제한을 적용했습니다.

ANA는 사용자 여러분의 건강한 정보 공유 환경을 위해, 신고 접수 후 24~72시간 이내 검토를 원칙으로 운영하고 있습니다.

앞으로도 공정하고 안전한 커뮤니티를 위해 지속적으로 관리하겠습니다.
문의 사항이 있으시면 고객센터로 연락해 주세요.

감사합니다.`,
    publishedAt: "2026-07-14T09:00:00.000Z",
  },
  {
    id: "n3",
    title: "(예시) 런칭 기념 1달 이벤트",
    body: `안녕하세요, ANA입니다.

런칭을 기념하여 1달간 이벤트를 진행합니다.
자세한 참여 방법과 혜택은 추후 공지를 통해 안내드릴 예정입니다.

많은 관심 부탁드립니다.`,
    publishedAt: "2026-07-01T09:00:00.000Z",
  },
];

export function getNoticesNewestFirst() {
  return [...NOTICES].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getNoticeById(id: string) {
  return NOTICES.find((n) => n.id === id) ?? null;
}

/** 작성일: YYYY.MM.DD (타임존 영향 없이 날짜 부분 사용) */
export function formatNoticeDate(iso: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (matched) return `${matched[1]}.${matched[2]}.${matched[3]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
