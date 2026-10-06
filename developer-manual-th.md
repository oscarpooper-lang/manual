# คู่มือการพัฒนาและดูแลระบบขึ้นทะเบียนผู้ส่งมอบ

สถาปัตยกรรม ข้อมูล กฎ AI การทดสอบ และการส่งมอบ

ฉบับวันที่ 6 ตุลาคม 2569

## 1. ขอบเขตและหลักการรับช่วงต่อ

เริ่มจากยืนยันโครงการและ deployment ที่ถูกต้อง ก่อนแก้ข้อมูลหรือเผยแพร่โค้ด

1. ยืนยัน .clasp.json ชี้ scriptId ที่ได้รับอนุมัติ โดยไม่เผยแพร่ค่าบัญชีหรือ credential
2. จด deployment ID, version, URL /exec ปัจจุบัน และผู้ deploy ในทะเบียนภายในที่จำกัดสิทธิ์
3. ยืนยันผู้ถือครอง Spreadsheet โฟลเดอร์ Drive และผู้สร้าง triggers
4. สำรอง Sheet โค้ด และกฎก่อนเปลี่ยนแปลง เก็บข้อมูลจริงในพื้นที่จำกัดสิทธิ์
5. ไม่สร้าง deployment ใหม่เพื่ออัปเดตทั่วไป และไม่เพิ่มไฟล์คู่มือหรือ animation เข้า Apps Script

คู่มือนี้อ้างอิงซอร์สใน pingpong real test - Copy ณ วันที่จัดทำ ระบบเป็น Google Apps Script V8 เชื่อม Sheets, Drive, MailApp และ Gemini ผ่าน HTTP ไม่มีเซิร์ฟเวอร์ Node ที่ต้องรันเพื่อให้เว็บแอปทำงาน

การตรวจโค้ด การผ่าน local test การสร้าง version และการทำงานจริงบน /exec เป็นหลักฐานคนละระดับ คู่มือนี้ไม่รับรองว่า deployment จริงตรงกับโค้ดในเครื่องหรือผ่าน UAT แล้ว

ซอร์สแบบฟอร์มเชิญคู่ค้าในระบบต้นทางไม่ได้รวมอยู่ในไฟล์ Apps Script หลักที่ตรวจ พบเพียงภาพสาธิต Scene 1 ต้องรับลิงก์ เจ้าของ และซอร์สบริการเชิญจากผู้ส่งมอบเพิ่มเติม

อ้างอิงโค้ด: .claspignore; appsscript.json; code.gs: getPublishedWebAppUrl_

## 2. สถาปัตยกรรมและเส้นทางข้อมูล

คำขอหนึ่งรายการต้องติดตามด้วย Submission ID ไม่ใช่เลขแถวที่อาจเปลี่ยนเมื่อเรียงข้อมูล

ฟอร์มและ payload → ตรวจข้อมูลและป้องกันส่งซ้ำ → Sheet + Drive + FM021 → คิว AI และกฎเอกสาร → JSON + รายงาน + อีเมล → เคสและฉบับแก้ไข

1. supplier_registration_form.html รวบรวม answers และไฟล์ ส่งผ่าน processSubmitPayload หรือ doPost
2. doPost ใช้รหัสคำขอและ payload hash ตรวจการส่งซ้ำ ก่อน doPostOnce_ บันทึกข้อมูล
3. buildInitialColumns จัดข้อมูล 66 คอลัมน์ ระบบเก็บ Submission ID ที่คอลัมน์ 82 และตั้งสถานะ AI
4. scheduleBackgroundAIQueue_ สร้าง trigger; processPendingAIQueue_ เลือกคำขอค้างด้วย ID และประมวลผลครั้งละไม่เกิน 3 รายการ
5. runAIOnSpecificRow_ อ่านข้อมูลล่าสุด เรียก evaluateDocumentRulesFromSheet สร้างรายงานและส่งอีเมล
6. writeAIResultsOnly บันทึกเฉพาะคอลัมน์ 67–81; ลิงก์เคสพาไป admin_message.html
7. ฉบับแก้ไขเข้าคิวแยกใน DocumentRevisions.gs ตรวจเฉพาะ docKey และรวมกับผลเดิม

