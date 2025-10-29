/**
 * WTH Fitness App – Google Apps Script backend (fixed)
 * - REST-style API for Next.js frontend using Google Sheets
 * - Deploy as Web App: Execute as you / Anyone with the link
 */

const CONFIG = {
  SHEET_ID: PropertiesService.getScriptProperties().getProperty("SHEET_ID"),
  TOKEN_TTL_HOURS: 12,
};

// ===============================================
// Custom Menu for Google Sheets UI
// ===============================================

/**
 * ตั้งค่า URL ของเว็บไซต์สำหรับส่งอีเมล
 */
function setFrontendUrl() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '🌐 ตั้งค่า URL ของเว็บไซต์', 
    'กรุณาใส่ URL ของเว็บไซต์ (เช่น https://your-app.vercel.app):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    let url = response.getResponseText().trim();
    
    // Add https:// if no protocol specified
    if (url && !url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    if (url) {
      setProperty('FRONTEND_URL', url);
      ui.alert('✅ ตั้งค่าสำเร็จ', `URL ของเว็บไซต์: ${url}`, ui.ButtonSet.OK);
    }
  }
}

/**
 * ดู URL ปัจจุบัน
 */
function showCurrentFrontendUrl() {
  const ui = SpreadsheetApp.getUi();
  const url = getProperty('FRONTEND_URL') || 'ยังไม่ได้ตั้งค่า';
  ui.alert('🌐 URL ปัจจุบัน', `เว็บไซต์: ${url}`, ui.ButtonSet.OK);
}

/**
 * ทดสอบส่งอีเมลรีเซ็ตรหัสผ่าน
 */
function testResetEmail() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    '📧 ทดสอบส่งอีเมล', 
    'กรุณาใส่อีเมลที่ต้องการทดสอบ:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const testEmail = response.getResponseText().trim();
    
    if (testEmail && testEmail.includes('@')) {
      try {
        // Create a test reset token
        const testToken = 'test-' + Utilities.getUuid().replace(/-/g, '');
        let baseUrl = getProperty('FRONTEND_URL') || 'https://wth-fitness.vercel.app';
        baseUrl = baseUrl.replace(/\/$/, '');
        const resetUrl = `${baseUrl}/reset-password?token=${testToken}`;
        
        MailApp.sendEmail({
          to: testEmail,
          subject: '🔐 ทดสอบ - รีเซ็ตรหัสผ่าน - WTH Fitness App',
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h2 style="color: #2563eb;">🏋️ WTH Fitness App - ทดสอบระบบ</h2>
                <p>สวัสดีครับ/ค่ะ</p>
                
                <p>นี่คืออีเมลทดสอบระบบรีเซ็ตรหัสผ่าน</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" 
                     style="background: #2563eb; color: white; padding: 12px 30px; 
                            text-decoration: none; border-radius: 6px; display: inline-block;">
                    🔗 ลิงก์ทดสอบ (ใช้ไม่ได้จริง)
                  </a>
                </div>
                
                <p><strong>ลิงก์ทดสอบ:</strong></p>
                <div style="background: #e5e7eb; padding: 10px; border-radius: 4px; 
                            word-break: break-all; font-family: monospace; font-size: 12px;">
                  ${resetUrl}
                </div>
                
                <div style="background: #dbeafe; border-left: 4px solid #2563eb; 
                            padding: 15px; margin: 20px 0;">
                  <p style="margin: 0; color: #1e40af;">
                    <strong>ℹ️ นี่คือการทดสอบ:</strong> 
                    ลิงก์นี้เป็นเพียงการทดสอบเท่านั้น ไม่สามารถใช้งานจริงได้
                  </p>
                </div>
                
                <p style="text-align: center; color: #6b7280; font-size: 12px;">
                  📧 อีเมลทดสอบจากผู้ดูแลระบบ<br>
                  WTH Fitness App
                </p>
              </div>
            </div>
          `
        });
        
        ui.alert('✅ ส่งอีเมลทดสอบสำเร็จ', `ส่งไปยัง: ${testEmail}\nลิงก์: ${resetUrl}`, ui.ButtonSet.OK);
      } catch (error) {
        ui.alert('❌ ส่งอีเมลไม่สำเร็จ', error.toString(), ui.ButtonSet.OK);
      }
    } else {
      ui.alert('❌ รูปแบบอีเมลไม่ถูกต้อง', 'กรุณาใส่อีเมลที่ถูกต้อง', ui.ButtonSet.OK);
    }
  }
}

/**
 * ล้างข้อมูล Token รีเซ็ตรหัสผ่านที่เก่า
 */
function cleanupPasswordResets() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    '🧹 ล้างข้อมูล Password Reset Tokens',
    'ต้องการลบ Token รีเซ็ตรหัสผ่านที่เก่าหรือไม่?',
    ui.ButtonSet.YES_NO
  );
  
  if (result === ui.Button.YES) {
    try {
      cleanOldResetTokens();
      ui.alert('✅ ล้างข้อมูลสำเร็จ', 'ลบ Token เก่าแล้ว', ui.ButtonSet.OK);
    } catch (error) {
      ui.alert('❌ ล้างข้อมูลไม่สำเร็จ', error.toString(), ui.ButtonSet.OK);
    }
  }
}

/**
 * แสดงสถานะระบบรีเซ็ตรหัสผ่าน
 */
function showPasswordResetStatus() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    const sheet = getResetAttemptsSheet();
    const data = sheet.getDataRange().getValues();
    const now = Date.now();
    const fifteenMinutesAgo = now - (15 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let activeTokens = 0;
    let expiredTokens = 0;
    let usedTokens = 0;
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const createdAt = new Date(row[2]).getTime();
      const usedAt = row[3];
      
      if (usedAt) {
        usedTokens++;
      } else if (createdAt < fifteenMinutesAgo) {
        expiredTokens++;
      } else {
        activeTokens++;
      }
    }
    
    const frontendUrl = getProperty('FRONTEND_URL') || 'ยังไม่ได้ตั้งค่า';
    
    ui.alert(
      '📊 สถานะระบบรีเซ็ตรหัสผ่าน',
      `URL เว็บไซต์: ${frontendUrl}

📈 สถิติ Token:
• Token ที่ใช้งานได้: ${activeTokens}
• Token ที่หมดอายุ: ${expiredTokens}  
• Token ที่ใช้แล้ว: ${usedTokens}
• รวมทั้งหมด: ${data.length - 1}`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    ui.alert('❌ ไม่สามารถดูสถานะได้', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * สร้างเมนูใน Google Sheets เมื่อเปิดไฟล์
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏋️ WTH Fitness')
    .addSubMenu(ui.createMenu('⚙️ ตั้งค่าระบบ')
      .addItem('📋 สร้างตารางทั้งหมด', 'initializeSheetHeaders')
      .addItem('👤 สร้าง Admin (ครั้งแรก)', 'createDefaultAdmin')
      .addSeparator()
      .addItem('🔧 ตั้งค่าทั้งหมดพร้อมกัน', 'setupApplication'))
    .addSeparator()
    .addSubMenu(ui.createMenu('📊 จัดการข้อมูล')
      .addItem('📈 ดูสถิติการใช้พื้นที่', 'showStorageStats')
      .addSeparator()
      .addItem('📦 Archive ข้อมูลเก่า', 'showArchiveDialog')
      .addItem('🧹 ลบข้อมูลซ้ำ', 'showCleanupDialog')
      .addItem('🗑️ ลบข้อมูลเก่า', 'showDeleteDialog'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🔐 API Settings')
      .addItem('🔑 ตั้งค่า API Key', 'setApiKey')
      .addItem('📝 ดู API Key ปัจจุบัน', 'showCurrentApiKey')
      .addItem('🌐 ดู Web App URL', 'showWebAppUrl'))
    .addSeparator()
    .addItem('❓ คู่มือการใช้งาน', 'showUserGuide')
    .addToUi();
    ui.createMenu("WTH Admin")
      .addItem("① First-time Setup (headers + admin + standards)", "runFirstTimeSetupAll")
      .addItem("② Upgrade user_full_name columns", "upgradeSheetsAddUserFullName")
      .addSeparator()
      .addItem("③ Seed Demo – Basic (หลายคลาส)", "populateWithSampleData")
      .addItem("③ Seed Demo – Full Coverage", "populateDemoFullCoverage")
      .addItem("④ Seed Athlete Standards (เพิ่มเกณฑ์นักกีฬา)", "seedAthleteStandards")
      .addSeparator()
      .addSubMenu(ui.createMenu('🔐 Password Reset Settings')
        .addItem('🔗 ตั้งค่า URL เว็บไซต์', 'setFrontendUrl')
        .addItem('👀 ดู URL เว็บไซต์ปัจจุบัน', 'showCurrentFrontendUrl')
        .addSeparator()
        .addItem('📧 ทดสอบส่งอีเมลรีเซ็ต', 'testResetEmail')
        .addItem('📊 ดูสถานะระบบรีเซ็ต', 'showPasswordResetStatus')
        .addItem('🧹 ล้างข้อมูล Token เก่า', 'cleanupPasswordResets'))
      .addSubMenu(ui.createMenu('⚙️ App Configuration')
        .addItem('🔑 ตั้งค่า API Key', 'setApiKey')
        .addItem('📝 ดู API Key ปัจจุบัน', 'showCurrentApiKey')
        .addItem('🌐 ดู Web App URL', 'showWebAppUrl')
        .addSeparator()
        .addItem('📋 ดูสถานะการตั้งค่าทั้งหมด', 'showAllSettings'))
      .addSubMenu(ui.createMenu('🗄️ Data Management')
        .addItem('📊 ดูสถิติข้อมูลทั้งหมด', 'showDataStatistics')
        .addItem('🔍 ตรวจสอบข้อมูลผิดปกติ', 'validateDataIntegrity')
        .addSeparator()
        .addItem('💾 สำรองข้อมูลทั้งหมด', 'backupAllData')
        .addItem('🧹 ล้างข้อมูลชั่วคราว', 'cleanupTemporaryData'))
      .addSubMenu(ui.createMenu('🛡️ Security & Maintenance')
        .addItem('🔐 ตรวจสอบความปลอดภัย', 'runSecurityCheck')
        .addItem('👥 ดูการเข้าใช้งานล่าสุด', 'showRecentActivity')
        .addSeparator()
        .addItem('🔄 รีเซ็ตการตั้งค่าทั้งหมด', 'resetAllSettings')
        .addItem('⚠️ โหมดบำรุงรักษา', 'toggleMaintenanceMode'))
      .addToUi();
}

// ===============================================
// UI Dialog Functions
// ===============================================

/**
 * แสดงสถิติการใช้พื้นที่
 */
function showStorageStats() {
  try {
    const stats = getSheetStats();
    const maxCells = stats.maxCells;
    const totalCells = stats.totalCells;
    const percentUsed = ((totalCells / maxCells) * 100).toFixed(2);
    
    let html = '<style>body{font-family:Arial;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{padding:8px;text-align:left;border:1px solid #ddd;}th{background:#4285f4;color:white;}.warning{color:#f4b400;}.danger{color:#ea4335;}.safe{color:#34a853;}</style>';
    html += '<h2>📊 สถิติการใช้พื้นที่ Google Sheets</h2>';
    html += '<div style="padding:15px;background:#f0f0f0;border-radius:5px;margin-bottom:20px;">';
    html += '<h3>สรุปรวม</h3>';
    html += '<p>📦 ใช้ไปแล้ว: <strong>' + totalCells.toLocaleString() + '</strong> เซลล์</p>';
    html += '<p>💾 จำนวนสูงสุด: <strong>' + maxCells.toLocaleString() + '</strong> เซลล์</p>';
    
    let statusClass = 'safe';
    let statusText = '✅ ปกติ';
    if (percentUsed > 80) {
      statusClass = 'danger';
      statusText = '⚠️ เกือบเต็ม!';
    } else if (percentUsed > 60) {
      statusClass = 'warning';
      statusText = '⚡ ควรระวัง';
    }
    
    html += '<p>📈 ใช้ไป: <strong class="' + statusClass + '">' + percentUsed + '%</strong> ' + statusText + '</p>';
    html += '</div>';
    
    html += '<h3>รายละเอียดแต่ละ Sheet</h3>';
    html += '<table><thead><tr><th>ชื่อ Sheet</th><th>จำนวนแถว</th><th>จำนวนคอลัมน์</th><th>เซลล์ทั้งหมด</th><th>% ของทั้งหมด</th></tr></thead><tbody>';
    
    stats.sheets.forEach(sheet => {
      const sheetPercent = ((sheet.cellCount / maxCells) * 100).toFixed(2);
      html += '<tr>';
      html += '<td><strong>' + sheet.name + '</strong></td>';
      html += '<td>' + sheet.rowCount.toLocaleString() + '</td>';
      html += '<td>' + sheet.columnCount + '</td>';
      html += '<td>' + sheet.cellCount.toLocaleString() + '</td>';
      html += '<td>' + sheetPercent + '%</td>';
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '<br><p style="color:#666;font-size:12px;">💡 เมื่อใช้พื้นที่เกิน 80% ควร Archive หรือลบข้อมูลเก่า</p>';
    
    const htmlOutput = HtmlService.createHtmlOutput(html)
      .setWidth(700)
      .setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📊 สถิติการใช้พื้นที่');
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ เกิดข้อผิดพลาด: ' + error.message);
  }
}

/**
 * แสดง dialog สำหรับ Archive ข้อมูล
 */
function showArchiveDialog() {
  const html = `
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin: 10px 0 5px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
      button:hover { background: #357ae8; }
      .info { background: #e8f0fe; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
    <div class="info">
      <strong>📦 Archive ข้อมูลเก่า</strong>
      <p>ย้ายข้อมูลเก่าไปเก็บใน Sheet แยก เพื่อประหยัดพื้นที่</p>
    </div>
    <form>
      <label>📅 Archive ข้อมูลก่อนวันที่:</label>
      <input type="date" id="beforeDate" required />
      
      <label>📋 เลือก Sheets ที่ต้องการ Archive:</label>
      <div>
        <label><input type="checkbox" name="sheets" value="TestResults" checked /> TestResults (ผลการทดสอบ)</label><br>
        <label><input type="checkbox" name="sheets" value="BodyMeasurements" checked /> BodyMeasurements (ข้อมูลร่างกาย)</label>
      </div>
      
      <br>
      <button type="button" onclick="runArchive()">🚀 เริ่ม Archive</button>
    </form>
    
    <script>
      function runArchive() {
        const date = document.getElementById('beforeDate').value;
        if (!date) {
          alert('⚠️ กรุณาเลือกวันที่');
          return;
        }
        
        const checkboxes = document.querySelectorAll('input[name="sheets"]:checked');
        const sheets = Array.from(checkboxes).map(cb => cb.value);
        
        if (sheets.length === 0) {
          alert('⚠️ กรุณาเลือกอย่างน้อย 1 Sheet');
          return;
        }
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onError)
          .runArchiveOldData({ beforeDate: date, sheetNames: sheets });
      }
      
      function onSuccess(result) {
        alert('✅ สำเร็จ!\\n\\n' + result.message + '\\nSheet: ' + result.archiveSheetName);
        google.script.host.close();
      }
      
      function onError(error) {
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
      }
    </script>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📦 Archive ข้อมูลเก่า');
}

/**
 * แสดง dialog สำหรับลบข้อมูลซ้ำ
 */
function showCleanupDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const sheetNames = sheets.map(s => s.getName()).filter(name => 
    !name.startsWith('Archive_') && name !== 'SportTypes' && name !== 'FitnessCriteria'
  );
  
  let html = `
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin: 10px 0 5px; font-weight: bold; }
      select { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #34a853; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
      button:hover { background: #2d8e47; }
      .info { background: #e6f4ea; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    </style>
    <div class="info">
      <strong>🧹 ลบข้อมูลซ้ำ</strong>
      <p>ตรวจสอบและลบข้อมูลที่ซ้ำกัน (ตาม ID)</p>
    </div>
    <form>
      <label>📋 เลือก Sheet:</label>
      <select id="sheetName">`;
  
  sheetNames.forEach(name => {
    html += '<option value="' + name + '">' + name + '</option>';
  });
  
  html += `
      </select>
      <button type="button" onclick="runCleanup()">🧹 เริ่มลบข้อมูลซ้ำ</button>
    </form>
    
    <script>
      function runCleanup() {
        const sheetName = document.getElementById('sheetName').value;
        
        if (!confirm('⚠️ แน่ใจหรือไม่ว่าต้องการลบข้อมูลซ้ำใน Sheet: ' + sheetName + '?')) {
          return;
        }
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onError)
          .runCleanupDuplicates(sheetName);
      }
      
      function onSuccess(result) {
        alert('✅ สำเร็จ!\\n\\n' + result.message);
        google.script.host.close();
      }
      
      function onError(error) {
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
      }
    </script>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(450)
    .setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🧹 ลบข้อมูลซ้ำ');
}

/**
 * แสดง dialog สำหรับลบข้อมูลเก่า
 */
function showDeleteDialog() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const sheetNames = sheets.map(s => s.getName()).filter(name => 
    !name.startsWith('Archive_') && name !== 'SportTypes' && name !== 'FitnessCriteria'
  );
  
  let html = `
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin: 10px 0 5px; font-weight: bold; }
      input, select { width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; }
      button { background: #ea4335; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; width: 100%; }
      button:hover { background: #d33b2c; }
      .warning { background: #fef7e0; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #f4b400; }
    </style>
    <div class="warning">
      <strong>⚠️ ลบข้อมูลเก่า</strong>
      <p>ข้อมูลที่ลบแล้วจะกู้คืนไม่ได้! ระวังในการใช้งาน</p>
    </div>
    <form>
      <label>📋 เลือก Sheet:</label>
      <select id="sheetName">`;
  
  sheetNames.forEach(name => {
    html += '<option value="' + name + '">' + name + '</option>';
  });
  
  html += `
      </select>
      
      <label>📅 ลบข้อมูลก่อนวันที่:</label>
      <input type="date" id="beforeDate" required />
      
      <label>🔒 เก็บข้อมูลล่าสุดไว้ (ต่อผู้ใช้):</label>
      <input type="number" id="keepLatest" value="10" min="0" placeholder="เช่น 10 = เก็บ 10 รายการล่าสุด" />
      <small style="color:#666;">💡 ใส่ 0 ถ้าต้องการลบทั้งหมดก่อนวันที่</small>
      
      <br><br>
      <button type="button" onclick="runDelete()">🗑️ ลบข้อมูล</button>
    </form>
    
    <script>
      function runDelete() {
        const sheetName = document.getElementById('sheetName').value;
        const date = document.getElementById('beforeDate').value;
        const keepLatest = parseInt(document.getElementById('keepLatest').value) || 0;
        
        if (!date) {
          alert('⚠️ กรุณาเลือกวันที่');
          return;
        }
        
        const confirmMsg = '⚠️ คำเตือน: การลบข้อมูลไม่สามารถย้อนกลับได้!\\n\\n' +
                          'Sheet: ' + sheetName + '\\n' +
                          'ลบข้อมูลก่อน: ' + date + '\\n' +
                          'เก็บล่าสุด: ' + keepLatest + ' รายการ/คน\\n\\n' +
                          'แน่ใจหรือไม่?';
        
        if (!confirm(confirmMsg)) {
          return;
        }
        
        google.script.run
          .withSuccessHandler(onSuccess)
          .withFailureHandler(onError)
          .runDeleteOldRecords({
            sheetName: sheetName,
            beforeDate: date,
            keepLatestPerUser: keepLatest
          });
      }
      
      function onSuccess(result) {
        alert('✅ สำเร็จ!\\n\\n' + result.message);
        google.script.host.close();
      }
      
      function onError(error) {
        alert('❌ เกิดข้อผิดพลาด: ' + error.message);
      }
    </script>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(500)
    .setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '🗑️ ลบข้อมูลเก่า');
}

/**
 * ตั้งค่า API Key
 */
function setApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    '🔑 ตั้งค่า API Key',
    'กรุณาใส่ API Key สำหรับเชื่อมต่อกับ Web App:\n\n' +
    '(ควรเป็นรหัสที่ซับซ้อน เช่น: abc123xyz456)',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() == ui.Button.OK) {
    const apiKey = result.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('API_KEY', apiKey);
      ui.alert('✅ ตั้งค่า API Key สำเร็จ!');
    } else {
      ui.alert('❌ กรุณาใส่ API Key');
    }
  }
}

/**
 * แสดง API Key ปัจจุบัน
 */
function showCurrentApiKey() {
  const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  const ui = SpreadsheetApp.getUi();
  
  if (apiKey) {
    ui.alert('🔑 API Key ปัจจุบัน', 
             'API Key: ' + apiKey + '\n\n' +
             '⚠️ เก็บรักษาไว้เป็นความลับ!',
             ui.ButtonSet.OK);
  } else {
    ui.alert('❌ ยังไม่ได้ตั้งค่า API Key\n\nกรุณาไปที่: 🔐 API Settings → 🔑 ตั้งค่า API Key');
  }
}

/**
 * แสดง Web App URL
 */
function showWebAppUrl() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('🌐 Web App URL',
           'คัดลอก URL จากการ Deploy Web App แล้วนำไปใส่ใน Next.js:\n\n' +
           '1. Extensions → Apps Script\n' +
           '2. Deploy → New deployment\n' +
           '3. คัดลอก Web App URL\n' +
           '4. นำไปใส่ใน .env.local:\n' +
           '   NEXT_PUBLIC_GAS_API_URL=<URL>\n' +
           '   NEXT_PUBLIC_GAS_API_KEY=<API_KEY>',
           ui.ButtonSet.OK);
}

/**
 * แสดงคู่มือการใช้งาน
 */
function showUserGuide() {
  const html = `
    <style>
      body { font-family: Arial; padding: 20px; line-height: 1.6; }
      h2 { color: #4285f4; border-bottom: 2px solid #4285f4; padding-bottom: 10px; }
      h3 { color: #34a853; margin-top: 20px; }
      .section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }
      code { background: #e8e8e8; padding: 2px 5px; border-radius: 3px; }
      ul { margin: 10px 0; }
      li { margin: 5px 0; }
    </style>
    <h2>📖 คู่มือการใช้งาน WTH Fitness System</h2>
    
    <div class="section">
      <h3>🚀 การติดตั้งครั้งแรก</h3>
      <ol>
        <li>คลิก <strong>⚙️ ตั้งค่าระบบ → 🔧 ตั้งค่าทั้งหมดพร้อมกัน</strong></li>
        <li>คลิก <strong>🔐 API Settings → 🔑 ตั้งค่า API Key</strong> (ใส่รหัสที่ต้องการ)</li>
        <li>Deploy Web App และคัดลอก URL</li>
        <li>นำ URL และ API Key ไปใส่ใน Next.js</li>
      </ol>
    </div>
    
    <div class="section">
      <h3>👤 ข้อมูล Admin เริ่มต้น</h3>
      <ul>
        <li>📧 Email: <code>admin@wth.ac.th</code></li>
        <li>🔑 Password: <code>WTH456</code></li>
        <li>⚠️ ควรเปลี่ยนรหัสผ่านทันทีหลังเข้าระบบ!</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>📊 การจัดการข้อมูล</h3>
      <ul>
        <li><strong>ดูสถิติการใช้พื้นที่:</strong> ตรวจสอบว่าใช้พื้นที่ไปเท่าไหร่แล้ว</li>
        <li><strong>Archive ข้อมูลเก่า:</strong> ย้ายข้อมูลเก่าไปเก็บ Sheet แยก</li>
        <li><strong>ลบข้อมูลซ้ำ:</strong> ลบข้อมูลที่ซ้ำกัน (ตาม ID)</li>
        <li><strong>ลบข้อมูลเก่า:</strong> ลบข้อมูลก่อนวันที่กำหนด (มีตัวเลือกเก็บล่าสุด)</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>⚠️ ข้อควรระวัง</h3>
      <ul>
        <li>🔴 <strong>ลบข้อมูลเก่า</strong> - ข้อมูลที่ลบแล้วกู้คืนไม่ได้!</li>
        <li>🟡 <strong>Archive</strong> - ข้อมูลยังอยู่ แต่อยู่ Sheet แยก</li>
        <li>🟢 <strong>ดูสถิติ</strong> - ปลอดภัย ดูอย่างเดียว</li>
        <li>💾 เมื่อใช้พื้นที่ >80% ควร Archive หรือลบข้อมูลเก่า</li>
      </ul>
    </div>
    
    <div class="section">
      <h3>💡 เคล็ดลับ</h3>
      <ul>
        <li>ตรวจสอบสถิติเป็นประจำทุกเดือน</li>
        <li>Archive ข้อมูลเก่ากว่า 1 ปีเป็นประจำ</li>
        <li>เก็บ API Key ไว้เป็นความลับ</li>
        <li>Backup ข้อมูลสำคัญก่อนลบ</li>
      </ul>
    </div>
    
    <p style="text-align:center;color:#666;margin-top:30px;">
      🏋️ WTH Fitness App - ระบบจัดการข้อมูลสมรรถภาพ
    </p>
  `;
  
  const htmlOutput = HtmlService.createHtmlOutput(html)
    .setWidth(650)
    .setHeight(600);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📖 คู่มือการใช้งาน');
}

// ===============================================
// Backend Functions for UI Dialogs
// ===============================================

function runArchiveOldData(options) {
  return archiveOldData(options);
}

function runCleanupDuplicates(sheetName) {
  return cleanupDuplicates(sheetName);
}

function runDeleteOldRecords(options) {
  return deleteOldRecords(options);
}

const SHEET_NAMES = {
  USERS: "Users",
  CLASSES: "Classes",
  TEST_RESULTS: "TestResults",
  STANDARDS: "Standards",
  BODY_MEASUREMENTS: "BodyMeasurements",
  SPORT_TYPES: "SportTypes",
  FITNESS_CRITERIA: "FitnessCriteria",
};

const HEADERS = {
  Users: [
    "id",
    "role",
    "full_name",
    "email",
    "password_hash",
    "gender",
    "birthdate",
    "class_id",
    "sport_type",
    "position",
    "created_at",
    "updated_at",
  ],
  Classes: ["id", "instructor_id", "class_name", "class_code", "created_at"],
  TestResults: [
    "id",
    "user_id",
    "user_full_name",
    "test_type",
    "recorded_at",
    "value",
    "derived_value",
    "evaluation",
    "notes",
  ],
  Standards: [
    "id",
    "test_type",
    "gender",
    "age_min",
    "age_max",
    "category",
    "min_value",
    "max_value",
    "comparison",
    "audience",
  ],
  BodyMeasurements: [
    "id",
    "user_id",
    "user_full_name",
    "phase",
    "recorded_at",
    "muscular_strength",
    "muscular_endurance",
    "flexibility",
    "bmi",
    "cardio_respiratory_endurance",
    "weight",
    "height",
    "pulse",
    "neck",
    "shoulder_left",
    "shoulder_right",
    "upper_arm_left",
    "upper_arm_right",
    "wrist_left",
    "wrist_right",
    "chest",
    "abdomen",
    "waist",
    "hip",
    "thigh_left",
    "thigh_right",
    "calf_left",
    "calf_right",
    "ankle_left",
    "ankle_right",
    "notes",
  ],
  SportTypes: [
    "id",
    "name",
    "positions",
    "created_at",
  ],
  FitnessCriteria: [
    "id",
    "sport_type",
    "gender",
    "age_min",
    "age_max",
    "test_type",
    "excellent",
    "good",
    "fair",
    "poor",
    "unit",
    "created_at",
  ],
};

const CLASS_ROSTER_HEADERS = [
  "studentId",
  "fullName",
  "email",
  "gender",
  "birthdate",
  "notes",
];

// Helper: map sheet-name -> headers (for safe lookup)
const HEADERS_BY_SHEET = {
  [SHEET_NAMES.USERS]: HEADERS.Users,
  [SHEET_NAMES.CLASSES]: HEADERS.Classes,
  [SHEET_NAMES.TEST_RESULTS]: HEADERS.TestResults,
  [SHEET_NAMES.STANDARDS]: HEADERS.Standards,
  [SHEET_NAMES.BODY_MEASUREMENTS]: HEADERS.BodyMeasurements,
  [SHEET_NAMES.SPORT_TYPES]: HEADERS.SportTypes,
  [SHEET_NAMES.FITNESS_CRITERIA]: HEADERS.FitnessCriteria,
};

const BODY_MEASUREMENT_FIELDS = [
  { sheetKey: "muscular_strength", responseKey: "muscularStrength", label: "Muscular Strength" },
  { sheetKey: "muscular_endurance", responseKey: "muscularEndurance", label: "Muscular Endurance" },
  { sheetKey: "flexibility", responseKey: "flexibility", label: "Flexibility" },
  { sheetKey: "bmi", responseKey: "bmi", label: "BMI" },
  { sheetKey: "cardio_respiratory_endurance", responseKey: "cardioRespiratoryEndurance", label: "Cardio-Respiratory Endurance" },
  { sheetKey: "weight", responseKey: "weight", label: "น้ำหนัก" },
  { sheetKey: "height", responseKey: "height", label: "ส่วนสูง" },
  { sheetKey: "pulse", responseKey: "pulse", label: "ชีพจร" },
  { sheetKey: "neck", responseKey: "neck", label: "รอบคอ" },
  { sheetKey: "shoulder_left", responseKey: "shoulderLeft", label: "หัวไหล่ (ซ้าย)" },
  { sheetKey: "shoulder_right", responseKey: "shoulderRight", label: "หัวไหล่ (ขวา)" },
  { sheetKey: "upper_arm_left", responseKey: "upperArmLeft", label: "แขนท่อนบน (ซ้าย)" },
  { sheetKey: "upper_arm_right", responseKey: "upperArmRight", label: "แขนท่อนบน (ขวา)" },
  { sheetKey: "wrist_left", responseKey: "wristLeft", label: "ข้อมือ (ซ้าย)" },
  { sheetKey: "wrist_right", responseKey: "wristRight", label: "ข้อมือ (ขวา)" },
  { sheetKey: "chest", responseKey: "chest", label: "รอบอก" },
  { sheetKey: "abdomen", responseKey: "abdomen", label: "หน้าท้อง" },
  { sheetKey: "waist", responseKey: "waist", label: "รอบเอว" },
  { sheetKey: "hip", responseKey: "hip", label: "รอบสะโพก" },
  { sheetKey: "thigh_left", responseKey: "thighLeft", label: "ต้นขา (ซ้าย)" },
  { sheetKey: "thigh_right", responseKey: "thighRight", label: "ต้นขา (ขวา)" },
  { sheetKey: "calf_left", responseKey: "calfLeft", label: "น่อง (ซ้าย)" },
  { sheetKey: "calf_right", responseKey: "calfRight", label: "น่อง (ขวา)" },
  { sheetKey: "ankle_left", responseKey: "ankleLeft", label: "ข้อเท้า (ซ้าย)" },
  { sheetKey: "ankle_right", responseKey: "ankleRight", label: "ข้อเท้า (ขวา)" },
  { sheetKey: "notes", responseKey: "notes", label: "หมายเหตุ" },
];


/** CORS */
function doOptions(e) {
  // Apps Script ไม่รองรับ setHeader กับ TextOutput
  // ให้ตอบ 200 เฉย ๆ พอ
  const out = ContentService.createTextOutput("OK")
    .setMimeType(ContentService.MimeType.TEXT);
  return addCorsHeaders(out);
}

function doGet(e) {
  return handleRequest("GET", e);
}
function doPost(e) {
  return handleRequest("POST", e);
}

// ===============================================================
// --- ✅ สร้างหัวตารางทั้งหมด (รันครั้งแรกตั้งค่าสีต) ---
// ===============================================================
function initializeSheetHeaders() {
  const sheets = Object.values(SHEET_NAMES); // ["Users","Classes",...]
  sheets.forEach((sheetName) => {
    const headers = HEADERS_BY_SHEET[sheetName];
    try {
      const sheet = getSheet(sheetName);
      if (headers && headers.length > 0) {
        sheet.clear();
        sheet.appendRow(headers);
        Logger.log(`Headers created for sheet: ${sheetName}`);
      } else {
        Logger.log(`No headers mapping for sheet: ${sheetName}`);
      }
    } catch (error) {
      Logger.log(
        `Error setting up sheet "${sheetName}": ${error.message}. Ensure the sheet exists.`,
      );
    }
  });
}

