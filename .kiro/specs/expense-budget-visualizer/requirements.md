# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, client-side web application built with HTML, CSS, and Vanilla JavaScript. It allows users to track personal expenses, categorize spending, and visualize distribution via an interactive pie chart. All data persists in the browser's Local Storage. The app ships as three files: `index.html`, `css/style.css`, and `js/app.js`, deployable via GitHub Pages with zero build tooling.

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense record consisting of an item name, a numeric amount, and a category.
- **Transaction_List**: The scrollable UI list that displays all recorded Transactions.
- **Balance_Display**: The numeric total at the top of the page reflecting the sum of all Transaction amounts.
- **Input_Form**: The HTML form containing the Item Name, Amount, and Category fields.
- **Category_Dropdown**: The `<select>` element listing available categories within the Input_Form.
- **Chart**: The Chart.js pie chart visualizing spending distribution by category.
- **Storage**: The browser's Local Storage API used to persist Transactions between sessions.
- **Theme_Toggle**: The button that switches the App between dark and light visual themes.
- **Sort_Control**: The UI control that reorders the Transaction_List by Amount or Category.

---

## Requirements

### Requirement 1: Balance Display

**User Story:** As a user, I want to see my total spending at a glance, so that I always know how much I have spent.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts formatted to two decimal places.
2. WHEN a Transaction is added, THE Balance_Display SHALL update its value without a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update its value without a page reload.
4. WHEN no Transactions exist, THE Balance_Display SHALL display a value of 0.00.

---

### Requirement 2: Transaction Input Form

**User Story:** As a user, I want to add expense entries through a form, so that I can record what I spent and on what.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field for Item Name, a number field for Amount, and a Category_Dropdown.
2. THE Category_Dropdown SHALL include the default options: Food, Transport, and Fun.
3. WHEN the user submits the Input_Form with all fields filled and Amount greater than zero, THE App SHALL add a new Transaction to Storage and render it in the Transaction_List.
4. IF the user submits the Input_Form with any field empty or Amount equal to or less than zero, THEN THE Input_Form SHALL display a validation error message and SHALL NOT add a Transaction.
5. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty/placeholder state.

---

### Requirement 3: Transaction List

**User Story:** As a user, I want to see all my recorded expenses in a list, so that I can review and manage them.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each Transaction's item name, amount, and category.
2. THE Transaction_List SHALL be scrollable when the number of Transactions exceeds the visible viewport area.
3. WHEN a Transaction is added, THE Transaction_List SHALL render the new Transaction immediately.
4. EACH Transaction item in the Transaction_List SHALL include a Delete button.
5. WHEN the user clicks a Transaction's Delete button, THE App SHALL remove that Transaction from Storage and remove it from the Transaction_List without a page reload.

---

### Requirement 4: Pie Chart Visualization

**User Story:** As a user, I want to see a visual breakdown of my spending by category, so that I can understand where my money goes.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart using Chart.js loaded from a CDN.
2. THE Chart SHALL display one segment per category that has at least one Transaction, sized proportionally to that category's total amount.
3. WHEN a Transaction is added, THE Chart SHALL update its segments dynamically without a page reload.
4. WHEN a Transaction is deleted, THE Chart SHALL update its segments dynamically without a page reload.
5. WHEN no Transactions exist, THE Chart SHALL render in an empty or placeholder state without throwing an error.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my expense data to survive page refreshes, so that I do not lose my records when I close or reload the browser tab.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL write the updated Transaction array to Storage.
2. WHEN a Transaction is deleted, THE App SHALL write the updated Transaction array to Storage.
3. WHEN the App initializes, THE App SHALL read all Transactions from Storage and render them in the Transaction_List and Chart.
4. IF Storage contains no data on initialization, THEN THE App SHALL initialize with an empty Transaction array.

---

### Requirement 6: Dark / Light Mode Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL render in light mode by default.
2. THE Theme_Toggle SHALL be a visible button accessible from the main interface.
3. WHEN the user clicks the Theme_Toggle, THE App SHALL switch to the opposite theme.
4. WHEN the user clicks the Theme_Toggle again, THE App SHALL switch back to the previous theme.
5. WHEN the App initializes, THE App SHALL restore the last saved theme preference from Storage.

---

### Requirement 7: Sort Transactions

**User Story:** As a user, I want to sort my transaction list, so that I can quickly find the largest expenses or group entries by category.

#### Acceptance Criteria

1. THE Sort_Control SHALL offer sorting by Amount (ascending and descending) and by Category (A–Z).
2. WHEN the user selects a sort option, THE Transaction_List SHALL reorder immediately to reflect the chosen sort criterion.
3. THE Sort_Control SHALL NOT modify the underlying Transaction data in Storage; it SHALL only affect the rendered order.

---

### Requirement 8: Custom Categories

**User Story:** As a user, I want to add my own categories, so that I can organize expenses beyond the default options.

#### Acceptance Criteria

1. THE App SHALL provide an input field and a button that allow the user to add a custom category name.
2. WHEN the user submits a non-empty custom category name, THE Category_Dropdown SHALL add the new category as a selectable option.
3. IF the user submits an empty or whitespace-only custom category name, THEN THE App SHALL display a validation error and SHALL NOT add the category.
4. WHEN a custom category is added, THE App SHALL persist the custom category list to Storage so it survives a page reload.
5. WHEN the App initializes, THE App SHALL restore all previously saved custom categories into the Category_Dropdown.

---

### Requirement 9: Non-Functional — Responsiveness and Performance

**User Story:** As a user, I want the app to work well on both mobile and desktop screens, so that I can use it on any device.

#### Acceptance Criteria

1. THE App SHALL render without horizontal scrolling on viewports as narrow as 320px.
2. THE App SHALL load and become interactive within 3 seconds on a standard broadband connection.
3. WHEN the user interacts with the Input_Form, Transaction_List, or Sort_Control, THE App SHALL reflect changes within 100ms.