มี script lock เพื่อกันงานชนกัน การเพิ่มความขนานโดยไม่ออกแบบการล็อกและการรวมผลอาจทำให้ข้อมูลฉบับล่าสุดถูกทับ คิวใช้งานตามเวลาที่ Apps Script จัดสรร ไม่ควรสัญญาว่าจะเริ่มตรง 45 วินาทีทุกครั้ง

อ้างอิงโค้ด: code.gs: doPost, doPostOnce_, processPendingAIQueue_, runAIOnSpecificRow_; DocumentRevisions.gs

## 3. แผนที่ไฟล์และจุดแก้ไข



| ไฟล์ | หน้าที่และจุดเริ่มอ่าน |
| --- | --- |
| supplier_registration_form.html | UI ฟอร์ม การเลือกกิจการ required fields ไฟล์แนบ การเก็บร่างและส่งข้อมูล |
| code.gs | Schema, doGet/doPost, queue, menus, validation, PDF, email, local verdict guards |
| BrainEngine.gs | ประกอบบริบท AI, schema, การเรียกโมเดล fallback และ diagnostics |
| Conversation.gs | สิทธิ์เคส ข้อความ ไฟล์ ร่างคำขอแก้ไข และปิดเคส |
| DocumentRevisions.gs | ผูก docKey กับคอลัมน์ รับฉบับใหม่ คิว revision และรวมผล |
| admin_message.html | UI สนทนา เลือกหลายรายการ แนบไฟล์ preview และ progress polling |
| EmailAssets.gs | ทรัพยากรภาพสำหรับอีเมล |
| appsscript.json | V8, Asia/Bangkok, webapp access และ executeAs |
| test.js | การตรวจ local ไม่แทนการทดสอบ Google services จริง |
| animation และ manuals | สื่อสอนและเอกสาร ไม่ใช่ไฟล์ production ของ Apps Script |


แก้กฎชื่อบริษัทต้องตรวจทั้ง prompt, schema, deterministic checks และตัวรวมผล ไม่แก้เพียงข้อความในรายงานเพื่อซ่อนปัญหา แก้ไฟล์แนบต้องตรวจเส้นทางจาก UI ถึง validation, Drive, AI และการดาวน์โหลด

ไฟล์ที่อนุญาตให้ push: admin_message.html, BrainEngine.gs, code.gs, Conversation.gs, DocumentRevisions.gs, EmailAssets.gs, supplier_registration_form.html และ appsscript.json ซึ่งเป็น manifest ที่จำเป็น ตรวจ .claspignore ก่อนทุกครั้ง

อ้างอิงโค้ด: .claspignore และไฟล์ที่ระบุ

## 4. โครงสร้างคอลัมน์และข้อมูลหลัก

ห้ามแทรก ลบ หรือย้ายคอลัมน์เดิมโดยไม่ทำ migration ครบทุกตัวอ่าน

| ตำแหน่ง | ข้อมูล |
| --- | --- |
| 1–66 | คำตอบและลิงก์เอกสารจาก buildInitialColumns |
| 3 / 8 / 17 | ชื่อกิจการ / เลขภาษีอ้างอิง / อีเมลคู่ค้า |
| 20 / 24 / 64 | ชื่อบัญชี / เลขบัญชี / สกุลเงินสองภาษา |
| 67 / 68 | overallStatus / summaryText |
| 69–80 | สถานะรายการเอกสารลำดับ 1–12 |
| 81 | JSON checklist ทั้งหมด ใช้สร้างรายงานและ revision |
| 82 หรือ CD | Submission ID UUID หัวคอลัมน์ต้องตรงตามนี้ |


getRange ใช้เลขคอลัมน์เริ่มที่ 1 แต่ rowValues ใช้ index เริ่มที่ 0 จึงอ่านคอลัมน์ 82 ด้วย index 81 ต้องรักษาเลขบัญชีและเลขอ้างอิงเป็นข้อความเพื่อคงศูนย์นำหน้า