// ===============================================================
// --- ✅ สร้าง Admin User เริ่มต้น ---
// ===============================================================
function createDefaultAdmin() {
  const users = listUsers();
  const adminEmail = "admin@wth.ac.th";
  
  // เช็คว่ามี admin อยู่แล้วหรือไม่
  if (users.find(u => u.email === adminEmail)) {
    Logger.log("Admin user already exists");
    return;
  }

  const now = new Date().toISOString();
  const adminUser = {
    id: generateId(),
    role: "instructor",
    full_name: "Admin123",
    email: adminEmail,
    password_hash: hashPassword("WTH456"),
    gender: "ชาย",
    birthdate: "1980-01-01",
    class_id: "",
    created_at: now,
    updated_at: now,
  };

  appendRow(SHEET_NAMES.USERS, HEADERS.Users, adminUser);
  Logger.log("Default admin user created successfully");
}

// ฟังก์ชันรัน setup ทั้งหมด
function setupApplication() {
  initializeSheetHeaders();
  createDefaultAdmin();
  Logger.log("Application setup completed");
}

function handleRequest(method, e) {
  try {
    // ตรวจสอบโหมดบำรุงรักษาก่อนทุกอย่าง
    const maintenanceMode = PropertiesService.getScriptProperties().getProperty('MAINTENANCE_MODE');
    if (maintenanceMode === 'true') {
      const message = PropertiesService.getScriptProperties().getProperty('MAINTENANCE_MESSAGE') || 
                     'ระบบอยู่ระหว่างการบำรุงรักษา กรุณาลองใหม่อีกครั้งในภายหลัง';
      
      return respondError(message, 503, 'maintenance_mode');
    }
    
    const action = (e?.parameter?.action || "").trim();
    if (!action) return respondError("Missing action parameter", 400);

    // API Key from query ?key=... or header Authorization: Bearer <API_KEY>
    let apiKey = (e?.parameter?.key || "").trim();
    if (!apiKey) {
      const auth = e?.parameter?.authorization || e?.headers?.Authorization || e?.headers?.authorization;
      if (auth && String(auth).toLowerCase().startsWith("bearer ")) {
        apiKey = String(auth).slice(7).trim();
      }
    }
    if (!verifyApiKey(apiKey)) return respondError("Unauthorized", 401);

    const payload = method === "POST" ? parseJsonSafe(e?.postData?.contents) || {} : {};
    const token =
      method === "POST" ? payload?.token || e?.parameter?.token : e?.parameter?.token;

    switch (action) {
      case "ping":
        return respond({ message: "pong" });

      case "sendOTP":
        return respond(sendOTP(payload));

      case "verifyOTP":
        return respond(verifyOTP(payload));

      case "register":
        return respond(registerUser(payload));

      case "login":
        return respond(loginUser(payload));

      case "createClass":
        return respond(
          requireAuth(token, "instructor", (user) => createClass(user, payload)),
        );

      case "joinClass":
        return respond(
          requireAuth(token, ["student", "athlete"], (user) => joinClass(user, payload)),
        );

      case "recordTest":
        return respond(requireAuth(token, null, (user) => recordTest(user, payload)));

      case "studentDashboard":
          return respond(
            requireAuth(token, ["student", "athlete"], (user) => getStudentDashboard(user)),
        );

      case "recordBodyMeasurements":
        return respond(
          requireAuth(token, null, (user) =>
            recordBodyMeasurements(user, payload),
          ),
        );

      case "getBodyMeasurements":
        return respond(
          requireAuth(token, null, (user) => getBodyMeasurements(user)),
        );

      case "getUserBodyMeasurements":
        return respond(
          requireAuth(token, "instructor", () => getUserBodyMeasurements(e?.parameter?.userId)),
        );

      case "getTestResults":
        return respond(
          requireAuth(token, null, (user) => getTestResults(user)),
        );

      case "instructorDashboard":
        return respond(
          requireAuth(token, "instructor", (user) =>
            getInstructorDashboard(user, e?.parameter?.classId),
          ),
        );

      case "getClassStudents":
        return respond(
          requireAuth(token, "instructor", (user) =>
            getClassStudents(user, e?.parameter?.classId),
          ),
        );

      case "standards":
        return respond(requireAuth(token, null, (user) => {
          const requested = (e?.parameter?.audience || "").toString().trim();
          const audience = requested || (user?.role === "athlete" ? "athlete" : "general");
          return listStandards(audience);
        }));

      case "updateStandard":
        return respond(
          requireAuth(token, "instructor", (user) =>
            updateStandard(user, payload),
          ),
        );

      case "deleteStandard":
        return respond(
          requireAuth(token, "instructor", (user) =>
            deleteStandard(user, e?.parameter?.standardId),
          ),
        );

      case "createStandard":
        return respond(
          requireAuth(token, "instructor", (user) =>
            createStandard(user, payload),
          ),
        );

      case "importStudents":
        return respond(
          requireAuth(token, "instructor", (user) =>
            importStudents(user, payload),
          ),
        );

      case "createRosterTemplate":
        return respond(
          requireAuth(token, "instructor", (user) =>
            createRosterTemplate(user, payload),
          ),
        );

      case "changePassword":
        return respond(
          requireAuth(token, null, (user) =>
            changePassword(user, payload),
          ),
        );

      case "changeUserRole":
        return respond(
          requireAuth(token, "instructor", (user) =>
            changeUserRole(user, payload),
          ),
        );

      // Sport Types Management
      case "getSportTypes":
        return respond(requireAuth(token, "instructor", () => getSportTypes()));

      case "addSportType":
        return respond(requireAuth(token, "instructor", () => addSportType(payload)));

      case "updateSportType":
        return respond(requireAuth(token, "instructor", () => updateSportType(payload)));

      case "deleteSportType":
        return respond(requireAuth(token, "instructor", () => deleteSportType(payload)));

      // Fitness Criteria Management
      case "getFitnessCriteria":
        return respond(requireAuth(token, "instructor", () => getFitnessCriteria()));

      case "addFitnessCriteria":
        return respond(requireAuth(token, "instructor", () => addFitnessCriteria(payload)));

      case "updateFitnessCriteria":
        return respond(requireAuth(token, "instructor", () => updateFitnessCriteria(payload)));

      case "deleteFitnessCriteria":
        return respond(requireAuth(token, "instructor", () => deleteFitnessCriteria(payload)));

      // Student Management
      case "updateStudent":
        return respond(requireAuth(token, "instructor", () => updateStudent(payload)));

      case "deleteStudent":
        return respond(requireAuth(token, "instructor", () => deleteStudent(payload)));

      case "addStudent":
        return respond(requireAuth(token, "instructor", () => addStudent(payload)));

      // Test Result Management
      case "deleteTestResult":
        return respond(requireAuth(token, "instructor", () => deleteTestResult(payload)));

      case "updateTestResult":
        return respond(requireAuth(token, "instructor", () => updateTestResult(payload)));

      // Class Management
      case "deleteClass":
        return respond(requireAuth(token, "instructor", () => deleteClass(payload)));

      // Storage Management
      case "getSheetStats":
        return respond(requireAuth(token, "instructor", () => getSheetStats()));

      case "archiveOldData":
        return respond(requireAuth(token, "instructor", () => archiveOldData(payload)));

      case "cleanupDuplicates":
        return respond(requireAuth(token, "instructor", () => cleanupDuplicates(payload.sheetName)));

      case "deleteOldRecords":
        return respond(requireAuth(token, "instructor", () => deleteOldRecords(payload)));

      // Password Reset
      case "requestPasswordReset":
        return respond(requestPasswordReset(payload));

      case "resetPassword":
        return respond(resetPassword(payload));

      default:
        return respondError(`Unsupported action: ${action}`, 404);
    }
  } catch (error) {
    Logger.log(error);
    
    // Check if it's a token-related error
    const errorMessage = error?.message || "Unexpected error";
    if (errorMessage === "Token expired" || errorMessage === "Invalid token" || errorMessage === "Missing token") {
      return respondError(errorMessage, 401);
    }
    
    return respondError(errorMessage, 500);
  }
}

function addCorsHeaders(output) {
  // Google Apps Script ไม่รองรับ setHeader กับ TextOutput
  // แต่เราสามารถใส่ headers ใน response ได้ด้วยการใช้ HtmlOutput
  return output;
}

function respond(data) {
  const output = ContentService.createTextOutput(
    JSON.stringify({ success: true, data })
  ).setMimeType(ContentService.MimeType.JSON);
  return addCorsHeaders(output);
}

function respondError(message, status, errorCode) {
  const errorResponse = { 
    success: false, 
    error: message, 
    status: status || 500 
  };
  
  if (errorCode) {
    errorResponse.error_code = errorCode;
  }
  
  const output = ContentService.createTextOutput(
    JSON.stringify(errorResponse)
  ).setMimeType(ContentService.MimeType.JSON);
  return addCorsHeaders(output);
}

function parseJsonSafe(body) {
  try {
    return body ? JSON.parse(body) : null;
  } catch (_) {
    return null;
  }
}

function getSpreadsheet() {
  const sheetId = CONFIG.SHEET_ID || getProperty("SHEET_ID");
  if (!sheetId) {
    throw new Error("Missing Spreadsheet ID in CONFIG or Script Properties");
  }
  return SpreadsheetApp.openById(sheetId);
}

function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * Backward-compatible helper: alias to getSheet(name).
 * Some modules call getOrCreateSheet; ensure it's available.
 */
function getOrCreateSheet(name) {
  return getSheet(name);
}

function verifyApiKey(apiKey) {
  const stored = getProperty("API_KEY");
  // หากไม่ได้ตั้งค่า API_KEY ใน Script Properties ให้เปิดเสรี
  if (!stored) {
    Logger.log("API_KEY not set in Script Properties - allowing all requests");
    return true;
  }
  // หากมี API_KEY ให้เช็คตรงกัน
  return Boolean(apiKey) && apiKey === stored;
}

function getProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
function setProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function generateId() {
  return Utilities.getUuid().replace(/-/g, "");
}

function generateTempPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 6; i += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

function sendStudentCredentialEmail(student, klass, instructor) {
  const appBaseUrl = getProperty("APP_BASE_URL") || "https://wthfitness.app";
  const senderName = getProperty("EMAIL_SENDER_NAME") || "WTH Fitness App";
  const instructorName = instructor?.full_name || instructor?.fullName || "ครูผู้สอน";
  const className = klass?.class_name || klass?.className || klass?.class_code || "";
  const loginUrl = appBaseUrl.startsWith("http") ? appBaseUrl : `https://${appBaseUrl}`;
  const subject = `บัญชีเข้าใช้งาน WTH Fitness App (${className})`;
  const plainBody =
    `สวัสดี ${student.firstName} ${student.lastName}\n\n` +
    `ครู ${instructorName} ได้สร้างบัญชีเข้าใช้งาน WTH Fitness App ให้กับคุณสำหรับชั้นเรียน ${className}.\n\n` +
    `อีเมล: ${student.email}\n` +
    `รหัสผ่านชั่วคราว: ${student.password}\n\n` +
    `เข้าสู่ระบบที่: ${loginUrl}\n\n` +
    `กรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านของคุณทันทีเพื่อความปลอดภัย หากไม่สามารถเข้าสู่ระบบได้ให้ติดต่อครูผู้สอนครับ/ค่ะ`;

  const htmlBody = `
    <p>สวัสดี <strong>${student.firstName} ${student.lastName}</strong>,</p>
    <p>ครู <strong>${instructorName}</strong> ได้สร้างบัญชี WTH Fitness App ให้กับคุณสำหรับชั้นเรียน <strong>${className}</strong>.</p>
    <p>
      <strong>อีเมล:</strong> ${student.email}<br/>
      <strong>รหัสผ่านชั่วคราว:</strong> ${student.password}
    </p>
    <p>
      <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">เข้าสู่ระบบ WTH Fitness App</a>
    </p>
    <p>กรุณาเข้าสู่ระบบและเปลี่ยนรหัสผ่านทันทีเพื่อความปลอดภัย หากพบปัญหาให้ติดต่อครูผู้สอน</p>
    <p>ขอบคุณ,<br/>${senderName}</p>
  `;

  try {
    GmailApp.sendEmail(student.email, subject, plainBody, {
      name: senderName,
      htmlBody,
    });
    return true;
  } catch (error) {
    Logger.log(`ส่งอีเมลแจ้งรหัสผ่านให้ ${student.email} ไม่สำเร็จ: ${error.message}`);
    return false;
  }
}

function hashPassword(password) {
  const pepper = getProperty("PASSWORD_PEPPER");
  if (!pepper) throw new Error("PASSWORD_PEPPER script property is not set");
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + pepper,
  );
  return digest.map((b) => (`0${(b & 0xff).toString(16)}`).slice(-2)).join("");
}
function verifyPassword(password, storedHash) {
  return hashPassword(password) === storedHash;
}

function getTokenSecret() {
  let secret = getProperty("TOKEN_SECRET");
  if (!secret) {
    secret = Utilities.base64EncodeWebSafe(
      Utilities.getUuid() + Utilities.getUuid(),
    );
    setProperty("TOKEN_SECRET", secret);
  }
  return secret;
}

function issueToken(user) {
  const payload = {
    userId: user.id,
    role: user.role,
    exp: Date.now() + CONFIG.TOKEN_TTL_HOURS * 60 * 60 * 1000,
  };
  const payloadString = JSON.stringify(payload);
  const signature = Utilities.computeHmacSha256Signature(
    payloadString,
    getTokenSecret(),
  );
  return (
    Utilities.base64EncodeWebSafe(payloadString) +
    "." +
    Utilities.base64EncodeWebSafe(signature)
  );
}

function decodeToken(token) {
  if (!token || token.indexOf(".") === -1) throw new Error("Invalid token");
  const [payloadPart, signaturePart] = token.split(".");
  const payloadString = Utilities.newBlob(
    Utilities.base64DecodeWebSafe(payloadPart),
  ).getDataAsString();
  const expectedSignature = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payloadString, getTokenSecret()),
  );
  if (expectedSignature !== signaturePart) throw new Error("Invalid token signature");
  const payload = JSON.parse(payloadString);
  if (Date.now() > payload.exp) throw new Error("Token expired");
  return payload;
}

/** Normalize internal role values to canonical ids */
function normalizeRole(r) {
  const s = String(r || "").trim().toLowerCase();
  if (["นักเรียน", "student", "std"].indexOf(s) !== -1) return "student";
  if (["นักกีฬา", "athlete", "ath"].indexOf(s) !== -1) return "athlete";
  if (["อาจารย์", "instructor", "teacher"].indexOf(s) !== -1) return "instructor";
  return s;
}

function requireAuth(token, role, handler) {
  if (!token) throw new Error("Missing token");
  const payload = decodeToken(token);
  const user = findUserById(payload.userId);
  if (!user) throw new Error("User not found");
  // role can be string or array; when provided, user.role must be included
  if (role) {
    const userRole = normalizeRole(user.role);
    if (Array.isArray(role)) {
      const allowed = role.map(normalizeRole);
      if (allowed.length > 0 && allowed.indexOf(userRole) === -1) {
        throw new Error("Insufficient permissions");
      }
    } else {
      if (userRole !== normalizeRole(role)) {
        throw new Error("Insufficient permissions");
      }
    }
  }
  return handler({
    ...user,
    role: normalizeRole(user.role), // propagate normalized role forward
  });
}

/** Normalize gender to 'male' | 'female' */
function normalizeGender(g) {
  const s = String(g || "").trim().toLowerCase();
  if (["ชาย", "male", "m"].includes(s)) return "male";
  if (["หญิง", "female", "f", "หญิงสาว"].includes(s)) return "female";
  return s || "male"; // default
}

// ===============================================================
// --- ✅ ระบบ OTP สำหรับการสมัครสมาชิก ---
// ===============================================================
function sendOTP(input) {
  const rawEmail = input?.email;
  if (!rawEmail) throw new Error("กรุณากรอกอีเมล");

  const email = String(rawEmail).trim().toLowerCase();
  if (!email) throw new Error("กรุณากรอกอีเมลให้ถูกต้อง");

  const users = listUsers();
  if (users.find((u) => String(u.email).toLowerCase() === email)) {
    throw new Error("อีเมลถูกใช้แล้ว");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expireTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(`otp_${email}`, JSON.stringify({
    code: otp,
    expires: expireTime,
  }));
  properties.deleteProperty(`otp_verified_${email}`);

  try {
    MailApp.sendEmail({
      to: email,
      subject: "รหัส OTP สำหรับสมัครสมาชิก WTH Fitness App",
      htmlBody: `
        <h2>รหัส OTP ของคุณ</h2>
        <p>รหัส OTP สำหรับยืนยันการสมัครสมาชิก: <strong>${otp}</strong></p>
        <p>รหัสนี้จะหมดอายุใน 10 นาที</p>
        <p>กรุณาอย่าแชร์รหัสนี้กับผู้อื่น</p>
      `
    });
    
    return { message: "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว" };
  } catch (error) {
    Logger.log("Error sending OTP email: " + error.message);
    throw new Error("ไม่สามารถส่งอีเมล OTP ได้ กรุณาตรวจสอบอีเมลและลองใหม่");
  }
}

function verifyOTP(input) {
  const rawEmail = input?.email;
  const otp = input?.otp;
  if (!rawEmail || !otp) throw new Error("กรุณากรอกอีเมลและรหัส OTP");

  const email = String(rawEmail).trim().toLowerCase();
  if (!email) throw new Error("กรุณากรอกอีเมลให้ถูกต้อง");

  const properties = PropertiesService.getScriptProperties();
  const storedOTPData = properties.getProperty(`otp_${email}`);

  if (!storedOTPData) {
    throw new Error("ไม่พบรหัส OTP หรือหมดอายุแล้ว");
  }

  const otpData = JSON.parse(storedOTPData);
  const now = new Date();
  const nowIso = now.toISOString();

  if (nowIso > otpData.expires) {
    properties.deleteProperty(`otp_${email}`);
    throw new Error("รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่");
  }

  if (otp !== otpData.code) {
    throw new Error("รหัส OTP ไม่ถูกต้อง");
  }

  properties.deleteProperty(`otp_${email}`);
  properties.setProperty(
    `otp_verified_${email}`,
    JSON.stringify({
      verifiedAt: nowIso,
      expires: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
    }),
  );

  return { message: "ยืนยัน OTP สำเร็จ" };
}

function registerUser(input) {
  const {
    role,
    fullName,
    email: rawEmail,
    password,
    gender,
    birthdate,
    classCode,
    otpVerified,
  } = input;

  if (!role || !fullName || !rawEmail || !password || !gender || !birthdate) {
    throw new Error("กรอกข้อมูลไม่ครบ");
  }

  const email = String(rawEmail).trim().toLowerCase();
  if (!email) throw new Error("กรุณากรอกอีเมลให้ถูกต้อง");

  const properties = PropertiesService.getScriptProperties();

  const users = listUsers();
  if (users.find((u) => String(u.email).toLowerCase() === email)) {
    throw new Error("อีเมลถูกใช้แล้ว");
  }

  let classId = "";
  if (role === "student") {
    if (!otpVerified) {
      throw new Error("กรุณายืนยัน OTP ก่อนสมัครสมาชิก");
    }

    const verificationData = properties.getProperty(`otp_verified_${email}`);
    if (!verificationData) {
      throw new Error("ไม่พบการยืนยัน OTP กรุณาลองใหม่อีกครั้ง");
    }

    const parsedVerification = JSON.parse(verificationData);
    const nowIso = new Date().toISOString();
    if (parsedVerification.expires && nowIso > parsedVerification.expires) {
      properties.deleteProperty(`otp_verified_${email}`);
      throw new Error("การยืนยัน OTP หมดอายุแล้ว กรุณาขอรหัสใหม่");
    }

    properties.deleteProperty(`otp_verified_${email}`);

    if (!classCode) throw new Error("นักเรียนต้องกรอกรหัสชั้นเรียน");
    const klass = findClassByCode(classCode);
    if (!klass) throw new Error("ไม่พบรหัสชั้นเรียน");
    classId = klass.id;
  }

  const now = new Date().toISOString();
  const user = {
    id: generateId(),
    role,
    full_name: fullName,
    email,
    password_hash: hashPassword(password),
    gender: normalizeGender(gender),
    birthdate,
    class_id: classId,
    created_at: now,
    updated_at: now,
  };

  appendRow(SHEET_NAMES.USERS, HEADERS.Users, user);

  const safeUser = sanitizeUser(user);
  return { token: issueToken(safeUser), user: safeUser };
}

function loginUser(input) {
  const { email, password } = input;
  if (!email || !password) throw new Error("Missing credentials");

  const users = listUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase(),
  );

  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const safeUser = sanitizeUser(user);
  return { token: issueToken(safeUser), user: safeUser };
}

function createClass(user, input) {
  const { className } = input;
  if (!className) throw new Error("กรุณากรอกชื่อชั้นเรียน");

  const now = new Date().toISOString();
  const klass = {
    id: generateId(),
    instructor_id: user.id,
    class_name: className,
    class_code: generateClassCode(),
    created_at: now,
  };

  appendRow(SHEET_NAMES.CLASSES, HEADERS.Classes, klass);
  let rosterSheetName = null;
  try {
    rosterSheetName = createClassRosterSheet(klass);
  } catch (error) {
    Logger.log(
      `Unable to create roster sheet for class ${klass.class_name}: ${error.message}`,
    );
  }
  return {
    classId: klass.id,
    classCode: klass.class_code,
    rosterSheetName,
  };
}

function sanitizeSheetTitle(name, fallback) {
  const invalidChars = /[\\/?*:\[\]]+/g;
  const spaceNormalized = String(name || "")
    .replace(invalidChars, " ")
    .replace(/\s+/g, " ")
    .trim();
  let base = spaceNormalized || String(fallback || "").trim() || "Class";
  if (base.length > 90) {
    base = base.substring(0, 90).trim();
  }
  return base || "Class";
}

function ensureUniqueSheetName(ss, baseName) {
  let candidate = baseName;
  let suffix = 2;
  const maxLength = 95;
  while (ss.getSheetByName(candidate)) {
    const suffixText = ` (${suffix})`;
    const allowedLength = Math.max(1, maxLength - suffixText.length);
    const trimmedBase = baseName.substring(0, allowedLength).trim();
    candidate = `${trimmedBase || baseName.substring(0, allowedLength)}${suffixText}`;
    suffix += 1;
  }
  return candidate;
}

function createClassRosterSheet(klass, rosterEntries) {
  const ss = getSpreadsheet();
  const marker = `ClassID:${klass.id}`;
  const sheets = ss.getSheets();
  let sheet = null;

  for (let i = 0; i < sheets.length; i += 1) {
    const candidate = sheets[i];
    const note = candidate.getRange("A1").getNote();
    if (note && note.indexOf(marker) !== -1) {
      sheet = candidate;
      break;
    }
  }

  let sheetName;
  if (!sheet) {
    const fallback = klass.class_code ? `Class ${klass.class_code}` : "Class";
    const baseName = sanitizeSheetTitle(klass.class_name, fallback);
    sheetName = ensureUniqueSheetName(ss, baseName);
    sheet = ss.insertSheet(sheetName);
  } else {
    sheetName = sheet.getName();
  }

  const headerRange = sheet.getRange(1, 1, 1, CLASS_ROSTER_HEADERS.length);
  headerRange.setValues([CLASS_ROSTER_HEADERS]);
  headerRange
    .setBackground("#0f172a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, CLASS_ROSTER_HEADERS.length);

  // ตั้งค่า Data Validation และรูปแบบวันที่ให้ใช้งานง่าย
  try {
    const genderCol = CLASS_ROSTER_HEADERS.indexOf("gender") + 1; // 1-based
    const birthdateCol = CLASS_ROSTER_HEADERS.indexOf("birthdate") + 1;

    if (genderCol > 0) {
      const genderRule = SpreadsheetApp.newDataValidation()
        // รองรับทั้งภาษาไทยและอังกฤษ เพื่อความยืดหยุ่นในการกรอก
        .requireValueInList(["ชาย", "หญิง", "male", "female"], true)
        .setAllowInvalid(false)
        .setHelpText("เลือกเพศ: ชาย/หญิง (ระบบจะบันทึกเป็น male/female)")
        .build();
      sheet
        .getRange(2, genderCol, sheet.getMaxRows() - 1, 1)
        .setDataValidation(genderRule);
    }

    if (birthdateCol > 0) {
      // กำหนดให้เป็นรูปแบบวันที่ ISO เพื่อให้ export CSV ตรงตามที่ Frontend คาดหวัง
      sheet
        .getRange(2, birthdateCol, sheet.getMaxRows() - 1, 1)
        .setNumberFormat("yyyy-mm-dd");
    }
  } catch (e) {
    Logger.log("Failed to set validations for roster sheet: " + e.message);
  }

  const tz = Session.getScriptTimeZone() || "Asia/Bangkok";
  const createdAt = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm");
  const instructions = [
    marker,
    `ชั้นเรียน: ${klass.class_name || "-"}`,
    klass.class_code ? `รหัสชั้นเรียน: ${klass.class_code}` : "",
    `อัปเดตเมื่อ: ${createdAt}`,
    "กรอกข้อมูลนักเรียนหนึ่งคนต่อหนึ่งแถว",
    "อย่าเปลี่ยนชื่อหัวคอลัมน์เพื่อให้นำเข้าข้อมูลได้ถูกต้อง",
  ]
    .filter(Boolean)
    .join("\n");
  sheet.getRange("A1").setNote(instructions);

  if (Array.isArray(rosterEntries)) {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet
        .getRange(2, 1, lastRow - 1, CLASS_ROSTER_HEADERS.length)
        .clearContent();
    }
    if (rosterEntries.length > 0) {
      sheet
        .getRange(2, 1, rosterEntries.length, CLASS_ROSTER_HEADERS.length)
        .setValues(rosterEntries);
    }
  }

  return sheetName;
}

function joinClass(user, input) {
  const { classCode } = input;
  if (!classCode) throw new Error("กรุณากรอกรหัสชั้นเรียน");
  const klass = findClassByCode(classCode);
  if (!klass) throw new Error("ไม่พบรหัสชั้นเรียน");
  updateUserClass(user.id, klass.id);
  return { classId: klass.id };
}

function createRosterTemplate(user, input) {
  const { classId, className, classCode } = input || {};

  const tz = Session.getScriptTimeZone() || "Asia/Bangkok";
  const timestamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd_HHmm");
  const safeClassName = (className || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .trim();
  const baseName = safeClassName
    ? `แบบฟอร์มรวบรวมรายชื่อนักศึกษา_${safeClassName}`
    : "แบบฟอร์มรวบรวมรายชื่อนักศึกษา";
  const spreadsheetName = `${baseName}_${timestamp}`;

  const spreadsheet = SpreadsheetApp.create(spreadsheetName);
  const sheet = spreadsheet.getActiveSheet();
  sheet.setName("รายชื่อนักศึกษา");
  sheet.clear();

  const headers = [
    "studentId",
    "firstName",
    "lastName",
    "email",
    "gender",
    "birthdate",
  ];

  sheet.appendRow(headers);

  // ตัวอย่างใช้ "ชาย/หญิง" เพื่อสื่อว่ากรอกภาษาไทยได้ ระบบจะแปลงเป็นอังกฤษให้ตอนนำเข้า
  const sampleRows = [
    ["65012345", "สมชาย", "ใจดี", "somchai@example.com", "ชาย", "2004-01-15"],
    ["65012346", "สมหญิง", "สวยงาม", "somying@example.com", "หญิง", "2005-03-22"],
    ["65012347", "วิทยา", "เก่งมาก", "", "ชาย", "2004-07-08"],
  ];
  sheet.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1d4ed8")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.autoResizeColumns(1, headers.length);

  // เพิ่ม Data Validation และ Calendar picker ให้กับ Template เช่นกัน
  try {
    const genderCol = headers.indexOf("gender") + 1;
    const birthdateCol = headers.indexOf("birthdate") + 1;

    if (genderCol > 0) {
      const genderRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["ชาย", "หญิง", "male", "female"], true)
        .setAllowInvalid(false)
        .setHelpText("เลือกเพศ: ชาย/หญิง (ระบบจะบันทึกเป็น male/female)")
        .build();
      sheet
        .getRange(2, genderCol, sheet.getMaxRows() - 1, 1)
        .setDataValidation(genderRule);
    }

    if (birthdateCol > 0) {
      sheet
        .getRange(2, birthdateCol, sheet.getMaxRows() - 1, 1)
        .setNumberFormat("yyyy-mm-dd");
    }
  } catch (e) {
    Logger.log("Failed to set validations for roster template: " + e.message);
  }

  const instructions = [
    "กรุณากรอกข้อมูลตามหัวตารางและอย่าเปลี่ยนชื่อหัวตาราง",
    className ? `ชั้นเรียน: ${className}${classCode ? ` (${classCode})` : ""}` : "",
    classId ? `รหัสชั้นเรียนในระบบ: ${classId}` : "",
    "หลังจากกรอกเสร็จให้ดาวน์โหลดเป็น CSV แล้วนำเข้าในระบบ WTH Fitness",
  ]
    .filter(Boolean)
    .join("\n");
  sheet.getRange("A1").setNote(instructions);

  const file = DriveApp.getFileById(spreadsheet.getId());
  try {
    file.addEditor(user.email);
  } catch (error) {
    Logger.log(`Cannot add editor ${user.email}: ${error.message}`);
  }

  const rosterFolderId = getProperty("ROSTER_FOLDER_ID");
  if (rosterFolderId) {
    try {
      const folder = DriveApp.getFolderById(rosterFolderId);
      folder.addFile(file);
      const parents = file.getParents();
      while (parents.hasNext()) {
        const parent = parents.next();
        if (parent.getId() !== rosterFolderId) {
          parent.removeFile(file);
        }
      }
    } catch (error) {
      Logger.log(`Unable to move roster sheet to folder ${rosterFolderId}: ${error.message}`);
    }
  }

  return {
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    name: spreadsheetName,
  };
}

