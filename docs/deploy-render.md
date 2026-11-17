# העלאה לאינטרנט בחינם: Render + Neon

האתר עולה כשני שירותים ב-Render (השרת ב-Docker והאתר כקבצים סטטיים) ומסד נתונים ב-Neon.
הכול בתוכניות החינמיות, בלי כרטיס אשראי. ההגדרות נמצאות ב-[render.yaml](../render.yaml).

| חלק | איפה | כתובת צפויה |
|---|---|---|
| האתר (frontend) | Render, Static Site | `https://family-budget-web.onrender.com` |
| השרת (backend) | Render, Web Service (Docker) | `https://family-budget-api.onrender.com` |
| מסד הנתונים | Neon, Postgres | (כתובת חיבור פרטית) |

## 1. הקוד ב-GitHub

Render בונה מ-GitHub, ולכן כל השינויים צריכים להיות ב-commit ו-push לענף שתבחרו (בדרך כלל `main`).

## 2. מסד נתונים ב-Neon

1. נרשמים ב-[neon.com](https://neon.com), אפשר עם חשבון GitHub.
2. יוצרים פרויקט חדש:
   - שם: `family-budget`.
   - גרסת Postgres: האחרונה.
   - אזור: **AWS Europe Central 1 (Frankfurt)**, אותו אזור שבו השרת ירוץ ב-Render.
3. במסך **Connect** מכבים את **Connection pooling** ומעתיקים את מחרוזת החיבור. היא נראית כך:
   `postgresql://neondb_owner:...@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   - למה בלי pooling: החיבור הישיר עובד בלי הגדרות נוספות עם הספרייה שבשרת.
   - הקוד ממיר את הכתובת לבד לדרייבר הנכון, אז מדביקים אותה כמו שהיא.

את הטבלאות לא צריך ליצור. השרת יוצר אותן וממלא את הקטגוריות בהפעלה הראשונה.

## 3. הקמה ב-Render

1. נרשמים ב-[render.com](https://render.com) עם GitHub ומאשרים ל-Render גישה ל-repo `budget-app`.
2. **New → Blueprint**, בוחרים את ה-repo ואת הענף. Render קורא את `render.yaml` ומציג שני שירותים.
3. Render מבקש ערכים לשדות הסודיים:
   - `DATABASE_URL`: מדביקים את מחרוזת החיבור מ-Neon. **חובה.**
   - `ANTHROPIC_API_KEY`: להשאיר ריק. בלי מפתח התובנות נוצרות מכללים קבועים, בחינם. עם מפתח כל יצירה עולה כסף.
   - `SMTP_*`: להשאיר ריק, או למלא לפי סעיף 6.
   - `SECRET_KEY`: לא צריך למלא. Render יוצר מפתח אקראי לבד.
4. **Apply**. הבנייה הראשונה לוקחת כמה דקות.

## 4. לוודא שהכתובות נכונות

ב-Dashboard של Render, בודקים את הכתובת שקיבל כל שירות.

- **אם הכתובות הן בדיוק `family-budget-api.onrender.com` ו-`family-budget-web.onrender.com`:** הכול מוכן.
- **אם Render הוסיף סיומת (למשל `family-budget-api-x7k2.onrender.com`),** כי השם תפוס:
  1. בשירות **family-budget-web**, בטאב **Environment**, מעדכנים את `VITE_API_HOST` לכתובת של השרת, בלי `https://`.
     אחר כך מריצים **Manual Deploy → Clear build cache & deploy**, כי הכתובת נכנסת לקוד בזמן הבנייה.
  2. בשירות **family-budget-api**, בטאב **Environment**, מעדכנים את `FRONTEND_URL` ואת `CORS_ORIGINS` לכתובת של האתר, עם `https://`.
     השירות יעלה מחדש לבד.

כדאי לעדכן גם את `render.yaml` לכתובות האמיתיות, כדי שהקובץ יתאים למה שרץ.

## 5. בדיקה

1. נכנסים לכתובת של השרת עם `/api/health` בסוף. צריך לקבל `{"status":"ok"}`. בפעם הראשונה זה יכול לקחת כדקה.
2. נכנסים לכתובת של האתר, נרשמים, יוצרים משפחה ומוסיפים תנועה.

## 6. אופציונלי: איפוס סיסמה במייל דרך Gmail

1. ב-[Google Account](https://myaccount.google.com) מפעילים אימות דו-שלבי (2-Step Verification).
2. יוצרים **App Password**.
3. ממלאים את משתני הסביבה של **family-budget-api**:

| משתנה | ערך |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | כתובת ה-Gmail |
| `SMTP_PASSWORD` | ה-App Password |
| `SMTP_FROM` | כתובת ה-Gmail |

בלי SMTP, משתמש ששכח סיסמה לא יוכל לאפס אותה.

## מה כדאי לדעת

- **שינה:** השרת החינמי נרדם אחרי 15 דקות בלי פעילות. הכניסה הראשונה אחרי זה לוקחת כדקה. האתר עצמו (דף הבית) נטען מיד, כי הוא קבצים סטטיים. כדאי להגיד את זה לבודקים מראש.
- **עדכונים:** כל push לענף שנבחר בונה ומעלה מחדש את מה שהשתנה. שינוי ב-`backend/` בונה את השרת, ושינוי ב-`frontend/` בונה את האתר.
- **מגבלות Neon:** 1GB אחסון לפרויקט בתוכנית החינמית. המסד נרדם אחרי 5 דקות בלי שימוש ומתעורר לבד.
- **הנתונים מקומיים לא עוברים:** מה שיש ב-Docker במחשב לא עובר לאתר. מתחילים עם מסד ריק.
- **פרטיות:** הבודקים עלולים להעלות קבצי בנק אמיתיים. כדאי לבקש מהם להשתמש בנתוני דוגמה.
