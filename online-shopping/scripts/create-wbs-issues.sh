#!/usr/bin/env bash
# WBS 표 -> GitHub Issues 일괄 생성
# 사용법: gh auth login 이후  bash scripts/create-wbs-issues.sh
set -euo pipefail

REPO="${REPO:-goodsosbva/online-shop-claude}"

# id|작업명|예상시간|담당|선행작업(id, 공백구분, 없으면 -)
TASKS="
T01|DB ORM 연동 + 상품 API 실DB 전환|5일|개발자A|-
T02|회원 테이블 설계 + 가입/로그인 API(JWT)|5일|개발자B|-
T03|상품 목록/상세 화면|5일|개발자A|T01
T04|로그인/가입 화면 + 인증상태 전역관리|5일|개발자B|T02
T05|장바구니 API + 화면|5일|개발자A|T03
T06|마이페이지 골격|3일|개발자B|T04
T07|주문 생성 API(재고 차감 트랜잭션)|5일|개발자A|T05
T08|주문서 작성 화면|5일|개발자B|T05 T06
T09|PG 연동 조사 + 결제요청 API 흐름|5일|공동|T07 T08
T10|결제 콜백 처리 + 주문상태 반영|5일|공동|T09
T11|마이페이지 주문내역 조회|3일|개발자B|T10
T12|관리자 상품 등록/수정/재고관리 화면|5일|개발자A|T01
T13|관리자 주문 목록/상태변경 화면|5일|개발자A|T10 T12
T14|예외/에러 처리 정비(재고부족, 결제실패 등)|3일|개발자B|T10
T15|핵심 플로우 E2E 테스트|4일|공동|T13 T14
T16|반응형/크로스브라우저 점검|3일|개발자B|T15
T17|보안/성능 점검|3일|공동|T15
T18|QA 버그픽스|4일|공동|T15 T16 T17
T19|배포 환경/Docker/CI 설정|3일|개발자A|T18
T20|모니터링/로깅 셋업|2일|개발자B|T18
T21|프로덕션 배포 + 최종 점검|2일|공동|T19 T20
T22|런칭 후 핫픽스 버퍼|3일|공동|T21
"

# 담당 라벨 없으면 생성 (이미 있으면 무시)
for label in "assignee:개발자A" "assignee:개발자B" "assignee:공동"; do
  gh label create "$label" -R "$REPO" --color "ededed" 2>/dev/null || true
done

declare -A ISSUE_NUM   # WBS id -> 생성된 issue 번호

while IFS='|' read -r id title hours owner deps; do
  [ -z "$id" ] && continue

  # 선행 작업 id를 실제 issue 번호(#N)로 치환
  dep_line="-"
  if [ "$deps" != "-" ]; then
    dep_line=""
    for dep in $deps; do
      dep_line+="#${ISSUE_NUM[$dep]} ($dep)  "
    done
  fi

  body=$(printf '예상시간: %s\n담당: %s\n선행 작업: %s\n상태: 예정' "$hours" "$owner" "$dep_line")

  url=$(gh issue create -R "$REPO" \
    --title "[$id] $title" \
    --body "$body" \
    --label "assignee:$owner")

  num="${url##*/}"
  ISSUE_NUM[$id]="$num"
  echo "$id -> #$num"
done <<< "$TASKS"