function importStudents(user, input) {
  const { classId, students } = input;

  // ตรวจสอบข้อมูลที่จำเป็น
  if (!classId) throw new Error("กรุณาระบุรหัสชั้นเรียน");
  if (!students || !Array.isArray(students) || students.length === 0) {
    throw new Error("กรุณาระบุรายชื่อนักเรียน");
  }

  // ตรวจสอบว่าอาจารย์เป็นเจ้าของชั้นเรียนนี้หรือไม่
  const klass = listClasses().find(c => c.id === classId && c.instructor_id === user.id);
  if (!klass) throw new Error("ไม่พบชั้นเรียนหรือคุณไม่มีสิทธิ์เข้าถึง");

  // ตรวจสอบรูปแบบข้อมูลนักเรียน
  const validatedStudents = [];
  const errors = [];
  const existingUsers = listUsers();
  const existingEmails = new Set(
    existingUsers
      .map(userRecord => String(userRecord.email || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const batchEmails = new Set();
  const defaultEmailDomain =
    getProperty("STUDENT_EMAIL_DOMAIN") || "student.wth.ac.th";

  // helper: normalize gender and birthdate
  function normalizeGender(value) {
    const v = String(value || "").trim().toLowerCase();
    if (v === "ชาย" || v === "male" || v === "m") return "male";
    if (v === "หญิง" || v === "female" || v === "f") return "female";
    return ""; // unknown
  }

  function normalizeBirthdate(value) {
    const v = String(value || "").trim();
    if (!v) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; // already ISO
    const m = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const dd = ("0" + m[1]).slice(-2);
      const mm = ("0" + m[2]).slice(-2);
      const yyyy = m[3].length === 2 ? (parseInt(m[3], 10) > 50 ? "19" + m[3] : "20" + m[3]) : m[3];
      return `${yyyy}-${mm}-${dd}`;
    }
    return v; // fallback as-is
  }

  students.forEach((student, index) => {
    const { studentId, firstName, lastName, email, gender, birthdate } = student;
    const rowNumber = index + 1;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!studentId || !firstName || !lastName) {
      errors.push(`แถวที่ ${rowNumber}: กรุณากรอกรหัสนักศึกษา ชื่อ และนามสกุล`);
      return;
    }

    const trimmedId = studentId.toString().trim();
    const resolvedEmail =
      (email && email.toString().trim()) || `${trimmedId}@${defaultEmailDomain}`;
    const emailKey = resolvedEmail.toLowerCase();

    if (existingEmails.has(emailKey)) {
      errors.push(`แถวที่ ${rowNumber}: พบผู้ใช้ที่ใช้อีเมล "${resolvedEmail}" อยู่ในระบบแล้ว`);
      return;
    }

    if (batchEmails.has(emailKey)) {
      errors.push(`แถวที่ ${rowNumber}: อีเมล "${resolvedEmail}" ถูกใช้งานซ้ำในไฟล์นำเข้า`);
      return;
    }

    if (validatedStudents.some(record => record.studentId === trimmedId)) {
      errors.push(`แถวที่ ${rowNumber}: รหัสนักศึกษา "${trimmedId}" ถูกระบุซ้ำในไฟล์นำเข้า`);
      return;
    }

    const tempPassword = generateTempPassword();

    validatedStudents.push({
      studentId: trimmedId,
      firstName: firstName.toString().trim(),
      lastName: lastName.toString().trim(),
      email: resolvedEmail,
      gender: normalizeGender(gender) || "ไม่ระบุ",
      birthdate: normalizeBirthdate(birthdate) || "2000-01-01",
      password: tempPassword,
    });
    batchEmails.add(emailKey);
  });

  // หากมีข้อผิดพลาด ให้ส่งกลับทันที
  if (errors.length > 0) {
    return {
      success: false,
      message: "พบข้อผิดพลาดในข้อมูล",
      errors: errors,
      imported: 0,
      total: students.length
    };
  }

  // เพิ่มนักเรียนเข้าระบบ
  const now = new Date().toISOString();
  let importedCount = 0;
  const importedCredentials = [];

  validatedStudents.forEach(student => {
    try {
      const newUser = {
        id: generateId(),
        role: "student",
        full_name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        password_hash: hashPassword(student.password),
        gender: student.gender,
        birthdate: student.birthdate,
        class_id: classId,
        created_at: now,
        updated_at: now,
      };

      appendRow(SHEET_NAMES.USERS, HEADERS.Users, newUser);
      importedCount++;
      importedCredentials.push({
        studentId: student.studentId,
        email: student.email,
        password: student.password,
      });
      const emailSent = sendStudentCredentialEmail(student, klass, user);
      if (!emailSent) {
        errors.push(`ส่งอีเมลแจ้งบัญชีให้ ${student.email} ไม่สำเร็จ กรุณาแจ้งรหัสผ่านด้วยตนเอง`);
      }
    } catch (error) {
      errors.push(`ไม่สามารถเพิ่มนักศึกษา "${student.firstName} ${student.lastName}" ได้: ${error.message}`);
    }
  });

  return {
    success: importedCount > 0,
    message: importedCount > 0 
      ? `นำเข้านักเรียนสำเร็จ ${importedCount} คน${errors.length > 0 ? ` (มีข้อผิดพลาด ${errors.length} รายการ)` : ""}`
      : "ไม่สามารถนำเข้านักเรียนได้",
    errors: errors,
    imported: importedCount,
    total: students.length,
    credentials: importedCredentials,
  };
}

function changePassword(user, input) {
  const currentPassword = String(input?.currentPassword || "").trim();
  const newPassword = String(input?.newPassword || "").trim();

  if (!currentPassword || !newPassword) {
    throw new Error("กรุณากรอกรหัสผ่านให้ครบถ้วน");
  }
  if (newPassword.length < 8) {
    throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
  }
  if (currentPassword === newPassword) {
    throw new Error("รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม");
  }

  const users = listUsers();
  const record = users.find((row) => row.id === user.id);
  if (!record) {
    throw new Error("ไม่พบข้อมูลผู้ใช้");
  }

  if (!verifyPassword(currentPassword, record.password_hash)) {
    throw new Error("รหัสผ่านเดิมไม่ถูกต้อง");
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const headers = HEADERS.Users;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("ไม่พบข้อมูลผู้ใช้");

  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === user.id) {
      values[i][4] = hashPassword(newPassword); // password_hash
      values[i][9] = new Date().toISOString(); // updated_at
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      return { success: true, message: "อัปเดตรหัสผ่านเรียบร้อยแล้ว" };
    }
  }

  throw new Error("ไม่พบข้อมูลผู้ใช้");
}

/**
 * เปลี่ยนโรลของผู้ใช้ (เฉพาะอาจารย์)
 * @param {Object} instructor - ผู้ใช้ที่เป็นอาจารย์
 * @param {Object} input - { userId: string, newRole: "student" | "athlete" }
 * @returns {Object} { success: boolean, message: string, user: Object }
 */
function changeUserRole(instructor, input) {
  const userId = String(input?.userId || "").trim();
  const newRole = String(input?.newRole || "").trim();

  if (!userId || !newRole) {
    throw new Error("กรุณาระบุ userId และ newRole");
  }

  // Validate newRole
  if (newRole !== "student" && newRole !== "athlete") {
    throw new Error("โรลต้องเป็น 'student' หรือ 'athlete' เท่านั้น");
  }

  const users = listUsers();
  const targetUser = users.find((u) => u.id === userId);
  
  if (!targetUser) {
    throw new Error("ไม่พบผู้ใช้ที่ต้องการเปลี่ยนโรล");
  }

  // Only allow changing student/athlete roles, not instructor
  if (targetUser.role === "instructor") {
    throw new Error("ไม่สามารถเปลี่ยนโรลของอาจารย์ได้");
  }

  const sheet = getSheet(SHEET_NAMES.USERS);
  const headers = HEADERS.Users;
  const lastRow = sheet.getLastRow();
  
  if (lastRow < 2) {
    throw new Error("ไม่พบข้อมูลผู้ใช้");
  }

  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === userId) {
      const oldRole = values[i][1]; // role column
      values[i][1] = newRole; // update role
      values[i][9] = new Date().toISOString(); // updated_at
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      
      const updatedUser = {
        id: values[i][0],
        role: values[i][1],
        full_name: values[i][2],
        email: values[i][3],
        gender: values[i][5],
        birthdate: values[i][6],
        class_id: values[i][7],
      };
      
      return { 
        success: true, 
        message: `เปลี่ยนโรลจาก "${oldRole}" เป็น "${newRole}" สำเร็จ`,
        user: updatedUser
      };
    }
  }

  throw new Error("ไม่พบข้อมูลผู้ใช้");
}

function recordTest(user, input) {
  const { testType, value, weightKg, heightM, notes } = input;
  if (!testType || value === undefined) throw new Error("ข้อมูลไม่ครบถ้วน");

  const standards = listStandards(user?.role === "athlete" ? "athlete" : "general");
  const age = calculateAge(user.birthdate);
  const userGender = normalizeGender(user.gender);

  let derivedValue = Number(value);
  let evaluationValue = Number(value);
  let finalNotes = notes || "";

  if (testType === "bmi") {
    if (!weightKg || !heightM) throw new Error("BMI ต้องกรอกน้ำหนักและส่วนสูง");
    const bmi = roundNumber(Number(weightKg) / Math.pow(Number(heightM), 2), 2);
    derivedValue = bmi;
    evaluationValue = bmi;
    finalNotes = composeNotes(finalNotes, `น้ำหนัก ${weightKg} กก. ส่วนสูง ${Number(heightM).toFixed(2)} ม.`);
  } else if (testType === "hand_grip") {
    if (!weightKg) throw new Error("แรงบีบมือ ต้องกรอกน้ำหนักตัว");
    const ratio = roundNumber(Number(value) / Number(weightKg), 2);
    derivedValue = ratio;
    evaluationValue = ratio;
    finalNotes = composeNotes(finalNotes, `แรงบีบ ${value} กก. น้ำหนัก ${weightKg} กก.`);
  }

  const matched = findStandardMatch(standards, testType, userGender, age, evaluationValue);

  const result = {
    id: generateId(),
    user_id: user.id,
    user_full_name: user.full_name || user.fullName || "",   // ⬅️ ใส่ชื่อ
    test_type: testType,
    recorded_at: new Date().toISOString(),
    value: roundNumber(Number(value), 2),
    derived_value: roundNumber(Number(derivedValue), 2),
    evaluation: matched ? matched.category : "ไม่มีเกณฑ์อ้างอิง",
    notes: finalNotes,
  };

  appendRow(SHEET_NAMES.TEST_RESULTS, HEADERS.TestResults, result);

  const allResults = listTestResultsForUser(user.id);
  return { result: result, results: allResults };
}

function recordBodyMeasurements(user, input) {
  const phaseRaw = input?.phase;
  const phase = String(phaseRaw || "").toLowerCase();
  if (!phase || ["before", "after"].indexOf(phase) === -1) {
    throw new Error("ระบุช่วงเวลาวัดเป็น before หรือ after เท่านั้น");
  }

  const measurements = input?.measurements || {};
  if (typeof measurements !== "object") {
    throw new Error("รูปแบบข้อมูลการวัดไม่ถูกต้อง");
  }

  const sheet = getSheet(SHEET_NAMES.BODY_MEASUREMENTS);
  const headers = HEADERS.BodyMeasurements;
  ensureSheetHasHeaders(sheet, headers);
  const rows = sheet.getDataRange().getValues();
  let targetRowIndex = -1;
  let existingId = "";

  if (rows.length > 1) {
    const userIndex = headers.indexOf("user_id");
    const phaseIndex = headers.indexOf("phase");
    const idIndex = headers.indexOf("id");
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][userIndex] === user.id && rows[i][phaseIndex] === phase) {
        targetRowIndex = i + 1;
        existingId = rows[i][idIndex];
        break;
      }
    }
  }

  const now = new Date().toISOString();
  const record = {
    id: existingId || generateId(),
    user_id: user.id,
    user_full_name: user.full_name || user.fullName || "",    // ⬅️ ใส่ชื่อ
    phase,
    recorded_at: now,
  };

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    if (field.sheetKey === "notes") {
      const rawNotes = measurements[field.responseKey];
      record[field.sheetKey] = rawNotes ? String(rawNotes).slice(0, 500) : "";
    } else {
      record[field.sheetKey] = normalizeBodyMeasurementNumber(
        measurements[field.responseKey],
        field.label,
      );
    }
  });

  const rowValues = headers.map((header) =>
    record[header] !== undefined && record[header] !== null ? record[header] : ""
  );

  if (targetRowIndex > -1) {
    sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }

  return getBodyMeasurements(user);
}

function getBodyMeasurements(user) {
  const records = listBodyMeasurementsForUser(user.id);
  const response = { before: null, after: null };

  records.forEach((record) => {
    if (record.phase === "before") {
      response.before = mapBodyMeasurementRecordToResponse(record);
    } else if (record.phase === "after") {
      response.after = mapBodyMeasurementRecordToResponse(record);
    }
  });

  return response;
}

/**
 * สำหรับอาจารย์: ดึงข้อมูลสัดส่วนร่างกายของนักเรียนรายคน
 */
function getUserBodyMeasurements(targetUserId) {
  const userId = String(targetUserId || "").trim();
  if (!userId) throw new Error("กรุณาระบุ userId");
  const records = listBodyMeasurementsForUser(userId);
  const response = { before: null, after: null };

  records.forEach((record) => {
    if (record.phase === "before") {
      response.before = mapBodyMeasurementRecordToResponse(record);
    } else if (record.phase === "after") {
      response.after = mapBodyMeasurementRecordToResponse(record);
    }
  });

  return response;
}

function getTestResults(user) {
  const results = listTestResultsForUser(user.id);
  
  return results.map((record) => ({
    id: record.id,
    userId: record.user_id,
    testType: record.test_type,
    recordedAt: record.recorded_at,
    value: parseFloat(record.value) || 0,
    derivedValue: record.derived_value ? parseFloat(record.derived_value) : undefined,
    evaluation: record.evaluation || "",
    notes: record.notes || ""
  }));
}

function mapBodyMeasurementRecordToResponse(record) {
  const payload = {
    phase: record.phase,
    recordedAt: record.recorded_at || null,
  };

  BODY_MEASUREMENT_FIELDS.forEach((field) => {
    if (field.sheetKey === "notes") {
      payload[field.responseKey] = record[field.sheetKey] || "";
    } else {
      const raw = record[field.sheetKey];
      payload[field.responseKey] =
        raw === "" || raw === null || raw === undefined ? null : Number(raw);
    }
  });

  return payload;
}

function normalizeBodyMeasurementNumber(value, label) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const numeric = Number(value);
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) {
    throw new Error(`กรุณากรอกค่า ${label} เป็นตัวเลขที่ถูกต้อง`);
  }

  return roundNumber(numeric, 2);
}

function getStudentDashboard(user) {
  const results = listTestResultsForUser(user.id);
  const grouped = results.reduce((acc, current) => {
    const key = current.test_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(current);
    return acc;
  }, {});
  Object.keys(grouped).forEach((key) => {
    grouped[key].sort(
      (a, b) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );
  });
  return {
    results,
    historyByTest: grouped,
    // ส่งเกณฑ์ให้สอดคล้องกับบทบาท: athlete ใช้เกณฑ์นักกีฬา, อื่น ๆ ใช้ general
    standards: listStandards(user.role === "athlete" ? "athlete" : "general"),
  };
}

function getInstructorDashboard(user, classId) {
  // Cache per instructor and optional class
  var cache;
  try {
    cache = CacheService.getScriptCache();
  } catch (e) {
    cache = null;
  }
  var key = "instructorDashboard:" + (user && user.id ? user.id : "unknown") + ":" + (classId || "summary");
  if (cache) {
    var cached = cache.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore parse errors
      }
    }
  }
  const classes = listClasses().filter((k) => k.instructor_id === user.id);
  // รวมทั้งนักเรียนทั่วไปและนักกีฬาในชั้นเรียนเดียวกัน
  const students = listUsers().filter((u) => u.role === "student" || u.role === "athlete");
  const results = listAllTestResults();

  const tests = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];

  const classSummaries = classes.map((klass) => {
    const classStudents = students.filter((s) => s.class_id === klass.id);
    const latestAverages = {};
    tests.forEach((test) => {
      const values = classStudents
        .map((s) => latestResultForStudent(results, s.id, test))
        .filter((r) => r)
        .map((r) => Number(r.derived_value || r.value));
      if (values.length) {
        latestAverages[test] =
          Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 100) /
          100;
      }
    });
    return {
      id: klass.id,
      className: klass.class_name,
      classCode: klass.class_code,
      studentCount: classStudents.length,
      latestAverages,
    };
  });

  let roster = null;
  if (classId) {
    const rosterStudents = students.filter((s) => s.class_id === classId);
    roster = rosterStudents.map((student) => {
      const perTest = {};
      tests.forEach((test) => {
        const latest = latestResultForStudent(results, student.id, test);
        if (latest) perTest[test] = latest;
      });
      return {
        ...sanitizeUser(student),
        className: classes.find((k) => k.id === classId)?.class_name || "",
        latestResults: perTest,
      };
    });
  }

  var payload = { classes: classSummaries, roster: roster };
  if (cache) {
    try {
      // Shorter TTL as roster and averages can change often
      cache.put(key, JSON.stringify(payload), 120); // 2 minutes
    } catch (e) {}
  }
  return payload;
}

function getClassStudents(user, classId) {
  if (!classId) {
    throw new Error("Class ID is required");
  }

  // ตรวจสอบว่าครูเป็นเจ้าของชั้นเรียนนี้
  const classes = listClasses().filter((k) => k.instructor_id === user.id);
  const targetClass = classes.find((k) => k.id === classId);
  if (!targetClass) {
    throw new Error("Class not found or unauthorized");
  }

  const allStudents = listUsers().filter((u) => u.role === "student" || u.role === "athlete");
  const classStudents = allStudents.filter((s) => s.class_id === classId);
  const allResults = listAllTestResults();

  const tests = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
  const scoreToLevel = (score) => {
    if (score >= 90) return "ดีเยี่ยม";
    if (score >= 80) return "ดี";
    if (score >= 70) return "ปานกลาง";
    return "ต้องพัฒนา";
  };

  const students = classStudents.map((student) => {
    // ดึงผลการทดสอบล่าสุดของแต่ละการทดสอบ
    const testResults = {};
    const latestByTest = {};
    const testScores = {};
    let totalScore = 0;
    let testCount = 0;
    let lastTestDate = null;

    tests.forEach((test) => {
      const latest = latestResultForStudent(allResults, student.id, test);
      if (latest) {
        const rawValue = Number(latest.derived_value || latest.value);
        if (Number.isFinite(rawValue)) {
          testResults[test] = rawValue;
        }
        latestByTest[test] = latest;

        // คำนวณคะแนนจากเกณฑ์ (ตัวอย่าง)
        let score = 0;
        if (test === "bmi") {
          // BMI scoring: 18.5-24.9 = 100, นอกช่วงลดคะแนน
          if (rawValue >= 18.5 && rawValue <= 24.9) score = 100;
          else if (rawValue >= 17 && rawValue < 18.5) score = 80;
          else if (rawValue > 24.9 && rawValue <= 29.9) score = 70;
          else score = 50;
        } else {
          // ตัวอย่างการให้คะแนนการทดสอบอื่นๆ
          score = Math.min(100, Math.max(0, rawValue * 10)); // ปรับตามเกณฑ์จริง
        }

        totalScore += score;
        testCount++;
        testScores[test] = score;

        // อัปเดตวันที่ทดสอบล่าสุด
        const testDate = new Date(latest.recorded_at); // ← ใช้ recorded_at ให้ตรงกับ schema
        if (!lastTestDate || testDate > lastTestDate) {
          lastTestDate = testDate;
        }
      }
    });

    // เลือกข้อมูลสัดส่วนร่างกายล่าสุด (เน้น after หากมี)
    const measurementRecords = listBodyMeasurementsForUser(student.id);
    let latestMeasurementRecord = null;
    if (measurementRecords.length > 0) {
      const afterRecords = measurementRecords.filter((row) => row.phase === "after");
      const pool = afterRecords.length > 0 ? afterRecords : measurementRecords;
      latestMeasurementRecord = pool.reduce((prev, current) => {
        if (!prev) return current;
        const prevTime = new Date(prev.recorded_at || 0).getTime();
        const currentTime = new Date(current.recorded_at || 0).getTime();
        return currentTime > prevTime ? current : prev;
      }, null);
    }

    const measurementPayload = latestMeasurementRecord
      ? mapBodyMeasurementRecordToResponse(latestMeasurementRecord)
      : null;

    const measurementNumber = (value) =>
      value === "" || value === null || value === undefined ? null : Number(value);
    const measurementLookup = (key) =>
      measurementPayload && measurementPayload[key] !== undefined
        ? measurementNumber(measurementPayload[key])
        : null;

    const createFitnessMetric = (testType, fallbackMeasurementKey) => {
      const latest = latestByTest[testType];
      const rawValue = latest ? Number(latest.derived_value || latest.value) : null;
      const measurementValue =
        fallbackMeasurementKey && measurementLookup(fallbackMeasurementKey);
      const value =
        rawValue !== null && Number.isFinite(rawValue)
          ? roundNumber(rawValue, 2)
          : measurementValue !== null && measurementValue !== undefined
            ? roundNumber(Number(measurementValue), 2)
            : null;
      const evaluation =
        (latest && latest.evaluation) ||
        (testScores[testType] !== undefined ? scoreToLevel(testScores[testType]) : "");
      return {
        value,
        evaluation,
      };
    };

    const bmiValue =
      (testResults.bmi !== undefined ? testResults.bmi : null) ??
      measurementLookup("bmi");
    const bodyFat =
      bmiValue !== null && bmiValue !== undefined
        ? Math.max(5, Math.min(50, (bmiValue - 18.5) * 2 + 15))
        : null;
    const muscleMass =
      bodyFat !== null
        ? Math.max(
            20,
            Math.min(
              70,
              student.gender === "male"
                ? 45 - bodyFat * 0.5
                : 35 - bodyFat * 0.4,
            ),
          )
        : null;

    const overallScoreValue = testCount > 0 ? Math.round(totalScore / testCount) : null;
    let performanceLevel = "needs_improvement";
    if (overallScoreValue !== null) {
      if (overallScoreValue >= 90) performanceLevel = "excellent";
      else if (overallScoreValue >= 80) performanceLevel = "good";
      else if (overallScoreValue >= 70) performanceLevel = "average";
    }

    const fitnessMetrics = {
      muscularStrength: createFitnessMetric("hand_grip", "muscularStrength"),
      muscularEndurance: createFitnessMetric("chair_stand", "muscularEndurance"),
      flexibility: createFitnessMetric("sit_and_reach", "flexibility"),
      bodyFat: {
        value: bodyFat !== null ? roundNumber(bodyFat, 1) : null,
        evaluation:
          (latestByTest.bmi && latestByTest.bmi.evaluation) ||
          (testScores.bmi !== undefined ? scoreToLevel(testScores.bmi) : ""),
      },
      cardioRespiratoryEndurance: createFitnessMetric(
        "step_up",
        "cardioRespiratoryEndurance",
      ),
    };

    const bodyMeasurements = measurementPayload
      ? {
          recordedAt: measurementPayload.recordedAt || null,
          phase: measurementPayload.phase || null,
          weight: measurementLookup("weight"),
          height: measurementLookup("height"),
          pulse: measurementLookup("pulse"),
          neck: measurementLookup("neck"),
          shoulderLeft: measurementLookup("shoulderLeft"),
          shoulderRight: measurementLookup("shoulderRight"),
          upperArmLeft: measurementLookup("upperArmLeft"),
          upperArmRight: measurementLookup("upperArmRight"),
          wristLeft: measurementLookup("wristLeft"),
          wristRight: measurementLookup("wristRight"),
          chest: measurementLookup("chest"),
          abdomen: measurementLookup("abdomen"),
          waist: measurementLookup("waist"),
          hip: measurementLookup("hip"),
          thighLeft: measurementLookup("thighLeft"),
          thighRight: measurementLookup("thighRight"),
          calfLeft: measurementLookup("calfLeft"),
          calfRight: measurementLookup("calfRight"),
          ankleLeft: measurementLookup("ankleLeft"),
          ankleRight: measurementLookup("ankleRight"),
        }
      : null;

    return {
      id: student.id,
      fullName: student.full_name,
      email: student.email,
      age: calculateAge(student.birthdate),
      gender: student.gender,
      role: student.role, // Include role for frontend to display badge
      latestBMI:
        bmiValue !== null && bmiValue !== undefined ? roundNumber(bmiValue, 2) : null,
      testResults:
        overallScoreValue !== null
          ? {
              bmi:
                bmiValue !== null && bmiValue !== undefined
                  ? roundNumber(bmiValue, 2)
                  : null,
              bodyFat: bodyFat !== null ? roundNumber(bodyFat, 1) : null,
              muscleMass: muscleMass !== null ? roundNumber(muscleMass, 1) : null,
              overallScore: overallScoreValue,
              lastTestDate: lastTestDate
                ? lastTestDate.toISOString().split("T")[0]
                : null,
            }
          : null,
      performanceLevel,
      fitnessMetrics,
      bodyMeasurements,
    };
  });

  return { students };
}

// ฟังก์ชันช่วยคำนวณอายุจากวันเกิด
function calculateAge(birthdate) {
  if (!birthdate) return 0;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * ดึงรายการเกณฑ์มาตรฐาน (Standards) ตามกลุ่มผู้ใช้งาน (audience)
 * - เปลี่ยนพฤติกรรม: "ตัดการ fallback" กลับไปที่ general เมื่อขอ athlete แล้วไม่มีข้อมูล
 *   เพื่อไม่ให้หน้า "จัดการเกณฑ์นักกีฬา" แสดงข้อมูลของ general โดยไม่ได้ตั้งใจ
 * - ถ้าไม่มี audience ส่งมา จะคืนทั้งหมด (คงพฤติกรรมเดิมสำหรับจุดอื่น ๆ)
 */
function listStandards(audience) {
  // Simple cache wrapper for frequent reads
  var cache;
  try {
    cache = CacheService.getScriptCache();
  } catch (e) {
    cache = null;
  }
  var audienceKey = audience ? String(audience).toLowerCase() : "all";
  var cacheKey = "standards:" + audienceKey;
  if (cache) {
    var cached = cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore parse error and continue
      }
    }
  }

  const sheet = getSheet(SHEET_NAMES.STANDARDS);
  const rows = readRows(sheet, HEADERS.Standards);

  // map คอลัมน์จากชีตให้เป็นโครงสร้างที่ frontend ใช้
  const mapped = rows.map((row) => ({
    id: row.id,
    testType: row.test_type,
    gender: normalizeGender(row.gender),
    ageMin: Number(row.age_min),
    ageMax: Number(row.age_max),
    category: row.category,
    minValue: row.min_value === "" ? null : Number(row.min_value),
    maxValue: row.max_value === "" ? null : Number(row.max_value),
    comparison: row.comparison || "range",
    // ถ้าไม่มีค่า ให้ถือเป็น "general" (ใช้สำหรับหน้าเกณฑ์ทั่วไป)
    audience: row.audience || "general",
  }));

  // ถ้าไม่ได้ระบุ audience ให้คืนทั้งหมด (ใช้งานบางจุดที่ต้องการรายการรวม)
  if (!audience) {
    if (cache) {
      try {
        cache.put(cacheKey, JSON.stringify(mapped), 300); // cache 5 minutes
      } catch (e) {}
    }
    return mapped;
  }

  // กรองแบบเข้มงวด: ต้องตรงกับ audience ที่ขอเท่านั้น
  // หมายเหตุ: ไม่ fallback ไปยัง "general" เพื่อไม่ให้ athlete เห็นข้อมูล general
  const desired = String(audience).toLowerCase();
  const filtered = mapped.filter((r) => (r.audience || "general").toLowerCase() === desired);
  if (cache) {
    try {
      cache.put(cacheKey, JSON.stringify(filtered), 300); // cache 5 minutes
    } catch (e) {}
  }
  return filtered;
}

function createStandard(user, standardData) {
  if (user.role !== "instructor") {
    throw new Error("Only instructors can create standards");
  }

  const newStandard = {
    id: generateId(),
    test_type: standardData.testType,
    gender: standardData.gender,
    age_min: standardData.ageMin || 0,
    age_max: standardData.ageMax || 999,
    category: standardData.category,
    min_value: standardData.minValue,
    max_value: standardData.maxValue,
    comparison: standardData.comparison || "range",
    audience: standardData.audience || "general",
  };

  // fix: ส่ง sheetName แทน sheet object
  appendRow(SHEET_NAMES.STANDARDS, HEADERS.Standards, newStandard);
  return { id: newStandard.id, success: true };
}

function updateStandard(user, standardData) {
  if (user.role !== "instructor") {
    throw new Error("Only instructors can update standards");
  }

  const sheet = getSheet(SHEET_NAMES.STANDARDS);
  const headers = HEADERS.Standards;
  const rows = sheet.getDataRange().getValues();
  
  // หา row ที่ต้องอัปเดต
  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) { // เริ่มจาก 1 เพื่อข้าม header
    if (rows[i][headers.indexOf("id")] === standardData.id) {
      targetRowIndex = i + 1; // +1 เพราะ Google Sheets index เริ่มจาก 1
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error("Standard not found");
  }

  // อัปเดตข้อมูล
  const updatedData = {
    id: standardData.id,
    test_type: standardData.testType,
    gender: standardData.gender,
    age_min: standardData.ageMin || 0,
    age_max: standardData.ageMax || 999,
    category: standardData.category,
    min_value: standardData.minValue,
    max_value: standardData.maxValue,
    comparison: standardData.comparison || "range",
    audience: standardData.audience,
  };

  headers.forEach((header, index) => {
    if (updatedData[header] !== undefined) {
      sheet.getRange(targetRowIndex, index + 1).setValue(updatedData[header]);
    }
  });

  return { success: true };
}

function deleteStandard(user, standardId) {
  if (user.role !== "instructor") {
    throw new Error("Only instructors can delete standards");
  }

  if (!standardId) {
    throw new Error("Standard ID is required");
  }

  const sheet = getSheet(SHEET_NAMES.STANDARDS);
  const headers = HEADERS.Standards;
  const rows = sheet.getDataRange().getValues();
  
  // หา row ที่ต้องลบ
  let targetRowIndex = -1;
  for (let i = 1; i < rows.length; i++) { // เริ่มจาก 1 เพื่อข้าม header
    if (rows[i][headers.indexOf("id")] === standardId) {
      targetRowIndex = i + 1; // +1 เพราะ Google Sheets index เริ่มจาก 1
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error("Standard not found");
  }

  // ลบ row
  sheet.deleteRow(targetRowIndex);
  return { success: true };
}

function latestResultForStudent(results, userId, testType) {
  return results
    .filter((r) => r.user_id === userId && r.test_type === testType)
    .sort(
      (a, b) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    )[0];
}

function sanitizeUser(user) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.full_name,
    email: user.email,
    gender: normalizeGender(user.gender),
    birthdate: user.birthdate,
    classId: user.class_id,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

function updateUserClass(userId, classId) {
  const sheet = getSheet(SHEET_NAMES.USERS);
  const headers = HEADERS.Users;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) throw new Error("ไม่พบผู้ใช้ที่ต้องการอัปเดต");

  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = range.getValues();

  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === userId) {
      values[i][7] = classId; // class_id
      values[i][9] = new Date().toISOString(); // updated_at
      sheet.getRange(i + 2, 1, 1, headers.length).setValues([values[i]]);
      return;
    }
  }
  throw new Error("ไม่พบผู้ใช้ที่ต้องการอัปเดต");
}

function listUsers() {
  const sheet = getSheet(SHEET_NAMES.USERS);
  return readRows(sheet, HEADERS.Users);
}
function listClasses() {
  const sheet = getSheet(SHEET_NAMES.CLASSES);
  return readRows(sheet, HEADERS.Classes);
}
function listAllTestResults() {
  const sheet = getSheet(SHEET_NAMES.TEST_RESULTS);
  return readRows(sheet, HEADERS.TestResults);
}
function listTestResultsForUser(userId) {
  return listAllTestResults()
    .filter((row) => row.user_id === userId)
    .sort(
      (a, b) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );
}
function listAllBodyMeasurements() {
  try {
    const sheet = getSheet(SHEET_NAMES.BODY_MEASUREMENTS);
    ensureSheetHasHeaders(sheet, HEADERS.BodyMeasurements);
    return readRows(sheet, HEADERS.BodyMeasurements);
  } catch (error) {
    Logger.log(`BodyMeasurements sheet unavailable: ${error.message}`);
    return [];
  }
}
function listBodyMeasurementsForUser(userId) {
  return listAllBodyMeasurements().filter((row) => row.user_id === userId);
}
function findUserById(userId) {
  return listUsers().find((row) => row.id === userId);
}
function findClassByCode(classCode) {
  const normalized = String(classCode).trim().toUpperCase();
  return listClasses().find((k) => String(k.class_code).toUpperCase() === normalized);
}

function appendRow(sheetName, headers, rowObject) {
  const sheet = getSheet(sheetName);
  ensureSheetHasHeaders(sheet, headers);
  const row = headers.map((h) => (rowObject[h] !== undefined ? rowObject[h] : ""));
  sheet.appendRow(row);
}

function readRows(sheet, headers) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const range = sheet.getRange(2, 1, lastRow - 1, headers.length);
  const values = range.getValues();
  return values.map((row) => {
    const record = {};
    headers.forEach((header, i) => {
      record[header] = row[i];
    });
    return record;
  });
}

function ensureSheetHasHeaders(sheet, headers) {
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(headers);
    return;
  }
  const existingCols = sheet.getLastColumn();
  const readCols = Math.max(1, Math.min(existingCols, headers.length));
  const firstRow = sheet.getRange(1, 1, 1, readCols).getValues()[0];
  const hasAnyData = firstRow.some((cell) => String(cell || "").trim() !== "");

  // Check if existing header is a prefix of new headers (header extension case)
  const isPrefixMatch = firstRow.every((cell, idx) => cell === headers[idx]);

  if (isPrefixMatch) {
    // Update header row in place to new headers (extends columns without shifting data)
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }

  // Fallback to original logic using exact comparison
  const fullFirstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isHeader = headers.every((header, index) => fullFirstRow[index] === header);
  if (!isHeader) {
    if (!hasAnyData) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      sheet.insertRowBefore(1);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }
}

