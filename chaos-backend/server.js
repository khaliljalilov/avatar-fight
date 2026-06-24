const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Global dəyişən olaraq saxlayırıq ki, hər yerdən idarə edə bilək
let tiktokLiveConnection = null;

// ================= FUNKSİYA: TIKTOK HADİSƏLƏRİNİ BAĞLAMAQ =================
// Hər yeni qoşulma olanda event listener-ləri bu funksiya vasitəsilə tətbiq edəcəyik
function setupTikTokListeners(connection) {
    
    // 1. Kimsə Takib (Follow) edəndə
    connection.on('follow', data => {
        console.log(`✨ YENİ TAKİBÇİ: ${data.uniqueId}`);
        io.emit('user-follow', {
            uniqueId: data.uniqueId,
            nickname: data.nickname,
            profilePictureUrl: data.profilePictureUrl
        });
    });

    // Sadəcə terminalda məlumat axınını görmək üçün
    connection.on('chat', data => {
        console.log(`💬 [TEST AXINI] ${data.uniqueId}: ${data.comment}`);
    });

    // Admin paneli üçün istifadəçi hovuzu funksiyası
    const addToAdminPool = (data) => {
        io.emit('viewer-pool', {
            uniqueId: data.uniqueId,
            nickname: data.nickname,
            profilePictureUrl: data.profilePictureUrl
        });
    };

    connection.on('member', addToAdminPool);
    connection.on('chat', addToAdminPool);
    connection.on('like', addToAdminPool);

    // 2. Kimsə Hədiyyə atanda
    connection.on('gift', data => {
        if (data.giftType === 1 && !data.repeatEnd) {
            // Kombo bitməsini gözləyirik
        } else {
            console.log(`🎁 ${data.uniqueId} -> ${data.giftName} (Jeton: ${data.diamondCount})`);
            io.emit('user-gift', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                giftName: data.giftName,
                diamondCount: data.diamondCount,
                repeatCount: data.repeatCount,
                profilePictureUrl: data.profilePictureUrl
            });
        }
    });
}

// ================= SOCKET.IO İDARƏETMƏ (ADMIN PANEL) =================
io.on('connection', (socket) => {
    console.log('🟢 Frontend oyunu serverə qoşuldu! ID:', socket.id);

    // Frontend-dən (Admin Paneldən) gələn "Qoşul" əmri
    socket.on('connect-tiktok', async (username) => {
        console.log(`🔄 Admin Panelindən istək gəldi: "${username}" adına qoşulunur...`);

        // 1. Əgər hal-hazırda aktiv bir bağlantı varsa, əvvəlcə onu tamamilə kəsirik
        if (tiktokLiveConnection) {
            try {
                tiktokLiveConnection.disconnect();
                console.log("🔌 Köhnə yayınçının bağlantısı uğurla kəsildi.");
            } catch (err) {
                console.error("Köhnə bağlantını kəsərkən xəta:", err);
            }
        }

        // 2. Yeni yayıncı adı ilə sıfırdan instansiya yaradırıq
        tiktokLiveConnection = new WebcastPushConnection(username);

        // 3. Bizim funksiyanı çağırıb bütün Follow/Gift eventlərini bu yeni bağlantıya yükləyirik
        setupTikTokListeners(tiktokLiveConnection);

        // 4. Canlı yayıma qoşulmağa cəhd edirik
        tiktokLiveConnection.connect().then(state => {
            console.info(`✅ TikTok yayımına uğurla qoşuldu: ${username}`);
            
            // Admin panelinə uğurlu status siqnalı göndəririk
            socket.emit('tiktok-status', { 
                success: true, 
                message: `Uğurla ${username} yayımına qoşuldu!`,
                activeUser: username 
            });
        }).catch(err => {
            console.error(`❌ TikTok bağlantı xətası (${username}):`, err);
            
            // Admin panelinə xəta siqnalı göndəririk
            socket.emit('tiktok-status', { 
                success: false, 
                message: `Bağlantı uğursuz oldu! Səbəb: ${err.message}` 
            });
        });
    });

    // İSTƏYƏ UYĞUN: Yayımı paneldən söndürmək üçün düymə qoysan bu işə düşəcək
    socket.on('disconnect-tiktok', () => {
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
            tiktokLiveConnection = null;
            console.log("🛑 Admin əmri ilə TikTok bağlantısı dayandırıldı.");
            socket.emit('tiktok-status', { success: false, message: 'Bağlantı kəsildi.' });
        }
    });
});

server.listen(3001, () => {
    console.log('🚀 Backend Server 3001 portunda hazır və dinamik əmrləri gözləyir!');
});