# Security Specification - Multi-Tenant Bike Shop System

## Data Invariants
- All documents (except user profiles) MUST have a `tenantId`.
- A user's `tenantId` is immutable and defined in their `users/{userId}` profile.
- Users can only read/write documents where `doc.tenantId == user.tenantId`.
- Specific modules require specific boolean flags in `user.permissions`.

## The "Dirty Dozen" Payloads (Deny Cases)
1. **Tenant Escape:** Attempt to read a `customer` document belonging to another `tenantId`.
2. **Permission Bypass (Finance):** Attempt to create a `financialEntry` when `permissions.financeiro` is `false`.
3. **Identity Spoofing:** Create a `sale` with someone else's `userId`.
4. **Tenant Injection:** Create a document with a `tenantId` that doesn't match the user's actual `tenantId`.
5. **Role Escalation:** A non-admin user trying to update their own `role` or `permissions`.
6. **Immutable Field Attack:** Attempting to change the `tenantId` of an existing `product`.
7. **Cross-Tenant Query:** Listing `products` without a `where('tenantId', '==', ...)` clause (Rules should block the scan).
8. **Orphaned Write:** Creating a `productMovement` for a `productId` that doesn't exist in the tenant.
9. **Status Short-circuiting:** Force-updating a `serviceOrder` status to 'delivered' without valid permissions.
10. **PII Leak:** Reading an admin's PII from the `users` collection as a standard employee.
11. **Cost Exhaustion:** Writing a 1MB string into an ID field.
12. **Recursive Auth Attack:** Trying to use custom claims (which aren't used in this system) to gain admin access.

## Permission Map
| Collection | Required Permission |
|------------|---------------------|
| customers, bikes | `clientes` |
| sales, budgets | `vendas` |
| products, productMovements | `produtos` |
| financialEntries, bankAccounts, cashSessions, cashMovements | `financeiro` |
| serviceOrders | `ordemServico` |
| leads | `crm` |
| appointments | `agenda` |
| commissions | `comissoes` |
| fiscalConfig, fiscalNotes | `fiscal` |
| settings | `configuracoes` |