function roundNumber(value, precision) {
  const factor = Math.pow(10, precision || 2);
  return Math.round(Number(value) * factor) / factor;
}

function composeNotes(current, addition) {
  if (!addition) return current;
  if (!current) return addition;
  return `${current} | ${addition}`;
}

function generateClassCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function findStandardMatch(standards, testType, gender, age, value) {
  const g = normalizeGender(gender);
  const candidates = standards.filter(
    (row) =>
      row.testType === testType &&
      normalizeGender(row.gender) === g &&
      age >= row.ageMin &&
      age <= row.ageMax,
  );
  for (let i = 0; i < candidates.length; i++) {
    const row = candidates[i];
    if (row.comparison === "threshold") {
      if (row.minValue !== null && row.maxValue === null && value >= row.minValue) return row;
      if (row.maxValue !== null && row.minValue === null && value <= row.maxValue) return row;
    } else {
      const min = row.minValue !== null ? row.minValue : -Infinity;
      const max = row.maxValue !== null ? row.maxValue : Infinity;
      if (value >= min && value <= max) return row;
    }
  }
  return null;
}

/**
 * Populate the Standards sheet using the dataset below.
 * Run this function manually after creating the Spreadsheet.
 */
function initializeStandards() {
  const sheet = getSheet(SHEET_NAMES.STANDARDS);
  sheet.clear();
  sheet.appendRow(HEADERS.Standards);

  const rows = [];
  STANDARD_DATA.forEach((entry) => {
    entry.bands.forEach((band) => {
      rows.push([
        generateId(),
        entry.testType,
        entry.gender, // already normalized 'male'|'female'
        entry.ageMin,
        entry.ageMax,
        band.category,
        band.min == null ? "" : band.min,
        band.max == null ? "" : band.max,
        band.min != null && band.max != null ? "range" : "threshold",
        "general",
      ]);
    });
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, HEADERS.Standards.length).setValues(rows);
  }
}

/**
 * เติม "เกณฑ์นักกีฬา" (audience = 'athlete') จาก STANDARD_DATA โดยทำให้เข้มงวดขึ้นเล็กน้อย
 * หลักการแบบง่าย:
 * - ถ้า band มีทั้ง min และ max (ช่วง): จะ "บีบช่วง" เข้าด้านในข้างละ 5% (รวมแคบลง ~10%)
 * - ถ้าเป็น threshold (มี min อย่างเดียว หรือ max อย่างเดียว): คงเดิม (ไม่ปรับ) เพื่อเลี่ยงการทับซ้อนผิดพลาด
 * การทำงานถูกออกแบบให้ไม่ซ้ำซ้อน: ถ้าพบว่าในชีตมี audience='athlete' แล้ว จะไม่ทำซ้ำอีก
 */
function seedAthleteStandards() {
  const sheet = getSheet(SHEET_NAMES.STANDARDS);
  ensureSheetHasHeaders(sheet, HEADERS.Standards);

  // อ่านข้อมูลเดิมเพื่อตรวจว่ามี athlete อยู่แล้วหรือยัง
  const existing = readRows(sheet, HEADERS.Standards);
  const hasAthlete = existing.some((r) => (r.audience || "general") === "athlete");
  if (hasAthlete) {
    try { SpreadsheetApp.getActive().toast("พบเกณฑ์นักกีฬาอยู่แล้ว – ข้ามการ seed"); } catch (_) {}
    Logger.log("[seedAthleteStandards] Skip: athlete standards already exist.");
    return;
  }

  const tightenRange = (min, max) => {
    if (min == null || max == null) return { min, max };
    const width = Number(max) - Number(min);
    if (!isFinite(width) || width <= 0) return { min, max };
    const newMin = roundNumber(Number(min) + width * 0.05, 2); // บีบเข้ามา 5%
    const newMax = roundNumber(Number(max) - width * 0.05, 2); // บีบเข้ามา 5%
    // ป้องกันชนกันกลับด้าน
    if (newMin >= newMax) return { min, max };
    return { min: newMin, max: newMax };
  };

  const rows = [];
  STANDARD_DATA.forEach((entry) => {
    entry.bands.forEach((band) => {
      const { min, max } = tightenRange(band.min, band.max);
      rows.push([
        generateId(),
        entry.testType,
        entry.gender, // 'male' | 'female'
        entry.ageMin,
        entry.ageMax,
        band.category,
        min == null ? "" : min,
        max == null ? "" : max,
        min != null && max != null ? "range" : "threshold",
        "athlete",
      ]);
    });
  });

  if (rows.length) {
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, HEADERS.Standards.length).setValues(rows);
  }

  try { SpreadsheetApp.getActive().toast("Seed Athlete Standards สำเร็จ"); } catch (_) {}
  Logger.log(`[seedAthleteStandards] Inserted ${rows.length} rows for audience=athlete.`);
}

/**
 * Standards dataset (cleaned; gender normalized to 'male'/'female')
 * Values inclusive; null min/max means unbounded one-side threshold.
 */
const STANDARD_DATA = [
  // ===================== BMI – Female =====================
  createBands("bmi", "female", 19, 24, [
    { category: "อ้วน", min: 28.64, max: null },
    { category: "ท้วม", min: 23.9, max: 28.63 },
    { category: "สมส่วน", min: 19.16, max: 23.89 },
    { category: "ผอม", min: 13.6, max: 19.15 },
    { category: "ผอมมาก", min: null, max: 13.59 },
  ]),
  createBands("bmi", "female", 25, 29, [
    { category: "อ้วน", min: 31.92, max: null },
    { category: "ท้วม", min: 26.54, max: 31.91 },
    { category: "สมส่วน", min: 21.2, max: 26.53 },
    { category: "ผอม", min: 13.68, max: 21.19 },
    { category: "ผอมมาก", min: null, max: 13.67 },
  ]),
  createBands("bmi", "female", 30, 34, [
    { category: "อ้วน", min: 32.19, max: null },
    { category: "ท้วม", min: 26.64, max: 32.18 },
    { category: "สมส่วน", min: 21.09, max: 26.63 },
    { category: "ผอม", min: 13.72, max: 21.08 },
    { category: "ผอมมาก", min: null, max: 13.71 },
  ]),
  createBands("bmi", "female", 35, 39, [
    { category: "อ้วน", min: 32.85, max: null },
    { category: "ท้วม", min: 26.85, max: 32.84 },
    { category: "สมส่วน", min: 20.82, max: 26.84 },
    { category: "ผอม", min: 14.23, max: 20.81 },
    { category: "ผอมมาก", min: null, max: 14.22 },
  ]),
  createBands("bmi", "female", 40, 44, [
    { category: "อ้วน", min: 31.94, max: null },
    { category: "ท้วม", min: 26.6, max: 31.93 },
    { category: "สมส่วน", min: 21.31, max: 26.59 },
    { category: "ผอม", min: 14.37, max: 21.3 },
    { category: "ผอมมาก", min: null, max: 14.36 },
  ]),
  createBands("bmi", "female", 45, 49, [
    { category: "อ้วน", min: 31.65, max: null },
    { category: "ท้วม", min: 26.2, max: 31.64 },
    { category: "สมส่วน", min: 20.41, max: 26.19 },
    { category: "ผอม", min: 14.52, max: 20.4 },
    { category: "ผอมมาก", min: null, max: 14.51 },
  ]),
  createBands("bmi", "female", 50, 54, [
    { category: "อ้วน", min: 31.49, max: null },
    { category: "ท้วม", min: 26.96, max: 31.48 },
    { category: "สมส่วน", min: 22.52, max: 26.95 },
    { category: "ผอม", min: 14.89, max: 22.51 },
    { category: "ผอมมาก", min: null, max: 14.88 },
  ]),
  createBands("bmi", "female", 55, 59, [
    { category: "อ้วน", min: 31.23, max: null },
    { category: "ท้วม", min: 26.81, max: 31.22 },
    { category: "สมส่วน", min: 21.84, max: 26.8 },
    { category: "ผอม", min: 14.99, max: 21.83 },
    { category: "ผอมมาก", min: null, max: 14.98 },
  ]),

  // ===================== BMI – Male =====================
  createBands("bmi", "male", 19, 24, [
    { category: "อ้วน", min: 29.42, max: null },
    { category: "ท้วม", min: 24.85, max: 29.41 },
    { category: "สมส่วน", min: 20.26, max: 24.84 },
    { category: "ผอม", min: 13.95, max: 20.25 },
    { category: "ผอมมาก", min: null, max: 13.94 },
  ]),
  createBands("bmi", "male", 25, 29, [
    { category: "อ้วน", min: 30.31, max: null },
    { category: "ท้วม", min: 25.66, max: 30.3 },
    { category: "สมส่วน", min: 21, max: 25.65 },
    { category: "ผอม", min: 13.92, max: 20.99 },
    { category: "ผอมมาก", min: null, max: 13.91 },
  ]),
  createBands("bmi", "male", 30, 34, [
    { category: "อ้วน", min: 31.19, max: null },
    { category: "ท้วม", min: 26.24, max: 31.18 },
    { category: "สมส่วน", min: 21.13, max: 26.23 },
    { category: "ผอม", min: 14.14, max: 21.12 },
    { category: "ผอมมาก", min: null, max: 14.13 },
  ]),
  createBands("bmi", "male", 35, 39, [
    { category: "อ้วน", min: 31.22, max: null },
    { category: "ท้วม", min: 26.27, max: 31.21 },
    { category: "สมส่วน", min: 21.31, max: 26.26 },
    { category: "ผอม", min: 14.21, max: 21.3 },
    { category: "ผอมมาก", min: null, max: 14.2 },
  ]),
  createBands("bmi", "male", 40, 44, [
    { category: "อ้วน", min: 31.23, max: null },
    { category: "ท้วม", min: 26.31, max: 31.22 },
    { category: "สมส่วน", min: 21.38, max: 26.3 },
    { category: "ผอม", min: 14.28, max: 21.37 },
    { category: "ผอมมาก", min: null, max: 14.27 },
  ]),
  createBands("bmi", "male", 45, 49, [
    { category: "อ้วน", min: 31.37, max: null },
    { category: "ท้วม", min: 26.41, max: 31.36 },
    { category: "สมส่วน", min: 21.43, max: 26.4 },
    { category: "ผอม", min: 14.64, max: 21.42 },
    { category: "ผอมมาก", min: null, max: 14.63 },
  ]),
  createBands("bmi", "male", 50, 54, [
    { category: "อ้วน", min: 31.75, max: null },
    { category: "ท้วม", min: 26.63, max: 31.74 },
    { category: "สมส่วน", min: 21.42, max: 26.62 },
    { category: "ผอม", min: 14.66, max: 21.41 },
    { category: "ผอมมาก", min: null, max: 14.65 },
  ]),
  createBands("bmi", "male", 55, 59, [
    { category: "อ้วน", min: 31.83, max: null },
    { category: "ท้วม", min: 26.58, max: 31.82 },
    { category: "สมส่วน", min: 21.34, max: 26.57 },
    { category: "ผอม", min: 14.75, max: 21.33 },
    { category: "ผอมมาก", min: null, max: 14.74 },
  ]),

  // ===================== Sit and Reach – Female =====================
  createBands("sit_and_reach", "female", 19, 24, [
    { category: "ดีมาก", min: 27, max: null },
    { category: "ดี", min: 20, max: 26 },
    { category: "ปานกลาง", min: 13, max: 19 },
    { category: "ต่ำ", min: 5, max: 12 },
    { category: "ต่ำมาก", min: null, max: 4 },
  ]),
  createBands("sit_and_reach", "female", 25, 29, [
    { category: "ดีมาก", min: 26, max: null },
    { category: "ดี", min: 19, max: 25 },
    { category: "ปานกลาง", min: 12, max: 18 },
    { category: "ต่ำ", min: 4, max: 11 },
    { category: "ต่ำมาก", min: null, max: 3 },
  ]),
  createBands("sit_and_reach", "female", 30, 34, [
    { category: "ดีมาก", min: 23, max: null },
    { category: "ดี", min: 17, max: 22 },
    { category: "ปานกลาง", min: 10, max: 16 },
    { category: "ต่ำ", min: 3, max: 9 },
    { category: "ต่ำมาก", min: null, max: 2 },
  ]),
  createBands("sit_and_reach", "female", 35, 39, [
    { category: "ดีมาก", min: 22, max: null },
    { category: "ดี", min: 15, max: 21 },
    { category: "ปานกลาง", min: 8, max: 14 },
    { category: "ต่ำ", min: 1, max: 7 },
    { category: "ต่ำมาก", min: null, max: 0 },
  ]),
  createBands("sit_and_reach", "female", 40, 44, [
    { category: "ดีมาก", min: 21, max: null },
    { category: "ดี", min: 14, max: 20 },
    { category: "ปานกลาง", min: 6, max: 13 },
    { category: "ต่ำ", min: -1, max: 5 },
    { category: "ต่ำมาก", min: null, max: -2 },
  ]),
  createBands("sit_and_reach", "female", 45, 49, [
    { category: "ดีมาก", min: 20, max: null },
    { category: "ดี", min: 13, max: 19 },
    { category: "ปานกลาง", min: 6, max: 12 },
    { category: "ต่ำ", min: -1, max: 5 },
    { category: "ต่ำมาก", min: null, max: -2 },
  ]),
  createBands("sit_and_reach", "female", 50, 54, [
    { category: "ดีมาก", min: 18, max: null },
    { category: "ดี", min: 11, max: 17 },
    { category: "ปานกลาง", min: 4, max: 10 },
    { category: "ต่ำ", min: -2, max: 3 },
    { category: "ต่ำมาก", min: null, max: -3 },
  ]),
  createBands("sit_and_reach", "female", 55, 59, [
    { category: "ดีมาก", min: 18, max: null },
    { category: "ดี", min: 11, max: 17 },
    { category: "ปานกลาง", min: 4, max: 10 },
    { category: "ต่ำ", min: -3, max: 3 },
    { category: "ต่ำมาก", min: null, max: -4 },
  ]),

  // ===================== Sit and Reach – Male =====================
  createBands("sit_and_reach", "male", 19, 24, [
    { category: "ดีมาก", min: 24, max: null },
    { category: "ดี", min: 17, max: 23 },
    { category: "ปานกลาง", min: 9, max: 16 },
    { category: "ต่ำ", min: 2, max: 8 },
    { category: "ต่ำมาก", min: null, max: 1 },
  ]),
  createBands("sit_and_reach", "male", 25, 29, [
    { category: "ดีมาก", min: 23, max: null },
    { category: "ดี", min: 16, max: 22 },
    { category: "ปานกลาง", min: 9, max: 15 },
    { category: "ต่ำ", min: 2, max: 8 },
    { category: "ต่ำมาก", min: null, max: 1 },
  ]),
  createBands("sit_and_reach", "male", 30, 34, [
    { category: "ดีมาก", min: 22, max: null },
    { category: "ดี", min: 15, max: 21 },
    { category: "ปานกลาง", min: 8, max: 14 },
    { category: "ต่ำ", min: 1, max: 7 },
    { category: "ต่ำมาก", min: null, max: 0 },
  ]),
  createBands("sit_and_reach", "male", 35, 39, [
    { category: "ดีมาก", min: 22, max: null },
    { category: "ดี", min: 15, max: 21 },
    { category: "ปานกลาง", min: 7, max: 14 },
    { category: "ต่ำ", min: 0, max: 6 },
    { category: "ต่ำมาก", min: null, max: -1 },
  ]),
  createBands("sit_and_reach", "male", 40, 44, [
    { category: "ดีมาก", min: 20, max: null },
    { category: "ดี", min: 13, max: 19 },
    { category: "ปานกลาง", min: 6, max: 12 },
    { category: "ต่ำ", min: -1, max: 5 },
    { category: "ต่ำมาก", min: null, max: -2 },
  ]),
  createBands("sit_and_reach", "male", 45, 49, [
    { category: "ดีมาก", min: 19, max: null },
    { category: "ดี", min: 12, max: 18 },
    { category: "ปานกลาง", min: 4, max: 11 },
    { category: "ต่ำ", min: -3, max: 3 },
    { category: "ต่ำมาก", min: null, max: -4 },
  ]),
  createBands("sit_and_reach", "male", 50, 54, [
    { category: "ดีมาก", min: 18, max: null },
    { category: "ดี", min: 11, max: 17 },
    { category: "ปานกลาง", min: 3, max: 10 },
    { category: "ต่ำ", min: -4, max: 2 },
    { category: "ต่ำมาก", min: null, max: -5 },
  ]),
  createBands("sit_and_reach", "male", 55, 59, [
    { category: "ดีมาก", min: 17, max: null },
    { category: "ดี", min: 10, max: 16 },
    { category: "ปานกลาง", min: 2, max: 9 },
    { category: "ต่ำ", min: -5, max: 1 },
    { category: "ต่ำมาก", min: null, max: -6 },
  ]),

  // ===================== Hand Grip Strength – Male =====================
  createBands("hand_grip", "male", 19, 24, [
    { category: "ดีมาก", min: 0.8, max: null },
    { category: "ดี", min: 0.7, max: 0.79 },
    { category: "ปานกลาง", min: 0.61, max: 0.69 },
    { category: "ต่ำ", min: 0.51, max: 0.6 },
    { category: "ต่ำมาก", min: null, max: 0.5 },
  ]),
  createBands("hand_grip", "male", 25, 29, [
    { category: "ดีมาก", min: 0.81, max: null },
    { category: "ดี", min: 0.71, max: 0.8 },
    { category: "ปานกลาง", min: 0.62, max: 0.7 },
    { category: "ต่ำ", min: 0.52, max: 0.61 },
    { category: "ต่ำมาก", min: null, max: 0.51 },
  ]),
  createBands("hand_grip", "male", 30, 34, [
    { category: "ดีมาก", min: 0.8, max: null },
    { category: "ดี", min: 0.71, max: 0.79 },
    { category: "ปานกลาง", min: 0.62, max: 0.7 },
    { category: "ต่ำ", min: 0.53, max: 0.61 },
    { category: "ต่ำมาก", min: null, max: 0.52 },
  ]),
  createBands("hand_grip", "male", 35, 39, [
    { category: "ดีมาก", min: 0.78, max: null },
    { category: "ดี", min: 0.69, max: 0.77 },
    { category: "ปานกลาง", min: 0.6, max: 0.68 },
    { category: "ต่ำ", min: 0.51, max: 0.59 },
    { category: "ต่ำมาก", min: null, max: 0.5 },
  ]),
  createBands("hand_grip", "male", 40, 44, [
    { category: "ดีมาก", min: 0.73, max: null },
    { category: "ดี", min: 0.63, max: 0.72 },
    { category: "ปานกลาง", min: 0.52, max: 0.62 },
    { category: "ต่ำ", min: 0.42, max: 0.51 },
    { category: "ต่ำมาก", min: null, max: 0.41 },
  ]),
  createBands("hand_grip", "male", 45, 49, [
    { category: "ดีมาก", min: 0.72, max: null },
    { category: "ดี", min: 0.61, max: 0.71 },
    { category: "ปานกลาง", min: 0.5, max: 0.6 },
    { category: "ต่ำ", min: 0.37, max: 0.49 },
    { category: "ต่ำมาก", min: null, max: 0.36 },
  ]),
  createBands("hand_grip", "male", 50, 54, [
    { category: "ดีมาก", min: 0.69, max: null },
    { category: "ดี", min: 0.59, max: 0.68 },
    { category: "ปานกลาง", min: 0.48, max: 0.58 },
    { category: "ต่ำ", min: 0.36, max: 0.47 },
    { category: "ต่ำมาก", min: null, max: 0.35 },
  ]),
  createBands("hand_grip", "male", 55, 59, [
    { category: "ดีมาก", min: 0.69, max: null },
    { category: "ดี", min: 0.58, max: 0.68 },
    { category: "ปานกลาง", min: 0.47, max: 0.57 },
    { category: "ต่ำ", min: 0.35, max: 0.46 },
    { category: "ต่ำมาก", min: null, max: 0.34 },
  ]),

  // ===================== Hand Grip Strength – Female =====================
  createBands("hand_grip", "female", 19, 24, [
    { category: "ดีมาก", min: 0.64, max: null },
    { category: "ดี", min: 0.56, max: 0.63 },
    { category: "ปานกลาง", min: 0.49, max: 0.55 },
    { category: "ต่ำ", min: 0.41, max: 0.48 },
    { category: "ต่ำมาก", min: null, max: 0.4 },
  ]),
  createBands("hand_grip", "female", 25, 29, [
    { category: "ดีมาก", min: 0.68, max: null },
    { category: "ดี", min: 0.59, max: 0.67 },
    { category: "ปานกลาง", min: 0.5, max: 0.58 },
    { category: "ต่ำ", min: 0.41, max: 0.49 },
    { category: "ต่ำมาก", min: null, max: 0.4 },
  ]),
  createBands("hand_grip", "female", 30, 34, [
    { category: "ดีมาก", min: 0.69, max: null },
    { category: "ดี", min: 0.63, max: 0.68 },
    { category: "ปานกลาง", min: 0.53, max: 0.62 },
    { category: "ต่ำ", min: 0.43, max: 0.52 },
    { category: "ต่ำมาก", min: null, max: 0.42 },
  ]),
  createBands("hand_grip", "female", 35, 39, [
    { category: "ดีมาก", min: 0.63, max: null },
    { category: "ดี", min: 0.55, max: 0.62 },
    { category: "ปานกลาง", min: 0.46, max: 0.54 },
    { category: "ต่ำ", min: 0.38, max: 0.45 },
    { category: "ต่ำมาก", min: null, max: 0.37 },
  ]),
  createBands("hand_grip", "female", 40, 44, [
    { category: "ดีมาก", min: 0.62, max: null },
    { category: "ดี", min: 0.54, max: 0.61 },
    { category: "ปานกลาง", min: 0.45, max: 0.53 },
    { category: "ต่ำ", min: 0.37, max: 0.44 },
    { category: "ต่ำมาก", min: null, max: 0.36 },
  ]),
  createBands("hand_grip", "female", 45, 49, [
    { category: "ดีมาก", min: 0.61, max: null },
    { category: "ดี", min: 0.53, max: 0.6 },
    { category: "ปานกลาง", min: 0.44, max: 0.52 },
    { category: "ต่ำ", min: 0.36, max: 0.43 },
    { category: "ต่ำมาก", min: null, max: 0.35 },
  ]),
  createBands("hand_grip", "female", 50, 54, [
    { category: "ดีมาก", min: 0.54, max: null },
    { category: "ดี", min: 0.47, max: 0.53 },
    { category: "ปานกลาง", min: 0.4, max: 0.46 },
    { category: "ต่ำ", min: 0.33, max: 0.39 },
    { category: "ต่ำมาก", min: null, max: 0.32 },
  ]),
  createBands("hand_grip", "female", 55, 59, [
    { category: "ดีมาก", min: 0.52, max: null },
    { category: "ดี", min: 0.46, max: 0.51 },
    { category: "ปานกลาง", min: 0.39, max: 0.45 },
    { category: "ต่ำ", min: 0.31, max: 0.38 },
    { category: "ต่ำมาก", min: null, max: 0.3 },
  ]),

  // ===================== Chair Stand – Male =====================
  createBands("chair_stand", "male", 19, 24, [
    { category: "ดีมาก", min: 54, max: null },
    { category: "ดี", min: 46, max: 53 },
    { category: "ปานกลาง", min: 39, max: 45 },
    { category: "ต่ำ", min: 32, max: 38 },
    { category: "ต่ำมาก", min: null, max: 31 },
  ]),
  createBands("chair_stand", "male", 25, 29, [
    { category: "ดีมาก", min: 53, max: null },
    { category: "ดี", min: 47, max: 52 },
    { category: "ปานกลาง", min: 39, max: 46 },
    { category: "ต่ำ", min: 31, max: 38 },
    { category: "ต่ำมาก", min: null, max: 30 },
  ]),
  createBands("chair_stand", "male", 30, 34, [
    { category: "ดีมาก", min: 52, max: null },
    { category: "ดี", min: 43, max: 51 },
    { category: "ปานกลาง", min: 34, max: 42 },
    { category: "ต่ำ", min: 26, max: 33 },
    { category: "ต่ำมาก", min: null, max: 25 },
  ]),
  createBands("chair_stand", "male", 35, 39, [
    { category: "ดีมาก", min: 50, max: null },
    { category: "ดี", min: 42, max: 49 },
    { category: "ปานกลาง", min: 34, max: 41 },
    { category: "ต่ำ", min: 25, max: 33 },
    { category: "ต่ำมาก", min: null, max: 24 },
  ]),
  createBands("chair_stand", "male", 40, 44, [
    { category: "ดีมาก", min: 48, max: null },
    { category: "ดี", min: 41, max: 47 },
    { category: "ปานกลาง", min: 33, max: 40 },
    { category: "ต่ำ", min: 25, max: 32 },
    { category: "ต่ำมาก", min: null, max: 24 },
  ]),
  createBands("chair_stand", "male", 45, 49, [
    { category: "ดีมาก", min: 46, max: null },
    { category: "ดี", min: 38, max: 45 },
    { category: "ปานกลาง", min: 30, max: 37 },
    { category: "ต่ำ", min: 23, max: 29 },
    { category: "ต่ำมาก", min: null, max: 22 },
  ]),
  createBands("chair_stand", "male", 50, 54, [
    { category: "ดีมาก", min: 43, max: null },
    { category: "ดี", min: 36, max: 42 },
    { category: "ปานกลาง", min: 28, max: 35 },
    { category: "ต่ำ", min: 20, max: 27 },
    { category: "ต่ำมาก", min: null, max: 19 },
  ]),
  createBands("chair_stand", "male", 55, 59, [
    { category: "ดีมาก", min: 41, max: null },
    { category: "ดี", min: 34, max: 40 },
    { category: "ปานกลาง", min: 26, max: 33 },
    { category: "ต่ำ", min: 19, max: 25 },
    { category: "ต่ำมาก", min: null, max: 18 },
  ]),

  // ===================== Chair Stand – Female =====================
  createBands("chair_stand", "female", 19, 24, [
    { category: "ดีมาก", min: 49, max: null },
    { category: "ดี", min: 41, max: 48 },
    { category: "ปานกลาง", min: 33, max: 40 },
    { category: "ต่ำ", min: 25, max: 32 },
    { category: "ต่ำมาก", min: null, max: 24 },
  ]),
  createBands("chair_stand", "female", 25, 29, [
    { category: "ดีมาก", min: 46, max: null },
    { category: "ดี", min: 39, max: 45 },
    { category: "ปานกลาง", min: 31, max: 38 },
    { category: "ต่ำ", min: 24, max: 30 },
    { category: "ต่ำมาก", min: null, max: 23 },
  ]),
  createBands("chair_stand", "female", 30, 34, [
    { category: "ดีมาก", min: 45, max: null },
    { category: "ดี", min: 38, max: 44 },
    { category: "ปานกลาง", min: 30, max: 37 },
    { category: "ต่ำ", min: 23, max: 29 },
    { category: "ต่ำมาก", min: null, max: 22 },
  ]),
  createBands("chair_stand", "female", 35, 39, [
    { category: "ดีมาก", min: 43, max: null },
    { category: "ดี", min: 36, max: 42 },
    { category: "ปานกลาง", min: 29, max: 35 },
    { category: "ต่ำ", min: 22, max: 28 },
    { category: "ต่ำมาก", min: null, max: 21 },
  ]),
  createBands("chair_stand", "female", 40, 44, [
    { category: "ดีมาก", min: 41, max: null },
    { category: "ดี", min: 34, max: 40 },
    { category: "ปานกลาง", min: 27, max: 33 },
    { category: "ต่ำ", min: 21, max: 26 },
    { category: "ต่ำมาก", min: null, max: 20 },
  ]),
  createBands("chair_stand", "female", 45, 49, [
    { category: "ดีมาก", min: 36, max: null },
    { category: "ดี", min: 29, max: 35 },
    { category: "ปานกลาง", min: 23, max: 28 },
    { category: "ต่ำ", min: 17, max: 22 },
    { category: "ต่ำมาก", min: null, max: 16 },
  ]),
  createBands("chair_stand", "female", 50, 54, [
    { category: "ดีมาก", min: 31, max: null },
    { category: "ดี", min: 25, max: 30 },
    { category: "ปานกลาง", min: 19, max: 24 },
    { category: "ต่ำ", min: 13, max: 18 },
    { category: "ต่ำมาก", min: null, max: 12 },
  ]),
  createBands("chair_stand", "female", 55, 59, [
    { category: "ดีมาก", min: 30, max: null },
    { category: "ดี", min: 24, max: 29 },
    { category: "ปานกลาง", min: 18, max: 23 },
    { category: "ต่ำ", min: 12, max: 17 },
    { category: "ต่ำมาก", min: null, max: 11 },
  ]),

  // ===================== Step Up and Down – Male =====================
  createBands("step_up", "male", 19, 24, [
    { category: "ดีมาก", min: 187, max: null },
    { category: "ดี", min: 164, max: 186 },
    { category: "ปานกลาง", min: 141, max: 163 },
    { category: "ต่ำ", min: 118, max: 140 },
    { category: "ต่ำมาก", min: null, max: 117 },
  ]),
  createBands("step_up", "male", 25, 29, [
    { category: "ดีมาก", min: 184, max: null },
    { category: "ดี", min: 161, max: 183 },
    { category: "ปานกลาง", min: 138, max: 160 },
    { category: "ต่ำ", min: 114, max: 137 },
    { category: "ต่ำมาก", min: null, max: 113 },
  ]),
  createBands("step_up", "male", 30, 34, [
    { category: "ดีมาก", min: 181, max: null },
    { category: "ดี", min: 158, max: 180 },
    { category: "ปานกลาง", min: 134, max: 157 },
    { category: "ต่ำ", min: 111, max: 133 },
    { category: "ต่ำมาก", min: null, max: 110 },
  ]),
  createBands("step_up", "male", 35, 39, [
    { category: "ดีมาก", min: 179, max: null },
    { category: "ดี", min: 155, max: 178 },
    { category: "ปานกลาง", min: 132, max: 154 },
    { category: "ต่ำ", min: 108, max: 131 },
    { category: "ต่ำมาก", min: null, max: 107 },
  ]),
  createBands("step_up", "male", 40, 44, [
    { category: "ดีมาก", min: 179, max: null },
    { category: "ดี", min: 153, max: 178 },
    { category: "ปานกลาง", min: 128, max: 152 },
    { category: "ต่ำ", min: 102, max: 127 },
    { category: "ต่ำมาก", min: null, max: 101 },
  ]),
  createBands("step_up", "male", 45, 49, [
    { category: "ดีมาก", min: 177, max: null },
    { category: "ดี", min: 152, max: 176 },
    { category: "ปานกลาง", min: 127, max: 151 },
    { category: "ต่ำ", min: 101, max: 126 },
    { category: "ต่ำมาก", min: null, max: 100 },
  ]),
  createBands("step_up", "male", 50, 54, [
    { category: "ดีมาก", min: 175, max: null },
    { category: "ดี", min: 150, max: 174 },
    { category: "ปานกลาง", min: 125, max: 149 },
    { category: "ต่ำ", min: 100, max: 124 },
    { category: "ต่ำมาก", min: null, max: 99 },
  ]),
  createBands("step_up", "male", 55, 59, [
    { category: "ดีมาก", min: 174, max: null },
    { category: "ดี", min: 149, max: 173 },
    { category: "ปานกลาง", min: 123, max: 148 },
    { category: "ต่ำ", min: 97, max: 122 },
    { category: "ต่ำมาก", min: null, max: 96 },
  ]),

  // ===================== Step Up and Down – Female =====================
  createBands("step_up", "female", 19, 24, [
    { category: "ดีมาก", min: 178, max: null },
    { category: "ดี", min: 155, max: 177 },
    { category: "ปานกลาง", min: 133, max: 154 },
    { category: "ต่ำ", min: 110, max: 132 },
    { category: "ต่ำมาก", min: null, max: 109 },
  ]),
  createBands("step_up", "female", 25, 29, [
    { category: "ดีมาก", min: 177, max: null },
    { category: "ดี", min: 153, max: 176 },
    { category: "ปานกลาง", min: 129, max: 152 },
    { category: "ต่ำ", min: 105, max: 128 },
    { category: "ต่ำมาก", min: null, max: 104 },
  ]),
  createBands("step_up", "female", 30, 34, [
    { category: "ดีมาก", min: 176, max: null },
    { category: "ดี", min: 150, max: 175 },
    { category: "ปานกลาง", min: 124, max: 149 },
    { category: "ต่ำ", min: 98, max: 123 },
    { category: "ต่ำมาก", min: null, max: 97 },
  ]),
  createBands("step_up", "female", 35, 39, [
    { category: "ดีมาก", min: 173, max: null },
    { category: "ดี", min: 148, max: 172 },
    { category: "ปานกลาง", min: 123, max: 147 },
    { category: "ต่ำ", min: 98, max: 122 },
    { category: "ต่ำมาก", min: null, max: 97 },
  ]),
  createBands("step_up", "female", 40, 44, [
    { category: "ดีมาก", min: 171, max: null },
    { category: "ดี", min: 147, max: 170 },
    { category: "ปานกลาง", min: 122, max: 146 },
    { category: "ต่ำ", min: 97, max: 121 },
    { category: "ต่ำมาก", min: null, max: 96 },
  ]),
  createBands("step_up", "female", 45, 49, [
    { category: "ดีมาก", min: 171, max: null },
    { category: "ดี", min: 145, max: 170 },
    { category: "ปานกลาง", min: 119, max: 144 },
    { category: "ต่ำ", min: 94, max: 118 },
    { category: "ต่ำมาก", min: null, max: 93 },
  ]),
  createBands("step_up", "female", 50, 54, [
    { category: "ดีมาก", min: 170, max: null },
    { category: "ดี", min: 143, max: 169 },
    { category: "ปานกลาง", min: 115, max: 142 },
    { category: "ต่ำ", min: 88, max: 114 },
    { category: "ต่ำมาก", min: null, max: 87 },
  ]),
  createBands("step_up", "female", 55, 59, [
    { category: "ดีมาก", min: 164, max: null },
    { category: "ดี", min: 138, max: 163 },
    { category: "ปานกลาง", min: 111, max: 137 },
    { category: "ต่ำ", min: 84, max: 110 },
    { category: "ต่ำมาก", min: null, max: 83 },
  ]),
];

