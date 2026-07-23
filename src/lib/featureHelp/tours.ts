import type { FeatureHelpTour } from "./types";

/** 화면별 기능설명 투어. 등록된 화면에만 기능설명 버튼을 노출한다. */
export const FEATURE_HELP_TOURS: Record<string, FeatureHelpTour> = {
  home: {
    id: "home",
    steps: [
      {
        targetId: "home-skin-profile",
        title: "내 피부 프로필",
        description: "피부 타입과 고민이 아직 비어 있으면 얼른 등록해요",
        placement: "below",
      },
      {
        targetId: "home-routine-cta",
        title: "오늘 루틴 기록하기",
        description: "오늘 한 스킨케어를 기록해가는 가장 중요한 시작 버튼이에요",
        placement: "below",
      },
      {
        targetId: "home-week",
        title: "참여기록",
        description:
          "이번 루틴을 얼마나 참여했는지 보여주고, 날짜별로 기록한 날은 표시돼요. 화살표를 누르면 더 볼 수 있어요.",
        placement: "above",
      },
      {
        targetId: "home-honor",
        title: "명예의 스킨노트",
        description: "저장 best, 댓글 best 기록을 빠르게 볼 수 있어요",
        placement: "above",
      },
      {
        targetId: "app-bottom-nav",
        title: "하단 탭 이동",
        description:
          "홈은 시작점, 케어로그는 기록, 스킨서랍장은 저장한 후기, 마이페이지는 내 정보예요",
        placement: "above",
        padding: 4,
      },
    ],
  },
  mypage: {
    id: "mypage",
    steps: [
      {
        targetId: "mypage-profile",
        title: "내 프로필",
        description: "내 이름과 프로필 상태를 확인하는 공간이에요.",
        placement: "below",
      },
      {
        targetId: "mypage-routine",
        title: "진행중인 루틴",
        description:
          "현재 진행 중인 루틴이 있으면 여기서 바로 확인하거나 이어서 볼 수 있어요.",
        placement: "below",
      },
      {
        targetId: "mypage-notes",
        title: "스킨노트 모아보기",
        description: "내가 모아본 스킨노트를 빠르게 다시 꺼내볼 수 있어요.",
        placement: "below",
      },
      {
        targetId: "mypage-saved",
        title: "저장한 스킨노트",
        description:
          "스킨서랍장에서 사용자가 저장한 스킨노트들을 확인할 수 있어요.",
        placement: "above",
      },
      {
        targetId: "mypage-settings",
        title: "설정",
        description:
          "공지사항, 문의하기, 이용약관, 회원탈퇴 같은 설정은 톱니바퀴에서 볼 수 있어요.",
        placement: "below",
        padding: 6,
      },
    ],
  },
  "skin-profile": {
    id: "skin-profile",
    steps: [
      {
        targetId: "skin-profile-user",
        title: "프로필 확인",
        description: "내 이름과 프로필을 먼저 확인해요",
        placement: "below",
      },
      {
        targetId: "skin-profile-type",
        title: "피부 타입 선택",
        description: "건성·지성·복합성·민감성 중 내 피부에 가장 가까운 타입을 골라요",
        placement: "below",
      },
      {
        targetId: "skin-profile-concerns",
        title: "피부 고민 선택",
        description: "여드름/트러블, 색소침착, 민감/붉음증처럼 내 고민을 선택해요",
        placement: "above",
      },
      {
        targetId: "skin-profile-sensitivity",
        title: "민감도 선택",
        description: "낮음·보통·높음 중 피부 자극 민감도를 체크해요",
        placement: "above",
      },
      {
        targetId: "skin-profile-save",
        title: "저장하기",
        description: "필수 항목을 선택하면 저장 버튼이 활성화돼요",
        placement: "above",
      },
    ],
  },
  "routine-register": {
    id: "routine-register",
    steps: [
      {
        targetId: "routine-mode-tabs",
        title: "등록 방식 선택",
        description:
          "직접 루틴 만들기 또는 피부 고민 맞춤 추천 중 하나를 골라요. 지금은 '직접 만들기'를 알려드릴게요.",
        placement: "below",
      },
      {
        targetId: "routine-steps-list",
        title: "루틴 순서 설정",
        description:
          "왼쪽 − 버튼을 눌러 단계를 삭제하거나, 오른쪽 드래그 핸들을 스와이프하여 단계 순서를 변경할 수 있어요.",
        placement: "below",
      },
      {
        targetId: "routine-add-step",
        title: "단계별 제품 추가",
        description: "단계 추가하기 버튼을 눌러 루틴 단계를 추가해보세요.",
        placement: "above",
      },
      {
        targetId: "routine-product-search",
        title: "제품 검색",
        description: "원하는 제품을 검색하여 선택할 수 있어요.",
        placement: "below",
      },
      {
        targetId: "routine-custom-product",
        title: "직접 제품 등록하기",
        description: "원하는 제품이 없다면 직접 제품을 등록할 수 있어요.",
        placement: "above",
      },
      {
        targetId: "routine-complete",
        title: "루틴 설정 완료",
        description: "마지막에 완료 버튼을 눌러 루틴을 저장하세요.",
        placement: "above",
      },
    ],
  },
  "routine-end": {
    id: "routine-end",
    steps: [
      {
        targetId: "end-reason",
        title: "종료 사유 선택",
        description: "왜 루틴을 그만하고 싶은지 알려주시면 서비스 개선에 참고할게요.",
        placement: "below",
      },
      {
        targetId: "end-difficulty",
        title: "꾸준히 하기 어땠는지 평가",
        description: "쉬웠는지, 보통이었는지, 어려웠는지 이모지로 골라주세요.",
        placement: "below",
      },
      {
        targetId: "end-tags",
        title: "어떤 변화가 있었는지 선택",
        description: "느껴진 변화가 있다면 태그로 간단히 남겨주세요.",
        placement: "above",
      },
      {
        targetId: "end-stars",
        title: "체감 변화",
        description: "이번 루틴을 통해 느낀 변화를 별점으로 선택해주세요.",
        placement: "above",
      },
      {
        targetId: "end-finish",
        title: "이번 루틴 마치기",
        description: "선택을 마쳤으면 버튼을 눌러 루틴을 종료해주세요.",
        placement: "above",
      },
    ],
  },
  "routine-end-tags": {
    id: "routine-end-tags",
    steps: [
      {
        targetId: "end-tags-list",
        title: "변화 태그 선택",
        description: "루틴 사용 후 느껴진 변화를 태그로 골라주세요.",
        placement: "below",
      },
      {
        targetId: "end-tags-none",
        title: "큰 변화 없음",
        description: "변화가 딱히 없었다면 이 태그만 단독으로 선택할 수 있어요.",
        placement: "above",
      },
      {
        targetId: "end-tags-done",
        title: "선택 완료",
        description: "태그를 다 골랐으면 버튼을 눌러 저장해주세요.",
        placement: "above",
      },
    ],
  },
  "note-detail": {
    id: "note-detail",
    steps: [
      {
        targetId: "detail-products",
        title: "제품/루틴 보기",
        description: "이만한 제품을 어떤 순서로 썼는지 먼저 확인해요.",
        placement: "below",
      },
      {
        targetId: "detail-progress",
        title: "변화 과정 보기",
        description:
          "7일차, 14일차처럼 변화 과정을 보면 실제 사용 흐름을 이해하기 쉬워요.",
        placement: "below",
      },
      {
        targetId: "detail-save",
        title: "저장하기",
        description:
          "도움이 된 후기는 저장해두면 나중에 스킨서랍장에서 다시 볼 수 있어요.",
        placement: "above",
      },
      {
        targetId: "detail-engage",
        title: "도움돼요 / 댓글",
        description: "공감되면 도움돼요를 누르고, 궁금하면 댓글로 질문할 수 있어요.",
        placement: "above",
      },
      {
        targetId: "detail-comment-input",
        title: "댓글 입력",
        description:
          "하단 입력창에서 직접 질문하거나 경험에 공감하는 댓글을 남겨요.",
        placement: "above",
      },
    ],
  },
  drawer: {
    id: "drawer",
    steps: [
      {
        targetId: "drawer-filters",
        title: "조건 선택",
        description:
          "피부 타입, 피부 고민, 사용기간 등으로 원하는 후기만 좁혀서 볼 수 있어요.",
        placement: "below",
      },
      {
        targetId: "drawer-photo",
        title: "사진 토글",
        description: "사진이 있는 후기만 보고 싶다면 사진 토글을 활용해요.",
        placement: "below",
      },
      {
        targetId: "drawer-card-title",
        title: "후기 카드 제목",
        description:
          "14일 사용 후기처럼 얼마나 사용했는지 먼저 읽어보면 이해가 쉬워요.",
        placement: "below",
      },
      {
        targetId: "drawer-card-info",
        title: "핵심 정보 읽기",
        description:
          "사용 기간, 체감 변화, 태그를 보면 이 후기가 나와 맞는지 빠르게 판단할 수 있어요.",
        placement: "above",
      },
      {
        targetId: "drawer-card-stats",
        title: "반응 수치 보기",
        description:
          "저장, 도움돼요 수를 통해 다른 사람들이 어떻게 반응했는지도 볼 수 있어요.",
        placement: "above",
      },
    ],
  },
  "skin-note-complete": {
    id: "skin-note-complete",
    steps: [
      {
        targetId: "note-save",
        title: "스킨노트 저장하기",
        description: "저장하기를 누르면 스킨노트를 이미지로 갤러리에 저장할 수 있어요.",
        placement: "below",
      },
      {
        targetId: "note-skin",
        title: "피부 타입/고민 요약",
        description: "기록 당시 내 피부 타입과 고민이 자동으로 함께 저장돼요.",
        placement: "below",
      },
      {
        targetId: "note-routine",
        title: "사용 제품 & 사용 기간 / 루틴 순서",
        description: "어떤 제품을 얼마나, 어떤 순서로 사용했는지 한눈에 확인할 수 있어요.",
        placement: "below",
      },
      {
        targetId: "note-progress",
        title: "루틴 난이도 & 변화 과정",
        description: "주차별 사진으로 내 피부가 어떻게 변해왔는지 과정을 볼 수 있어요.",
        placement: "above",
      },
      {
        targetId: "note-result",
        title: "변화 태그 & 체감 변화 & 루틴 종료 사유",
        description:
          "붉은기 완화 같은 태그와 체감 변화 점수로 결과를 간단히 확인할 수 있고, 루틴 종료 사유도 함께 볼 수 있어요.",
        placement: "above",
      },
      {
        targetId: "note-actions",
        title: "나만 보기 / 공유하고 스킨서랍장 구경하기",
        description:
          "나만 보기로 저장할 수도 있고, 공유하면 다른 사람들의 스킨서랍장을 더 많이 구경할 수 있어요.",
        placement: "above",
      },
    ],
  },
  "care-log-change": {
    id: "care-log-change",
    steps: [
      {
        targetId: "change-photos",
        title: "변화 사진",
        description: "사진은 선택이에요. 있으면 올리고, 없어도 넘어갈 수 있어요.",
        placement: "below",
      },
      {
        targetId: "change-feeling",
        title: "변화 여부 선택",
        description: "변화가 있었는지 / 없었는지 중 하나를 골라주세요.",
        placement: "below",
      },
      {
        targetId: "change-tags",
        title: "변화 태그 선택",
        description: "붉은기 완화, 촉촉해졌다 같은 태그로 변화를 간단히 남겨보세요.",
        placement: "auto",
      },
      {
        targetId: "change-multi-hint",
        title: "복수 선택 가능",
        description: "여러 변화가 함께 있었다면 여러 개의 태그를 선택해도 돼요.",
        placement: "below",
      },
      {
        targetId: "change-save",
        title: "기록 저장하기",
        description: "선택을 마쳤으면 버튼을 눌러 이번 주 변화를 저장해주세요.",
        placement: "above",
      },
    ],
  },
  "care-log": {
    id: "care-log",
    steps: [
      {
        targetId: "care-progress",
        title: "루틴 진행 현황",
        description: "루틴 시작일과 얼마나 지났는지 언제든 확인 가능해요.",
        placement: "below",
      },
      {
        targetId: "care-steps",
        title: "오늘 단계 체크",
        description: "오늘 사용한 단계만 하나씩 체크하면 돼요.",
        placement: "above",
      },
      {
        targetId: "care-summary",
        title: "완료/남은 단계 보기",
        description: "전체 단계, 완료 개수, 남은 단계를 한눈에 볼 수 있어요.",
        placement: "below",
      },
      {
        targetId: "care-today-done",
        title: "오늘 했어요",
        description: "오늘 루틴을 마쳤다면 이 버튼을 눌러 기록을 완료해주세요.",
        placement: "above",
      },
      {
        targetId: "care-weekly",
        title: "변화 과정 기록 상태",
        description: "이번 주 변화 기록을 이미 했는지 여기서 같이 확인해요.",
        placement: "above",
      },
      {
        targetId: "care-end",
        title: "루틴 종료",
        description: "루틴을 종료하고 싶으시면 상단 버튼을 눌러주세요.",
        placement: "below",
      },
    ],
  },
  "routine-register-recommend": {
    id: "routine-register-recommend",
    steps: [
      {
        targetId: "routine-mode-tabs",
        title: "등록 방식 선택",
        description:
          "직접 만들기 또는 피부 고민 맞춤 추천 중 하나를 고를 수 있어요. 지금은 '맞춤 추천'을 알려드릴게요.",
        placement: "below",
      },
      {
        targetId: "routine-rec-basis",
        title: "이렇게 추천했어요",
        description:
          "내가 등록한 피부 타입, 고민, 민감도를 바탕으로 루틴을 추천해드려요.",
        placement: "below",
      },
      {
        targetId: "routine-rec-preview",
        title: "추천 루틴 미리보기",
        description:
          "추천된 제품 구성을 먼저 확인해보세요. 옆으로 넘기면 다른 제품도 볼 수 있어요.",
        placement: "above",
      },
      {
        targetId: "routine-rec-actions",
        title: "추천 루틴 적용 / 다른 루틴 추천받기",
        description:
          "마음에 들면 바로 적용하고, 다른 조합이 궁금하면 다시 추천받을 수 있어요.",
        placement: "above",
      },
      {
        targetId: "routine-rec-complete",
        title: "루틴 설정 완료",
        description:
          "추천 루틴을 적용하면 이 버튼이 활성화돼요. 눌러서 루틴을 저장해주세요.",
        placement: "above",
      },
    ],
  },
};

export function getFeatureHelpTour(tourId: string) {
  return FEATURE_HELP_TOURS[tourId] ?? null;
}

export function hasFeatureHelpTour(tourId: string) {
  return Boolean(FEATURE_HELP_TOURS[tourId]?.steps.length);
}
