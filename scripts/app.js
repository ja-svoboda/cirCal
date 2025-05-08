let storedSunrise = null;
let storedSunset = null;

let storedLatitude;
let storedLongitude;

//date
window.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const formattedDate = mm + '/' + dd + '/' + yyyy;

  document.getElementById("date").innerHTML = formattedDate;
});

//daytime

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getSunTimes() {
    const today = new Date();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                storedLatitude = position.coords.latitude;
                storedLongitude = position.coords.longitude;

                const times = SunCalc.getTimes(today, storedLatitude, storedLongitude);
                const sunrise = times.sunrise;
                const sunset = times.sunset;

                storedSunrise = sunrise;
                storedSunset = sunset;

                const sunriseStr = formatTime(sunrise);
                const sunsetStr = formatTime(sunset);

                document.getElementById("mainTimes").innerHTML =
                    `${sunriseStr} – ${sunsetStr}`;
            },
            (error) => {
                document.getElementById("mainTimes").innerHTML =
                    "geolocation failed.";
            }
        );
    } else {
        document.getElementById("mainTimes").innerHTML =
            "geolocation is not supported.";
    }
}

//ics events

function createICalEvent() {
    if (!storedSunrise || !storedSunset || !storedLatitude || !storedLongitude) {
        alert("First click on the localization button.");
        return;
    }

    const formatDateToICS = (date) =>
        date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const dtStamp = formatDateToICS(new Date());
    const yearsAhead = 3;

    let icsEvents = '';

    const now = new Date();

    for (let i = 0; i < 365 * yearsAhead; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);

        const times = SunCalc.getTimes(date, storedLatitude, storedLongitude);

        const dtStart = formatDateToICS(times.sunrise);
        const dtEnd = formatDateToICS(times.sunset);
        const uid = `${date.toISOString().split('T')[0]}@sun-times`;

        icsEvents += `
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtStamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:daytime/circal
DESCRIPTION:Sunrise: ${times.sunrise.toLocaleTimeString()}, Sunset: ${times.sunset.toLocaleTimeString()}
END:VEVENT
        `.trim() + '\n';
    }

    const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//SunTimes//EN
${icsEvents}END:VCALENDAR
    `.trim();

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "sunrise-sunset-3-years.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
