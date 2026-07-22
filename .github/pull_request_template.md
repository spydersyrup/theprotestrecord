## Contribution Checklist

Thank you for contributing to the TWLD Archive! Before you submit your pull request, please make sure you have checked all of the following:

- [ ] **JSON Data:** I have added my JSON file inside the `data/events/` folder.
- [ ] **Formatting:** My JSON file perfectly matches the required schema (`data/schema.json`).
- [ ] **ID Naming:** My JSON filename perfectly matches the `id` field inside the file, and only contains lowercase letters, numbers, and hyphens.
- [ ] **Images:** I have uploaded my images directly to `data/images/` (no subfolders).
- [ ] **Graphic Content:** If my photo shows violence or blood, I have set `"graphic_content": true` in the JSON file so it can be blurred by default.
- [ ] **Privacy:** I am not sharing anyone's personal information without their consent.

*(Note: Don't worry about EXIF metadata—our GitHub Actions will automatically strip location data from your photos before this gets merged!)*