function createBands(testType, gender, ageMin, ageMax, bands) {
  return { testType, gender, ageMin, ageMax, bands };
}

// ===============================================================
// --- ✅ สร้างข้อมูลตัวอย่าง (Sample Data) ---
// ===============================================================
function populateWithSampleData() {
  Logger.log("Starting to populate with sample data...");

  try {
    let users = listUsers();
    const standards = listStandards("general");
    let classes = listClasses();
    const existingResults = listAllTestResults();

    const userIndex = new Map();
    users.forEach((user) => {
      const key = String(user.email || "").toLowerCase();
      if (key) {
        userIndex.set(key, user);
      }
    });

    const resultsKey = new Set(
      existingResults.map(
        (row) => `${row.user_id}|${row.test_type}|${row.recorded_at}`,
      ),
    );

    const instructor =
      users.find((u) => u.email === "admin@wth.ac.th") ||
      users.find((u) => u.role === "instructor");
    if (!instructor) {
      Logger.log(
        "Instructor user not found. Please run createDefaultAdmin() first.",
      );
      return;
    }
    Logger.log(`Using instructor account: ${instructor.full_name}`);

    const defaultPassword = "123456";

    const sampleClassBlueprints = [
      {
        className: "พลศึกษาม.6/1 (ตัวอย่าง)",
        students: [
          {
            studentId: "M61-001",
            fullName: "สมชาย ใจดี",
            email: "somchai.m61@example.com",
            gender: "male",
            birthdate: "2007-05-10",
            rosterNote: "หัวหน้าห้อง",
            bmiEntries: [
              {
                recordedAt: "2025-01-15T09:00:00.000Z",
                heightM: 1.74,
                weightKg: 65.2,
              },
              {
                recordedAt: "2025-02-20T09:00:00.000Z",
                heightM: 1.75,
                weightKg: 66.4,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-18T09:00:00.000Z", value: 19 },
              { recordedAt: "2025-02-18T09:00:00.000Z", value: 24 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-18T09:00:00.000Z",
                value: 46,
                bodyWeightKg: 66.4,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-17T09:00:00.000Z", value: 35 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-17T09:00:00.000Z", value: 162 },
            ],
          },
          {
            studentId: "M61-002",
            fullName: "สมหญิง เก่งมาก",
            email: "somying.m61@example.com",
            gender: "female",
            birthdate: "2007-08-22",
            rosterNote: "ชมรมลีดเดอร์",
            bmiEntries: [
              {
                recordedAt: "2025-01-15T09:00:00.000Z",
                heightM: 1.66,
                weightKg: 53.5,
              },
              {
                recordedAt: "2025-02-20T09:00:00.000Z",
                heightM: 1.66,
                weightKg: 54.2,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-19T09:00:00.000Z", value: 24 },
              { recordedAt: "2025-02-19T09:00:00.000Z", value: 28 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-19T09:00:00.000Z",
                value: 30,
                bodyWeightKg: 54.2,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-18T09:00:00.000Z", value: 33 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-18T09:00:00.000Z", value: 150 },
            ],
          },
          {
            studentId: "M61-003",
            fullName: "มานะ บากบั่น",
            email: "mana.m61@example.com",
            gender: "male",
            birthdate: "2007-03-15",
            rosterNote: "ชมรมฟุตบอล",
            bmiEntries: [
              {
                recordedAt: "2025-01-14T09:00:00.000Z",
                heightM: 1.78,
                weightKg: 70.1,
              },
              {
                recordedAt: "2025-02-18T09:00:00.000Z",
                heightM: 1.78,
                weightKg: 69.4,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-20T09:00:00.000Z", value: 16 },
              { recordedAt: "2025-02-19T09:00:00.000Z", value: 21 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-19T09:00:00.000Z",
                value: 44,
                bodyWeightKg: 69.4,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-18T09:00:00.000Z", value: 29 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-18T09:00:00.000Z", value: 140 },
            ],
          },
          {
            studentId: "M61-004",
            fullName: "ปิติ ยินดี",
            email: "piti.m61@example.com",
            gender: "male",
            birthdate: "2008-01-30",
            rosterNote: "ชมรมดนตรี",
            bmiEntries: [
              {
                recordedAt: "2025-01-15T09:00:00.000Z",
                heightM: 1.73,
                weightKg: 59.3,
              },
              {
                recordedAt: "2025-02-19T09:00:00.000Z",
                heightM: 1.73,
                weightKg: 60.0,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-22T09:00:00.000Z", value: 20 },
              { recordedAt: "2025-02-20T09:00:00.000Z", value: 25 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-20T09:00:00.000Z",
                value: 42,
                bodyWeightKg: 60.0,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-19T09:00:00.000Z", value: 37 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-19T09:00:00.000Z", value: 170 },
            ],
          },
          {
            studentId: "M61-005",
            fullName: "ชูใจ ใฝ่เรียน",
            email: "chujai.m61@example.com",
            gender: "female",
            birthdate: "2007-11-05",
            rosterNote: "ตัวแทนแข่งขันวิชาการ",
            bmiEntries: [
              {
                recordedAt: "2025-01-17T09:00:00.000Z",
                heightM: 1.63,
                weightKg: 50.5,
              },
              {
                recordedAt: "2025-02-20T09:00:00.000Z",
                heightM: 1.63,
                weightKg: 51.1,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-21T09:00:00.000Z", value: 26 },
              { recordedAt: "2025-02-21T09:00:00.000Z", value: 30 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-21T09:00:00.000Z",
                value: 29,
                bodyWeightKg: 51.1,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-20T09:00:00.000Z", value: 32 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-20T09:00:00.000Z", value: 152 },
            ],
          },
          {
            studentId: "M61-006",
            fullName: "อารีย์ สดใส",
            email: "aree.m61@example.com",
            gender: "female",
            birthdate: "2007-12-12",
            rosterNote: "ชมรมโยคะ",
            bmiEntries: [
              {
                recordedAt: "2025-01-18T09:00:00.000Z",
                heightM: 1.6,
                weightKg: 48.0,
              },
              {
                recordedAt: "2025-02-21T09:00:00.000Z",
                heightM: 1.6,
                weightKg: 48.6,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-01-21T09:00:00.000Z", value: 25 },
              { recordedAt: "2025-02-21T09:00:00.000Z", value: 29 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-02-21T09:00:00.000Z",
                value: 27,
                bodyWeightKg: 48.6,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-02-21T09:00:00.000Z", value: 34 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-02-21T09:00:00.000Z", value: 148 },
            ],
          },
        ],
      },
      {
        className: "การออกกำลังกายเพื่อสุขภาพ",
        students: [
          {
            studentId: "FIT-201",
            fullName: "กิตติพงษ์ แข็งแรง",
            email: "kittipong.fit@example.com",
            gender: "male",
            birthdate: "2006-12-12",
            rosterNote: "ทีมบาสเกตบอล",
            bmiEntries: [
              {
                recordedAt: "2025-03-10T09:00:00.000Z",
                heightM: 1.8,
                weightKg: 72.0,
              },
              {
                recordedAt: "2025-04-15T09:00:00.000Z",
                heightM: 1.8,
                weightKg: 71.2,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-03-11T09:00:00.000Z", value: 20 },
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 26 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-04-15T09:00:00.000Z",
                value: 48,
                bodyWeightKg: 71.2,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-04-14T09:00:00.000Z", value: 38 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-04-14T09:00:00.000Z", value: 175 },
            ],
          },
          {
            studentId: "FIT-202",
            fullName: "รุ่งนภา สดชื่น",
            email: "roongnapa.fit@example.com",
            gender: "female",
            birthdate: "2007-04-09",
            rosterNote: "ชมรมแอโรบิก",
            bmiEntries: [
              {
                recordedAt: "2025-03-11T09:00:00.000Z",
                heightM: 1.65,
                weightKg: 56.0,
              },
              {
                recordedAt: "2025-04-16T09:00:00.000Z",
                heightM: 1.65,
                weightKg: 55.4,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-03-12T09:00:00.000Z", value: 27 },
              { recordedAt: "2025-04-16T09:00:00.000Z", value: 31 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-04-16T09:00:00.000Z",
                value: 32,
                bodyWeightKg: 55.4,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 34 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 160 },
            ],
          },
          {
            studentId: "FIT-203",
            fullName: "ศรัทธา ตั้งใจ",
            email: "sattha.fit@example.com",
            gender: "male",
            birthdate: "2006-10-21",
            rosterNote: "ทีมวิ่งผลัด",
            bmiEntries: [
              {
                recordedAt: "2025-03-09T09:00:00.000Z",
                heightM: 1.76,
                weightKg: 68.5,
              },
              {
                recordedAt: "2025-04-14T09:00:00.000Z",
                heightM: 1.76,
                weightKg: 68.0,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-03-12T09:00:00.000Z", value: 22 },
              { recordedAt: "2025-04-16T09:00:00.000Z", value: 27 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-04-16T09:00:00.000Z",
                value: 45,
                bodyWeightKg: 68.0,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 36 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 168 },
            ],
          },
          {
            studentId: "FIT-204",
            fullName: "จิราภรณ์ สารีบุตร",
            email: "jiraporn.fit@example.com",
            gender: "female",
            birthdate: "2007-03-02",
            rosterNote: "ทีมบาสหญิง",
            bmiEntries: [
              {
                recordedAt: "2025-03-10T09:00:00.000Z",
                heightM: 1.64,
                weightKg: 52.1,
              },
              {
                recordedAt: "2025-04-15T09:00:00.000Z",
                heightM: 1.64,
                weightKg: 52.5,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-03-13T09:00:00.000Z", value: 25 },
              { recordedAt: "2025-04-17T09:00:00.000Z", value: 29 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-04-17T09:00:00.000Z",
                value: 28,
                bodyWeightKg: 52.5,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-04-16T09:00:00.000Z", value: 33 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-04-16T09:00:00.000Z", value: 154 },
            ],
          },
          {
            studentId: "FIT-205",
            fullName: "วิชิต กล้าหาญ",
            email: "wichit.fit@example.com",
            gender: "male",
            birthdate: "2006-07-18",
            rosterNote: "นักกรีฑา",
            bmiEntries: [
              {
                recordedAt: "2025-03-08T09:00:00.000Z",
                heightM: 1.82,
                weightKg: 78.0,
              },
              {
                recordedAt: "2025-04-14T09:00:00.000Z",
                heightM: 1.82,
                weightKg: 77.2,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-03-12T09:00:00.000Z", value: 18 },
              { recordedAt: "2025-04-16T09:00:00.000Z", value: 23 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-04-16T09:00:00.000Z",
                value: 50,
                bodyWeightKg: 77.2,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 32 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-04-15T09:00:00.000Z", value: 138 },
            ],
          },
        ],
      },
      {
        className: "การออกกำลังกายเพื่อสุขภาพ ห้อง 2",
        students: [
          {
            studentId: "FIT2-301",
            fullName: "สุเนตร ว่องไว",
            email: "sunet.active@example.com",
            gender: "male",
            birthdate: "2007-01-14",
            rosterNote: "ชมรมแบดมินตัน",
            bmiEntries: [
              {
                recordedAt: "2025-04-10T09:00:00.000Z",
                heightM: 1.79,
                weightKg: 68.8,
              },
              {
                recordedAt: "2025-05-20T09:00:00.000Z",
                heightM: 1.79,
                weightKg: 69.5,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-04-12T09:00:00.000Z", value: 23 },
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 27 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-05-21T09:00:00.000Z",
                value: 47,
                bodyWeightKg: 69.5,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-05-20T09:00:00.000Z", value: 36 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-05-20T09:00:00.000Z", value: 172 },
            ],
          },
          {
            studentId: "FIT2-302",
            fullName: "พรทิพย์ ใจดี",
            email: "porntip.active@example.com",
            gender: "female",
            birthdate: "2007-06-25",
            rosterNote: "ชมรมเต้น",
            bmiEntries: [
              {
                recordedAt: "2025-04-11T09:00:00.000Z",
                heightM: 1.62,
                weightKg: 49.8,
              },
              {
                recordedAt: "2025-05-21T09:00:00.000Z",
                heightM: 1.62,
                weightKg: 50.4,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-04-13T09:00:00.000Z", value: 28 },
              { recordedAt: "2025-05-22T09:00:00.000Z", value: 31 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-05-22T09:00:00.000Z",
                value: 29,
                bodyWeightKg: 50.4,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 33 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 156 },
            ],
          },
          {
            studentId: "FIT2-303",
            fullName: "นพดล พากเพียร",
            email: "nopphon.active@example.com",
            gender: "male",
            birthdate: "2006-11-05",
            rosterNote: "ทีมว่ายน้ำ",
            bmiEntries: [
              {
                recordedAt: "2025-04-09T09:00:00.000Z",
                heightM: 1.81,
                weightKg: 74.0,
              },
              {
                recordedAt: "2025-05-19T09:00:00.000Z",
                heightM: 1.81,
                weightKg: 73.2,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-04-12T09:00:00.000Z", value: 21 },
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 26 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-05-21T09:00:00.000Z",
                value: 46,
                bodyWeightKg: 73.2,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-05-20T09:00:00.000Z", value: 34 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-05-20T09:00:00.000Z", value: 166 },
            ],
          },
          {
            studentId: "FIT2-304",
            fullName: "ทิพย์สุดา ศรีสุข",
            email: "thipsuda.active@example.com",
            gender: "female",
            birthdate: "2007-09-12",
            rosterNote: "โครงการลดน้ำหนัก",
            bmiEntries: [
              {
                recordedAt: "2025-04-11T09:00:00.000Z",
                heightM: 1.58,
                weightKg: 54.2,
              },
              {
                recordedAt: "2025-05-22T09:00:00.000Z",
                heightM: 1.58,
                weightKg: 53.6,
              },
            ],
            sitAndReachEntries: [
              { recordedAt: "2025-04-13T09:00:00.000Z", value: 22 },
              { recordedAt: "2025-05-22T09:00:00.000Z", value: 26 },
            ],
            handGripEntries: [
              {
                recordedAt: "2025-05-22T09:00:00.000Z",
                value: 27,
                bodyWeightKg: 53.6,
              },
            ],
            chairStandEntries: [
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 31 },
            ],
            stepUpEntries: [
              { recordedAt: "2025-05-21T09:00:00.000Z", value: 149 },
            ],
          },
        ],
      },
    ];

    const ageAt = (birthdate, recordedAt) => {
      if (!birthdate) return 0;
      const birth = new Date(birthdate);
      const ref = recordedAt ? new Date(recordedAt) : new Date();
      let age = ref.getFullYear() - birth.getFullYear();
      const monthDiff = ref.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < birth.getDate())) {
        age -= 1;
      }
      return age;
    };

    const ensureStudentRecord = (blueprint, klass) => {
      const emailKey = String(blueprint.email || "").toLowerCase();
      const nowIso = new Date().toISOString();
      let student = userIndex.get(emailKey);
      if (!student) {
        student = {
          id: generateId(),
          role: "student",
          full_name: blueprint.fullName,
          email: emailKey,
          password_hash: hashPassword(blueprint.password || defaultPassword),
          gender: blueprint.gender,
          birthdate: blueprint.birthdate,
          class_id: klass.id,
          created_at: nowIso,
          updated_at: nowIso,
        };
        appendRow(SHEET_NAMES.USERS, HEADERS.Users, student);
        users.push(student);
        userIndex.set(emailKey, student);
        Logger.log(`Created sample student: ${student.full_name} (${emailKey})`);
        return { record: student, created: true };
      }

      if (student.class_id !== klass.id) {
        updateUserClass(student.id, klass.id);
        student.class_id = klass.id;
      }

      return { record: student, created: false };
    };

    const ensureResult = (studentId, testType, recordedAt, payload) => {
      if (!recordedAt) return false;
      const key = `${studentId}|${testType}|${recordedAt}`;
      if (resultsKey.has(key)) {
        return false;
      }
      appendRow(SHEET_NAMES.TEST_RESULTS, HEADERS.TestResults, {
        id: generateId(),
        user_id: studentId,
        user_full_name:userFullName,           // ⬅️ NEW

        test_type: testType,
        recorded_at: recordedAt,
        value: payload.value,
        derived_value:
          payload.derivedValue !== undefined ? payload.derivedValue : payload.value,
        evaluation: payload.evaluation || "",
        notes: payload.notes || "",
      });
      resultsKey.add(key);
      return true;
    };

    const addBmiEntry = (student, entry) => {
      if (!entry || typeof entry.weightKg !== "number" || typeof entry.heightM !== "number") {
        return { added: false, weightKg: null };
      }
      const recordedAt = entry.recordedAt || new Date().toISOString();
      const heightM = entry.heightM;
      const weightKg = entry.weightKg;
      const bmi = roundNumber(weightKg / (heightM * heightM), 2);
      const gender = normalizeGender(student.gender);
      const age = ageAt(student.birthdate, recordedAt);
      const match = findStandardMatch(standards, "bmi", gender, age, bmi);
      const evaluation = match ? match.category : "ไม่มีเกณฑ์";
      const added = ensureResult(student.id, "bmi", recordedAt, {
        value: roundNumber(weightKg, 2),
        derivedValue: bmi,
        evaluation,
        notes: entry.notes || `สูง ${heightM.toFixed(2)} ม.`,
      });
      return { added, weightKg };
    };

    const addSitAndReachEntry = (student, entry) => {
      if (!entry || typeof entry.value !== "number") return false;
      const recordedAt = entry.recordedAt || new Date().toISOString();
      const value = roundNumber(entry.value, 2);
      const gender = normalizeGender(student.gender);
      const age = ageAt(student.birthdate, recordedAt);
      const match = findStandardMatch(standards, "sit_and_reach", gender, age, value);
      const evaluation = match ? match.category : "ไม่มีเกณฑ์";
      return ensureResult(student.id, "sit_and_reach", recordedAt, {
        value,
        evaluation,
        notes: entry.notes || "",
      });
    };

    const addHandGripEntry = (student, entry, fallbackWeight) => {
      if (!entry || typeof entry.value !== "number") return false;
      const recordedAt = entry.recordedAt || new Date().toISOString();
      const grip = roundNumber(entry.value, 2);
      const bodyWeight = entry.bodyWeightKg || fallbackWeight || grip;
      const ratio = bodyWeight ? roundNumber(grip / bodyWeight, 2) : grip;
      const gender = normalizeGender(student.gender);
      const age = ageAt(student.birthdate, recordedAt);
      const match = findStandardMatch(standards, "hand_grip", gender, age, ratio);
      const evaluation = match ? match.category : "ไม่มีเกณฑ์";
      return ensureResult(student.id, "hand_grip", recordedAt, {
        value: grip,
        derivedValue: ratio,
        evaluation,
        notes:
          entry.notes ||
          `น้ำหนักตัว ${roundNumber(bodyWeight, 2)} กก.`,
      });
    };

    const addChairStandEntry = (student, entry) => {
      if (!entry || typeof entry.value !== "number") return false;
      const recordedAt = entry.recordedAt || new Date().toISOString();
      const value = Math.round(entry.value);
      const gender = normalizeGender(student.gender);
      const age = ageAt(student.birthdate, recordedAt);
      const match = findStandardMatch(standards, "chair_stand", gender, age, value);
      const evaluation = match ? match.category : "ไม่มีเกณฑ์";
      return ensureResult(student.id, "chair_stand", recordedAt, {
        value,
        evaluation,
        notes: entry.notes || "",
      });
    };

    const addStepUpEntry = (student, entry) => {
      if (!entry || typeof entry.value !== "number") return false;
      const recordedAt = entry.recordedAt || new Date().toISOString();
      const value = Math.round(entry.value);
      const gender = normalizeGender(student.gender);
      const age = ageAt(student.birthdate, recordedAt);
      const match = findStandardMatch(standards, "step_up", gender, age, value);
      const evaluation = match ? match.category : "ไม่มีเกณฑ์";
      return ensureResult(student.id, "step_up", recordedAt, {
        value,
        evaluation,
        notes: entry.notes || "",
      });
    };

    let createdStudents = 0;
    let createdResults = 0;

    sampleClassBlueprints.forEach((classBlueprint) => {
      let klass = classes.find(
        (c) =>
          c.instructor_id === instructor.id &&
          c.class_name === classBlueprint.className,
      );
      if (!klass) {
        const nowIso = new Date().toISOString();
        klass = {
          id: generateId(),
          instructor_id: instructor.id,
          class_name: classBlueprint.className,
          class_code: generateClassCode(),
          created_at: nowIso,
        };
        appendRow(SHEET_NAMES.CLASSES, HEADERS.Classes, klass);
        classes.push(klass);
        Logger.log(
          `Created sample class: ${classBlueprint.className} (${klass.class_code})`,
        );
      } else {
        Logger.log(`Using existing class: ${classBlueprint.className}`);
      }

      const rosterRows = [];

      classBlueprint.students.forEach((studentBlueprint) => {
        const { record: studentRecord, created } = ensureStudentRecord(
          studentBlueprint,
          klass,
        );
        if (created) {
          createdStudents += 1;
        }

        const rosterGender = normalizeGender(
          studentBlueprint.gender || studentRecord.gender,
        );
        rosterRows.push([
          studentBlueprint.studentId,
          studentBlueprint.fullName,
          studentBlueprint.email,
          rosterGender,
          studentBlueprint.birthdate,
          studentBlueprint.rosterNote || "บัญชีตัวอย่าง",
        ]);

        let latestWeight = null;

        if (Array.isArray(studentBlueprint.bmiEntries)) {
          studentBlueprint.bmiEntries.forEach((entry) => {
            const result = addBmiEntry(studentRecord, entry);
            if (result) {
              latestWeight = result.weightKg;
              if (result.added) {
                createdResults += 1;
              }
            }
          });
        }

        if (Array.isArray(studentBlueprint.sitAndReachEntries)) {
          studentBlueprint.sitAndReachEntries.forEach((entry) => {
            if (addSitAndReachEntry(studentRecord, entry)) {
              createdResults += 1;
            }
          });
        }

        if (Array.isArray(studentBlueprint.handGripEntries)) {
          studentBlueprint.handGripEntries.forEach((entry) => {
            if (addHandGripEntry(studentRecord, entry, latestWeight)) {
              createdResults += 1;
            }
          });
        }

        if (Array.isArray(studentBlueprint.chairStandEntries)) {
          studentBlueprint.chairStandEntries.forEach((entry) => {
            if (addChairStandEntry(studentRecord, entry)) {
              createdResults += 1;
            }
          });
        }

        if (Array.isArray(studentBlueprint.stepUpEntries)) {
          studentBlueprint.stepUpEntries.forEach((entry) => {
            if (addStepUpEntry(studentRecord, entry)) {
              createdResults += 1;
            }
          });
        }
      });

      createClassRosterSheet(klass, rosterRows);
    });

    Logger.log(
      `Sample data population completed. New students: ${createdStudents}, new test records: ${createdResults}.`,
    );
  } catch (error) {
    Logger.log(`Error during sample data population: ${error.message}`);
  }
}

/**
 * ✅ เติม “ข้อมูลเดโม่สำหรับทดสอบครบทุกกรณี”
 * - สร้างคลาส DEMO – เกณฑ์ครบทุกกรณี
 * - สร้าง 11 คน:
 *    (1) ตัวอย่างครบถ้วน: มีบันทึกสมรรถภาพทุกชนิด + สัดส่วนร่างกาย before/after ครบทุกช่อง
 *    (2-6) ชาย 5 คน ครอบคลุมผลประเมิน: ต่ำมาก / ต่ำ / ปานกลาง / ดี / ดีมาก
 *    (7-11) หญิง 5 คน ครอบคลุมผลประเมิน: ต่ำมาก / ต่ำ / ปานกลาง / ดี / ดีมาก
 * - ทุกคนมีผลทดสอบ: bmi, sit_and_reach, hand_grip, chair_stand, step_up (ช่วงอายุ 19–24)
 * - ค่าที่ใส่ถูกเลือกให้ตก “ช่วงเกณฑ์” ของ STANDARD_DATA ที่ประกาศไว้ในไฟล์นี้
 *
 * วิธีใช้: เปิด Apps Script → รันฟังก์ชัน populateDemoFullCoverage() ครั้งเดียว
 */
function populateDemoFullCoverage() {
  const standards = listStandards("general");
  const nowIso = new Date().toISOString();

  // ---------- helpers ----------
  const ensureClass = (name) => {
    const instructor =
      listUsers().find(u => u.email === "admin@wth.ac.th") ||
      listUsers().find(u => u.role === "instructor");
    if (!instructor) throw new Error("ไม่พบครูผู้สอน โปรดรัน createDefaultAdmin() ก่อน");

    let klass = listClasses().find(c => c.instructor_id === instructor.id && c.class_name === name);
    if (!klass) {
      klass = {
        id: generateId(),
        instructor_id: instructor.id,
        class_name: name,
        class_code: generateClassCode(),
        created_at: nowIso,
      };
      appendRow(SHEET_NAMES.CLASSES, HEADERS.Classes, klass);
    }
    return { klass, instructor };
  };

  const ensureStudent = (klass, { fullName, email, gender, birthdate }) => {
    const emailKey = String(email || "").toLowerCase();
    const existed = listUsers().find(u => u.email && String(u.email).toLowerCase() === emailKey);
    if (existed) {
      if (existed.class_id !== klass.id) updateUserClass(existed.id, klass.id);
      return existed;
    }
    const user = {
      id: generateId(),
      role: "student",
      full_name: fullName,
      email: emailKey,
      password_hash: hashPassword("123456"),
      gender: normalizeGender(gender),
      birthdate,
      class_id: klass.id,
      created_at: nowIso,
      updated_at: nowIso,
    };
    appendRow(SHEET_NAMES.USERS, HEADERS.Users, user);
    return user;
  };

  const ageAt = (birthdate, recordedAt) => {
    if (!birthdate) return 0;
    const birth = new Date(birthdate);
    const ref = recordedAt ? new Date(recordedAt) : new Date();
    let age = ref.getFullYear() - birth.getFullYear();
    const m = ref.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
    return age;
  };

  const addTest = (user, { testType, recordedAt, rawValue, note, weightKg, heightM }) => {
    const recAt = recordedAt || new Date().toISOString();
    let value = rawValue;
    let derived = rawValue;

    if (testType === "bmi") {
      // ถ้ามีส่วนสูง/น้ำหนัก จะคำนวณ BMI ให้ และเก็บน้ำหนักไว้ใน value
      if (typeof weightKg !== "number" || typeof heightM !== "number") {
        throw new Error("BMI ต้องระบุ weightKg และ heightM");
      }
      const bmi = roundNumber(Number(weightKg) / Math.pow(Number(heightM), 2), 2);
      value = roundNumber(weightKg, 2);
      derived = bmi;
    } else if (testType === "hand_grip") {
      // value = ค่าแรงบีบ (กก.), derived = อัตราส่วนต่อ นน.ตัว
      const bw = typeof weightKg === "number" ? weightKg : 60;
      derived = roundNumber(Number(value) / Number(bw), 2);
    }

    // match กับเกณฑ์
    const g = normalizeGender(user.gender);
    const evalAge = ageAt(user.birthdate, recAt);
    const matched = findStandardMatch(standards, testType, g, evalAge, Number(derived));
    const evaluation = matched ? matched.category : "ไม่มีเกณฑ์อ้างอิง";

    appendRow(SHEET_NAMES.TEST_RESULTS, HEADERS.TestResults, {
      id: generateId(),
      user_id: user.id,
      test_type: testType,
      recorded_at: recAt,
      value: roundNumber(Number(value), 2),
      derived_value: roundNumber(Number(derived), 2),
      evaluation,
      notes: note || "",
    });
  };

  const addBody = (user, phase, recordedAt, m) => {
    const headers = HEADERS.BodyMeasurements;
    const sheet = getSheet(SHEET_NAMES.BODY_MEASUREMENTS);
    ensureSheetHasHeaders(sheet, headers);
    const record = {
      id: generateId(),
      user_id: user.id,
          user_full_name: user.full_name || user.fullName || "",  // ⬅️ NEW

      phase,
      recorded_at: recordedAt,
      muscular_strength: m.muscularStrength,
      muscular_endurance: m.muscularEndurance,
      flexibility: m.flexibility,
      bmi: m.bmi,
      cardio_respiratory_endurance: m.cardioRespiratoryEndurance,
      weight: m.weight,
      height: m.height,
      pulse: m.pulse,
      neck: m.neck,
      shoulder_left: m.shoulderLeft,
      shoulder_right: m.shoulderRight,
      upper_arm_left: m.upperArmLeft,
      upper_arm_right: m.upperArmRight,
      wrist_left: m.wristLeft,
      wrist_right: m.wristRight,
      chest: m.chest,
      abdomen: m.abdomen,
      waist: m.waist,
      hip: m.hip,
      thigh_left: m.thighLeft,
      thigh_right: m.thighRight,
      calf_left: m.calfLeft,
      calf_right: m.calfRight,
      ankle_left: m.ankleLeft,
      ankle_right: m.ankleRight,
      notes: m.notes || "",
    };
    const row = headers.map(h => (record[h] !== undefined ? record[h] : ""));
    sheet.appendRow(row);
  };

  // ---------- เริ่มสร้างข้อมูล ----------
  const { klass } = ensureClass("DEMO – เกณฑ์ครบทุกกรณี");

  // (1) นักเรียนตัวอย่าง “ครบถ้วน” (ชาย อายุ ~19)
  const demoFull = ensureStudent(klass, {
    fullName: "เดโม่ ครบถ้วน",
    email: "demo.full@example.com",
    gender: "male",
    birthdate: "2006-12-15", // ~18–19y ในปี 2025
  });

  // บันทึกสัดส่วน before / after ครบทุกฟิลด์
  addBody(demoFull, "before", "2025-01-10T09:00:00.000Z", {
    muscularStrength: 36, muscularEndurance: 28, flexibility: 22, bmi: 22.8,
    cardioRespiratoryEndurance: 165, weight: 68.0, height: 175, pulse: 78,
    neck: 36, shoulderLeft: 48, shoulderRight: 48, upperArmLeft: 29, upperArmRight: 29,
    wristLeft: 16, wristRight: 16, chest: 92, abdomen: 82, waist: 80, hip: 95,
    thighLeft: 54, thighRight: 54, calfLeft: 36, calfRight: 36, ankleLeft: 23, ankleRight: 23,
    notes: "ก่อนเรียน – ค่าตั้งต้น"
  });
  addBody(demoFull, "after", "2025-03-10T09:00:00.000Z", {
    muscularStrength: 42, muscularEndurance: 34, flexibility: 27, bmi: 22.2,
    cardioRespiratoryEndurance: 175, weight: 67.0, height: 175, pulse: 72,
    neck: 36.5, shoulderLeft: 49, shoulderRight: 49, upperArmLeft: 30, upperArmRight: 30,
    wristLeft: 16, wristRight: 16, chest: 94, abdomen: 80, waist: 79, hip: 96,
    thighLeft: 55, thighRight: 55, calfLeft: 36.5, calfRight: 36.5, ankleLeft: 23, ankleRight: 23,
    notes: "หลังเรียน – พัฒนาขึ้นหลายด้าน"
  });

  // สมรรถภาพ (ก่อน/หลัง) ครบทุกชนิด
  addTest(demoFull, { testType: "bmi", recordedAt: "2025-01-10T09:05:00.000Z", weightKg: 68.0, heightM: 1.75, rawValue: 68.0, note: "ก่อนเรียน" });
  addTest(demoFull, { testType: "bmi", recordedAt: "2025-03-10T09:05:00.000Z", weightKg: 67.0, heightM: 1.75, rawValue: 67.0, note: "หลังเรียน" });
  addTest(demoFull, { testType: "sit_and_reach", recordedAt: "2025-01-10T09:10:00.000Z", rawValue: 20, note: "ก่อนเรียน" });
  addTest(demoFull, { testType: "sit_and_reach", recordedAt: "2025-03-10T09:10:00.000Z", rawValue: 26, note: "หลังเรียน" });
  addTest(demoFull, { testType: "hand_grip", recordedAt: "2025-01-10T09:15:00.000Z", rawValue: 42, weightKg: 68.0, note: "ก่อนเรียน" });
  addTest(demoFull, { testType: "hand_grip", recordedAt: "2025-03-10T09:15:00.000Z", rawValue: 48, weightKg: 67.0, note: "หลังเรียน" });
  addTest(demoFull, { testType: "chair_stand", recordedAt: "2025-01-10T09:20:00.000Z", rawValue: 34, note: "ก่อนเรียน" });
  addTest(demoFull, { testType: "chair_stand", recordedAt: "2025-03-10T09:20:00.000Z", rawValue: 41, note: "หลังเรียน" });
  addTest(demoFull, { testType: "step_up", recordedAt: "2025-01-10T09:25:00.000Z", rawValue: 158, note: "ก่อนเรียน" });
  addTest(demoFull, { testType: "step_up", recordedAt: "2025-03-10T09:25:00.000Z", rawValue: 175, note: "หลังเรียน" });

  // ---------- ชุด “ครอบคลุมทุกเกณฑ์” ----------
  // หมายเหตุ: ใช้อายุ 19–24 เพื่อจับคู่ตารางช่วงนี้ (ตาม STANDARD_DATA)
  // ชาย (5 ระดับ)
  const males = [
    {
      label: "ต่ำมาก",
      fullName: "เดโม่ ชาย ต่ำมาก",
      email: "demo.male.min@example.com",
      // เลือกค่าให้อยู่ในช่วง “ต่ำมาก” ของแต่ละการทดสอบ
      plan: {
        heightM: 1.75, weightKgForBmi: 41.3, bmiNote: "BMI~13.5",
        sitAndReach: 1, handGripKg: 25, bodyWeightForGrip: 60,
        chairStand: 30, stepUp: 110
      }
    },
    {
      label: "ต่ำ",
      fullName: "เดโม่ ชาย ต่ำ",
      email: "demo.male.low@example.com",
      plan: {
        heightM: 1.75, weightKgForBmi: 52.0, bmiNote: "BMI~17.0 (ผอม)",
        sitAndReach: 6, handGripKg: 31, bodyWeightForGrip: 60, // 0.52 ≈ ต่ำ
        chairStand: 33, stepUp: 130
      }
    },
    {
      label: "ปานกลาง",
      fullName: "เดโม่ ชาย ปานกลาง",
      email: "demo.male.mid@example.com",
      plan: {
        heightM: 1.75, weightKgForBmi: 62.0, bmiNote: "BMI~20.2 (ผอม/ใกล้สมส่วน)",
        sitAndReach: 12, handGripKg: 41, bodyWeightForGrip: 65, // ≈0.63 (ปานกลาง)
        chairStand: 42, stepUp: 150
      }
    },
    {
      label: "ดี",
      fullName: "เดโม่ ชาย ดี",
      email: "demo.male.good@example.com",
      plan: {
        heightM: 1.75, weightKgForBmi: 68.0, bmiNote: "BMI~22.2 (สมส่วน)",
        sitAndReach: 19, handGripKg: 45, bodyWeightForGrip: 62, // ≈0.73 (ดี)
        chairStand: 48, stepUp: 170
      }
    },
    {
      label: "ดีมาก",
      fullName: "เดโม่ ชาย ดีมาก",
      email: "demo.male.vgood@example.com",
      plan: {
        heightM: 1.75, weightKgForBmi: 77.3, bmiNote: "BMI~25.2 (ท้วม)",
        sitAndReach: 26, handGripKg: 52, bodyWeightForGrip: 63, // ≈0.83 (ดีมาก)
        chairStand: 55, stepUp: 190
      }
    },
  ];

  males.forEach(m => {
    const u = ensureStudent(klass, {
      fullName: m.fullName,
      email: m.email,
      gender: "male",
      birthdate: "2006-08-15",
    });
    addTest(u, { testType: "bmi", recordedAt: "2025-02-01T09:00:00.000Z", weightKg: m.plan.weightKgForBmi, heightM: m.plan.heightM, rawValue: m.plan.weightKgForBmi, note: m.plan.bmiNote });
    addTest(u, { testType: "sit_and_reach", recordedAt: "2025-02-01T09:10:00.000Z", rawValue: m.plan.sitAndReach, note: m.label });
    addTest(u, { testType: "hand_grip", recordedAt: "2025-02-01T09:15:00.000Z", rawValue: m.plan.handGripKg, weightKg: m.plan.bodyWeightForGrip, note: m.label });
    addTest(u, { testType: "chair_stand", recordedAt: "2025-02-01T09:20:00.000Z", rawValue: m.plan.chairStand, note: m.label });
    addTest(u, { testType: "step_up", recordedAt: "2025-02-01T09:25:00.000Z", rawValue: m.plan.stepUp, note: m.label });
  });

  // หญิง (5 ระดับ)
  const females = [
    {
      label: "ต่ำมาก",
      fullName: "เดโม่ หญิง ต่ำมาก",
      email: "demo.female.min@example.com",
      plan: {
        heightM: 1.62, weightKgForBmi: 35.5, bmiNote: "BMI~13.5",
        sitAndReach: 0, handGripKg: 18, bodyWeightForGrip: 48, // 0.375
        chairStand: 23, stepUp: 100
      }
    },
    {
      label: "ต่ำ",
      fullName: "เดโม่ หญิง ต่ำ",
      email: "demo.female.low@example.com",
      plan: {
        heightM: 1.62, weightKgForBmi: 44.5, bmiNote: "BMI~17.0 (ผอม)",
        sitAndReach: 6, handGripKg: 22, bodyWeightForGrip: 50, // 0.44
        chairStand: 26, stepUp: 120
      }
    },
    {
      label: "ปานกลาง",
      fullName: "เดโม่ หญิง ปานกลาง",
      email: "demo.female.mid@example.com",
      plan: {
        heightM: 1.62, weightKgForBmi: 53.0, bmiNote: "BMI~20.2 (ผอม/ใกล้สมส่วน)",
        sitAndReach: 10, handGripKg: 26, bodyWeightForGrip: 48, // ≈0.54 (ปานกลาง)
        chairStand: 31, stepUp: 140
      }
    },
    {
      label: "ดี",
      fullName: "เดโม่ หญิง ดี",
      email: "demo.female.good@example.com",
      plan: {
        heightM: 1.62, weightKgForBmi: 58.4, bmiNote: "BMI~22.3 (สมส่วน)",
        sitAndReach: 16, handGripKg: 30, bodyWeightForGrip: 52, // ≈0.58–0.59 (ดี)
        chairStand: 39, stepUp: 165
      }
    },
    {
      label: "ดีมาก",
      fullName: "เดโม่ หญิง ดีมาก",
      email: "demo.female.vgood@example.com",
      plan: {
        heightM: 1.62, weightKgForBmi: 69.0, bmiNote: "BMI~26.3 (ท้วม)",
        sitAndReach: 28, handGripKg: 34, bodyWeightForGrip: 50, // 0.68 (ดีมากช่วง 19–24 = ≥0.64)
        chairStand: 50, stepUp: 180
      }
    },
  ];

  females.forEach(f => {
    const u = ensureStudent(klass, {
      fullName: f.fullName,
      email: f.email,
      gender: "female",
      birthdate: "2006-10-10",
    });
    addTest(u, { testType: "bmi", recordedAt: "2025-02-02T09:00:00.000Z", weightKg: f.plan.weightKgForBmi, heightM: f.plan.heightM, rawValue: f.plan.weightKgForBmi, note: f.plan.bmiNote });
    addTest(u, { testType: "sit_and_reach", recordedAt: "2025-02-02T09:10:00.000Z", rawValue: f.plan.sitAndReach, note: f.label });
    addTest(u, { testType: "hand_grip", recordedAt: "2025-02-02T09:15:00.000Z", rawValue: f.plan.handGripKg, weightKg: f.plan.bodyWeightForGrip, note: f.label });
    addTest(u, { testType: "chair_stand", recordedAt: "2025-02-02T09:20:00.000Z", rawValue: f.plan.chairStand, note: f.label });
    addTest(u, { testType: "step_up", recordedAt: "2025-02-02T09:25:00.000Z", rawValue: f.plan.stepUp, note: f.label });
  });

  // เติมชีทรายชื่อ (Roster) ของคลาสด้วยข้อมูลย่อเพื่อใช้นำเสนอในแดชบอร์ด
  const rosterRows = [
    ["DF-000", "เดโม่ ครบถ้วน", "demo.full@example.com", "male", "2006-12-15", "ตัวอย่างครบถ้วน"],
    ["DM-001", "เดโม่ ชาย ต่ำมาก", "demo.male.min@example.com", "male", "2006-08-15", "ต่ำมาก"],
    ["DM-002", "เดโม่ ชาย ต่ำ", "demo.male.low@example.com", "male", "2006-08-15", "ต่ำ"],
    ["DM-003", "เดโม่ ชาย ปานกลาง", "demo.male.mid@example.com", "male", "2006-08-15", "ปานกลาง"],
    ["DM-004", "เดโม่ ชาย ดี", "demo.male.good@example.com", "male", "2006-08-15", "ดี"],
    ["DM-005", "เดโม่ ชาย ดีมาก", "demo.male.vgood@example.com", "male", "2006-08-15", "ดีมาก"],
    ["DF-001", "เดโม่ หญิง ต่ำมาก", "demo.female.min@example.com", "female", "2006-10-10", "ต่ำมาก"],
    ["DF-002", "เดโม่ หญิง ต่ำ", "demo.female.low@example.com", "female", "2006-10-10", "ต่ำ"],
    ["DF-003", "เดโม่ หญิง ปานกลาง", "demo.female.mid@example.com", "female", "2006-10-10", "ปานกลาง"],
    ["DF-004", "เดโม่ หญิง ดี", "demo.female.good@example.com", "female", "2006-10-10", "ดี"],
    ["DF-005", "เดโม่ หญิง ดีมาก", "demo.female.vgood@example.com", "female", "2006-10-10", "ดีมาก"],
  ];
  createClassRosterSheet(listClasses().find(c => c.class_name === "DEMO – เกณฑ์ครบทุกกรณี"), rosterRows);
}


// ===============================================================
// --- ✅ ฟังก์ชันหลักสำหรับ Setup ระบบทั้งหมด (รันตัวนี้ตัวเดียว) ---
// ===============================================================
function runInitialSetup() {
  Logger.log("--- Starting Initial Application Setup ---");
  
  // 1. สร้างหัวตารางในทุกชีต
  Logger.log("Step 1: Initializing sheet headers...");
  initializeSheetHeaders();
  
  // 2. สร้างผู้ใช้ Admin เริ่มต้น
  Logger.log("Step 2: Creating default admin user...");
  createDefaultAdmin();
  
  // 3. ใส่ข้อมูลเกณฑ์มาตรฐานทั้งหมด
  Logger.log("Step 3: Initializing standards data...");
  initializeStandards();

  // 4. สร้างข้อมูลตัวอย่าง (ชั้นเรียน, นักเรียน, ผลทดสอบ)
  Logger.log("Step 4: Populating with sample data...");
  populateWithSampleData();
    // 5. เติมเดโม่ครอบคลุมทุกเกณฑ์ (ตัวอย่างทดสอบ UI/ตรรกะ)
  Logger.log("Step 5: Populating demo full-coverage dataset...");
  populateDemoFullCoverage();
  
  Logger.log("--- Initial Application Setup Completed Successfully! ---");
  SpreadsheetApp.getUi().alert("การติดตั้งระบบเสร็จสมบูรณ์!");
}

// ===== Teacher-friendly workbook setup =====
function setupTeacherWorkbook() {
  initializeSheetHeaders();           // ของเดิม
  ensureLookups();                    // สร้างดรอปดาวน์/รายการอ้างอิง
  applySheetProtectionAndFormats();   // สี หัวตาราง ล็อกคอลัมน์ id
  buildReadme();                      // หน้าอธิบายสั้นๆ
  buildViews();                       // สร้างรายงานสรุปให้อาจารย์
  reorderTabs();                      // จัดลำดับแท็บให้สวย
  Logger.log("Workbook ready for instructors.");
}

// ---- Lookups (เพื่อง่ายต่อ dropdown) ----
function ensureLookups() {
  const sh = getSheet("Lookups");
  sh.clear().setTabColor("#8b5cf6");
  const data = {
    A: ["test_type","bmi","sit_and_reach","hand_grip","chair_stand","step_up"],
    C: ["gender","male","female"],
    E: ["phase","before","after"]
  };
  sh.getRange(1,1,data.A.length,1).setValues(data.A.map(v=>[v]));
  sh.getRange(1,3,data.C.length,1).setValues(data.C.map(v=>[v]));
  sh.getRange(1,5,data.E.length,1).setValues(data.E.map(v=>[v]));
  sh.getRange("A1").setFontWeight("bold");
  sh.getRange("C1").setFontWeight("bold");
  sh.getRange("E1").setFontWeight("bold");
  // ชื่อช่วงสำหรับ validation
  sh.getRange(2,1,data.A.length-1,1).setName("LK_test_type");
  sh.getRange(2,3,data.C.length-1,1).setName("LK_gender");
  sh.getRange(2,5,data.E.length-1,1).setName("LK_phase");

  // ผูก dropdown ให้ชีทข้อมูล
  addDropdown(SHEET_NAMES.USERS, "gender", "=LK_gender");
  addDropdown(SHEET_NAMES.BODY_MEASUREMENTS, "phase", "=LK_phase");
  addDropdown(SHEET_NAMES.TEST_RESULTS, "test_type", "=LK_test_type");
  addDropdown(SHEET_NAMES.USERS, "gender", "=LK_gender");
}
function addDropdown(sheetName, headerKey, formulaRange) {
  const sheet = getSheet(sheetName);
  const headers = HEADERS_BY_SHEET[sheetName];
  const col = headers.indexOf(headerKey)+1;
  if (col<1) return;
  ensureSheetHasHeaders(sheet, headers);
  const last = Math.max(sheet.getMaxRows()-1, 1000); // เผื่อแถวอนาคต
  const rule = SpreadsheetApp.newDataValidation()
    .requireFormulaSatisfied(`=COUNTIF(${formulaRange},INDIRECT("RC",FALSE))>0`)
    .setAllowInvalid(false).build();
  sheet.getRange(2, col, last, 1).setDataValidation(rule);
}

// ---- ป้องกันหัวตาราง + ฟอร์แมตสี ----
function applySheetProtectionAndFormats() {
  const cfg = [
    {name:"README", color:"#6b7280"},
    {name:SHEET_NAMES.CLASSES, color:"#10b981"},
    {name:SHEET_NAMES.USERS, color:"#10b981"},
    {name:SHEET_NAMES.TEST_RESULTS, color:"#10b981"},
    {name:SHEET_NAMES.BODY_MEASUREMENTS, color:"#10b981"},
    {name:SHEET_NAMES.STANDARDS, color:"#2563eb"},
    {name:"Lookups", color:"#8b5cf6"},
    {name:"Views_ClassSummary", color:"#f59e0b"},
    {name:"Views_StudentLatest", color:"#f59e0b"},
  ];
  cfg.forEach(c=>{
    const sh = getSheet(c.name);
    sh.setTabColor(c.color);
    // หัวตาราง
    const headers = (c.name in HEADERS_BY_SHEET) ? HEADERS_BY_SHEET[c.name] : null;
    if (headers) {
      sh.setFrozenRows(1);
      const hr = sh.getRange(1,1,1,headers.length);
      hr.setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold")
        .setHorizontalAlignment("center");
      sh.autoResizeColumns(1, headers.length);
      // ล็อกหัวตาราง + คอลัมน์ id
      protectRange(sh, hr);
      const idCol = headers.indexOf("id")+1;
      if (idCol>0) protectRange(sh, sh.getRange(2,idCol,sh.getMaxRows()-1,1));
    }
  });
}
function protectRange(sheet, range) {
  const p = sheet.protect().setDescription("protected");
  p.setUnprotectedRanges([range]);
  p.removeEditors(p.getEditors());
  p.setWarningOnly(true); // เตือน ไม่ล็อกแข็ง เพื่อความยืดหยุ่น
  p.setRange(sheet.getDataRange());
}

// ---- README แบบสรุป 1 หน้า ----
function buildReadme() {
  const sh = getSheet("README");
  sh.clear();
  sh.getRange("A1").setValue("WTH Fitness App – คู่มืออาจารย์ (สรุป)")
    .setFontWeight("bold").setFontSize(14);
  const lines = [
    "1) สร้างชั้นเรียนในหน้าเว็บ แล้วนำเข้า/สร้างรายชื่อ (Roster) ได้จากเมนู",
    "2) บันทึกผลการทดสอบ (หรือใช้สคริปต์ช่วยนำเข้าตัวอย่าง)",
    "3) ดูสรุปผลล่าสุดรายชั้นเรียนที่แท็บ Views_ClassSummary",
    "4) ดูผลล่าสุดรายคนและวันที่วัดที่แท็บ Views_StudentLatest",
    "",
    "คำแนะนำ: ห้ามแก้ชื่อหัวคอลัมน์, แก้ไขค่าผ่านระบบเว็บจะปลอดภัยกว่า"
  ];
  sh.getRange(3,1,lines.length,1).setValues(lines.map(v=>[v]));
  sh.setTabColor("#6b7280");
}

// ---- มุมมองสรุปสำหรับอาจารย์ ----
function buildViews() {
  // Class Summary (ค่าเฉลี่ย “ผลล่าสุด” ต่อคลาส)
  const vs = getSheet("Views_ClassSummary"); vs.clear().setTabColor("#f59e0b");
  const headers = ["class_id","class_name","student_count","avg_bmi","avg_sit","avg_grip_ratio","avg_chair","avg_step"];
  vs.appendRow(headers).setFrozenRows(1);
  // สูตรใช้ QUERY + LOOKUP ล่าสุดต่อคน (ทำง่ายๆ ฝั่งชีท)
  // สร้างตาราง latest per (user_id,test_type)
  const helper = getSheet("_LatestHelper");
  helper.clear();
  helper.appendRow(["user_id","test_type","recorded_at","value","derived_value"]);
  helper.getRange("G1").setValue("NOTE: sheet อัตโนมัติ ใช้คำนวณผลล่าสุด");

  // ดึงผลล่าสุดต่อคู่กุญแจ
  helper.getRange(2,1).setFormula(`
=ARRAYFORMULA(QUERY(
  SORT({TestResults!A2:H, Users!A2:J},4,0),
  "select Col2,Col3,max(Col4),Col5,Col6 
   where Col2 is not null 
   group by Col2,Col3 label max(Col4) ''",0))`.trim());

  // สรุปค่าเฉลี่ยต่อคลาส (join ผ่าน Users.class_id)
  vs.getRange(2,1).setFormula(`
=ARRAYFORMULA(QUERY(
  {Users!H2:H, Classes!A2:C, 
   IFNA(VLOOKUP({Users!A2:A,"bmi"}, _LatestHelper!A2:E, 5, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"sit_and_reach"}, _LatestHelper!A2:E, 4, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"hand_grip"}, _LatestHelper!A2:E, 5, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"chair_stand"}, _LatestHelper!A2:E, 4, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"step_up"}, _LatestHelper!A2:E, 4, FALSE))},
  "select Col1, Col2, count(Col1), avg(Col5), avg(Col6), avg(Col7), avg(Col8), avg(Col9)
   where Col1 is not null
   group by Col1, Col2", 0))`.trim());

  // Student Latest (ผลล่าสุดรายคน)
  const vl = getSheet("Views_StudentLatest"); vl.clear().setTabColor("#f59e0b");
  vl.appendRow(["student_id","full_name","class_name","latest_date","bmi","sit","grip_ratio","chair","step"]);
  vl.setFrozenRows(1);
  vl.getRange(2,1).setFormula(`
=ARRAYFORMULA(QUERY(
  {Users!A2:J,
   Classes!A2:C,
   IFNA(VLOOKUP({Users!A2:A,"bmi"}, _LatestHelper!A2:E, 3, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"bmi"}, _LatestHelper!A2:E, 5, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"sit_and_reach"}, _LatestHelper!A2:E, 4, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"hand_grip"}, _LatestHelper!A2:E, 5, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"chair_stand"}, _LatestHelper!A2:E, 4, FALSE)),
   IFNA(VLOOKUP({Users!A2:A,"step_up"}, _LatestHelper!A2:E, 4, FALSE))},
  "select Col1, Col3, Col12, Col11, Col13, Col14, Col15, Col16
   where Col2='student' and Col1 is not null", 0))`.trim());
}

// ---- จัดลำดับแท็บให้อ่านง่าย ----
function reorderTabs() {
  const ss = getSpreadsheet();
  const order = ["README","Classes","Users","TestResults","BodyMeasurements","Standards","Lookups","Views_ClassSummary","Views_StudentLatest"];
  order.forEach((name, idx) => {
    const sh = ss.getSheetByName(name);
    if (sh) ss.setActiveSheet(sh); // ย้ายทีละแผ่น
  });
  ss.setActiveSheet(ss.getSheetByName("README"));
}

/**
 * อัปเกรดชีต TestResults / BodyMeasurements:
 * - เพิ่มคอลัมน์ user_full_name ถ้ายังไม่มี
 * - เติมชื่อย้อนหลังโดย join จาก Users ด้วย user_id
 */
function upgradeSheetsAddUserFullName() {
  const users = listUsers();
  const nameById = new Map(users.map(u => [u.id, u.full_name || ""]));

  // ---- TestResults ----
  (function upgradeTestResults(){
    const sheet = getSheet(SHEET_NAMES.TEST_RESULTS);
    if (!sheet) return;

    // อ่าน header ปัจจุบัน
    const headers = HEADERS.TestResults.slice();
    const currentHeader = sheet.getRange(1,1,1,Math.max(1,sheet.getLastColumn())).getValues()[0];
    const wantIndex = headers.indexOf("user_full_name");
    const haveIndex = currentHeader.indexOf("user_full_name");

    // ถ้าไม่มีคอลัมน์ user_full_name ให้แทรกหลัง user_id
    if (haveIndex === -1) {
      const afterUserIdAt = currentHeader.indexOf("user_id");
      const insertCol = (afterUserIdAt >= 0 ? (afterUserIdAt + 2) : (currentHeader.length + 1));
      sheet.insertColumnBefore(insertCol);
      sheet.getRange(1, insertCol, 1, 1).setValues([["user_full_name"]]);
    }

    // เติมชื่อย้อนหลัง
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      // รีเฟรช header หลังแทรก
      const hdr = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const idxUserId = hdr.indexOf("user_id");
      const idxUserName = hdr.indexOf("user_full_name");
      if (idxUserId >= 0 && idxUserName >= 0) {
        const rng = sheet.getRange(2,1,lastRow-1,sheet.getLastColumn());
        const vals = rng.getValues();
        for (let i=0;i<vals.length;i++){
          const uid = vals[i][idxUserId];
          if (!vals[i][idxUserName]) {
            vals[i][idxUserName] = nameById.get(uid) || "";
          }
        }
        rng.setValues(vals);
      }
    }
  })();

  // ---- BodyMeasurements ----
  (function upgradeBodyMeasurements(){
    const sheet = getSheet(SHEET_NAMES.BODY_MEASUREMENTS);
    if (!sheet) return;

    const currentHeader = sheet.getRange(1,1,1,Math.max(1,sheet.getLastColumn())).getValues()[0];
    const haveIndex = currentHeader.indexOf("user_full_name");

    if (haveIndex === -1) {
      const afterUserIdAt = currentHeader.indexOf("user_id");
      const insertCol = (afterUserIdAt >= 0 ? (afterUserIdAt + 2) : (currentHeader.length + 1));
      sheet.insertColumnBefore(insertCol);
      sheet.getRange(1, insertCol, 1, 1).setValues([["user_full_name"]]);
    }

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const hdr = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const idxUserId = hdr.indexOf("user_id");
      const idxUserName = hdr.indexOf("user_full_name");
      if (idxUserId >= 0 && idxUserName >= 0) {
        const rng = sheet.getRange(2,1,lastRow-1,sheet.getLastColumn());
        const vals = rng.getValues();
        for (let i=0;i<vals.length;i++){
          const uid = vals[i][idxUserId];
          if (!vals[i][idxUserName]) {
            vals[i][idxUserName] = nameById.get(uid) || "";
          }
        }
        rng.setValues(vals);
      }
    }
  })();

  Logger.log("Upgrade completed: added/filled user_full_name where needed.");
}



/**
 * เมนูบน Google Sheets → WTH Admin
 * - First-time Setup: รันครบ 3 ขั้นตอนแรก
 * - Upgrade user_full_name: อัปเกรดคอลัมน์และเติมชื่อย้อนหลัง
 * - Seed Demo (Basic / Full Coverage): เติมข้อมูลเดโม่
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("WTH Admin")
      .addItem("① First-time Setup (headers + admin + standards)", "runFirstTimeSetupAll")
      .addItem("② Upgrade user_full_name columns", "upgradeSheetsAddUserFullName")
      .addSeparator()
      .addItem("③ Seed Demo – Basic (หลายคลาส)", "populateWithSampleData")
      .addItem("③ Seed Demo – Full Coverage", "populateDemoFullCoverage")
      .addToUi();
  } catch (e) {
    // ถ้าเปิดจาก Apps Script (ไม่ใช่จาก Spreadsheet) จะไม่มี Ui — ข้ามได้
  }
}

/**
 * กดครั้งเดียวทำ 3 ขั้น:
 * 1) setupApplication() -> สร้าง headers + admin
 * 2) initializeStandards() -> เติมเกณฑ์มาตรฐาน
 * 3) upgradeSheetsAddUserFullName() -> เพิ่ม/เติมชื่อในผลทดสอบและสัดส่วนร่างกาย
 */
function runFirstTimeSetupAll() {
  const logs = [];
  const step = (name, fn) => {
    try { fn(); logs.push(`✔ ${name} สำเร็จ`); }
    catch (err) { logs.push(`✖ ${name} ล้มเหลว: ${err.message}`); }
  };

  step("Setup application (headers + admin)", setupApplication);
  step("Initialize standards", initializeStandards);
  step("Upgrade user_full_name columns", upgradeSheetsAddUserFullName);

  Logger.log(logs.join("\n"));
  try { SpreadsheetApp.getActive().toast("First-time setup เสร็จแล้ว\nดูรายละเอียดใน View → Logs"); } catch (_) {}
}

// ===============================================================
// --- Sport Types Management ---
// ===============================================================

function getSportTypes() {
  const sheet = getSheet(SHEET_NAMES.SPORT_TYPES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (h === "positions") {
        // Parse positions from comma-separated string
        obj[h] = row[i] ? row[i].split(",").map(p => p.trim()) : [];
      } else {
        obj[h] = row[i];
      }
    });
    return obj;
  });
}

function addSportType(payload) {
  const { name, positions } = payload;
  if (!name || !positions || !Array.isArray(positions)) {
    throw new Error("name and positions array are required");
  }

  const now = new Date().toISOString();
  const newSportType = {
    id: generateId(),
    name: name,
    positions: positions.join(", "), // Store as comma-separated string
    created_at: now,
  };

  appendRow(SHEET_NAMES.SPORT_TYPES, HEADERS.SportTypes, newSportType);
  
  // Return the created sport type with parsed positions
  return {
    ...newSportType,
    positions: positions,
  };
}

function updateSportType(payload) {
  const { id, name, positions } = payload;
  if (!id) throw new Error("id is required");

  const sheet = getSheet(SHEET_NAMES.SPORT_TYPES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === id) {
      if (name !== undefined) {
        const idxName = headers.indexOf("name");
        data[i][idxName] = name;
      }
      if (positions !== undefined && Array.isArray(positions)) {
        const idxPos = headers.indexOf("positions");
        data[i][idxPos] = positions.join(", ");
      }
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      
      return {
        id: data[i][idxId],
        name: data[i][headers.indexOf("name")],
        positions: data[i][headers.indexOf("positions")].split(",").map(p => p.trim()),
        created_at: data[i][headers.indexOf("created_at")],
      };
    }
  }
  throw new Error("Sport type not found");
}

function deleteSportType(payload) {
  const { id } = payload;
  if (!id) throw new Error("id is required");

  const sheet = getSheet(SHEET_NAMES.SPORT_TYPES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Sport type deleted" };
    }
  }
  throw new Error("Sport type not found");
}

// ===============================================================
// --- Fitness Criteria Management ---
// ===============================================================

function getFitnessCriteria() {
  const sheet = getSheet(SHEET_NAMES.FITNESS_CRITERIA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      // Convert snake_case to camelCase for frontend
      const camelKey = h.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      obj[camelKey] = row[i];
    });
    return obj;
  });
}

