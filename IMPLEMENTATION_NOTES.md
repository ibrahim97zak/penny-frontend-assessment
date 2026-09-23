# Implementation Notes

## 1. What I changed

- Fixed the diff calculation so line items with the same SKU but changed quantity, price, or description are classified as `changed` rather than `unchanged`.
- Completed the Change Request status filter by deriving visible rows from the loaded API summaries. The template shows a distinct message and hides the table when no rows match the selected status.
- Completed the detail screen:
  - Renders the baseline/proposed diff, including added, removed, changed, and unchanged rows.
  - Reloads the detail when a different Change Request is selected from the list.
  - Displays formatted baseline total, proposed total, and delta.
  - Sorts the audit timeline chronologically without mutating the API response.
  - Shows Approve and Reject only for pending requests and users with an approval policy.
  - Calls the mock API for approval and rejection, preserves the loaded detail on action failure, and prevents duplicate actions while submitting.
  - Requires a non-empty, non-whitespace rejection reason.
- Added explicit loading, empty, and error/retry states to the list and detail templates.

## 2. Component & state model

When you open the list screen, it loads organization-scoped Change Request summaries from the mock API while clearly showing whether the data is loading, ready, empty, or experiencing an error. The status filter does not request new data; it filters the summaries already held in component state, and the template renders the resulting rows. Clicking a row passes its ID to the detail component, which loads the full Change Request from the mock API and stores it in component state so the template can display the line-item differences, totals, chronological timeline, and available actions. The detail loading state is kept separate from action state so a slow or failed approval or rejection can leave the request visible while preventing duplicate decisions.

For the detail component, `state` represents the load lifecycle (`idle`, `loading`, `loaded`, or `error`) and contains the current `CrDetail` when available. Derived getters calculate the diff, sorted timeline, formatted values, and whether the current user may review the request. `submitting` is independent from the load state, so action controls can be disabled during a slow request without replacing the detail view. `actionError` reports an approval or rejection failure while leaving the request and retryable controls visible.

## 3. Invariants I keep

| Invariant | How / where |
| --- | --- |
| Changing the status filter does not mutate the API-loaded summaries. | `CrListComponent.visibleRows` derives a rendered array from `state.data` and `statusFilter`. |
| An organization with no Change Requests is different from a selected status with no matches. | The template shows `cr-list__empty` only for API-empty state, and `cr-list__filter-empty` only when loaded data produces zero visible rows. |
| Review actions are available only for pending requests and permitted users. | `CrDetailComponent.canApprove` checks both `PENDING_APPROVAL` and `canApprovePolicy`; Reject uses the same gate. |
| A review action cannot be submitted twice concurrently. | `approve` and `reject` return while `submitting` is true, and the template disables the controls during submission. |
| A rejection must contain meaningful text. | `rejectControl` uses required and non-whitespace validation, and `reject` marks invalid input as touched without calling the API. |
| Timeline rendering does not reorder stored audit data. | `timeline` sorts a copied array oldest first. |

## 4. Testing strategy

- Added TestBed DOM tests for filtering, filter-empty feedback, row selection, loading, and error recovery. The error test uses the supplied mock API's `failNext` control and verifies that clicking Retry restores the list.
- Added detail TestBed DOM tests for loading and retry states, changing the selected request, read-only permission gating, terminal-status action hiding, chronological timeline rendering, diff and totals rendering, rejection validation, approve/reject success flows, approve/reject failures, description changes, and duplicate-click prevention during slow approve and reject requests.
- The focused detail suite passes 18 tests, and the complete project suite passes 29 tests. TypeScript checking and ESLint also pass.

## 5. Assumptions

- Approve and Reject are both governed by the available approval policy because the provided workflow treats them as decisions on a pending request.
- A rejection containing only whitespace is treated as invalid, since it does not communicate a useful reason.
- The mock API is treated as the source of truth after a successful action; the returned detail replaces the current loaded state and includes the new audit entry.

## 6. Where I used AI

- AI was used to help inspect the existing Angular structure, identify the relevant state and permission paths, draft focused DOM tests, and review edge cases. The implementation and test behavior were checked against the repository code and verified with the project test, typecheck, and lint commands.

## 7. What I'd improve with more time

- I would make the two-panel layout easier to scan, with a highlighted selected row and clearer status labels.
- I would show Before, After, and Difference separately at the top and add the amount and difference for each line item.
- I would move the rejection reason into a small dialog with Cancel and Reject buttons, while keeping the current validation and error handling.
- I would add a test that clicks a request in the list and checks that the matching detail opens, including after switching users.
- If I built the rejection dialog, I would test cancelling it, invalid reasons, slow submissions, and API errors. I would also test inaccessible or stale requests.
