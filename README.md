# Avatar Fight: Chaos Arena

TikTok canlı yayımları ilə inteqrasiya olunmuş, izləyicilərin göndərdiyi hədiyyələr və reaksiyalar əsasında real vaxtda (real-time) ekranda döyüşən canvas oyunu. Layihə React (Vite) və Node.js (Socket.io) üzərində qurulub.

---

## 📺 Demo Video
https://streamable.com/x8cyx0
---

## ✨ Özəlliklər

* **Real-Time Əlaqə:** Socket.io ilə backend və frontend arasında milisaniyəlik məlumat ötürülməsi.
* **TikTok İnteqrasiyası:** Canlı yayımdakı hədiyyə, təqib və şərhlərin oyuna dinamik daxil edilməsi.
* **İdarəetmə Paneli:** Yayımçının istənilən istifadəçi adını yazıb yayıma qoşula biləcəyi admin interfeysi.
* **Dinamik Canvas:** Şuriken, helikopter və əjdaha kimi obyektlərin vizual effektlərlə idarə olunması.

---

## 📂 Layihə Strukturu

avatar-fight/

├── chaos-arena/       # Frontend (React + Vite)

└── chaos-backend/     # Backend (Node.js + Socket.io)

🛠️ Quraşdırma və İşə Salma

1. Layihəni Klonlayın
   
Bash

git clone [https://github.com/khaliljalilov/avatar-fight.git](https://github.com/khaliljalilov/avatar-fight.git)

cd avatar-fight

3. Backend-i Başladın
   
Bash

cd chaos-backend

npm install

node server.js

Backend http://localhost:3001 portunda işləyir.



5. Frontend-i Başladın

Bash

cd ../chaos-arena

npm install

npm run dev

Frontend brauzerdə http://localhost:5173 portunda işləyir.


🎮 İstifadə Qaydası
Həm backend, həm də frontend layihələrini yuxarıdakı qaydada işə salın.

Brauzerdə oyunu açın və sol üstdəki İdarəetmə Paneli düyməsinə klikləyin.

Aktiv olan hər hansı bir TikTok istifadəçi adını daxil edin və Qoşul düyməsini sıxın.

Yayımda atılan hədiyyələrə uyğun olaraq ekrandakı döyüşü izləyin.
