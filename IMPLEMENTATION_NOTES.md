# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## 1. What I changed
<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

-

## 2. Component & state model
When you open the list screen, it pulls up your organization's Change Request summaries while clearly showing whether the data is loading, ready, empty, or experiencing an error. To keep things fast, the status filter doesn't request new data from the server; it simply sorts through the summaries you've already loaded. Clicking a specific row sends its ID to the detail screen, which then fetches the complete file to display line-item differences, totals, a chronological timeline, and available actions. Finally, the page's overall loading state is kept separate from the action buttons, ensuring that if an approval or rejection is slow to process, you can still view the request details without accidentally submitting your decision twice.
-

## 3. Invariants I keep
<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
|---|---|

## 4. Testing strategy
<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

-

## 5. Assumptions
<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI
-

## 7. What I'd improve with more time
-
