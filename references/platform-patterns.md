# Platform Patterns

Use native controls first. Framework defaults usually provide better role,
state, action, focus, and event support than a custom imitation.

## Web, React, and Electron

Prefer intrinsic elements:

```tsx
<button type="button" aria-pressed={active} onClick={toggle}>
  Pin
</button>
```

Prefer the corresponding native HTML capability; use permitted ARIA to supply
semantics it lacks, such as `aria-pressed` on the native button above:

```tsx
<nav aria-label="Settings sections">
  <a href="/settings/general" aria-current={section === 'general' ? 'page' : undefined}>
    General
  </a>
</nav>
```

Rules:

- Prefer one primary `main` per document/application scope. Embedded documents
  and nested application roots can each have their own main. Review multiple
  mains in context and give them distinct labels where appropriate.
- Scope follows the actual document or exposed ARIA `document`/`application`
  role, not a React component named App/Root. Do not add `role="application"`
  merely to evade landmark checks; it changes assistive-technology behavior.
- Use `section`, `aside`, or `div role="region"` with a name for nested pages.
- Use native `dialog` or a proven dialog primitive.
- Use actual `button`/`a` elements, not click handlers on generic containers.
- Expose `aria-selected`, `aria-current`, `aria-expanded`, `aria-pressed`,
  `aria-checked`, `aria-busy`, `aria-invalid`, and value attributes from the
  same state that renders the UI.
- Use `inert` for page subtrees that genuinely lose interaction eligibility
  under a modal or replacement surface, not every visually covered area.
  Prefer native modal behavior where available.
- Test the Chromium accessibility tree, not only DOM attributes.
- In Electron, inspect each relevant WebContentsView, iframe, popup, and native
  dialog separately. Renderer CDP coverage does not prove native AX bridge
  coverage or OS-level focus routing.

Read [web-ax-dom.md](web-ax-dom.md) for computed-name diagnostics, form/ARIA
behavior, hydration, portals, frame/shadow boundaries and executable probes.

Official references:

- https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html
- https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html
- https://www.w3.org/WAI/ARIA/apg/patterns/
- https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html

## macOS AppKit and SwiftUI

AppKit standard controls expose accessibility by default. Prefer them before
implementing a custom `NSView`.

For custom views:

- implement the appropriate NSAccessibility protocol/role;
- expose label, value, enabled state, focus, children, parent, actions, and
  frame;
- post accessibility notifications when focus, value, selection, children, or
  layout meaningfully changes;
- use `NSAccessibilityElement` for virtual semantic children;
- test sheets, popovers, panels, and secondary windows with Accessibility
  Inspector and VoiceOver.

SwiftUI:

- use semantic controls (`Button`, `Toggle`, `Slider`, `TextField`);
- apply accessibility label/value/hint/identifier and custom actions only when
  needed;
- combine or contain children deliberately;
- do not combine an entire actionable row into a single element if that hides
  independent buttons; use a containing relationship or exposed custom actions;
- verify the resulting macOS AX tree because visual composition does not prove
  semantic ownership.
- For a custom SwiftUI control, consider `accessibilityRepresentation` using a
  standard semantic control bound to the same authoritative value. Its
  nonvisual representation is legitimate accessibility, not an independent
  hidden agent UI. Verify its action changes the real rendered/domain state.
  If persistence currently occurs only on gesture end, connect semantic
  adjustment to the same required commit lifecycle. Verify stored state after
  commit independently of the current UI and its in-memory cache.

Official references:

- https://developer.apple.com/documentation/accessibility
- https://developer.apple.com/documentation/appkit/accessibility-for-appkit
- https://developer.apple.com/documentation/Accessibility/integrating-accessibility-into-your-app
- https://developer.apple.com/documentation/swiftui/view/accessibilityrepresentation(representation:)

## Windows UI Automation

Prefer controls that already implement the correct UIA control type and
patterns.

For custom controls, expose a UI Automation provider with:

- control type and localized control type;
- Name, AutomationId, IsEnabled, IsKeyboardFocusable, HasKeyboardFocus;
- BoundingRectangle and off-screen state;
- the correct control patterns, such as Invoke, Toggle, Selection,
  SelectionItem, Value, RangeValue, ExpandCollapse, Scroll, Text, or Window;
- property- and structure-changed events when state changes.

Keep AutomationId stable for the same business object, but do not reuse it for a
different virtualized row.

Validate with Accessibility Insights for Windows, Inspect, Narrator, and a UIA
client test.

Official references:

- https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32
- https://learn.microsoft.com/en-us/windows/win32/winauto/uiauto-providersoverview
- https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/accessibility-best-practices

## Qt Widgets and Qt Quick/QML

Use standard Qt controls where possible.

For QWidget custom controls:

- implement or extend `QAccessibleInterface`/`QAccessibleWidget`;
- expose role, text/name, state, value, child hierarchy, rect, focus, and
  actions;
- emit `QAccessibleEvent` updates for focus, value, selection, state, and
  children changes.

For Qt Quick:

- prefer Qt Quick Controls;
- set `Accessible.role`, `Accessible.name`, descriptions, state, and actions on
  custom `Item`/`MouseArea` surfaces;
- provide keyboard focus and activation;
- verify the platform bridge output, not only QML properties.

Official references:

- https://doc.qt.io/qt-6/accessible.html
- https://doc.qt.io/qt-6/accessible-qwidget.html
- https://doc.qt.io/qt-6/accessible-qtquick.html

## GTK and Linux

Prefer standard GTK widgets and semantic actions. For custom widgets, implement
the toolkit's accessibility interfaces and expose role, name, state, value,
relations, actions, focus, and bounds through the platform accessibility bus.

Validate with Orca and an AT-SPI tree inspector. Run under the actual display
server and packaging environment used by the product.

## Canvas, WebGL, games, and owner-drawn controls

Do not make pixels the only model.

Choose one:

- native semantic controls layered over the visual surface;
- a synchronized virtual accessibility tree;
- native menus, accessibility actions, or another existing in-app command
  surface for actions with no meaningful visual target.

The virtual model must share the same authoritative state as rendering. Do not
maintain an unrelated shadow state only for automation.
Use the same permission and business-action paths; this option does not
authorize creating a private API, external server, or hidden agent-only UI.
