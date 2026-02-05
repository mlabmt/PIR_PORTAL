import { chromium } from 'playwright';
import fs from 'fs';
import slugify from 'slugify';

async function fetchHazardNews() {
  console.log("🚀 Uruchamiam silnik przeglądarki (Playwright)...");
  
  const browser = await chromium.launch({ headless: true }); // headless: true oznacza, że nie zobaczysz okna
  const page = await browser.newPage();

  try {
    console.log("🌐 Wchodzę na hazard.mf.gov.pl...");
    await page.goto('https://hazard.mf.gov.pl/', { waitUntil: 'networkidle' });

    // Czekamy, aż tabela z danymi faktycznie się pojawi
    console.log("⏳ Czekam na załadowanie danych do tabeli...");
    await page.waitForSelector('table tbody tr');

    // Wyciągamy dane prosto z pierwszego wiersza tabeli
    const latestEntry = await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      if (!row) return null;
      
      const cells = row.querySelectorAll('td');
      return {
        id: cells[0]?.innerText.trim(),
        domain: cells[1]?.innerText.trim(),
        date: cells[3]?.innerText.trim()
      };
    });

    if (!latestEntry || !latestEntry.domain) {
      console.log("❌ Nie udało się odczytać tabeli.");
      return;
    }

    const { domain, id, date } = latestEntry;
    const title = `REJESTR HAZARDOWY: Nowy wpis ${domain}`;
    const fileName = `hazard-id-${id}.md`;
    const filePath = `./src/content/news/${fileName}`;

    if (!fs.existsSync(filePath)) {
      const content = `---
title: "${title}"
date: "${new Date().toLocaleString('pl-PL')}"
tag: "Alert Hazard"
description: Domena ${domain} została dopisana do rejestru. (Poz. ${id})."
---

### 🚨 Automatyczny Alert PIR

Wykryto aktualizację w Rejestrze Domen Służących do Oferowania Gier Hazardowych Niezgodnie z Ustawą.

**Szczegóły wpisu:**
- **Adres domeny:** \`${domain}\`
- **Pozycja w rejestrze:** ${id}
- **Data wpisu (wg MF):** ${date}

Zgodnie z art. 15f ust. 5 ustawy o grach hazardowych, dostawcy usług dostępu do internetu muszą zablokować tę domenę w ciągu 48 godzin.

---

`;
      fs.writeFileSync(filePath, content);
      console.log(`✅ SUKCES! Znaleziono nową domenę: ${domain}`);
    } else {
      console.log(`ℹ️ Rejestr sprawdzony. Ostatnia domena (${domain}) jest już w systemie.`);
    }

  } catch (error) {
    console.error("❌ Błąd podczas pracy przeglądarki:", error.message);
  } finally {
    await browser.close();
    console.log("🏁 Przeglądarka zamknięta.");
  }
}

fetchHazardNews();