function addFitnessCriteria(payload) {
  const {
    sportType,
    gender,
    ageMin,
    ageMax,
    testType,
    excellent,
    good,
    fair,
    poor,
    unit,
  } = payload;

  if (!sportType || !gender || !testType) {
    throw new Error("sportType, gender, and testType are required");
  }

  const now = new Date().toISOString();
  const newCriteria = {
    id: generateId(),
    sport_type: sportType,
    gender: gender,
    age_min: ageMin || 0,
    age_max: ageMax || 100,
    test_type: testType,
    excellent: excellent || "",
    good: good || "",
    fair: fair || "",
    poor: poor || "",
    unit: unit || "",
    created_at: now,
  };

  appendRow(SHEET_NAMES.FITNESS_CRITERIA, HEADERS.FitnessCriteria, newCriteria);

  // Return in camelCase for frontend
  return {
    id: newCriteria.id,
    sportType: newCriteria.sport_type,
    gender: newCriteria.gender,
    ageMin: newCriteria.age_min,
    ageMax: newCriteria.age_max,
    testType: newCriteria.test_type,
    excellent: newCriteria.excellent,
    good: newCriteria.good,
    fair: newCriteria.fair,
    poor: newCriteria.poor,
    unit: newCriteria.unit,
    createdAt: newCriteria.created_at,
  };
}

