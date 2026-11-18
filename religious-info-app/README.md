# RELIGIOUS INFO – ሃይማኖታዊ ኢንፎ

## Project overview – የፕሮጀክቱ አጠቃላይ እይታ

RELIGIOUS INFO is a bilingual, frontend-only registration and management demonstration. It supports five religions, the three specified Ethiopian Orthodox organizations, seven Gibi Gubae academic years, and three Sunday School age groups.

RELIGIOUS INFO በእንግሊዝኛ እና በአማርኛ የተዘጋጀ የፊት-ገጽ ምዝገባ እና አስተዳደር ማሳያ ነው። አምስቱን ሃይማኖቶች፣ ሶስቱን የኦርቶዶክስ ድርጅቶች፣ ሰባቱን የግቢ ጉባኤ ዓመታት እና ሶስቱን የሰንበት ትምህርት ዕድሜ ክፍሎች ይደግፋል።

## Features – ባህሪያት

- Independent member registration, details, search, filters, editing, and deletion per section.
- Seven separate Gibi Gubae academic years and three Sunday School age categories.
- Sunday School attendance by date, status, and member history.
- Sunday School result entry, automatic percentage and grade calculation, editing, and reports.
- Independent logo upload, preview, replacement, and removal for each religion and Orthodox organization.
- Bilingual English–Amharic interface, responsive layout, and printable tables.
- LocalStorage persistence; no account or internet connection is needed for routine local use.

## Technologies – ቴክኖሎጂዎች

HTML5, CSS3, and vanilla JavaScript. Data is kept in the current browser's LocalStorage. No backend, PHP, MySQL, or JavaScript framework is included.

## Folder structure – የፋይሎች አወቃቀር

```text
religious-info-app/
├── index.html
├── religious-info.html
├── README.md
├── .gitignore
├── components/
│   ├── header.html
│   ├── sidebar.html
│   ├── navbar.html
│   ├── dashboard.html
│   ├── member-form.html
│   └── footer.html
├── css/
│   ├── style.css
│   └── components.css
├── js/
│   ├── app.js
│   ├── components.js
│   └── dashboard.js
└── assets/
    └── images/
```

## Open and run – ክፈት እና አስኪድ

1. Open the `religious-info-app` folder in Visual Studio Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and select **Open with Live Server** (or click **Go Live** in the status bar).
4. Choose a religion card. For Ethiopian Orthodox Tewahedo, choose an organization first; select a Gibi Gubae year or Sunday School age group when prompted.
5. Data is stored locally in that browser. Keep the `components`, `css`, `js`, and `assets` folders alongside `index.html`.

Live Server is required because the app uses the Fetch API to load files from `components/`. Opening `index.html` directly as a `file://` URL will block those requests. No package installation or external network connection is needed.

## Development process for beginners – ለጀማሪዎች የልማት ሂደት

1. **Create the folders.** Keep the HTML, CSS, and JavaScript files in the structure shown above.
2. **Build the HTML foundation.** `index.html` links the stylesheets and scripts and provides mount points; `js/components.js` fetches the HTML templates from `components/`.
3. **Style the interface.** `css/style.css` defines the responsive layout, cards, forms, tables, and print view; `css/components.css` styles the shared footer.
4. **Create the dashboard and navigation.** `js/dashboard.js` renders the religion cards, while `js/app.js` routes each selection to its required organizations, year, or age group.
5. **Add member management.** The app validates registration data and provides section-specific lists, details, search, editing, and deletion.
6. **Add logos, attendance, results, and reports.** Each feature uses its own browser storage collection; attendance and results refer back to the registered member.
7. **Test in a browser.** Start Live Server, follow each navigation path, try saving and editing sample records, refresh to confirm local persistence, and print a report if needed.
8. **Document limitations.** LocalStorage is browser/device-specific; do not treat this demo as shared or backed-up storage.

## Register and manage members – አባላትን መዝግብ እና አስተዳድር

Open the relevant religion, organization, year, or age group and use **Member Registration**. Fill in the required fields and choose **Register Member**. Sunday School members also need parent/guardian contact details. Use **Member List** to search, filter, sort, view, edit, or delete records. Member IDs are unique within their own section.

## Upload a logo – ሎጎ ጫን

Open **Logo Settings** inside the section whose logo you want to manage. Choose an image (PNG, JPG, WEBP, or GIF, up to 800 KB). The preview is shown before the logo is saved. Each section has its own setting; a logo is not automatically shared with other sections.

## Manage attendance – አቴንዳንስ አስተዳድር

Open a Sunday School age group, choose **Attendance**, set the date, and mark each member Present, Absent, or Late. Save the date's attendance together. Saving again updates the existing member/date record rather than adding a duplicate. Use **View** to open an individual member's attendance history.

## Enter academic results – የትምህርት ውጤት አስገባ

Open a Sunday School age group and choose **Academic Results**. Select an existing member, enter the subject and exam information, then enter total and obtained marks. Percentage and grade are calculated automatically. Open **Grading Rules** to customize grade thresholds. The application rejects obtained marks above the total. Existing results can be edited or deleted.

## Reports and printing – ሪፖርቶች እና ማተሚያ

Open **Reports** for member summaries, age and gender counts, and (in Sunday School) attendance and results tables. Search the member-based reports as needed and choose **Print Report** to print the visible tables. Member lists, attendance, and results also have print controls.

## LocalStorage and limitations – LocalStorage እና ገደቦች

Member records, logos, attendance, and results are stored in the browser's LocalStorage. They remain on the same browser and device and are not uploaded or synchronized. Clearing browser data can remove saved records. This frontend-only demonstration does not provide accounts, access control, backups, secure shared storage, or a server database. Keep separate backups of important information.

## Possible future backend – የወደፊት ባክኤንድ

A separately requested future version could connect a server API, a database, authentication, and backup tools. None of those backend features are part of this project.