JSON checklist มี overallStatus, summaryText และ items แต่ละรายการใช้ docKey/order, name, condition, statusBool, needsManualReview, identityRejected, isMandatory, statusText, note, modelUsed, duration, fileId, viewUrl และ downloadUrl ข้อมูล revision อาจมี revisionId และ reviewedAt เพิ่ม

ensureSubmissionIdColumn จะปฏิเสธคอลัมน์ 82 ที่มีหัวหรือข้อมูลอื่นอยู่ ห้ามแก้ error ด้วยการล้างคอลัมน์หรือเปลี่ยนหัวโดยไม่พิสูจน์ข้อมูลเดิม ต้องสำรองและออกแบบ migration ก่อน

สกุลเงินใช้ normalizeCurrency สำหรับเปรียบเทียบ และ label สำหรับเก็บค่าที่อ่านได้ เช่น THB / บาทไทย อย่าลดค่าที่แสดงเหลือ ISO code โดยไม่ตรวจรายงานและ PDF

อ้างอิงโค้ด: code.gs: buildInitialColumns, writeAIResultsOnly, ensureSubmissionIdColumn, normalizeCurrency

## 5. เอกสารและตารางเบื้องหลัง



| docKey | คอลัมน์นิติบุคคล / บุคคลธรรมดา |
| --- | --- |
| docCompanyProfile | 40 / 47 |
| docAffidavit | 41 / ไม่มีช่องแยก |
| docPP20 | 42 / 48 |
| docIdCard | 43 / 49 |
| docDistributor | 44 / ไม่มีช่องแยก |
| docCodeConduct | 46 / 50 |
| bookBank / certFile | 56 / 57 ใช้ร่วมกัน |
| docHumanRights | 58 / 61 |
| docESG | 63 / 66 |


คีย์บุคคลธรรมดามี suffix Ind ในช่องที่แยก เช่น docESGInd ต้องแก้ ALLOWED_UPLOAD_KEYS, buildInitialColumns, ตัวอ่านแถว, rule context และ CASE_DOCUMENT_COLUMNS พร้อมกันเมื่อเปลี่ยนเอกสาร

ตารางเคส: Supplier_Cases เก็บ Case ID, Submission ID, บริษัท, อีเมล, สถานะ, Private Folder ID และเวลาเปิด/ปิด ส่วน Supplier_Case_Messages เก็บ Request ID, บทบาท, ข้อความ, Files JSON, hash และสถานะแจ้งเตือน

ตาราง revision: Supplier_Document_Requests เก็บประเภทเอกสารที่ขอแก้; Supplier_Document_Revisions เก็บ Revision ID, Case ID, Request ID, Submission ID, docKey, State JSON, Status และ Updated At

onOpen แสดงเฉพาะ 5 แท็บหลัก การซ่อนแท็บช่วยลดความสับสน แต่ผู้มีสิทธิ์ Sheet ยังอาจเข้าถึงข้อมูลเบื้องหลังได้ ห้ามเก็บความลับโดยอาศัยการซ่อนเพียงอย่างเดียว

อ้างอิงโค้ด: DocumentRevisions.gs: CASE_DOCUMENT_COLUMNS, caseRequestSheet_, caseRevisionSheet_; Conversation.gs: caseTables_

## 6. กฎ AI และการตัดสินผล

Prompt บอกสิ่งที่ต้องตรวจ แต่โค้ดกำหนดข้อมูลอ้างอิง ข้อบังคับ และผลรวมด้วย

| AI_Rules_Config | ความหมาย |
| --- | --- |
| A–C | Order, Group, Document Name |
| D–E | Condition และ Prompt Instruction |
| F | ป้ายข้อบังคับแยกประเภทกิจการจากโค้ด ไม่ใช่ toggle อิสระทุกกรณี |
| G | Enabled TRUE/FALSE |
| H | docKey ต้องตรงกับ payload และ mapping |

