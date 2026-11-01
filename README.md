# 孕期糖尿病診療導航

繁體中文臨床教學與決策輔助工具，涵蓋妊娠糖尿病及既有第 1／2 型糖尿病合併懷孕。

預定網址：https://yht5582-source.github.io/GDM/

## 功能

- 75 g／100 g OGTT、50 g 初篩及早孕高血糖分流。
- 孕前、孕期及生產前後照護清單與用藥核對。
- 血糖紀錄分析、低血糖提醒、產後 OGTT 與日期窗口。
- 結果分為藍色「國際規範」（ADA／NICE／WHO）與綠色「台灣規範」（國健署公費產檢：24–28 週 75 g OGTT、IADPSG 門檻、孕期血糖目標、產後 4–12 週 OGTT）。
- 六個虛構教學病例、指引差異及原文連結。
- 考題 20 題（基礎 10、高階 10，作答後顯示解析與出處，不記錄作答）與診斷、治療心智圖。
- 列印／複製摘要；不永久儲存病人資料。

## 使用與部署

`index.html` 含全部 HTML、CSS 與 JavaScript，可直接下載以瀏覽器開啟。

GitHub Pages 採 Deploy from a branch：`main` 分支根目錄，推送後自動發布。`.github/workflows/test.yml` 只做測試，不負責部署。

## 驗證

- `node --test tests/clinical.test.mjs`：64 項臨床規則測試（含台灣規範 taiwanDx），含 index.html 內嵌規則與 `clinical.mjs` 一致性檢查（修改規則時兩處須同步）。
- `node --test tests/teach.test.mjs`：題庫結構、答案分布，並以規則引擎核對考題中的數值判讀。內容在 index.html 第二段 script 的 QUIZ、MAP 區塊。
- `node tests/browser.mjs`：Playwright 檢查桌面與手機的關鍵操作（需先安裝 playwright）。

測試結果並非獨立臨床驗證。

## 醫學依據與限制

查核日期 2026-10-30。ADA 2026 §2、§15；NICE NG3；WHO 2025；NIDDK、CDC；國健署孕婦產前檢查補助與孕產兒關懷網站。原始連結及差異見網站「指引與差異」。

本工具供醫療團隊教學與共同決策，不能取代醫師評估，不提供個人化胰島素處方，也不判定台灣健保給付資格。請勿輸入個人識別資料。

