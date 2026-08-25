# Decisions

## Brief

**The problem**

I built a web app for version control of database schemas. The user can create branches, change tables and columns, compare two branches, and merge schema changes back.

This is meant for engineers who want to review schema changes before they apply them to a real database.

**The hard part**

The hard part is not showing tables on the screen. The hard part is understanding what changed.

If I use a normal text diff, a column rename can look like one column was deleted and another column was added. That is technically true at text level.

So I tried to show changes in a more useful way, like:

- column renamed
- column type changed
- column added
- table added
- breaking change
- merge conflict

**The slice**

The main flow I built is:

1. Select a branch.
2. Edit the schema.
3. Compare it with another branch.
4. Review the changes.
5. Merge if it is safe.
6. If there is a conflict, choose which version to keep.

The edge case I handled is when both branches edit the same column differently. In that case, the app asks the user to choose between the two versions.

**Why I picked this problem**

I picked the database schema version control problem because it had a real hard part. It was not just CRUD.

It gave me space to show frontend architecture, product thinking, and UX decisions. I also liked that the UI has to explain a technical concept in a simple way.

I also made one practical decision here. My strongest experience is on the frontend side. I have worked much less on backend-heavy systems, so I did not want to spend most of the assignment choosing backend tools, setting up databases, or building APIs. I wanted the project to show the area where I can add the most value: frontend architecture, state management, product flow, and user experience.

Because of that, I built this as a frontend-first prototype with the schema logic running in the browser.

## Decision 1: Store schema as structured data

**The decision**

I stored the schema as structured data. There are objects for schema, tables, columns, indexes, branches, diffs, and merge conflicts.

**The alternatives**

I thought about storing SQL text and comparing strings.

**The reasoning**

String diff is simple to build, but it gives noisy results. A schema is not just text. It has meaning.

With structured data, I can show better changes, like “column renamed” instead of “one column removed and one column added”.

**What I cut**

I did not build a full SQL parser. That would take too much time for this assignment and would move focus away from the main product flow.

## Decision 2: Keep business logic outside UI components

**The decision**

I used custom hooks for business logic and state.

Main hooks:

- `useSchemaWorkspace` handles branches and schema edits.
- `useBranchComparison` calculates schema changes.
- `useMergePlan` checks merge status.
- `useMergeDecisions` stores the user’s conflict choices.

**The alternatives**

I could have kept all state inside `App.tsx`.

I also thought about using Redux or Zustand.

**The reasoning**

Putting everything in one component would become messy. But adding Redux felt unnecessary for this size of app.

Custom hooks gave me a good middle ground. The UI components stay simpler, and the logic is easier to test.

**What I cut**

I did not add a global state library. The app does not need it yet.

## Decision 3: Build it frontend-first

**The decision**

I built the app mostly on the frontend. The schema data, branch state, diff logic, merge preview, and conflict resolution all run in the browser.

**The alternatives**

I considered building a backend with a database and APIs.

**The reasoning**

I am mainly a frontend developer. I have more experience building interfaces, managing client state, and turning complex flows into simple UX.

For this assignment, I wanted to focus on those strengths instead of spending too much time on backend setup. A backend would be useful in a real product, but for this project the important part was proving the workflow:

- branch a schema
- edit it
- compare changes
- detect conflicts
- choose a version
- merge

Doing it in the frontend made the project easier to run and easier to review.

**What I cut**

I did not add a backend server, database storage, authentication, or deployment database. If this became a real product, I would add those later.

## Decision 4: Build semantic diff

**The decision**

I built a diff system that understands schema changes.

It shows changes like:

- safe
- review
- breaking

**The alternatives**

I considered just showing two schemas side by side.

**The reasoning**

Side by side comparison is useful, but it still puts too much work on the user. I wanted the app to directly tell the user what changed.

For example, if `total` becomes `subtotal`, the app shows it as a rename.

**What I cut**

I did not support every database feature. I left out triggers, stored procedures, views, enum changes, and migrations.

## Decision 5: Make merge conflicts easy to understand

**The decision**

When both branches change the same field differently, the app shows a conflict and asks the user to choose.

For example:

- keep `main`: `fullName`
- use `checkout-tax-update`: `display_name`

After the user picks one option, the merge becomes available.

**The alternatives**

I first showed only “merge paused”, but that was confusing because the user could not actually resolve the conflict.

**The reasoning**

If the app says “pick a version”, it should give buttons to do that. Otherwise the user gets stuck.

So I added a simple conflict resolution UI.

**What I cut**

I did not build a full advanced merge editor. I only handled the most important conflict type for this version: both branches changing the same column field.

## Decision 6: Keep row data out of scope

**The decision**

The app only versions database schemas. It does not version row data.

**The alternatives**

I thought about showing sample data or migration previews.

**The reasoning**

The assignment clearly says row data is out of scope. Also, data migration is a much bigger problem than schema review.

I wanted to keep the product focused.

**What I cut**

I cut row data, backfills, production database execution, and real migration scripts.

## Decision 7: UI style

**The decision**

I used a clean visual style inspired by the Zamp AI assignment page:

- white and dark themes
- strong blue accent
- binary background
- rounded pill buttons
- Geist font family
- compact mono labels

**The alternatives**

I first had a more generic dashboard style.

**The reasoning**

The generic dashboard looked too much like a normal admin panel. I wanted this assignment to feel more intentional and memorable.

The Zamp-style theme also fits the assignment context.

**What I cut**

I did not copy the Zamp page exactly. I used it as visual direction, but kept the app focused on schema version control.
