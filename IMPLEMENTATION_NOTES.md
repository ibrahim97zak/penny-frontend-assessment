# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## 1. What I changed

<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

- Completed the Change Request status filter by deriving visible rows from the loaded API summaries. Added a distinct message when data is loaded but no rows match the selected status, and hides the table in that case.

## 2. Component & state model

When you open the list screen, it loads organization-scoped Change Request summaries from the mock API while clearly showing whether the data is loading, ready, empty, or experiencing an error. The status filter does not request new data; it filters the summaries already held in component state, and the template renders the resulting rows. Clicking a row passes its ID to the detail component, which loads the full Change Request from the mock API and stores it in component state so the template can display the line-item differences, totals, chronological timeline, and available actions. The detail loading state is kept separate from action state so a slow or failed approval or rejection can leave the request visible while preventing duplicate decisions.

## 3. Invariants I keep

<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
| --- | --- |
| Changing the status filter does not mutate the API-loaded summaries. | `CrListComponent.visibleRows` derives a rendered array from `state.data` and `statusFilter`. |
| An organization with no Change Requests is different from a selected status with no matches. | The template shows `cr-list__empty` only for API-empty state, and `cr-list__filter-empty` only when loaded data produces zero visible rows. |

## 4. Testing strategy

<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

- Added TestBed DOM tests for filtering, filter-empty feedback, row selection, loading, and error recovery. The error test uses the supplied mock API's `failNext` control and verifies that clicking Retry restores the list.

## 5. Assumptions

<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI

-

## 7. What I'd improve with more time

-
