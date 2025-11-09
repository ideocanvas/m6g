# Goal

- Analyze program copy from another app.
  @docs/reference-programs/MarkSizAPI.js
  @docs/reference-programs/index.html
- This app will not require user login.
- This app will have env variable MASTER_API_KEY, and a RESTful API to all fetch latest draw results from hkjc API (protected by the master api key).
- The data will be stored in supabase.
- You will define the supabase schema to store the mark6 results and mark6 generation data.
- You will create program to convert the existing data to the new struture and import to supabase.
  @docs/data/UfxCdaMarksixRecords.json (DO NOT LOAD ALL DATA to the chat)
  @docs/data/UfxCdaMarksixResults.json (DO NOT LOAD ALL DATA to the chat)
- You will re-create the app with a modern design (reference index.html for the UI, and MarkSixAPI.js for the baskend logic)