1. สำรองแถวกฎและใช้ตัวอย่างเอกสารที่ผ่าน ไม่ผ่าน และอ่านไม่ชัด
2. เขียนเกณฑ์เป็นสิ่งที่ตรวจได้ พร้อมข้อมูลจากฟอร์มและตำแหน่งหลักฐาน
3. ทดสอบผลเดิมกับผลใหม่และดูความขัดแย้งระหว่างเหตุผลกับ verdict
4. ใช้ Sync required documents with form เมื่อต้องปรับป้ายบังคับโดยไม่ทับ Prompt; Update AI Rules & Prompts ล้างตารางและลงค่าเริ่มต้นใหม่

getRulesFromSheetOnly ใช้กฎที่เปิดอยู่ แต่หากไม่มีกฎที่ใช้ได้อาจกลับไป DEFAULT_RULES ดังนั้นการปิดทุกแถวไม่ใช่วิธีรับประกันว่าจะหยุด AI ต้องควบคุมการรันโดยผู้ดูแล

documentRequiredForEntity_ กำหนด bookBank, จรรยาบรรณ, สิทธิมนุษยชน และ ESG เป็นบังคับทั้งสองประเภท หนังสือรับรองและภาษีบังคับนิติบุคคล บัตรบังคับบุคคลธรรมดา Profile/ตัวแทน/ใบรับรองเป็นไม่บังคับ FM021 ระบบสร้าง FM612 ติดตามงานภายใน

evaluateDocumentRulesFromSheet รวมผล: มีรายการบังคับไม่ผ่านหรือ identityRejected ให้ FAILED; ถ้ายังต้องตรวจด้วยคนตามตรรกะให้ NEED_REVIEW; มิฉะนั้น PASSED ต้องรักษาข้อแยก optional กับ identity rejection

enforceLocalDeterministicAudit ตรวจหลักฐานและค่าที่อ่านได้ เลขภาษีเปรียบเทียบค่าหลัง normalize ไม่ใช้ข้อจำกัด 13 หลักกับทุกประเทศ ไม่ใช้เลขบัตรเทียบเลขบริษัทเมื่อฟอร์มไม่ได้เก็บเลขบัตร

ตรวจประเภทเอกสารจากเนื้อหา ไม่ใช่ชื่อไฟล์อย่างเดียว ห้ามยอมรับ ESG ในช่องสิทธิมนุษยชนหากไม่มีเนื้อหาที่ต้องการ ความสัมพันธ์บริษัทแม่/ลูกหรือชื่อแปลต้องมีหลักฐาน ไม่เดาเพื่อให้ผ่าน

อ้างอิงโค้ด: code.gs: getRulesFromSheetOnly, enforceLocalDeterministicAudit, evaluateDocumentRulesFromSheet, manualUpdateRulesConfig

## 7. โมเดล การตั้งค่า และข้อมูลลับ



| รายการ | ตำแหน่งและข้อควรระวัง |
| --- | --- |
| QTC_DATA_SPREADSHEET_ID | Script Properties ระบุ Spreadsheet หลัก |
| QTC_WEB_APP_URL | Script Properties ต้องเป็น /exec ของ deployment ที่อนุมัติ |
| QTC_ADMIN_MESSAGE_HMAC_SECRET | กุญแจลงลายเซ็นลิงก์ ห้ามเผยแพร่หรือเปลี่ยนโดยไม่วางแผน |
| GEMINI_API_KEY | Script Properties ใช้เป็น fallback เมื่อไม่มี key ใน config |
| Gemini API Key / Selected Model | AI_Model_Config ระวังสิทธิ์ผู้เข้าถึง Sheet |
| DRIVE_FOLDER_ID | ค่าคงที่ใน code.gs ต้องเป็นโฟลเดอร์ที่บัญชีรันเข้าถึงได้ |
| NOTIFY_EMAILS / OWNER_EMAIL | ค่าคงที่เกี่ยวกับผู้รับและผู้มีสิทธิ์เมนู ห้ามใส่ข้อมูลตัวอย่างในระบบจริง |
| NOTIFY_ON_SUBMIT | ตัวควบคุมการแจ้งเตือน ต้องทดสอบผลกระทบตามเส้นทางการส่ง |


