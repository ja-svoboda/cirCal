const express = require('express');
const SunCalc = require('suncalc');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5501;

app.use(express.static('public'));

// API pro dnešní časy (používá klient)
app.get('/api/sun-times', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (!lat || !lon) return res.status(400).send("Chybí lat/lon");

  const times = SunCalc.getTimes(new Date(), lat, lon);

  res.json({
    sunrise: times.sunrise.toLocaleTimeString(),
    sunset: times.sunset.toLocaleTimeString(),
  });
});

// ICS generátor (na 5 let)
app.get('/download-ics', (req, res) => {
  const LAT = 50.08;  // Nebo vezmi z query, pokud chceš
  const LON = 14.43;
  const YEARS = 5;

  const now = new Date();
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  function formatICS(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  let events = '';

  for (let i = 0; i < 365 * YEARS; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const t = SunCalc.getTimes(d, LAT, LON);

    const dtStart = formatICS(t.sunrise);
    const dtEnd = formatICS(t.sunset);
    const uid = `${d.toISOString().split('T')[0]}@sun-calendar`;

    events += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:Sunrise to Sunset
DESCRIPTION:Sunrise: ${t.sunrise.toLocaleTimeString()}, Sunset: ${t.sunset.toLocaleTimeString()}
END:VEVENT
`;
  }

  const ics = `
BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:-//SunCalendar//EN
${events}
END:VCALENDAR
`;

  const filePath = path.join(__dirname, 'sun-calendar-5years.ics');
  fs.writeFileSync(filePath, ics);

  res.download(filePath, 'sun-calendar-5years.ics');
});

app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
