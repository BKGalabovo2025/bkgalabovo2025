# Badminton Club Management System

This project is an administrative application for a badminton club, designed to be managed by a single administrative user.

## Project Plan

This plan outlines the main modules, functions, and data requirements for the club's administrative system.

### I. Core Modules

| Module | Main Purpose | Target Users |
| --- | --- | --- |
| 1. Members (CRM) | Manage the profiles of all members and players. | Administrator |
| 2. Finances | Track income (subscriptions, visits, contributions) and generate reports. | Administrator |
| 3. Schedule & Events| Manage the monthly schedule, training, competitions, and special events. | Administrator |
| 4. Shop & Inventory | Manage stock, prices, and sales of club inventory. | Administrator |
| 5. Documents & Reports| Automatically generate financial reports and sales documents. | Administrator |

### II. Detailed Module Descriptions

#### 1. Members (CRM) Module
*   **Purpose:** Maintain an up-to-date database of all members (active and inactive).
*   **Features:**
    *   **Add Member:** Create a new profile.
    *   **Edit Member:** Update existing information.
    *   **Delete/Archive Member:** Deactivate or permanently delete a profile.
    *   **Search & Filter:** Search by name, filter by status (Active/Inactive).
    *   **Payment History:** Link to the finance module to view all member payments.
*   **Data Fields:** First Name, Last Name, Personal ID (optional), Date of Birth, Phone, Email, Address, Registration Date, Active/Inactive Status, Notes.

#### 2. Finances Module
*   **Purpose:** Track and manage all income from club activities.
*   **Features:**
    *   **Manage Subscriptions (Monthly):** Handle different types of subscriptions (e.g., "Full Access", 12 visits, Kids Group).
    *   **Log Individual Visits:** Register payment for a single training session/court usage.
    *   **Log Membership Fees (Annual):** Register the mandatory annual membership fee.
    *   **Generate Reports:** Create financial reports by period (month/year) and income type. List unpaid subscriptions.
*   **Payment Data:** Subscription Name, Price, Validity Period, Status (Paid/Unpaid), Member ID, Payment Date.

#### 3. Schedule & Events Module
*   **Purpose:** Organize and manage all planned club activities.
*   **Features:**
    *   **Monthly Schedule:** Create regular training sessions.
    *   **Additional Training:** Add extra or substitute training sessions.
    *   **Competitions:** Plan internal and external tournaments.
    *   **Camps:** Manage sports camps.
    *   **Other Events:** Register club events like demonstrations, meetings, parties.
*   **Event Data:** Title, Date, Start/End Time, Coach, Location (Court), Target Group, Price (if applicable).

#### 4. Shop & Inventory Module
*   **Purpose:** Manage the stock and sales of club inventory (rackets, shuttles, apparel, etc.).
*   **Features:**
    *   **Product Management:** Add, edit, and delete items.
    *   **Stock Management:** Track the number of available items.
    *   **Price Management:** Set and change selling prices.
    *   **Register Sale:** Record the sale of an item.
    *   **Stock Report:** Report on current stock levels and sales.
*   **Item Data:** Item Name, Category, Supplier, Description, Stock Quantity, Reorder Level, Sale Price.

#### 5. Documents & Reports Module
*   **Purpose:** Generate official documents based on data from other modules.
*   **Documents:**
    *   **Financial Report:** Monthly or annual income report, grouped by type.
    *   **Liabilities Report:** List of members with unpaid subscriptions/fees.
    *   **Invoice / Receipt:** Document for inventory sales.
    *   **Restock Protocol:** List of items below the minimum stock level for supplier orders.

### III. Technology Stack
The choice of technologies is focused on platforms with generous free tiers to ensure no monthly costs for the club.

| Component | Recommended Technology | Justification (Free Plan) |
| --- | --- | --- |
| **Backend/Database** | Google Firebase (Firestore) or Supabase (PostgreSQL) | Provides a fast backend and database with generous free tier limits suitable for a small club. |
| **Frontend** | React, Vue, or Svelte (using Next.js) | Free and open-source JavaScript frameworks for a modern UI. |
| **Hosting** | Vercel or Netlify | Free hosting for static and server-side rendered client applications. |
| **Authentication** | Firebase Authentication or Supabase Auth | Included in the free plan. Used for managing the single Administrator account. |
| **Document Generation** | Client-side PDF Generation (e.g., `jsPDF`) | Free libraries. Generation is done directly in the browser. |

### 🔑 Security
The system will use a single "Administrator" role. Database access rules will be configured to ensure that only an authenticated Administrator has full read and write access to all data.