BrainEngine อ่าน Selected Model โดยมีค่าเริ่มต้น gemini-3.5-flash-lite ในซอร์สนี้ และมี fallback chain ที่อาจใช้ชื่อโมเดลอื่น อย่ารับรองว่าทุกงานใช้โมเดลเดียว ให้ตรวจ usedModel/modelUsed และ AI_Live_Jobs ชื่อโมเดลที่มีในโค้ดไม่ได้ยืนยันว่าผู้ให้บริการยังเปิดใช้จริง

config cache มีอายุ 1,800 วินาที หากเปลี่ยน config ให้ใช้ BrainEngine.clearConfigCache() ในบริบทผู้ดูแลหรือรอ cache หมด ก่อนสรุปว่าระบบไม่อ่านค่าใหม่

ไม่ฝังคีย์ในหน้า HTML ในคู่มือ ในภาพหน้าจอ หรือใน repository จำกัดสิทธิ์ Spreadsheet และ Script ให้เหมาะสม ลิงก์เคสเป็น bearer credential ต้องปฏิบัติเหมือนข้อมูลลับ

อ้างอิงโค้ด: BrainEngine.gs: getBrainAIConfig, clearConfigCache; code.gs: constants, getPublishedWebAppUrl_

## 8. สนทนาและการแทนเอกสาร

การส่งข้อความทั่วไปกับการส่งฉบับแก้ไขเป็นคนละเส้นทาง ห้ามรวมจนเสียความหมาย

OPEN และเลือก docKey → QUEUED → RUNNING → REVIEWED → REPORT_READY → SENDING แล้ว DONE

1. แก้ UI และ validation เซิร์ฟเวอร์คู่กันเมื่อเปลี่ยนจำนวนไฟล์
2. คง request/revision ID เดิมเมื่อ retry payload เดิม และห้าม reuse ID กับเนื้อหาต่างกัน
3. ห้ามส่ง admin token ในข้อความหรือ PDF ที่คู่ค้าเข้าถึงได้
4. ทดสอบกรณีไฟล์ใหม่ผ่านแต่เอกสารอื่นยังไม่ผ่าน และเคสต้องยังเปิดอยู่

getCaseContext แปลงลิงก์ admin เดิมเป็นเคสที่ผูก Submission ID ส่วน caseToken_ แยกบทบาท admin/supplier ลิงก์ case1 ไม่มีฟิลด์หมดอายุใน payload ต่างจาก token admin แบบเดิมที่มีเวลา ห้ามสมมติว่าลิงก์ทุกชนิดหมดอายุ 30 วัน

draftCaseCorrection สร้างร่างจาก checklist ที่บันทึกไว้ ไม่เรียกโมเดลเพิ่ม การแสดงชื่อปุ่ม AI ไม่ได้หมายความว่ามี generation ใหม่ทุกครั้ง

submitCaseDocumentRevision ตรวจ role, OPEN, request, files และ revision hash ก่อนสร้างโฟลเดอร์ แก้ไข 01 เป็นต้น เก็บ oldCell/oldItem ไว้ใน State JSON เปลี่ยนรายการเป็นรอตรวจ และคิวเฉพาะ docKey

worker ตรวจเพียงเอกสารใหม่ แล้ว mergeCaseRevision_ รวมกับผลเดิม เก็บต้นฉบับฉบับใหม่แยก kind: source และรายงาน kind: report เพื่อไม่ให้ปุ่มดูต้นฉบับพาไปเปิดรายงาน

retry อัตโนมัติมีเพดาน 3 ครั้ง ERROR ต้องตรวจสาเหตุ ส่วน VERIFY_REQUIRED หมายถึงผลส่งอีเมลไม่แน่นอน ห้าม retry อัตโนมัติจนส่งซ้ำ closeSupplierCase ตรวจว่าไม่มี revision ค้าง แล้วเปลี่ยนสถานะเป็น CLOSED แต่ไม่ได้ทำธุรกรรมอนุมัติ Vendor

