# 08_MULTI_TENANT_FORENSIC.md
# MULTI-TENANCY & TENANT ISOLATION FORENSIC REPORT

---

### 1. Архитектурен модел на Tenancy (`bkgalabovo` vs `recoveryzone`)

1. **State Level (Zustand)**:
   - `useAppStore` съдържа `activeBranch: string` (по подразбиране `"bkgalabovo"`).
   - `GlobalHeader.tsx` позволява бързо превключване между `bkgalabovo` и `recoveryzone`.

2. **Query Level (Firestore Converters & Services)**:
   - `createSiteQuery(collectionRef)` автоматично закача `.where("siteId", "==", getSiteId())`.
   - Всички основни услуги (`member-service`, `schedule-service`, `sales-service`, `planner-service`, `quiz-service`) подават `activeBranch` като филтър.

3. **Data Isolation Integrity**:
   - **Cross-tenant Data Leakage**: Не е открито изтичане на данни от единия клон към другия в UI слоевете. Всеки списък се филтрира по активния клон.
   - **Правила в Firestore**: Изискват `hasValidSiteId()` (`siteId in ['bkgalabovo', 'recoveryzone']`).

4. **Открит Проблем (F-02)**:
   - `firestore.rules` съдържа функция `hasAccessToSite(siteId)`, която очаква Custom Claim `request.auth.token.allowedSites`. При стандартни потребители без този claim заявките биха били блокирани от Firestore.
