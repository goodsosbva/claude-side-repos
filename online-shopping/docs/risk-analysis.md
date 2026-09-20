# 기술 리스크 분석

목표 아키텍처 기준(현재 레포는 아직 단일 NestJS 모놀리식 + docker-compose):

- 마이크로서비스 아키텍처
- 예상 동시 접속자 1만
- 데이터베이스: PostgreSQL (단일 인스턴스)
- 캐시: Redis
- 배포: 쿠버네티스

| # | 리스크 | 원인 | 영향 | 대응 방안 |
|---|---|---|---|---|
| 1 | PostgreSQL 단일 인스턴스 = SPOF | Failover/복제 구성 없음 | DB 장애 시 전 서비스 동시 중단 | Read Replica + 자동 failover(Patroni/RDS Multi-AZ), 최소 1개 이상 대기 인스턴스 |
| 2 | DB 커넥션 고갈 | MSA 각 서비스 + K8s HPA로 pod 수 급증 시, 서비스별 개별 커넥션이 PG 단일 인스턴스의 `max_connections` 초과 | 1만 동접 시 DB 접속 실패로 전체 다운 | PgBouncer 등 커넥션 풀러 앞단 배치, 서비스별 pool 상한 설정, HPA 최대 replica 수 제한 |
| 3 | 분산 트랜잭션 정합성 깨짐 | 주문→재고→결제 등이 여러 서비스에 걸쳐 있는데 단일 DB 트랜잭션으로 못 묶음 | 결제는 됐는데 재고 반영 실패 등 데이터 불일치 | Saga 패턴 + Outbox 패턴, 멱등키(idempotency key)로 재시도 안전화 |
| 4 | 장애 전파(cascading failure) | 서비스간 동기 호출 체인에서 한 서비스 지연 시 전체 지연/타임아웃 | 특정 서비스 하나 느려지면 연쇄 장애 | Circuit Breaker + Timeout/Retry(resilience4j, Istio), Bulkhead로 격리 |
| 5 | Redis 캐시 스탬피드/SPOF | 캐시 단일 인스턴스, TTL 동시 만료 시 대량 요청이 DB로 몰림 | DB 순간 과부하 → 전체 지연 | Redis Sentinel/Cluster로 HA, TTL에 jitter 부여, 캐시 미스 시 락/coalescing |
| 6 | 관측성 부재 | MSA는 요청 하나가 여러 서비스를 거쳐 장애 지점 특정이 어려움 | MTTR(복구시간) 증가 | 분산 트레이싱(OpenTelemetry), 중앙 로그(Loki/ELK), Prometheus+Grafana 대시보드 |
| 7 | 서비스간 계약(API) 깨짐 | 독립 배포 중 한 서비스가 API 스펙을 바꾸면 다른 서비스가 깨짐 | 배포할 때마다 장애 리스크 | API 버저닝, Contract Testing(Pact), Canary/Blue-Green 배포 |
| 8 | 세션 상태의 로컬 보관 | Pod가 오토스케일/재시작되면 로컬 세션 유실 | 로그인 풀림, 장바구니 등 유실 | 세션을 Redis에 외부화(stateless pod) |
| 9 | 실측 용량 미검증 | "1만 동접"이 추정치일 뿐 실제 PG 단일 인스턴스가 버티는지 미확인 | 런칭 당일 예상 밖 다운 | 사전 부하테스트(k6/JMeter)로 실제 처리량 확인 후 스펙/replica 수 결정 |
| 10 | 시크릿 노출 | DB/Redis 크리덴셜이 K8s manifest에 평문/미흡 관리 | 크리덴셜 유출 | K8s Secret + Vault/Sealed Secrets, RBAC 최소권한 |

## 우선순위

1·2·9(DB가 실제 병목이 될 가능성이 가장 큼)부터 먼저 검증 권장. 3·4·6은 MSA 전환 초기부터 구조에 넣어야 나중에 리팩터링 비용이 안 커짐.