อ้างอิงโค้ด: Conversation.gs; DocumentRevisions.gs; admin_message.html

## 9. การทดสอบก่อนส่งมอบ

ใช้สำเนาทดสอบและผู้รับอีเมลที่ตกลงไว้ เก็บผลจริง ไม่ใช้เครื่องหมายผ่านล่วงหน้า

| กรณีทดสอบ | ผลที่ต้องตรวจ |
| --- | --- |
| นิติบุคคลและบุคคลธรรมดา | ข้อบังคับตรงฟอร์มและรายงาน ไม่บังคับบัตรนิติบุคคล |
| บริษัทต่างประเทศ | เลขอ้างอิงตามฟอร์ม ไม่บังคับ 13 หลัก และอ่านหลักฐานต่างภาษา |
| ESG ใส่ช่องสิทธิมนุษยชน | ไม่ผ่านแบบผิดประเภทหรือให้ตรวจเพิ่มตามหลักฐาน ไม่ให้ผ่านโดยเดา |
| optional ไม่แนบ / คนละบริษัท | ไม่แนบไม่ทำให้ตกโดยลำพัง แต่ identity rejection ต้องคงอยู่ |
| หลาย ISO ในโฟลเดอร์ | อ่านไฟล์จริงครบ ไม่ใช้โฟลเดอร์เป็น blob 0 bytes |
| auto กับ manual แถวเดียวกัน | Submission ID เดิม ลิงก์ใช้ deployment เดียว และเปิดได้ตามสิทธิ์ |
| No AI | สร้างรายงานจากผลเดิมโดยไม่มีงานโมเดลใหม่ แต่ตรวจอีเมลจริง |
| ผู้ส่งกับผู้รับอีเมลเดียวกัน | ตรวจการส่ง ผู้รับทั้งหมดที่กำหนด และ inbox/spam จริง |
| revision 1–6 ไฟล์ | ตรวจเฉพาะประเภทที่เลือก เก็บฉบับเก่า ผลอื่นคงเดิม |
| double submit / retry | ไม่สร้างคำขอหรือข้อความซ้ำจาก request ID เดิม |
| token ผิดบทบาท / ไฟล์นอกเคส | ปฏิเสธ ไม่รั่วข้อมูล |
| เรียงแถวระหว่างทำงาน | ผลยังผูก Submission ID ถูกคำขอ |


รัน node test.js เพื่อตรวจ regression ที่มีอยู่ และอ่านข้อผิดพลาดก่อน deploy ผลผ่าน local ไม่พิสูจน์สิทธิ์ Drive, OAuth, quota, เวลา trigger หรือผล AI จริง บันทึก UAT แยกเป็นวันเวลา ผู้ทดสอบ Submission ID ผลที่คาด ผลจริง และหลักฐาน

ไม่รัน Run AI on All Pending Rows บน production เพื่อทดสอบรูปแบบรายงาน เพราะอาจประมวลผลคำขอจริงจำนวนมากและส่งอีเมล

อ้างอิงโค้ด: test.js; code.gs; Conversation.gs; DocumentRevisions.gs

## 10. เผยแพร่และย้อนกลับโดยรักษา URL เดิม

Push โค้ด สร้าง version และอัปเดต deployment เป็นคนละขั้นตอน

