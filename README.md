# ชุดคู่มือและวิดีโอส่งมอบระบบ Vendor

เปิด `index.html` เพื่ออ่านคู่มือและดูวิดีโอทั้งหมด ใช้งานแบบ local ได้โดยไม่ deploy และไม่ต้องเชื่อมระบบ production

## สิ่งที่ส่งมอบ

- `user-manual-th.pdf` คู่มือผู้ใช้งานและแอดมิน 10 หน้า
- `developer-manual-th.pdf` คู่มือนักพัฒนาและผู้ดูแลระบบ 13 หน้า
- ไฟล์ `.html` ของคู่มือมีภาพฝังอยู่ในไฟล์และมีสารบัญกดได้
- ไฟล์ `.md` ใช้แก้ไขหรืออ้างอิงข้อความ
- `QTC-Training-TH.mp4` รวม Scene 1 และ Scene 2 พร้อมเสียงชายภาษาไทยและมาสคอต
- `QTC-Training-TH.srt` และ `.vtt` คำบรรยายเต็ม ส่วนข้อความบนภาพเป็นใจความสำคัญ
- `narration-th.json` บทบรรยายและช่วงต้นฉบับที่นำมาตัดต่อ
- `video-chapters.json` เวลาของแต่ละบทในวิดีโอที่สร้างจริง

## แก้ไขและสร้างใหม่

1. แก้เนื้อหาคู่มือใน `manuals-th.json` แล้วรัน `node build-manuals.cjs` จากสภาพแวดล้อมที่มี Playwright และ Chromium ตาม path ในสคริปต์
2. รัน `verify-pdfs.py` ด้วย Python ที่มี `pypdfium2`, `pypdf`, `Pillow` ตรวจจำนวนหน้า แล้วเปิดภาพ PDF ทุกหน้าเพื่อตรวจรูปแบบ
3. แก้เสียงใน `narration-th.json` หากเปลี่ยนบท ให้เปลี่ยนชื่อหรือสำรองไฟล์เสียง segment ที่เกี่ยวข้องก่อนรัน `make-narration.py` เพราะสคริปต์จะใช้เสียงเดิมที่มีอยู่
4. `make-narration.py` ใช้เสียง `th-TH-NiwatNeural` ผ่าน Edge TTS ต้องเชื่อมอินเทอร์เน็ต ส่งเฉพาะข้อความบทสอน ไม่ใช่ข้อมูลคู่ค้า
5. `build-video.cjs` ใช้ FFmpeg ประกอบวิดีโอเดิมกับเสียงและมาสคอต โดยไม่แก้ source scene ต้องมี `animation/scene 1/scene_1_youtube_1080p.mp4` และ `animation/scene 2/scene_2_youtube_1080p.mp4` ในโปรเจกต์
6. ปรับ path runtime, FFmpeg, Chromium และ mascot ในสคริปต์หากย้ายเครื่อง ไฟล์เหล่านี้เป็นสคริปต์สร้างสื่อในเครื่องผู้จัดทำ ไม่ใช่ตัวติดตั้งแบบ portable

## ข้อจำกัดและหลักฐาน

- คู่มืออ้างอิงโค้ด `pingpong real test - Copy` วันที่ 6 ตุลาคม 2569 ไม่ใช่การรับรอง UAT หรือ deployment ปัจจุบัน
- แบบฟอร์มเชิญต้นทางใน Scene 1 ต้องรับซอร์สและเจ้าของระบบเพิ่มจากผู้ส่งมอบ ไม่มีบริการส่งคำเชิญต้นทางครบชุดในโค้ดหลักที่ตรวจ
- ภาพเคลื่อนไหวเป็นสื่อสาธิต มาสคอตขยับประกอบเสียง ไม่ใช่ lip sync
- ไม่เปลี่ยนไฟล์ production, deployment, version, ข้อมูล Sheet หรือส่งอีเมลจริงในการสร้างชุดนี้
- PDF/HTML ไม่บรรจุ API key หรือ token เคสจริง ไม่แนบโค้ด production ในชุดแจก

อ้างอิงการสร้างเสียง: [Edge TTS](https://github.com/rany2/edge-tts)

อ้างอิงการเผยแพร่: [Google Apps Script deployments](https://developers.google.com/apps-script/concepts/deployments) และ [installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)
