# How to Publish New Entries to TWLD

Whenever you receive a new submission from your Tally form (or want to add an entry manually), just follow these 3 simple steps to get it live on the website:

### Step 1: Save the Media
If the submission includes a photo or video:
1. Download the file from the Tally email/dashboard.
2. Rename it to something simple (e.g., `delhi-protest-1.jpg`).
3. Move that file into the **`data/images/`** folder in this project.

### Step 2: Create the Data File
1. Go to your main project folder and double-click the **`add-entry.bat`** file.
2. A black terminal window will open. Answer the prompts it gives you (Date, Title, Category, Handles, etc.).
   - **For Photos/Videos or Art/Memes:** If you saved an image in Step 1, type its exact filename when it asks for "Image filenames" (e.g., `delhi-protest-1.jpg`).
   - **For Stories:** Just press Enter to skip the image question, and paste their full story into the "Description" prompt.
   - **For News Articles:** Just press Enter to skip the image question, and paste the article link into the "Source URL" prompt.
3. Press Enter on the last question, and the script will automatically generate the perfect code file for you in `data/events/`.

### Step 3: Push it Live!
1. Double-click the **`publish.bat`** file.
2. This script will automatically update the website, save your changes, and push everything to GitHub.
3. Once the black window says "SUCCESS", you can close it. 

Your new entry will be live on [twld.in](https://twld.in) within 60 seconds!