1. สำรองโค้ดและจด version ที่ใช้งานอยู่ ตรวจ .clasp.json และ .claspignore ให้ตรงโครงการ
2. รัน clasp status และตรวจว่ามีเฉพาะ 7 ไฟล์แอปที่อนุญาตกับ appsscript.json ไม่มีคู่มือ วิดีโอ token หรือข้อมูลทดสอบ
3. เมื่อได้รับอนุมัติจึงรัน clasp push การ push เปลี่ยนซอร์ส แต่ไม่ได้ทำให้ /exec เปลี่ยน version โดยอัตโนมัติ
4. สร้าง version ที่ระบุหมายเหตุชัดเจน หากคำสั่งผู้ดูแลอนุญาตเพียง push และ version ให้หยุดตรงนั้น
5. เมื่อต้องเผยแพร่จริง ใช้ Deploy > Manage deployments > เลือก deployment เดิม > Edit > เลือก version ใหม่ > Deploy ไม่เลือก New deployment
6. ยืนยัน deployment ID และ URL เดิมไม่เปลี่ยน ตรวจ QTC_WEB_APP_URL ให้ตรง /exec เดิม
7. ทดสอบ /exec จากบัญชีคู่ค้าหรือหน้าต่างออกจากระบบ และทดสอบอีเมล/เคสจากบัญชีแอดมิน
8. หากต้อง rollback ให้ชี้ deployment เดิมกลับ version ที่บันทึกไว้ แล้วทดสอบซ้ำ การ rollback โค้ดไม่ย้อนข้อมูล Sheet หรือ Drive

เอกสาร Google แยก version ออกจาก deployment ชัดเจน การอัปเดต deployment เดิมช่วยรักษา URL ไม่แก้ลิงก์ในอีเมลที่ส่งไปแล้ว หากเคยสร้างรายงานด้วย URL ผิด ต้องสร้างรายงาน/อีเมลใหม่เมื่อผู้ดูแลอนุมัติ

manifest ปัจจุบันระบุ executeAs USER_DEPLOYING และ access ANYONE_ANONYMOUS ต้องตรวจค่าจริงใน deployment และนโยบายองค์กร บัญชีเจ้าของ Sheet ไม่ได้แปลว่าจะเป็นบัญชีผู้ deploy หรือมีสิทธิ์ทุกทรัพยากรโดยอัตโนมัติ

