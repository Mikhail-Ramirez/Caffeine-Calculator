/* caffeine.js – CSP-safe caffeine tracker (time-only picker) */
(() => {
  const HALF_LIFE_HR = 5;                   // biological half-life in hours

  /* ─── DOM shortcuts ───────────────────────────────────── */
  const drinks  = document.getElementById('drinks');
  const addBtn  = document.getElementById('add');
  const calcBtn = document.getElementById('calc');
  const result  = document.getElementById('result');
  const clock   = document.getElementById('clock');

  /* ─── live clock ──────────────────────────────────────── */
  const pad = n => n.toString().padStart(2, '0');
  setInterval(() => {
    const now = new Date();
    clock.textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }, 1000);

  /* ─── helpers ─────────────────────────────────────────── */
  const renumber = () =>
    [...drinks.children].forEach((fs, i) =>
      fs.querySelector('legend').textContent = `Drink #${i + 1}`);

  function makeDrinkRow() {
    const fs = document.createElement('fieldset');
    fs.className = 'drink';
    fs.innerHTML = `
      <legend></legend>
      <button type="button" class="del" aria-label="Remove drink">✕</button><br>
      <label>
        Caffeine (mg):
        <input type="number" min="0" step="1" required class="mg">
      </label><br>
      <label>
        Time consumed:
        <input type="time" required class="when" step="60">
      </label>
    `;

    /* delete-row behaviour */
    fs.querySelector('.del').addEventListener('click', () => {
      fs.remove();
      renumber();
    });

    return fs;
  }

  /* ─── initial row + “Add drink” hook ─────────────────── */
  addBtn.addEventListener('click', () => {
    drinks.appendChild(makeDrinkRow());
    renumber();
  });
  drinks.appendChild(makeDrinkRow());
  renumber();

  /* ─── calculation ─────────────────────────────────────── */
  calcBtn.addEventListener('click', () => {
    const now   = new Date();
    let totalMg = 0;
    let anyGood = false;

    drinks.querySelectorAll('.drink').forEach(row => {
      const mgStr   = row.querySelector('.mg').value.trim();
      const timeStr = row.querySelector('.when').value.trim();
      if (mgStr === '' || timeStr === '') return;          // skip blanks

      const mg = Number(mgStr);
      if (isNaN(mg) || mg <= 0) return;                    // skip junk

      /* === interpret time === */
      let when;
      if (timeStr.includes('T')) {
        /* legacy datetime-local field, let Date parse it */
        when = new Date(timeStr);
      } else {
        /* new time-only picker HH:MM or HH:MM:SS */
        const parts = timeStr.split(':').map(Number);
        const [hh = 0, mm = 0, ss = 0] = parts;
        when = new Date(now);
        when.setHours(hh, mm, ss, 0);

        /* if user picked a time “later” than now, assume it was yesterday */
        if (when > now) when.setDate(when.getDate() - 1);
      }

      if (isNaN(when)) return;                            // guard parse fail

      const hoursAgo   = (now - when) / 36e5;             // ms → h
      const remaining  = mg * Math.pow(0.5, hoursAgo / HALF_LIFE_HR);

      totalMg += remaining;
      anyGood  = true;
    });

    result.textContent = anyGood
      ? `Current caffeine: ${totalMg.toFixed(1)} mg`
      : 'Enter at least one valid drink.';
    result.hidden = false;
  });
})();

