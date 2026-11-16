# Delta: apps/mobile

> **Change:** `2026-11-15-i18n`

## ADDED Requirements

### Requirement: MOBILE-46 — The busy and retry labels come from the catalogs

The mobile app SHALL label the busy indicator of `Button`, the `LoadingSkeleton` and the async
boundary's loading region with the `common.loading` message, and SHALL show, in the async
boundary's error fallback, the `helper.error.generic` message for a thrown value that is not an
error and a retry control labelled with the `common.retry` message, every message in the active
language.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a busy button

- **GIVEN** a button whose action is running, under the Spanish language
- **WHEN** it renders
- **THEN** its busy indicator is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/Button/__tests__/Button.component.test.tsx` › "labels its busy indicator in the active language"

#### Scenario: a skeleton

- **GIVEN** a loading skeleton, under the Spanish language
- **WHEN** it renders
- **THEN** it is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/LoadingSkeleton/__tests__/LoadingSkeleton.component.test.tsx` › "labels the skeleton in the active language"

#### Scenario: the loading fallback

- **GIVEN** the async boundary's default loading fallback, under the Spanish language
- **WHEN** it renders
- **THEN** it is named with the Spanish loading message
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultLoading.component.test.tsx` › "labels the loading region in the active language"

#### Scenario: the error fallback

- **GIVEN** the async boundary's default error fallback for a thrown value that is not an error, under the Spanish language
- **WHEN** it renders and its retry control is pressed
- **THEN** the Spanish generic message and retry label are shown, and the boundary is reset once
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the generic message and the retry label in the active language"

#### Scenario: an error is thrown

- **GIVEN** the async boundary's default error fallback for a thrown error
- **WHEN** it renders
- **THEN** the error's own message is shown
- **Test:** `apps/mobile/src/components/ui/AsyncBoundary/__tests__/AsyncBoundaryDefaultError.component.test.tsx` › "shows the message of a thrown error"

## MODIFIED Requirements

### Requirement: MOBILE-14 — The item card shows the age and the status in the active language

The mobile app SHALL describe each item's age as a unit and a count, just now under one minute,
then whole minutes, hours or days, and the item card SHALL show that age as the `items.age`
message of its unit and the item's status as the `items.status` message of that status, in the
active language.

**Evidence:** written at apply time, when the code exists.

#### Scenario: the age of an item

- **GIVEN** items created under a minute, forty minutes, five hours and three days ago
- **WHEN** they are adapted
- **THEN** their ages are just now with a count of zero, 40 minutes, 5 hours and 3 days, each as a unit and a count
- **Test:** `apps/mobile/src/services/Items/__tests__/Items.adapter.test.ts` › "describes the age as a unit and a count"

#### Scenario: an item created three hours ago

- **GIVEN** an active item three hours old, under the English or the Spanish language
- **WHEN** its card renders
- **THEN** its age and status read that language's `items.age.hours` message for three and `items.status.active` message
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemCard/__tests__/ItemCard.component.test.tsx` › "shows the status and the age in the active language"

### Requirement: MOBILE-18 — Results list and count

The mobile app SHALL render one item card per loaded item, in order, each with the author
initials, title, description, category, author label, age and status label (MOBILE-14), under a
caption holding the items.dashboard.listResults message for the item count, which states the count
once.

**Evidence:** written at apply time, when the code exists.

#### Scenario: items have loaded

- **GIVEN** the items query resolved five items
- **WHEN** the list card renders
- **THEN** five item cards show in order, under the count caption
- **Test:** Not covered — "renders without returning null with items" mocks the item card away and asserts only a non-null return

#### Scenario: the count caption

- **GIVEN** two loaded items
- **WHEN** the list card renders
- **THEN** the caption is the listResults message for two, with the count written once
- **Test:** `apps/mobile/src/screens/ItemsDashboard/components/ItemsListCard/__tests__/ItemsListCard.component.test.tsx` › "shows the result count once"

### Requirement: MOBILE-36 — The root layout shows the toast viewport

The mobile app SHALL mount the toast viewport in the root layout, over every route, rendering each
toast of the toast store as an alert with its message and a dismiss control, labelled with the
`common.dismiss` message of the active language, that removes it.

**Evidence:** written at apply time, when the code exists.

#### Scenario: a toast is added while a route is shown

- **GIVEN** the root layout rendered with its fonts loaded
- **WHEN** an error toast is added to the toast store
- **THEN** its message is shown
- **Test:** `apps/mobile/src/app/__tests__/layout.route.test.tsx` › "shows a toast added to the store over the routes"

#### Scenario: the toast is dismissed

- **GIVEN** one toast in the viewport
- **WHEN** its dismiss control is pressed
- **THEN** the toast is shown in an alert, and after the press it is gone
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "removes a toast when its dismiss control is pressed"

#### Scenario: the dismiss label in another language

- **GIVEN** one toast in the viewport, under the Spanish language
- **WHEN** it renders
- **THEN** its dismiss control is named with the Spanish dismiss message
- **Test:** `apps/mobile/src/components/ui/Toast/__tests__/Toast.component.test.tsx` › "labels the dismiss control in the active language"