[Google Apps Script deployment](https://developers.google.com/apps-script/concepts/deployments)

[Google Apps Script versions](https://developers.google.com/apps-script/guides/versions)

อ้างอิงโค้ด: .claspignore; appsscript.json; code.gs: configurePublishedWebAppUrl

## 11. วินิจฉัยเหตุขัดข้องอย่างปลอดภัย



| อาการ | ลำดับตรวจ |
| --- | --- |
| manual เปิดลิงก์ไม่ได้ | QTC_WEB_APP_URL → deployment เดิม → token/Submission ID → สิทธิ์ไฟล์ → อีเมลล่าสุด |
| เจ้าของ Sheet รันหรือ deploy ไม่ได้ | บัญชีที่ใช้ → requireAdminUser_ → สิทธิ์ script → OAuth → Drive → ผู้สร้าง trigger → นโยบายองค์กร |
| AI ค้าง | คอลัมน์ 67 → Executions → คิว trigger → config/key → HTTP error → lock/revision ค้าง |
| 13 หลักยังปรากฏในเหตุผล | ค้นกฎใน AI_Rules_Config และ DEFAULT_RULES → prompt ประกอบจริง → deployment version → cache |
| ISO เป็น 0 bytes | extractDriveIdFromAny → resolveManualDocument_ → แยก file/folder → blob/สิทธิ์ของไฟล์ลูก |
| ไฟล์ซ้ำ | ตรวจ File ID, request hash, revision ID และ path ผู้สร้าง ไม่ตัดสินจากชื่อไฟล์อย่างเดียว |
| อีเมลซ้ำหรือไม่แน่นอน | Notification/SENDING/VERIFY_REQUIRED → ประวัติส่ง → ผู้รับ → quota ก่อน retry |
| Column 82 ถูกใช้งาน | หยุดเขียน ตรวจ CD1 และข้อมูลทั้งคอลัมน์ สำรองแล้ววางแผน migration |


ใช้ Executions ระบุฟังก์ชันและเวลาที่ล้มเหลว เทียบ AI_Live_Jobs และตาราง revision ด้วย Submission ID ปกปิด key และ token ใน log ที่แชร์ ห้ามแก้โดยทำให้ทุกไฟล์เป็น public หรือปิด validation

Installable trigger รันภายใต้บัญชีผู้สร้าง จึงต้องตรวจสิทธิ์ของบัญชีนั้น ไม่ใช่ดูเฉพาะเจ้าของ Sheet การโอนงานให้ผู้ดูแลใหม่ต้องตรวจการอนุญาตและสร้าง trigger ภายใต้บัญชีที่รับผิดชอบอย่างเป็นขั้นตอน

Clean Up Background Triggers ลบ trigger คิวที่เกี่ยวข้อง ไม่ใช่การประมวลผลงานค้าง หลังใช้ต้องตรวจการสร้างคิวกลับตามแผนของผู้ดูแล ห้ามกดซ้ำเพื่อแก้ทุกอาการ

[Google installable triggers](https://developers.google.com/apps-script/guides/triggers/installable)

อ้างอิงโค้ด: code.gs: resolveManualDocument_, getBlobFromDriveUrlOrId, requireAdminUser_, cleanUpQueueTriggers_; DocumentRevisions.gs

## 12. เช็กลิสต์รับมอบและการบำรุงรักษา

เอกสารและวิดีโอช่วยรับช่วง แต่การรับมอบต้องมีผู้รับผิดชอบและผล UAT จริง

| รอบดูแลที่แนะนำ | รายการ |
| --- | --- |
| ทุกวันทำการ | งานค้าง เคสค้าง error และการส่งอีเมลไม่แน่นอน |
| ทุกครั้งที่แก้กฎหรือโมเดล | ชุดเอกสารตัวอย่าง ผลเทียบเดิม ค่าใช้จ่าย และเวลา |
| ทุกครั้งที่เผยแพร่ | backup, version, URL, สิทธิ์ และ smoke test |
| เมื่อเปลี่ยนผู้ดูแล | เจ้าของทรัพยากร OAuth triggers secret และบัญชีผู้รับ |
| ตามนโยบายองค์กร | ระยะเก็บเอกสาร การลบข้อมูล การสำรอง และการทบทวนสิทธิ์ |

1. บันทึกเจ้าของระบบ ผู้สำรอง และช่องทางแจ้งเหตุในทะเบียนภายใน
2. รับ Spreadsheet, Drive, Script, deployment ID/version/URL และบัญชีผู้สร้าง trigger
3. รับซอร์สและ URL แบบฟอร์มเชิญต้นทางแยกจากเว็บแอปผู้ส่งมอบ
4. ยืนยันผู้รับ NOTIFY_EMAILS และบัญชีทดสอบที่อนุมัติ ไม่ใส่ key หรือ token ในคู่มือ
5. สำรอง config และ schema พร้อมวันที่และผู้อนุมัติ จัดให้มีวิธีกู้คืนและผู้รับผิดชอบ
6. ทำ UAT ตามหน้าการทดสอบ เก็บหลักฐาน auto, manual, no-AI, revision และสิทธิ์เข้าถึง
7. ให้ผู้ใช้ลองทำตามคู่มือด้วยตนเอง แล้วบันทึกจุดที่ไม่เข้าใจ
8. อนุมัติ go-live แยกจากการเสร็จคู่มือ และนัดทบทวนหลังเริ่มใช้งาน

ไฟล์ user-manual-th และ developer-manual-th มีฉบับ HTML, PDF และ Markdown ให้แก้ต้นทาง manuals-th.json แล้วรัน build-manuals.cjs เพื่อให้ทุกฉบับตรงกัน วิดีโอรวมใช้คำบรรยายและเสียงตัวอย่างสำหรับการสอน ไม่ส่งข้อมูลคู่ค้าไปสร้างเสียง

คู่มือ DEV_MANUAL_TH.md เดิมเป็นเอกสารย้อนหลัง โดยเฉพาะข้อความเรื่องสร้าง deployment ใหม่ ให้ใช้ขั้นตอนในคู่มือฉบับนี้และข้อจำกัดการเผยแพร่ของผู้ดูแลแทน

อ้างอิงโค้ด: คู่มือฉบับนี้และซอร์สโค้ดที่ระบุทุกหน้า