function updateFitnessCriteria(payload) {
  const { id, ...updates } = payload;
  if (!id) throw new Error("id is required");

  const sheet = getSheet(SHEET_NAMES.FITNESS_CRITERIA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === id) {
      // Map camelCase to snake_case
      const fieldMap = {
        sportType: "sport_type",
        ageMin: "age_min",
        ageMax: "age_max",
        testType: "test_type",
      };

      Object.keys(updates).forEach(key => {
        const snakeKey = fieldMap[key] || key;
        const idx = headers.indexOf(snakeKey);
        if (idx !== -1) {
          data[i][idx] = updates[key];
        }
      });

      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);

      // Return updated object in camelCase
      const result = {};
      headers.forEach((h, idx) => {
        const camelKey = h.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = data[i][idx];
      });
      return result;
    }
  }
  throw new Error("Fitness criteria not found");
}

function deleteFitnessCriteria(payload) {
  const { id } = payload;
  if (!id) throw new Error("id is required");

  const sheet = getSheet(SHEET_NAMES.FITNESS_CRITERIA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Fitness criteria deleted" };
    }
  }
  throw new Error("Fitness criteria not found");
}

// ========== STUDENT MANAGEMENT ==========

function updateStudent(payload) {
  const { studentId, fullName, email, gender, birthdate } = payload;
  if (!studentId) throw new Error("studentId is required");

  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === studentId) {
      if (fullName) data[i][headers.indexOf("full_name")] = fullName;
      if (email) data[i][headers.indexOf("email")] = email;
      if (gender) data[i][headers.indexOf("gender")] = gender;
      if (birthdate) data[i][headers.indexOf("birthdate")] = birthdate;
      
      data[i][headers.indexOf("updated_at")] = new Date().toISOString();
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      
      return { message: "Student updated successfully" };
    }
  }
  throw new Error("Student not found");
}

function deleteStudent(payload) {
  const { studentId } = payload;
  if (!studentId) throw new Error("studentId is required");

  const sheet = getSheet(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === studentId) {
      sheet.deleteRow(i + 1);
      return { message: "Student deleted successfully" };
    }
  }
  throw new Error("Student not found");
}

function addStudent(payload) {
  const { classId, fullName, email, gender, birthdate } = payload;
  if (!classId || !fullName || !email || !gender || !birthdate) {
    throw new Error("classId, fullName, email, gender, and birthdate are required");
  }

  const now = new Date().toISOString();
  const studentId = generateId();
  const tempPassword = generateTempPassword();
  const passwordHash = hashPassword(tempPassword);

  const newStudent = {
    id: studentId,
    role: "student",
    email: email,
    password_hash: passwordHash,
    full_name: fullName,
    gender: gender,
    birthdate: birthdate,
    class_id: classId,
    created_at: now,
    updated_at: now,
  };

  appendRow(SHEET_NAMES.USERS, HEADERS.Users, newStudent);
  
  return { 
    message: "Student added successfully",
    studentId: studentId,
    tempPassword: tempPassword
  };
}

// ========== TEST RESULT MANAGEMENT ==========

function deleteTestResult(payload) {
  const { resultId } = payload;
  if (!resultId) throw new Error("resultId is required");

  const sheet = getSheet(SHEET_NAMES.TEST_RESULTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === resultId) {
      sheet.deleteRow(i + 1);
      return { message: "Test result deleted successfully" };
    }
  }
  throw new Error("Test result not found");
}

function updateTestResult(payload) {
  const { resultId, value, derivedValue, evaluation, notes } = payload;
  if (!resultId) throw new Error("resultId is required");

  const sheet = getSheet(SHEET_NAMES.TEST_RESULTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === resultId) {
      if (value !== undefined) data[i][headers.indexOf("value")] = value;
      if (derivedValue !== undefined) data[i][headers.indexOf("derived_value")] = derivedValue;
      if (evaluation) data[i][headers.indexOf("evaluation")] = evaluation;
      if (notes !== undefined) data[i][headers.indexOf("notes")] = notes;
      
      data[i][headers.indexOf("updated_at")] = new Date().toISOString();
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([data[i]]);
      
      return { message: "Test result updated successfully" };
    }
  }
  throw new Error("Test result not found");
}

// ========== CLASS MANAGEMENT ==========

function deleteClass(payload) {
  const { classId } = payload;
  if (!classId) throw new Error("classId is required");

  // Check if class has students
  const userSheet = getSheet(SHEET_NAMES.USERS);
  const userData = userSheet.getDataRange().getValues();
  const userHeaders = userData[0];
  const idxClassId = userHeaders.indexOf("class_id");
  
  if (idxClassId !== -1) {
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][idxClassId] === classId) {
        throw new Error("Cannot delete class with students. Please remove all students first.");
      }
    }
  }

  // Delete the class
  const sheet = getSheet(SHEET_NAMES.CLASSES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxId = headers.indexOf("id");
  if (idxId === -1) throw new Error("id column not found");

  for (let i = 1; i < data.length; i++) {
    if (data[i][idxId] === classId) {
      sheet.deleteRow(i + 1);
      return { message: "Class deleted successfully" };
    }
  }
  throw new Error("Class not found");
}

// ===============================================================
// --- 🚀 RESET & SEED DATABASE - แบ่งเป็นพาร์ทย่อยๆ ---
// ===============================================================

/**
 * 🎯 ฟังก์ชันหลัก: Reset ระบบและเพิ่มข้อมูลตัวอย่างทั้งหมด (รันครั้งเดียวจบ)
 */
function RESET_AND_SEED_ALL() {
  Logger.log("🔄 Starting full database reset...");
  
  try {
    STEP1_ClearAllData();
    STEP2_InitializeHeaders();
    STEP3_SeedUsers();
    STEP4_SeedClasses();
    STEP5_SeedTestResults();
    STEP6_SeedBodyMeasurements();
    STEP7_SeedSportTypes();
    STEP8_SeedFitnessCriteria();
    STEP9_SeedStandards();
    
    Logger.log("✅ All steps completed!");
    
    SpreadsheetApp.getUi().alert(
      "✅ สำเร็จ!\n\n" +
      "ระบบได้รีเซ็ตและเพิ่มข้อมูลตัวอย่างเรียบร้อยแล้ว\n\n" +
      "� ข้อมูลเข้าสู่ระบบ:\n" +
      "อาจารย์: admin@wth.ac.th / WTH456\n" +
      "นักเรียน: student1@wth.ac.th / student123\n" +
      "นักกีฬา: athlete1@wth.ac.th / athlete123"
    );
    
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
    SpreadsheetApp.getUi().alert("❌ เกิดข้อผิดพลาด: " + error.message);
    throw error;
  }
}

/**
 * 📝 STEP 1: ลบข้อมูลเก่าทั้งหมด (เก็บเฉพาะ header)
 */
function STEP1_ClearAllData() {
  Logger.log("STEP 1: Clearing all data...");
  clearAllSheets();
  SpreadsheetApp.getUi().alert("✅ STEP 1 สำเร็จ: ลบข้อมูลเก่าทั้งหมดแล้ว");
}

/**
 * 📝 STEP 2: สร้าง Headers ใหม่ทุกตาราง
 */
function STEP2_InitializeHeaders() {
  Logger.log("STEP 2: Initializing headers...");
  initializeSheetHeaders();
  SpreadsheetApp.getUi().alert("✅ STEP 2 สำเร็จ: สร้าง Headers ทุกตารางแล้ว");
}

/**
 * 📝 STEP 3: เพิ่มผู้ใช้ (อาจารย์ 1, นักเรียน 15, นักกีฬา 5)
 */
function STEP3_SeedUsers() {
  Logger.log("STEP 3: Adding users...");
  const users = seedUsers();
  SpreadsheetApp.getUi().alert(
    `✅ STEP 3 สำเร็จ: เพิ่มผู้ใช้แล้ว\n\n` +
    `• อาจารย์: 1 คน\n` +
    `• นักเรียน: ${users.students.length} คน\n` +
    `• นักกีฬา: ${users.athletes.length} คน`
  );
}

/**
 * 📝 STEP 4: สร้างห้องเรียนและจัดนักเรียนเข้าห้อง
 */
function STEP4_SeedClasses() {
  Logger.log("STEP 4: Creating classes...");
  
  // ดึงข้อมูล instructor และ students ที่สร้างไว้
  const users = listUsers();
  const instructor = users.find(u => u.role === "instructor");
  const students = users.filter(u => u.role === "student");
  
  if (!instructor) throw new Error("ไม่พบอาจารย์ กรุณารัน STEP 3 ก่อน");
  
  const classes = seedClasses(instructor);
  assignStudentsToClasses(students, classes);
  
  SpreadsheetApp.getUi().alert(
    `✅ STEP 4 สำเร็จ: สร้างห้องเรียนแล้ว\n\n` +
    `• จำนวนห้อง: ${classes.length} ห้อง\n` +
    `• จัดนักเรียนเข้าห้องเรียบร้อย`
  );
}

/**
 * 📝 STEP 5: เพิ่มผลการทดสอบ (ก่อน-หลัง)
 */
function STEP5_SeedTestResults() {
  Logger.log("STEP 5: Adding test results...");
  
  const users = listUsers();
  const students = users.filter(u => u.role === "student");
  const athletes = users.filter(u => u.role === "athlete");
  
  if (students.length === 0 && athletes.length === 0) {
    throw new Error("ไม่พบนักเรียนหรือนักกีฬา กรุณารัน STEP 3 ก่อน");
  }
  
  const count = seedTestResults(students, athletes);
  
  SpreadsheetApp.getUi().alert(
    `✅ STEP 5 สำเร็จ: เพิ่มผลการทดสอบแล้ว\n\n` +
    `• จำนวน: ${count} รายการ (ก่อน-หลัง)`
  );
}

/**
 * � STEP 6: เพิ่มข้อมูลสัดส่วนร่างกาย
 */
function STEP6_SeedBodyMeasurements() {
  Logger.log("STEP 6: Adding body measurements...");
  
  const users = listUsers();
  const students = users.filter(u => u.role === "student");
  
  if (students.length === 0) {
    throw new Error("ไม่พบนักเรียน กรุณารัน STEP 3 ก่อน");
  }
  
  const count = seedBodyMeasurements(students);
  
  SpreadsheetApp.getUi().alert(
    `✅ STEP 6 สำเร็จ: เพิ่มข้อมูลสัดส่วนร่างกายแล้ว\n\n` +
    `• จำนวน: ${count} รายการ (ก่อน-หลัง)`
  );
}

/**
 * 📝 STEP 7: เพิ่มประเภทกีฬา
 */
function STEP7_SeedSportTypes() {
  Logger.log("STEP 7: Adding sport types...");
  const count = seedSportTypes();
  SpreadsheetApp.getUi().alert(
    `✅ STEP 7 สำเร็จ: เพิ่มประเภทกีฬาแล้ว\n\n` +
    `• จำนวน: ${count} ประเภท`
  );
}

/**
 * 📝 STEP 8: เพิ่มเกณฑ์การประเมินนักกีฬา
 */
function STEP8_SeedFitnessCriteria() {
  Logger.log("STEP 8: Adding fitness criteria...");
  const count = seedFitnessCriteria();
  SpreadsheetApp.getUi().alert(
    `✅ STEP 8 สำเร็จ: เพิ่มเกณฑ์การประเมินนักกีฬาแล้ว\n\n` +
    `• จำนวน: ${count} เกณฑ์`
  );
}

/**
 * 📝 STEP 9: เพิ่มเกณฑ์มาตรฐาน
 */
function STEP9_SeedStandards() {
  Logger.log("STEP 9: Adding standards...");
  const count = seedStandards();
  SpreadsheetApp.getUi().alert(
    `✅ STEP 9 สำเร็จ: เพิ่มเกณฑ์มาตรฐานแล้ว\n\n` +
    `• จำนวน: ${count} เกณฑ์\n\n` +
    `🎉 เสร็จสมบูรณ์ทุก STEP แล้ว!`
  );
}

/**
 * ลบข้อมูลทั้งหมด (เก็บเฉพาะ header row)
 */
function clearAllSheets() {
  const ss = getSpreadsheet();
  const sheetNames = Object.values(SHEET_NAMES);
  
  sheetNames.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
        Logger.log(`✓ Cleared: ${sheetName}`);
      }
    } catch (error) {
      Logger.log(`⚠ Error clearing ${sheetName}: ${error}`);
    }
  });
}

// ===============================================================
// --- 🛠️ HELPER FUNCTIONS สำหรับ SEED DATA ---
// ===============================================================

/**
 * สร้างผู้ใช้ตัวอย่าง
 */
function seedUsers() {
  const now = new Date().toISOString();
  
  // อาจารย์
  const instructor = {
    id: generateId(),
    role: "instructor",
    full_name: "อาจารย์สมชาย ใจดี",
    email: "admin@wth.ac.th",
    password_hash: hashPassword("WTH456"),
    gender: "male",
    birthdate: "1985-05-15",
    class_id: "",
    sport_type: "",
    position: "",
    created_at: now,
    updated_at: now,
  };
  appendRow(SHEET_NAMES.USERS, HEADERS.Users, instructor);
  
  // นักเรียน 15 คน
  const students = [];
  const firstNames = ["สมชาย", "สมหญิง", "วิชัย", "ประภา", "นฤมล", "ชัยวัฒน์", "อรุณ", "สุดา", "ปิยะ", "วัชระ", "มณี", "ศิริ", "บุญมี", "เกษม", "พิมพ์"];
  const lastNames = ["ใจดี", "มานะ", "เรืองศรี", "สวัสดี", "รักษา", "พัฒนา", "ทองดี", "แสงจันทร์", "วิไล", "สุขใส", "งามดี", "เจริญ", "ปลอดภัย", "ร่มเย็น", "สุขสันต์"];
  
  for (let i = 0; i < 15; i++) {
    const student = {
      id: generateId(),
      role: "student",
      full_name: `${firstNames[i]} ${lastNames[i]}`,
      email: `student${i + 1}@wth.ac.th`,
      password_hash: hashPassword("student123"),
      gender: i % 2 === 0 ? "male" : "female",
      birthdate: `200${Math.floor(i / 3) + 3}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      class_id: "",
      sport_type: "",
      position: "",
      created_at: now,
      updated_at: now,
    };
    appendRow(SHEET_NAMES.USERS, HEADERS.Users, student);
    students.push(student);
  }
  
  // นักกีฬา 5 คน
  const athletes = [];
  const sports = ["football", "basketball", "volleyball", "badminton", "tennis"];
  const positions = {
    football: ["striker", "midfielder", "defender"],
    basketball: ["point_guard", "shooting_guard", "center"],
    volleyball: ["setter", "outside_hitter", "libero"],
    badminton: ["singles", "doubles"],
    tennis: ["singles", "doubles"]
  };
  
  for (let i = 0; i < 5; i++) {
    const sport = sports[i];
    const athlete = {
      id: generateId(),
      role: "athlete",
      full_name: `นักกีฬา${firstNames[i]} ${lastNames[i]}`,
      email: `athlete${i + 1}@wth.ac.th`,
      password_hash: hashPassword("athlete123"),
      gender: i % 2 === 0 ? "male" : "female",
      birthdate: `200${2 + i}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      class_id: "",
      sport_type: sport,
      position: positions[sport][Math.floor(Math.random() * positions[sport].length)],
      created_at: now,
      updated_at: now,
    };
    appendRow(SHEET_NAMES.USERS, HEADERS.Users, athlete);
    athletes.push(athlete);
  }
  
  return { instructor, students, athletes };
}

/**
 * สร้างห้องเรียนตัวอย่าง
 */
function seedClasses(instructor) {
  const now = new Date().toISOString();
  const classes = [];
  
  const classNames = ["PE รุ่น 1/2568", "PE รุ่น 2/2568", "PE รุ่น 3/2568"];
  const classCodes = ["PE101", "PE102", "PE103"];
  
  for (let i = 0; i < 3; i++) {
    const classData = {
      id: generateId(),
      instructor_id: instructor.id,
      class_name: classNames[i],
      class_code: classCodes[i],
      created_at: now,
    };
    appendRow(SHEET_NAMES.CLASSES, HEADERS.Classes, classData);
    classes.push(classData);
  }
  
  return classes;
}

/**
 * กำหนดนักเรียนเข้าห้อง
 */
function assignStudentsToClasses(students, classes) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const classIdIndex = headers.indexOf("class_id");
  
  students.forEach((student, index) => {
    const classId = classes[index % classes.length].id;
    
    // อัปเดตใน sheet
    for (let i = 1; i < data.length; i++) {
      if (data[i][headers.indexOf("id")] === student.id) {
        sheet.getRange(i + 1, classIdIndex + 1).setValue(classId);
        break;
      }
    }
  });
}

/**
 * สร้างผลการทดสอบตัวอย่าง
 */
function seedTestResults(students, athletes) {
  const now = new Date().toISOString();
  let count = 0;
  const testTypes = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
  const evaluations = ["ดีมาก", "ดี", "ปานกลาง", "ควรปรับปรุง"];
  
  const allUsers = students.concat(athletes);
  
  allUsers.forEach(user => {
    testTypes.forEach(testType => {
      // ก่อน
      const beforeValue = getRandomTestValue(testType, false);
      const beforeResult = {
        id: generateId(),
        user_id: user.id,
        user_full_name: user.full_name,
        test_type: testType,
        recorded_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 วันก่อน
        value: beforeValue,
        derived_value: calculateDerivedValue(testType, beforeValue, user.gender),
        evaluation: evaluations[Math.floor(Math.random() * evaluations.length)],
        notes: "ทดสอบก่อนเข้าเรียน",
      };
      appendRow(SHEET_NAMES.TEST_RESULTS, HEADERS.TestResults, beforeResult);
      count++;
      
      // หลัง (ปรับปรุงขึ้น)
      const afterValue = getRandomTestValue(testType, true);
      const afterResult = {
        id: generateId(),
        user_id: user.id,
        user_full_name: user.full_name,
        test_type: testType,
        recorded_at: now,
        value: afterValue,
        derived_value: calculateDerivedValue(testType, afterValue, user.gender),
        evaluation: evaluations[Math.floor(Math.random() * 2)], // ดีขึ้น
        notes: "ทดสอบหลังเรียน",
      };
      appendRow(SHEET_NAMES.TEST_RESULTS, HEADERS.TestResults, afterResult);
      count++;
    });
  });
  
  return count;
}

/**
 * สร้างข้อมูลสัดส่วนร่างกาย
 */
function seedBodyMeasurements(students) {
  const now = new Date().toISOString();
  let count = 0;
  
  students.forEach(student => {
    // ก่อน
    const beforeMeasurement = {
      id: generateId(),
      user_id: student.id,
      user_full_name: student.full_name,
      phase: "before",
      recorded_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      muscular_strength: Math.floor(Math.random() * 20) + 20,
      muscular_endurance: Math.floor(Math.random() * 10) + 15,
      flexibility: Math.floor(Math.random() * 15) + 10,
      bmi: (Math.random() * 5 + 20).toFixed(1),
      cardio_respiratory_endurance: Math.floor(Math.random() * 50) + 100,
      weight: Math.floor(Math.random() * 20) + 50,
      height: Math.floor(Math.random() * 20) + 160,
      pulse: Math.floor(Math.random() * 20) + 70,
      neck: Math.floor(Math.random() * 5) + 32,
      shoulder_left: Math.floor(Math.random() * 10) + 40,
      shoulder_right: Math.floor(Math.random() * 10) + 40,
      upper_arm_left: Math.floor(Math.random() * 8) + 25,
      upper_arm_right: Math.floor(Math.random() * 8) + 25,
      wrist_left: Math.floor(Math.random() * 3) + 15,
      wrist_right: Math.floor(Math.random() * 3) + 15,
      chest: Math.floor(Math.random() * 15) + 80,
      abdomen: Math.floor(Math.random() * 15) + 75,
      waist: Math.floor(Math.random() * 15) + 70,
      hip: Math.floor(Math.random() * 15) + 85,
      thigh_left: Math.floor(Math.random() * 10) + 50,
      thigh_right: Math.floor(Math.random() * 10) + 50,
      calf_left: Math.floor(Math.random() * 8) + 32,
      calf_right: Math.floor(Math.random() * 8) + 32,
      ankle_left: Math.floor(Math.random() * 3) + 20,
      ankle_right: Math.floor(Math.random() * 3) + 20,
      notes: "การวัดก่อนเข้าเรียน",
    };
    appendRow(SHEET_NAMES.BODY_MEASUREMENTS, HEADERS.BodyMeasurements, beforeMeasurement);
    count++;
    
    // หลัง (ปรับปรุง)
    const afterMeasurement = {
      id: generateId(),
      user_id: student.id,
      user_full_name: student.full_name,
      phase: "after",
      recorded_at: now,
      muscular_strength: beforeMeasurement.muscular_strength + Math.floor(Math.random() * 10) + 5,
      muscular_endurance: beforeMeasurement.muscular_endurance + Math.floor(Math.random() * 5) + 3,
      flexibility: beforeMeasurement.flexibility + Math.floor(Math.random() * 8) + 3,
      bmi: (parseFloat(beforeMeasurement.bmi) - Math.random() * 2).toFixed(1),
      cardio_respiratory_endurance: beforeMeasurement.cardio_respiratory_endurance + Math.floor(Math.random() * 30) + 10,
      weight: beforeMeasurement.weight - Math.floor(Math.random() * 3),
      height: beforeMeasurement.height,
      pulse: beforeMeasurement.pulse - Math.floor(Math.random() * 5),
      neck: beforeMeasurement.neck,
      shoulder_left: beforeMeasurement.shoulder_left + Math.floor(Math.random() * 3),
      shoulder_right: beforeMeasurement.shoulder_right + Math.floor(Math.random() * 3),
      upper_arm_left: beforeMeasurement.upper_arm_left + Math.floor(Math.random() * 3),
      upper_arm_right: beforeMeasurement.upper_arm_right + Math.floor(Math.random() * 3),
      wrist_left: beforeMeasurement.wrist_left,
      wrist_right: beforeMeasurement.wrist_right,
      chest: beforeMeasurement.chest + Math.floor(Math.random() * 5),
      abdomen: beforeMeasurement.abdomen - Math.floor(Math.random() * 5),
      waist: beforeMeasurement.waist - Math.floor(Math.random() * 5),
      hip: beforeMeasurement.hip,
      thigh_left: beforeMeasurement.thigh_left + Math.floor(Math.random() * 3),
      thigh_right: beforeMeasurement.thigh_right + Math.floor(Math.random() * 3),
      calf_left: beforeMeasurement.calf_left + Math.floor(Math.random() * 2),
      calf_right: beforeMeasurement.calf_right + Math.floor(Math.random() * 2),
      ankle_left: beforeMeasurement.ankle_left,
      ankle_right: beforeMeasurement.ankle_right,
      notes: "การวัดหลังเรียน",
    };
    appendRow(SHEET_NAMES.BODY_MEASUREMENTS, HEADERS.BodyMeasurements, afterMeasurement);
    count++;
  });
  
  return count;
}

/**
 * สร้างประเภทกีฬา
 */
function seedSportTypes() {
  const now = new Date().toISOString();
  const sportTypes = [
    { name: "ฟุตบอล", positions: ["ผู้รักษาประตู", "กองหลัง", "กองกลาง", "กองหน้า"] },
    { name: "บาสเกตบอล", positions: ["พอยต์การ์ด", "ชูตติ้งการ์ด", "สมอลฟอร์เวิร์ด", "พาวเวอร์ฟอร์เวิร์ด", "เซ็นเตอร์"] },
    { name: "วอลเลย์บอล", positions: ["เซ็ตเตอร์", "เอาท์ไซด์ฮิตเตอร์", "มิดเดิลบล็อกเกอร์", "ออปโปสิต", "ลิเบโร่"] },
    { name: "แบดมินตัน", positions: ["เดี่ยว", "คู่"] },
    { name: "เทนนิส", positions: ["เดี่ยว", "คู่"] },
  ];
  
  sportTypes.forEach(sport => {
    const sportData = {
      id: generateId(),
      name: sport.name,
      positions: JSON.stringify(sport.positions),
      created_at: now,
    };
    appendRow(SHEET_NAMES.SPORT_TYPES, HEADERS.SportTypes, sportData);
  });
  
  return sportTypes.length;
}

/**
 * สร้างเกณฑ์การประเมินสำหรับนักกีฬา
 */
function seedFitnessCriteria() {
  const now = new Date().toISOString();
  let count = 0;
  
  const sports = ["ฟุตบอล", "บาสเกตบอล", "วอลเลย์บอล", "แบดมินตัน", "เทนนิส"];
  const testTypes = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
  const genders = ["male", "female"];
  const ageRanges = [
    { min: 18, max: 24 },
    { min: 25, max: 34 },
    { min: 35, max: 44 }
  ];
  
  sports.forEach(sport => {
    testTypes.forEach(testType => {
      genders.forEach(gender => {
        ageRanges.forEach(ageRange => {
          const criterion = {
            id: generateId(),
            sport_type: sport,
            gender: gender,
            age_min: ageRange.min,
            age_max: ageRange.max,
            test_type: testType,
            excellent: gender === "male" ? 32 : 28,
            good: gender === "male" ? 26 : 23,
            fair: gender === "male" ? 20 : 18,
            poor: gender === "male" ? 15 : 13,
            unit: getTestUnit(testType),
            created_at: now,
          };
          appendRow(SHEET_NAMES.FITNESS_CRITERIA, HEADERS.FitnessCriteria, criterion);
          count++;
        });
      });
    });
  });
  
  return count;
}

/**
 * สร้างเกณฑ์มาตรฐานทั่วไป
 */
function seedStandards() {
  const now = new Date().toISOString();
  let count = 0;
  
  const testTypes = ["bmi", "sit_and_reach", "hand_grip", "chair_stand", "step_up"];
  const genders = ["male", "female"];
  const ageRanges = [
    { min: 18, max: 24 },
    { min: 25, max: 34 },
    { min: 35, max: 44 },
    { min: 45, max: 54 },
    { min: 55, max: 64 }
  ];
  const categories = ["ดีมาก", "ดี", "ปานกลาง", "ควรปรับปรุง"];
  
  testTypes.forEach(testType => {
    genders.forEach(gender => {
      ageRanges.forEach(ageRange => {
        categories.forEach((category, idx) => {
          let minValue, maxValue;
          
          if (testType === "bmi") {
            // BMI ควรอยู่ในช่วง 18.5-24.9
            minValue = 18.5 + (idx * 2);
            maxValue = minValue + 2;
          } else {
            // ค่าที่มากกว่าคือดีกว่า
            const baseValue = gender === "male" ? 30 : 25;
            minValue = baseValue - (idx * 5);
            maxValue = baseValue - ((idx - 1) * 5);
          }
          
          const standard = {
            id: generateId(),
            test_type: testType,
            gender: gender,
            age_min: ageRange.min,
            age_max: ageRange.max,
            category: category,
            min_value: minValue,
            max_value: maxValue,
            comparison: "range",
            audience: "general",
          };
          appendRow(SHEET_NAMES.STANDARDS, HEADERS.Standards, standard);
          count++;
        });
      });
    });
  });
  
  return count;
}

/**
 * Helper: สุ่มค่าการทดสอบ
 */
function getRandomTestValue(testType, isAfter) {
  const baseValues = {
    bmi: { min: 18.5, max: 26 },
    sit_and_reach: { min: 10, max: 30 },
    hand_grip: { min: 20, max: 45 },
    chair_stand: { min: 15, max: 35 },
    step_up: { min: 40, max: 80 },
  };
  
  const range = baseValues[testType] || { min: 10, max: 50 };
  let value = Math.random() * (range.max - range.min) + range.min;
  
  // ถ้าเป็นหลัง ให้ดีขึ้น
  if (isAfter) {
    if (testType === "bmi") {
      value = Math.max(value - (Math.random() * 2 + 1), 18.5); // ลดลง
    } else {
      value = value + (Math.random() * 8 + 3); // เพิ่มขึ้น
    }
  }
  
  return parseFloat(value.toFixed(2));
}

/**
 * Helper: คำนวณค่าที่ได้จากการทดสอบ
 */
function calculateDerivedValue(testType, value, gender) {
  return parseFloat(value);
}

/**
 * Helper: ดึง unit ของการทดสอบ
 */
function getTestUnit(testType) {
  const units = {
    bmi: "kg/m²",
    sit_and_reach: "cm",
    hand_grip: "kg",
    chair_stand: "times",
    step_up: "times",
  };
  return units[testType] || "";
}

// ===============================================
// Storage Management Functions
// ===============================================

/**
 * Get statistics about sheet usage
 */
function getSheetStats() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheets = ss.getSheets();
    const maxCells = 10000000; // Google Sheets limit: 10 million cells
    
    let totalCells = 0;
    const sheetStats = [];
    
    sheets.forEach(sheet => {
      const rowCount = sheet.getMaxRows();
      const columnCount = sheet.getMaxColumns();
      const cellCount = rowCount * columnCount;
      totalCells += cellCount;
      
      sheetStats.push({
        name: sheet.getName(),
        rowCount: rowCount,
        columnCount: columnCount,
        cellCount: cellCount,
        percentFull: (cellCount / maxCells) * 100
      });
    });
    
    return {
      sheets: sheetStats,
      totalCells: totalCells,
      maxCells: maxCells,
      warningThreshold: (totalCells / maxCells) > 0.8 // Warning at 80%
    };
  } catch (error) {
    throw new Error('ไม่สามารถดึงสถิติ Sheet ได้: ' + error.message);
  }
}

/**
 * Archive old data to a separate sheet
 */
function archiveOldData(options) {
  const beforeDate = options.beforeDate ? new Date(options.beforeDate) : null;
  const sheetNames = options.sheetNames || ['TestResults', 'BodyMeasurements'];
  
  if (!beforeDate) {
    throw new Error('กรุณาระบุวันที่สำหรับ archive');
  }
  
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  let totalArchived = 0;
  
  // Create archive sheet if not exists
  const archiveSheetName = 'Archive_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy_MM');
  let archiveSheet = ss.getSheetByName(archiveSheetName);
  
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(archiveSheetName);
    archiveSheet.appendRow(['Archived Date', 'Source Sheet', 'Original Row Data']);
  }
  
  sheetNames.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find date column (usually 'recorded_at' or 'created_at')
    const dateColIndex = headers.findIndex(h => 
      String(h).toLowerCase().includes('recorded_at') ||
      String(h).toLowerCase().includes('created_at')
    );
    
    if (dateColIndex === -1) return;
    
    const rowsToArchive = [];
    const rowsToKeep = [headers]; // Keep headers
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = new Date(row[dateColIndex]);
      
      if (rowDate < beforeDate) {
        // Archive this row
        rowsToArchive.push([
          new Date(),
          sheetName,
          JSON.stringify(row)
        ]);
      } else {
        // Keep this row
        rowsToKeep.push(row);
      }
    }
    
    // Write archived rows
    if (rowsToArchive.length > 0) {
      archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, rowsToArchive.length, 3)
        .setValues(rowsToArchive);
      totalArchived += rowsToArchive.length;
      
      // Clear and rewrite original sheet
      sheet.clear();
      sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length)
        .setValues(rowsToKeep);
    }
  });
  
  return {
    success: true,
    archivedCount: totalArchived,
    archiveSheetName: archiveSheetName,
    message: `Archive ${totalArchived} รายการสำเร็จ`
  };
}

/**
 * Clean up duplicate records
 */
function cleanupDuplicates(sheetName) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('ไม่พบ Sheet: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find unique identifier column (id)
  const idColIndex = headers.findIndex(h => 
    String(h).toLowerCase() === 'id'
  );
  
  if (idColIndex === -1) {
    throw new Error('ไม่พบคอลัมน์ ID สำหรับตรวจสอบข้อมูลซ้ำ');
  }
  
  const seen = new Set();
  const uniqueRows = [headers];
  let removedCount = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const identifier = row[idColIndex];
    
    if (!seen.has(identifier)) {
      seen.add(identifier);
      uniqueRows.push(row);
    } else {
      removedCount++;
    }
  }
  
  // Rewrite sheet with unique rows only
  if (removedCount > 0) {
    sheet.clear();
    sheet.getRange(1, 1, uniqueRows.length, uniqueRows[0].length)
      .setValues(uniqueRows);
  }
  
  return {
    success: true,
    removedCount: removedCount,
    message: `ลบข้อมูลซ้ำ ${removedCount} รายการสำเร็จ`
  };
}

/**
 * Delete old records with option to keep latest per user
 */
function deleteOldRecords(options) {
  const sheetName = options.sheetName;
  const beforeDate = new Date(options.beforeDate);
  const keepLatestPerUser = options.keepLatestPerUser || 0;
  
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('ไม่พบ Sheet: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  // Find columns
  const dateColIndex = headers.findIndex(h => 
    String(h).toLowerCase().includes('recorded_at') ||
    String(h).toLowerCase().includes('created_at')
  );
  
  const userColIndex = headers.findIndex(h => 
    String(h).toLowerCase() === 'user_id'
  );
  
  if (dateColIndex === -1) {
    throw new Error('ไม่พบคอลัมน์วันที่');
  }
  
  const rowsToKeep = [headers];
  let deletedCount = 0;
  
  if (keepLatestPerUser > 0 && userColIndex !== -1) {
    // Group by user and keep latest N records
    const userRecords = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const userId = row[userColIndex];
      const rowDate = new Date(row[dateColIndex]);
      
      if (!userRecords[userId]) {
        userRecords[userId] = [];
      }
      
      userRecords[userId].push({ row: row, date: rowDate });
    }
    
    // Sort each user's records by date (newest first) and keep latest N
    Object.keys(userRecords).forEach(userId => {
      const records = userRecords[userId]
        .sort((a, b) => b.date - a.date)
        .slice(0, keepLatestPerUser);
      
      records.forEach(record => {
        rowsToKeep.push(record.row);
      });
      
      deletedCount += userRecords[userId].length - records.length;
    });
  } else {
    // Simple date-based deletion
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = new Date(row[dateColIndex]);
      
      if (rowDate >= beforeDate) {
        rowsToKeep.push(row);
      } else {
        deletedCount++;
      }
    }
  }
  
  // Rewrite sheet
  if (deletedCount > 0) {
    sheet.clear();
    sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length)
      .setValues(rowsToKeep);
  }
  
  return {
    success: true,
    deletedCount: deletedCount,
    message: `ลบข้อมูลเก่า ${deletedCount} รายการสำเร็จ`
  };
}

// ===============================================
// Password Reset Functions
// ===============================================

/**
 * Generate secure reset token
 */
function generateResetToken() {
  return Utilities.getUuid().replace(/-/g, '') + Date.now().toString(36);
}

/**
 * Get or create reset attempts sheet
 */
function getResetAttemptsSheet() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('PasswordResets');
  if (!sheet) {
    sheet = ss.insertSheet('PasswordResets');
    sheet.appendRow(['email', 'token', 'created_at', 'used_at', 'ip_hash']);
  }
  return sheet;
}

/**
 * Check rate limiting for password reset
 */
function checkResetRateLimit(email) {
  const sheet = getResetAttemptsSheet();
  const data = sheet.getDataRange().getValues();
  const now = Date.now();
  const fifteenMinutesAgo = now - (15 * 60 * 1000);
  
  // Count attempts in last 15 minutes for this email
  let attemptCount = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowEmail = row[0];
    const createdAt = new Date(row[2]).getTime();
    
    if (rowEmail === email && createdAt > fifteenMinutesAgo) {
      attemptCount++;
    }
  }
  
  return attemptCount < 3; // Allow max 3 attempts per 15 minutes
}

/**
 * Clean old reset tokens (older than 24 hours)
 */
function cleanOldResetTokens() {
  const sheet = getResetAttemptsSheet();
  const data = sheet.getDataRange().getValues();
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  const rowsToKeep = [data[0]]; // Keep header
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const createdAt = new Date(row[2]).getTime();
    
    if (createdAt > twentyFourHoursAgo) {
      rowsToKeep.push(row);
    }
  }
  
  // Rewrite sheet if any rows were removed
  if (rowsToKeep.length < data.length) {
    sheet.clear();
    if (rowsToKeep.length > 0) {
      sheet.getRange(1, 1, rowsToKeep.length, rowsToKeep[0].length)
        .setValues(rowsToKeep);
    }
  }
}
/**
 * Request password reset
 */
function requestPasswordReset(payload) {
  const { email } = payload;
  
  if (!email || !email.includes('@')) {
    throw new Error('กรุณาใส่อีเมลที่ถูกต้อง');
  }
  
  // Clean old tokens first
  cleanOldResetTokens();
  
  // Check rate limiting
  if (!checkResetRateLimit(email)) {
    throw new Error('ส่งคำขอบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่');
  }
  
  // Find user (but don't reveal if user exists or not)
  const users = listUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    // Generate 6-digit OTP instead of token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    
    // Save OTP to password_resets sheet
    const sheet = getOrCreateSheet('password_resets');
    
    // Ensure headers exist (for robustness on older sheets)
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.getRange(1, 1, 1, 6).setValues([
        ['token', 'email', 'created_at', 'expires_at', 'user_id', 'used_at']
      ]);
    } else {
      const headerRow = sheet.getRange(1, 1, 1, Math.max(6, sheet.getLastColumn())).getValues()[0];
      // If header missing or wrong, attempt to set correct header without touching data
      const expected = ['token', 'email', 'created_at', 'expires_at', 'user_id', 'used_at'];
      const isHeaderOk = expected.every((name, idx) => String(headerRow[idx] || '').toLowerCase() === name);
      if (!isHeaderOk) {
        // Only write header cells if they are empty to avoid overwriting custom headers
        for (let i = 0; i < expected.length; i++) {
          const cell = sheet.getRange(1, i + 1);
          const val = String(headerRow[i] || '').trim();
          if (!val) cell.setValue(expected[i]);
        }
      }
    }
    
    sheet.appendRow([
      "'" + otpCode, // Force as text with leading apostrophe
      email,
      now,
      expiryTime,
      user.id || user.email,
      '' // used_at (empty initially)
    ]);
    
    // Send OTP email
    try {
      const emailBody = `
สวัสดีครับ/ค่ะ ${user.fullName || user.email}

คุณได้ขอรีเซ็ตรหัสผ่านสำหรับระบบ WTH Fitness App

• รหัส OTP ของคุณคือ: ${otpCode}

⏰ รหัสนี้จะหมดอายุใน 15 นาที

📱 วิธีใช้งาน:
1. กลับไปที่หน้าเว็บไซต์
2. กรอกรหัส OTP: ${otpCode}
3. ตั้งรหัสผ่านใหม่

🔒 เพื่อความปลอดภัย:
• อย่าแชร์รหัสนี้กับใครเลย
• ข้อความนี้มาจากระบบ WTH Fitness App
• หากไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาแจ้งผู้ดูแลระบบ

---
ขอบคุณที่ใช้บริการ WTH Fitness App 💪
`.trim();

      // Send simple text email with OTP
      MailApp.sendEmail({
        to: email,
        subject: '🔐 รหัส OTP รีเซ็ตรหัสผ่าน - WTH Fitness App',
        body: emailBody
      });
      
    } catch (error) {
      Logger.log('Failed to send reset email: ' + error.toString());
      throw new Error('ไม่สามารถส่งอีเมลได้ กรุณาลองใหม่อีกครั้ง');
    }
  }
  
  // Always return the same message (don't reveal if email exists)
  return {
    success: true,
    message: 'หากอีเมลนี้มีในระบบ เราได้ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบและนำรหัส 6 หลักมากรอกเพื่อตั้งรหัสผ่านใหม่'
  };
}

/**
 * Verify reset token and reset password
 */
function resetPassword(payload) {
  const { otp, email, newPassword } = payload;
  
  if (!otp || !email || !newPassword) {
    throw new Error('ข้อมูลไม่ครบถ้วน กรุณากรอกรหัส OTP, อีเมล และรหัสผ่านใหม่');
  }
  
  if (newPassword.length < 6) {
    throw new Error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
  }
  
  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    throw new Error('รหัส OTP ต้องเป็นตัวเลข 6 หลัก');
  }
  
  const sheet = getOrCreateSheet('password_resets');
  const data = sheet.getDataRange().getValues();
  const now = new Date();
  
  // Map columns by header names if available
  const header = (data[0] || []).map((h) => String(h || '').trim().toLowerCase());
  const tokenIdx = header.indexOf('token');
  const emailIdx = header.indexOf('email');
  const expiresIdx = header.indexOf('expires_at');
  const usedAtIdx = header.indexOf('used_at');
  
  const idx = {
    token: tokenIdx >= 0 ? tokenIdx : 0,
    email: emailIdx >= 0 ? emailIdx : 1,
    expires: expiresIdx >= 0 ? expiresIdx : 3,
    usedAt: usedAtIdx >= 0 ? usedAtIdx : 5,
  };

  // Find latest matching OTP record (search from bottom to top)
  let resetRow = null;
  let rowIndex = -1;
  const normalizeOtp = (value) =>
    String(value == null ? "" : value)
      .replace(/[^\d]/g, "")
      .trim();

  const targetOtp = normalizeOtp(otp); // Normalize OTP to digits only
  if (targetOtp.length !== 6) {
    throw new Error('รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว');
  }
  const targetEmail = String(email).trim().toLowerCase();

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    const rowOtp = normalizeOtp(row[idx.token]); // Normalize: remove apostrophe, spaces, non-digits
    const rowEmail = String(row[idx.email]).trim().toLowerCase();
    if (rowOtp === targetOtp && rowEmail === targetEmail) {
      const expiryCell = row[idx.expires];
      const expiryTime = (expiryCell instanceof Date)
        ? expiryCell
        : (typeof expiryCell === 'number')
          ? new Date(Math.round((expiryCell - 25569) * 86400 * 1000)) // Excel serial date fallback
          : new Date(expiryCell);
      const usedAt = row[idx.usedAt];

      // Check if OTP is still valid (not expired)
      if (!(expiryTime instanceof Date) || isNaN(expiryTime.getTime())) {
        // If cannot parse expiry, treat as expired to be safe
        throw new Error('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่');
      }
      if (now.getTime() > expiryTime.getTime()) {
        throw new Error('รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่');
      }

      // Check if OTP was already used
      if (usedAt) {
        throw new Error('รหัส OTP นี้ถูกใช้แล้ว กรุณาขอรหัสใหม่');
      }

      resetRow = row;
      rowIndex = i + 1; // sheet row index (1-based)
      break;
    }
  }
  
  if (!resetRow) {
    throw new Error('รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว');
  }
  
  // Find and update user password
  const users = listUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('ไม่พบผู้ใช้งาน');
  }
  
  // Update password in Users sheet
  const usersSheet = getSheet(SHEET_NAMES.USERS);
  const userData = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < userData.length; i++) {
    const row = userData[i];

    // email อยู่คอลัมน์ที่ 4 -> index 3
    if (row[3] && row[3].toLowerCase() === email.toLowerCase()) {
      // Hash password (simple method for demo - ใช้ hashing จริงจังในโปรดักชัน)
      const hashedPassword = hashPassword(newPassword);
      
      // password_hash อยู่คอลัมน์ที่ 5 -> index 4
      usersSheet.getRange(i + 1, 5).setValue(hashedPassword);
      break;
    }
  }
  
  // Mark OTP as used (col 6 = used_at)
  sheet.getRange(rowIndex, idx.usedAt + 1).setValue(new Date().toISOString());
  
  return {
    success: true,
    message: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'
  };
}

// ฟังก์ชันสำหรับการตั้งค่า App Configuration
function setApiKey() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    '🔑 ตั้งค่า API Key',
    'กรุณาใส่ API Key สำหรับแอป (หากมี):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();
    
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('API_KEY', apiKey);
      ui.alert('✅ บันทึกสำเร็จ!', `API Key ถูกบันทึกเรียบร้อยแล้ว`, ui.ButtonSet.OK);
    } else {
      PropertiesService.getScriptProperties().deleteProperty('API_KEY');
      ui.alert('🗑️ ลบสำเร็จ!', 'API Key ถูกลบออกจากระบบแล้ว', ui.ButtonSet.OK);
    }
  }
}

function showCurrentApiKey() {
  const ui = SpreadsheetApp.getUi();
  const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  
  if (apiKey) {
    const masked = apiKey.length > 8 ? 
      apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4) 
      : '*'.repeat(apiKey.length);
    
    ui.alert('🔑 API Key ปัจจุบัน', `API Key: ${masked}\n\nความยาว: ${apiKey.length} ตัวอักษร`, ui.ButtonSet.OK);
  } else {
    ui.alert('❌ ไม่พบ API Key', 'ยังไม่ได้ตั้งค่า API Key ในระบบ', ui.ButtonSet.OK);
  }
}

function showWebAppUrl() {
  const ui = SpreadsheetApp.getUi();
  
  try {
    // ลองดึง URL ของ Web App
    const scriptUrl = ScriptApp.getService().getUrl();
    if (scriptUrl) {
      ui.alert(
        '🌐 Web App URL',
        `URL ปัจจุบัน:\n${scriptUrl}\n\n💡 เคล็ดลับ: คัดลอก URL นี้ไปใช้ใน Frontend Configuration`,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❓ ไม่พบ Web App URL',
        'กรุณาทำการ Deploy Web App ก่อน:\n1. คลิก Deploy > New deployment\n2. เลือก Type: Web app\n3. ตั้งค่า Execute as: Me\n4. Who has access: Anyone',
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    ui.alert(
      '❌ เกิดข้อผิดพลาด',
      `ไม่สามารถดึง Web App URL ได้:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

function showAllSettings() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties().getProperties();
  
  let settingsText = '⚙️ สถานะการตั้งค่าทั้งหมด\n\n';
  
  // Frontend URL
  const frontendUrl = properties['FRONTEND_URL'] || 'ยังไม่ได้ตั้งค่า';
  settingsText += `🔗 Frontend URL: ${frontendUrl}\n\n`;
  
  // API Key
  if (properties['API_KEY']) {
    const apiKey = properties['API_KEY'];
    const masked = apiKey.length > 8 ? 
      apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4) 
      : '*'.repeat(apiKey.length);
    settingsText += `🔑 API Key: ${masked}\n\n`;
  } else {
    settingsText += `🔑 API Key: ยังไม่ได้ตั้งค่า\n\n`;
  }
  
  // Password Reset Statistics
  try {
    const resetSheet = getOrCreateSheet('password_resets');
    const resetData = resetSheet.getDataRange().getValues();
    const activeTokens = resetData.filter((row, index) => {
      if (index === 0) return false; // Skip header
      return row[3] && new Date(row[3]) > new Date(); // Check expiry
    }).length;
    
    settingsText += `🔐 Password Reset Tokens: ${activeTokens} รายการที่ใช้งานได้\n\n`;
  } catch (error) {
    settingsText += `🔐 Password Reset Tokens: ไม่สามารถตรวจสอบได้\n\n`;
  }
  
  // Sheet Information
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  settingsText += `📊 จำนวน Sheets: ${sheets.length} รายการ\n`;
  sheets.forEach(sheet => {
    settingsText += `   • ${sheet.getName()}\n`;
  });
  
  try {
    const scriptUrl = ScriptApp.getService().getUrl();
    if (scriptUrl) {
      settingsText += `\n🌐 Web App URL: ${scriptUrl}`;
    }
  } catch (error) {
    settingsText += '\n🌐 Web App URL: ยังไม่ได้ Deploy';
  }
  
  ui.alert('⚙️ App Configuration Status', settingsText, ui.ButtonSet.OK);
}

// ฟังก์ชันสำหรับการจัดการข้อมูล
function showDataStatistics() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  let statsText = '📊 สถิติข้อมูลทั้งหมด\n\n';
  
  let totalRecords = 0;
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastRow = sheet.getLastRow();
    const recordCount = Math.max(0, lastRow - 1); // ลบ header row
    
    if (recordCount > 0) {
      statsText += `📋 ${name}: ${recordCount.toLocaleString()} รายการ\n`;
      totalRecords += recordCount;
    } else if (!name.startsWith('Archive_')) {
      statsText += `📋 ${name}: ไม่มีข้อมูล\n`;
    }
  });
  
  statsText += `\n📈 รวมทั้งหมด: ${totalRecords.toLocaleString()} รายการ\n\n`;
  
  // เพิ่มข้อมูล file size (ประมาณ)
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    statsText += `📄 ไฟล์: ${spreadsheet.getName()}\n`;
    statsText += `🔗 ID: ${spreadsheet.getId()}\n`;
  } catch (error) {
    statsText += `❌ ไม่สามารถดึงข้อมูลไฟล์ได้\n`;
  }
  
  ui.alert('📊 Data Statistics', statsText, ui.ButtonSet.OK);
}

function validateDataIntegrity() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let issues = [];
  let checkedRecords = 0;
  
  // ตรวจสอบ Sheet หลักๆ
  const mainSheets = ['users', 'classes', 'tests'];
  
  mainSheets.forEach(sheetName => {
    try {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        const data = sheet.getDataRange().getValues();
        if (data.length > 1) {
          // ตรวจสอบ ID ซ้ำ
          const ids = [];
          for (let i = 1; i < data.length; i++) {
            const id = data[i][0];
            if (id) {
              if (ids.includes(id)) {
                issues.push(`❌ ${sheetName}: ID ซ้ำ - ${id}`);
              } else {
                ids.push(id);
              }
              checkedRecords++;
            }
          }
          
          // ตรวจสอบข้อมูลว่าง
          const emptyRows = data.filter((row, index) => 
            index > 0 && (!row[0] || row.every(cell => !cell))
          ).length;
          
          if (emptyRows > 0) {
            issues.push(`⚠️ ${sheetName}: มี ${emptyRows} แถวที่ข้อมูลว่าง`);
          }
        }
      }
    } catch (error) {
      issues.push(`❌ ${sheetName}: ไม่สามารถตรวจสอบได้ - ${error.toString()}`);
    }
  });
  
  let resultText = `🔍 การตรวจสอบข้อมูลเสร็จสิ้น\n\n`;
  resultText += `✅ ตรวจสอบแล้ว: ${checkedRecords.toLocaleString()} รายการ\n\n`;
  
  if (issues.length === 0) {
    resultText += `🎉 ไม่พบปัญหา! ข้อมูลทั้งหมดถูกต้อง`;
  } else {
    resultText += `⚠️ พบปัญหา ${issues.length} รายการ:\n\n`;
    issues.forEach(issue => {
      resultText += `${issue}\n`;
    });
  }
  
  ui.alert('🔍 Data Integrity Check', resultText, ui.ButtonSet.OK);
}

function backupAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '💾 สำรองข้อมูลทั้งหมด',
    'คุณต้องการสำรองข้อมูลทั้งหมดหรือไม่?\n\n⚠️ การดำเนินการนี้อาจใช้เวลาสักครู่',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const backupName = `Backup_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}`;
    
    // สร้าง backup sheet
    const backupSheet = ss.insertSheet(backupName);
    
    // เพิ่มข้อมูลสรุป
    const summary = [
      ['🏷️ รายการ', '📊 จำนวนข้อมูล', '📅 วันที่อัพเดทล่าสุด'],
    ];
    
    const sheets = ss.getSheets().filter(s => 
      !s.getName().startsWith('Backup_') && s.getName() !== backupName
    );
    
    sheets.forEach(sheet => {
      const lastRow = sheet.getLastRow();
      const recordCount = Math.max(0, lastRow - 1);
      const lastModified = new Date().toLocaleDateString('th-TH');
      
      summary.push([sheet.getName(), recordCount, lastModified]);
    });
    
    // เขียนข้อมูลสรุป
    backupSheet.getRange(1, 1, summary.length, 3).setValues(summary);
    
    // จัดรูปแบบ
    backupSheet.getRange(1, 1, 1, 3)
      .setBackground('#4285f4')
      .setFontColor('white')
      .setFontWeight('bold');
    backupSheet.autoResizeColumns(1, 3);
    
    ui.alert(
      '✅ สำรองข้อมูลสำเร็จ!',
      `สร้าง Sheet สำรองชื่อ "${backupName}" เรียบร้อยแล้ว\n\n💡 เคล็ดลับ: คุณสามารถคัดลอก URL ของไฟล์นี้เก็บไว้เป็นการสำรองเพิ่มเติม`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert(
      '❌ เกิดข้อผิดพลาด',
      `ไม่สามารถสำรองข้อมูลได้:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

function cleanupTemporaryData() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🧹 ล้างข้อมูลชั่วคราว',
    'จะทำการล้างข้อมูลต่อไปนี้:\n\n' +
    '• Token รีเซ็ตรหัสผ่านที่หมดอายุ\n' +
    '• ข้อมูล Cache ที่เก่า\n' +
    '• ล็อกการเข้าใช้งานที่เก่ากว่า 30 วัน\n\n' +
    'ดำเนินการต่อไหม?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  let cleaned = 0;
  let errors = [];
  
  try {
    // ล้าง password reset tokens ที่หมดอายุ
    const resetSheet = getOrCreateSheet('password_resets');
    const resetData = resetSheet.getDataRange().getValues();
    const currentTime = new Date();
    
    for (let i = resetData.length - 1; i >= 1; i--) { // เริ่มจากล่างขึ้นบน
      const row = resetData[i];
      const expiry = new Date(row[3]);
      
      if (expiry < currentTime || row[5]) { // หมดอายุหรือใช้แล้ว
        resetSheet.deleteRow(i + 1);
        cleaned++;
      }
    }
    
    // ล้างข้อมูล Properties ที่ไม่ใช้
    const properties = PropertiesService.getScriptProperties().getProperties();
    Object.keys(properties).forEach(key => {
      if (key.startsWith('TEMP_') || key.startsWith('CACHE_')) {
        PropertiesService.getScriptProperties().deleteProperty(key);
        cleaned++;
      }
    });
    
  } catch (error) {
    errors.push(`Password Reset Tokens: ${error.toString()}`);
  }
  
  let resultText = `🧹 ล้างข้อมูลเสร็จสิ้น\n\n`;
  resultText += `✅ ล้างแล้ว: ${cleaned} รายการ\n\n`;
  
  if (errors.length > 0) {
    resultText += `⚠️ มีข้อผิดพลาดบางส่วน:\n`;
    errors.forEach(error => {
      resultText += `• ${error}\n`;
    });
  } else {
    resultText += `🎉 ล้างข้อมูลเสร็จสิ้นโดยไม่มีปัญหา`;
  }
  
  ui.alert('🧹 Cleanup Complete', resultText, ui.ButtonSet.OK);
}

// ฟังก์ชันสำหรับความปลอดภัยและบำรุงรักษา
function runSecurityCheck() {
  const ui = SpreadsheetApp.getUi();
  
  let securityReport = '🛡️ รายงานความปลอดภัย\n\n';
  let issues = [];
  let warnings = [];
  
  // ตรวจสอบการตั้งค่าพื้นฐาน
  const properties = PropertiesService.getScriptProperties().getProperties();
  
  // ตรวจสอบ Frontend URL
  if (!properties['FRONTEND_URL']) {
    issues.push('❌ ยังไม่ได้ตั้งค่า Frontend URL');
  } else {
    const url = properties['FRONTEND_URL'];
    if (url.startsWith('http://') && !url.includes('localhost')) {
      warnings.push('⚠️ Frontend URL ใช้ HTTP แทน HTTPS (ไม่ปลอดภัย)');
    }
  }
  
  // ตรวจสอบ API Key
  if (properties['API_KEY'] && properties['API_KEY'].length < 16) {
    warnings.push('⚠️ API Key อาจสั้นเกินไป (ควรยาวอย่างน้อย 16 ตัวอักษร)');
  }
  
  // ตรวจสอบ Password Reset Tokens
  try {
    const resetSheet = getOrCreateSheet('password_resets');
    const resetData = resetSheet.getDataRange().getValues();
    const currentTime = new Date();
    
    let activeTokens = 0;
    let expiredTokens = 0;
    
    for (let i = 1; i < resetData.length; i++) {
      const expiry = new Date(resetData[i][3]);
      if (expiry > currentTime && !resetData[i][5]) {
        activeTokens++;
      } else {
        expiredTokens++;
      }
    }
    
    if (expiredTokens > 10) {
      warnings.push(`⚠️ มี Token รีเซ็ตรหัสผ่านที่หมดอายุ ${expiredTokens} รายการ (ควรล้าง)`);
    }
    
    securityReport += `🔐 Password Reset Tokens:\n`;
    securityReport += `   • ใช้งานได้: ${activeTokens} รายการ\n`;
    securityReport += `   • หมดอายุ: ${expiredTokens} รายการ\n\n`;
  } catch (error) {
    issues.push('❌ ไม่สามารถตรวจสอบ Password Reset Tokens ได้');
  }
  
  // ตรวจสอบสิทธิ์ของ Script
  try {
    const triggers = ScriptApp.getProjectTriggers();
    securityReport += `🔧 Triggers ที่เปิดใช้งาน: ${triggers.length} รายการ\n\n`;
  } catch (error) {
    warnings.push('⚠️ ไม่สามารถตรวจสอบ Triggers ได้');
  }
  
  // สรุปผลการตรวจสอบ
  if (issues.length === 0 && warnings.length === 0) {
    securityReport += '🎉 ไม่พบปัญหาความปลอดภัย!\nระบบทำงานอย่างปลอดภัย';
  } else {
    if (issues.length > 0) {
      securityReport += `🚨 ปัญหาที่ต้องแก้ไข (${issues.length} รายการ):\n`;
      issues.forEach(issue => securityReport += `${issue}\n`);
      securityReport += '\n';
    }
    
    if (warnings.length > 0) {
      securityReport += `⚠️ คำแนะนำ (${warnings.length} รายการ):\n`;
      warnings.forEach(warning => securityReport += `${warning}\n`);
    }
  }
  
  ui.alert('🛡️ Security Check Report', securityReport, ui.ButtonSet.OK);
}

function showRecentActivity() {
  const ui = SpreadsheetApp.getUi();
  
  let activityText = '👥 กิจกรรมล่าสุด\n\n';
  
  // ดูการเปลี่ยนแปลงไฟล์ล่าสุด
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const lastModified = ss.getLastUpdated();
    activityText += `📝 แก้ไขล่าสุด: ${lastModified.toLocaleString('th-TH')}\n\n`;
  } catch (error) {
    activityText += `📝 แก้ไขล่าสุด: ไม่สามารถตรวจสอบได้\n\n`;
  }
  
  // ดู Password Reset Activity
  try {
    const resetSheet = getOrCreateSheet('password_resets');
    const resetData = resetSheet.getDataRange().getValues();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentResets = resetData.filter((row, index) => {
      if (index === 0) return false;
      return new Date(row[2]) > last24Hours;
    });
    
    activityText += `🔐 การรีเซ็ตรหัสผ่าน (24 ชม.): ${recentResets.length} ครั้ง\n`;
    
    if (recentResets.length > 0 && recentResets.length <= 5) {
      activityText += `รายละเอียด:\n`;
      recentResets.forEach(reset => {
        const maskedEmail = reset[1]
          ? reset[1].substring(0, 3) + '***' + reset[1].substring(reset[1].lastIndexOf('@'))
          : 'Unknown';
        const time = new Date(reset[2]).toLocaleString('th-TH');
        activityText += `   • ${maskedEmail} - ${time}\n`;
      });
    }
    activityText += '\n';
  } catch (error) {
    activityText += `🔐 การรีเซ็ตรหัสผ่าน: ไม่สามารถตรวจสอบได้\n\n`;
  }
  
  // ดูข้อมูลการใช้งาน Script
  try {
    const properties = PropertiesService.getScriptProperties().getProperties();
    const configCount = Object.keys(properties).length;
    activityText += `⚙️ การตั้งค่าทั้งหมด: ${configCount} รายการ\n\n`;
  } catch (error) {
    activityText += `⚙️ การตั้งค่า: ไม่สามารถตรวจสอบได้\n\n`;
  }
  
  activityText += `🕐 ตรวจสอบเมื่อ: ${new Date().toLocaleString('th-TH')}`;
  
  ui.alert('👥 Recent Activity Report', activityText, ui.ButtonSet.OK);
}

function resetAllSettings() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚠️ รีเซ็ตการตั้งค่าทั้งหมด',
    'คำเตือน: การดำเนินการนี้จะลบการตั้งค่าทั้งหมด:\n\n' +
    '• Frontend URL\n' +
    '• API Key\n' +
    '• Password Reset Tokens ทั้งหมด\n' +
    '• การตั้งค่าอื่นๆ\n\n' +
    '⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้!\n\n' +
    'คุณแน่ใจหรือไม่?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  // ขอยืนยันอีกครั้ง
  const finalConfirm = ui.alert(
    '🚨 ยืนยันครั้งสุดท้าย',
    'กดใจยืนยันการรีเซ็ตการตั้งค่าทั้งหมด?\n\nการกระทำนี้จะลบข้อมูลการตั้งค่าทั้งหมด!',
    ui.ButtonSet.YES_NO
  );
  
  if (finalConfirm !== ui.Button.YES) {
    ui.alert('❌ ยกเลิก', 'การรีเซ็ตถูกยกเลิก', ui.ButtonSet.OK);
    return;
  }
  
  try {
    // ลบ Properties ทั้งหมด
    const properties = PropertiesService.getScriptProperties().getProperties();
    Object.keys(properties).forEach(key => {
      PropertiesService.getScriptProperties().deleteProperty(key);
    });
    
    // ลบ Password Reset Tokens
    const resetSheet = getOrCreateSheet('password_resets');
    resetSheet.clear();
    resetSheet.getRange(1, 1, 1, 6).setValues([
      ['token', 'email', 'created_at', 'expires_at', 'user_id', 'used_at']
    ]);
    
    ui.alert(
      '✅ รีเซ็ตเสร็จสิ้น!',
      'การตั้งค่าทั้งหมดถูกรีเซ็ตเรียบร้อยแล้ว\n\n' +
      '💡 คำแนะนำ: กรุณาตั้งค่าใหม่ผ่านเมนู WTH Admin:\n' +
      '1. ตั้งค่า Frontend URL\n' +
      '2. ตั้งค่า API Key (หากจำเป็น)\n' +
      '3. ทดสอบระบบ',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert(
      '❌ เกิดข้อผิดพลาด',
      `ไม่สามารถรีเซ็ตการตั้งค่าได้:\n${error.toString()}`,
      ui.ButtonSet.OK
    );
  }
}

function toggleMaintenanceMode() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  const isMaintenanceMode = properties.getProperty('MAINTENANCE_MODE') === 'true';
  
  if (isMaintenanceMode) {
    // ปิดโหมดบำรุงรักษา
    const response = ui.alert(
      '✅ ปิดโหมดบำรุงรักษา',
      'ระบบอยู่ในโหมดบำรุงรักษา\n\nต้องการเปิดระบบให้ใช้งานปกติหรือไม่?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      properties.deleteProperty('MAINTENANCE_MODE');
      properties.deleteProperty('MAINTENANCE_MESSAGE');
      ui.alert('✅ เปิดระบบแล้ว!', 'ระบบกลับมาใช้งานปกติแล้ว', ui.ButtonSet.OK);
    }
  } else {
    // เปิดโหมดบำรุงรักษา
    const response = ui.alert(
      '⚠️ เปิดโหมดบำรุงรักษา',
      'การเปิดโหมดนี้จะทำให้:\n\n' +
      '• ผู้ใช้งานไม่สามารถเข้าใช้ระบบได้\n' +
      '• แสดงข้อความแจ้งบำรุงรักษา\n' +
      '• เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าได้\n\n' +
      'ดำเนินการต่อไหม?',
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      const messageResult = ui.prompt(
        '📝 ข้อความแจ้งบำรุงรักษา',
        'ใส่ข้อความที่จะแสดงให้ผู้ใช้เห็น (หากไม่ใส่จะใช้ข้อความเริ่มต้น):',
        ui.ButtonSet.OK_CANCEL
      );
      
      if (messageResult.getSelectedButton() === ui.Button.OK) {
        const customMessage = messageResult.getResponseText().trim();
        const defaultMessage = 'ระบบอยู่ระหว่างการบำรุงรักษา กรุณาลองใหม่อีกครั้งในภายหลัง';
        
        properties.setProperty('MAINTENANCE_MODE', 'true');
        properties.setProperty('MAINTENANCE_MESSAGE', customMessage || defaultMessage);
        
        ui.alert(
          '⚠️ เปิดโหมดบำรุงรักษาแล้ว!',
          `ระบบถูกปิดสำหรับผู้ใช้งานทั่วไป\n\nข้อความ: "${customMessage || defaultMessage}"\n\n💡 ใช้เมนูนี้อีกครั้งเพื่อเปิดระบบ`,
          ui.ButtonSet.OK
        );
      }
    }
  }
}
