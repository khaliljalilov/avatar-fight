import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// ================= ASSETLƏR =================
const ASSETS = {
  rocket: new Image(),
  shuriken: new Image(),
  dragon: new Image(),
  bassSound: new Audio("/sound/bass.mp3"),
  carpismaSound: new Audio("/sound/carpisma.mp3"),
  explosionSound: new Audio("/sound/explosion.mp3"),
  healSound: new Audio("/sound/heal.mp3"),
  helicopterSound: new Audio("/sound/helicopter.mp3"),
  impactSound: new Audio("/sound/impact.mp3"),
  lazerSound: new Audio("/sound/lazer.mp3"),
  qaradelikSound: new Audio("/sound/qaradelik.mp3"),
  shootSound: new Audio("/sound/shoot.mp3"),
  aslanSound: new Audio("/sound/aslan.mp3"),
};
ASSETS.rocket.src = "/rocket.png";
ASSETS.shuriken.src = "/shuriken.png";
ASSETS.dragon.src = "/dragon.png";

Object.keys(ASSETS).forEach((key) => {
  if (ASSETS[key] instanceof Audio) ASSETS[key].volume = 0.3;
});
if (ASSETS.carpismaSound) ASSETS.carpismaSound.volume = 0.08;
if (ASSETS.helicopterSound) ASSETS.helicopterSound.volume = 0.15;

function App() {
  const canvasRef = useRef(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);

  const [showAdmin, setShowAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerPool, setViewerPool] = useState({});
  const socketRef = useRef(null);
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [tiktokStatus, setTiktokStatus] = useState("Bağlantı gözlənilir...");

  const gameState = useRef({
    particles: [],
    projectiles: [],
    bassWaves: [],
    impactFlashes: [],
    damageTexts: [],
    blackHole: { active: false, x: 300, y: 375, radius: 0, life: 0, angle: 0 },
    laser: { active: false, angle: 0, life: 0, ownerId: null },
    players: [],
  });

  const playRealSound = (type, isLong = false) => {
    if (!soundEnabledRef.current) return;
    try {
      const sound = ASSETS[type + "Sound"];
      if (sound) {
        if (isLong) {
          sound.currentTime = 0;
          sound.play().catch(() => {});
        } else {
          const clone = sound.cloneNode();
          clone.volume = sound.volume;
          clone.play().catch(() => {});
        }
      }
    } catch (e) {}
  };

  const stopRealSound = (type) => {
    try {
      const sound = ASSETS[type + "Sound"];
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    } catch (e) {}
  };
  const createParticles = (x, y, color, count = 8, speed = 8, size = 3) => {
    for (let i = 0; i < count; i++) {
      gameState.current.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        life: 30,
        maxLife: 30,
        radius: Math.random() * size + 1,
        color: color,
      });
    }
  };
  const createImpactFlash = (x, y, power) => {
    gameState.current.impactFlashes.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: Math.min(120, power * 10),
      life: 1.0,
    });
  };

  const createDamageText = (x, y, amount) => {
    gameState.current.damageTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y - 15,
      text: `-${Math.floor(amount)}`,
      life: 40,
      maxLife: 40,
    });
  };

  const spawnPlayerFromLive = (uniqueId, nickname, profilePicUrl) => {
    if (!uniqueId) return null;
    const safeId = String(uniqueId);
    const safeName = nickname ? String(nickname) : safeId;

    const players = gameState.current.players;
    const existingPlayer = players.find((p) => p.id === safeId);
    if (existingPlayer) {
      existingPlayer.health += 20;
      return existingPlayer;
    }

    const colors = [
      "#00BFFF",
      "#FF1493",
      "#00FF41",
      "#FFD700",
      "#FF4500",
      "#9400D3",
      "#FFFFFF",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    let imgObj = null;
    if (profilePicUrl) {
      imgObj = new Image();
      imgObj.crossOrigin = "anonymous";
      imgObj.src = profilePicUrl;
    }

    playRealSound("heal");
    const newPlayer = {
      id: safeId,
      x: Math.random() * 400 + 100,
      y: Math.random() * 500 + 100,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      radius: 25,
      color: randomColor,
      name: safeName,
      health: 100,
      score: 0,
      img: imgObj,
      bladeTimer: 0,
      shieldTimer: 0,
      berserkTimer: 0,
      heliTimer: 0,
      hasBlades: false,
      bladeAngle: 0,
      hasShield: false,
      isBerserk: false,
      isHeli: false,
      heliAngle: 0,
      bassCount: 0,
    };
    players.push(newPlayer);
    return newPlayer;
  };

  const adminAction = (userId, actionType, userObj) => {
    if (!userId || !userObj) return;
    let p = spawnPlayerFromLive(
      userId,
      userObj.nickname,
      userObj.profilePictureUrl,
    );
    if (!p) return;
    if (actionType === "heal") {
      p.health += 50;
      createParticles(p.x, p.y, "#00FF00", 15, 6, 4);
      playRealSound("heal");
    }
    if (actionType === "blade") {
      p.bladeTimer += 420;
      playRealSound("aslan", true);
    }
    if (actionType === "heli") {
      p.heliTimer += 480;
      playRealSound("helicopter", true);
    }
  };

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");

    socketRef.current.on("viewer-pool", (data) => {
      if (data && data.uniqueId) {
        setViewerPool((prev) => ({ ...prev, [String(data.uniqueId)]: data }));
      }
    });
    socketRef.current.on("user-follow", (data) => {
      if (data && data.uniqueId)
        spawnPlayerFromLive(
          data.uniqueId,
          data.nickname,
          data.profilePictureUrl,
        );
    });

    socketRef.current.on("user-gift", (data) => {
      if (!data || !data.uniqueId) return;
      const p = spawnPlayerFromLive(
        data.uniqueId,
        data.nickname,
        data.profilePictureUrl,
      );
      if (!p) return;
      const gift = data.giftName ? String(data.giftName).toLowerCase() : "";
      const coins = data.diamondCount || 0;
      const repeat = data.repeatCount || 1;

      p.health += 10 * repeat;
      p.score += coins > 0 ? coins * repeat * 5 : repeat * 2;

      if (gift === "rosa") {
        playRealSound("lazer", true);
        gameState.current.laser = {
          active: true,
          angle: 0,
          life: 480,
          ownerId: p.id,
        };
      } else if (gift.includes("gül") || gift.includes("rose")) {
        p.radius = Math.min(90, p.radius + 2 * repeat);
        p.health += 15 * repeat;
        playRealSound("heal");
        createParticles(p.x, p.y, "#FFFF00", 10, 4, 3);
      } else if (gift === "tiktok") {
        playRealSound("berserk", true);
        p.berserkTimer += 360 * repeat;
        p.shieldTimer += 360 * repeat;
      } else if (gift === "gg") {
        p.shieldTimer += 600 * repeat;
        playRealSound("shoot");
        for (let i = -1; i <= 1; i++) {
          let angle = Math.random() * Math.PI * 2 + i * 0.5;
          gameState.current.projectiles.push({
            x: p.x,
            y: p.y,
            vx: Math.cos(angle) * 8,
            vy: Math.sin(angle) * 8,
            color: "#FFA500",
            life: 800,
            ownerId: p.id,
            type: "dragon",
          });
        }
      } else if (
        coins === 1 &&
        (gift.includes("ice") ||
          gift.includes("dondurma") ||
          gift.includes("aslan"))
      ) {
        playRealSound("aslan", true);
        p.bladeTimer += 420 * repeat;
      } else if (
        gift.includes("finger") ||
        gift.includes("heart") ||
        gift.includes("ürək") ||
        gift.includes("ürek")
      ) {
        playRealSound("helicopter", true);
        p.heliTimer += 480 * repeat;
      } else if (gift === "nar" || gift.includes("pomegranate")) {
        p.bassCount += 6 * repeat;
        p.shieldTimer += 300 * repeat;
      } else if (
        gift.includes("journey pass") ||
        gift.includes("dost") ||
        gift.includes("friend")
      ) {
        playRealSound("qaradelik", true);
        gameState.current.blackHole = {
          active: true,
          x: p.x,
          y: p.y,
          radius: 0,
          life: 500,
          angle: 0,
        };
      } else if (coins >= 10) {
        p.health += 50 * repeat;
        playRealSound("heal");
        createParticles(p.x, p.y, "#00FF00", 15, 6, 4);
      }
    });
    socketRef.current.on("tiktok-status", (data) => {
      setTiktokStatus(data.message);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);
  const handleConnectTikTok = () => {
    if (!tiktokUsername.trim())
      return alert("Zəhmət olmasa istifadəçi adı yazın!");
    setTiktokStatus("Qoşulur...");

    if (socketRef.current) {
      socketRef.current.emit("connect-tiktok", tiktokUsername.trim());
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.fillStyle = "#020205";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      let arenaGrad = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        Math.max(cx, cy),
      );
      arenaGrad.addColorStop(0, "#0a0a1a");
      arenaGrad.addColorStop(0.7, "#11152a");
      arenaGrad.addColorStop(1, "#050510");
      ctx.fillStyle = arenaGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frameCount * 0.002);
      ctx.beginPath();
      ctx.arc(0, 0, 200, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 191, 255, 0.2)";
      ctx.lineWidth = 15;
      ctx.stroke();
      ctx.restore();

      gameState.current.players = gameState.current.players.filter(
        (p) => p && p.health > 0,
      );
      const players = gameState.current.players;

      let topHealthPlayer =
        players.length > 0
          ? players.reduce(
              (max, p) => (p.health > max.health ? p : max),
              players[0],
            )
          : null;
      if (
        topHealthPlayer &&
        topHealthPlayer.img &&
        topHealthPlayer.img.complete &&
        topHealthPlayer.health > 0
      ) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.sin(frameCount * 0.01) * 0.1);
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(0, 0, 130, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(topHealthPlayer.img, -130, -130, 260, 260);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(cx, cy, 130, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 255, 65, 0.2)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#00FF41";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        const kName = topHealthPlayer.name
          ? String(topHealthPlayer.name).toUpperCase()
          : "KRAL";
        ctx.fillText(`🛡️ HP LİDERİ: ${kName} 🛡️`, cx, cy + 160);
        ctx.globalAlpha = 1.0;
      }

      let particles = gameState.current.particles;
      let projectiles = gameState.current.projectiles;
      let bassWaves = gameState.current.bassWaves;
      let impactFlashes = gameState.current.impactFlashes;
      let damageTexts = gameState.current.damageTexts;
      let laser = gameState.current.laser;

      if (laser.active) {
        laser.life--;
        laser.angle += 0.02;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(laser.angle);
        ctx.beginPath();
        ctx.moveTo(-canvas.width, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.strokeStyle = "rgba(255, 0, 150, 0.6)";
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-canvas.width, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.restore();
        let A = Math.sin(laser.angle);
        let B = -Math.cos(laser.angle);
        let C = -cx * A - cy * B;
        players.forEach((p) => {
          if (p.id === laser.ownerId) return;
          if (Math.abs(A * p.x + B * p.y + C) < p.radius + 9) {
            p.health -= 0.8;
            if (frameCount % 10 === 0) createDamageText(p.x, p.y, 0.8);
            if (frameCount % 3 === 0)
              createParticles(p.x, p.y, "#FF00FF", 2, 5, 2);
          }
        });
        if (laser.life <= 0) {
          laser.active = false;
          stopRealSound("lazer");
        }
      }

      for (let i = impactFlashes.length - 1; i >= 0; i--) {
        let fl = impactFlashes[i];
        fl.radius += 8;
        fl.life -= 0.08;
        if (fl.life <= 0) impactFlashes.splice(i, 1);
        else {
          ctx.beginPath();
          ctx.arc(fl.x, fl.y, fl.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${fl.life})`;
          ctx.fill();
          ctx.closePath();
        }
      }
      for (let i = bassWaves.length - 1; i >= 0; i--) {
        let wave = bassWaves[i];
        wave.radius += 8;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 191, 255, ${Math.max(0, 1 - wave.radius / wave.maxRadius)})`;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.closePath();
        players.forEach((p) => {
          let dist = Math.hypot(p.x - wave.x, p.y - wave.y);
          if (Math.abs(dist - wave.radius) < 10) {
            p.vx += ((p.x - wave.x) / dist) * 5;
            p.vy += ((p.y - wave.y) / dist) * 5;
            p.health -= 2;
            createDamageText(p.x, p.y, 2);
          }
        });
        if (wave.radius >= wave.maxRadius) bassWaves.splice(i, 1);
      }
      for (let i = projectiles.length - 1; i >= 0; i--) {
        let proj = projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life -= 1;
        let angle = Math.atan2(proj.vy, proj.vx);
        createParticles(
          proj.x - Math.cos(angle) * 15,
          proj.y - Math.sin(angle) * 15,
          proj.color,
          1,
          1.5,
          2,
        );
        if (proj.x < 0 || proj.x > canvas.width) proj.vx *= -1;
        if (proj.y < 0 || proj.y > canvas.height) proj.vy *= -1;
        for (let p of players) {
          if (p.id === proj.ownerId) continue;
          if (Math.hypot(p.x - proj.x, p.y - proj.y) < p.radius + 15) {
            p.health -= 1;
            if (frameCount % 8 === 0) createDamageText(p.x, p.y, 1);
            if (frameCount % 4 === 0)
              createParticles(p.x, p.y, "#FF4500", 2, 4);
          }
        }
        if (proj.life <= 0) projectiles.splice(i, 1);
        else {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(angle);
          if (proj.type === "dragon" && ASSETS.dragon.complete)
            ctx.drawImage(ASSETS.dragon, -25, -25, 50, 50);
          else if (proj.type === "rocket" && ASSETS.rocket.complete)
            ctx.drawImage(ASSETS.rocket, -15, -10, 30, 20);
          else {
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(10, 0);
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 4;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      for (let i = 0; i < players.length; i++) {
        let p1 = players[i];
        if (!p1) continue;

        if (p1.bladeTimer > 0) {
          p1.hasBlades = true;
          p1.bladeTimer--;
        } else {
          p1.hasBlades = false;
        }
        if (p1.heliTimer > 0) {
          p1.isHeli = true;
          p1.heliTimer--;
        } else {
          p1.isHeli = false;
        }
        if (p1.berserkTimer > 0) {
          p1.isBerserk = true;
          p1.berserkTimer--;
        } else {
          p1.isBerserk = false;
        }
        if (p1.shieldTimer > 0) {
          p1.hasShield = true;
          p1.shieldTimer--;
        } else {
          p1.hasShield = false;
        }

        if (p1.isBerserk) {
          if (frameCount % 2 === 0)
            createParticles(p1.x, p1.y, "#00FFFF", 2, 2, 3);
          p1.vx += (Math.random() - 0.5) * 4;
          p1.vy += (Math.random() - 0.5) * 4;
        }
        if (p1.bassCount > 0 && frameCount % 40 === 0) {
          bassWaves.push({
            x: p1.x,
            y: p1.y,
            radius: p1.radius,
            maxRadius: 350,
          });
          playRealSound("bass");
          p1.bassCount--;
        }
        if (p1.isHeli) {
          p1.heliAngle += 0.4;
          if (frameCount % 20 === 0) {
            let angle = Math.random() * Math.PI * 2;
            projectiles.push({
              x: p1.x,
              y: p1.y,
              vx: Math.cos(angle) * 12,
              vy: Math.sin(angle) * 12,
              color: "#FF4500",
              life: 120,
              ownerId: p1.id,
              type: "rocket",
            });
          }
        }

        let speed = Math.hypot(p1.vx, p1.vy);
        const MAX_SPEED = p1.isBerserk ? 18 : 7;
        const MIN_SPEED = 1.5;
        if (speed > MAX_SPEED) {
          p1.vx *= 0.95;
          p1.vy *= 0.95;
        } else if (speed < MIN_SPEED && speed > 0.1) {
          p1.vx = (p1.vx / speed) * MIN_SPEED;
          p1.vy = (p1.vy / speed) * MIN_SPEED;
        }
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x + p1.radius > canvas.width) {
          p1.x = canvas.width - p1.radius;
          p1.vx *= -1;
        } else if (p1.x - p1.radius < 0) {
          p1.x = p1.radius;
          p1.vx *= -1;
        }
        if (p1.y + p1.radius > canvas.height) {
          p1.y = canvas.height - p1.radius;
          p1.vy *= -1;
        } else if (p1.y - p1.radius < 0) {
          p1.y = p1.radius;
          p1.vy *= -1;
        }

        if (p1.hasBlades) {
          p1.bladeAngle += 0.12;
          const orbitRadius = p1.radius + 30;
          for (let b = 0; b < 3; b++) {
            let angle = p1.bladeAngle + (b * Math.PI * 2) / 3;
            let bladeX = p1.x + Math.cos(angle) * orbitRadius;
            let bladeY = p1.y + Math.sin(angle) * orbitRadius;
            ctx.save();
            ctx.translate(bladeX, bladeY);
            ctx.rotate(p1.bladeAngle * 4);
            if (ASSETS.shuriken.complete)
              ctx.drawImage(ASSETS.shuriken, -12, -12, 24, 24);
            ctx.restore();
            for (let j = 0; j < players.length; j++) {
              if (i === j) continue;
              let p2 = players[j];
              if (!p2) continue;
              let dx = p2.x - bladeX;
              let dy = p2.y - bladeY;
              if (Math.hypot(dx, dy) < p2.radius + 12) {
                p2.vx = (dx / Math.hypot(dx, dy)) * 8;
                p2.vy = (dy / Math.hypot(dx, dy)) * 8;
                p2.health -= 3;
                createDamageText(p2.x, p2.y, 3);
                createParticles(bladeX, bladeY, "#FF0000", 3, 5);
              }
            }
          }
        }

        for (let j = i + 1; j < players.length; j++) {
          let p2 = players[j];
          if (!p2) continue;
          let dx = p2.x - p1.x;
          let dy = p2.y - p1.y;
          let distance = Math.hypot(dx, dy);
          let minDist = p1.radius + p2.radius;
          if (distance < minDist) {
            let overlap = minDist - distance;
            let nx = dx / distance;
            let ny = dy / distance;
            p1.x -= nx * (overlap / 2);
            p1.y -= ny * (overlap / 2);
            p2.x += nx * (overlap / 2);
            p2.y += ny * (overlap / 2);
            let relSpeed = (p1.vx - p2.vx) * nx + (p1.vy - p2.vy) * ny;

            // ================= YENİ: ZƏRƏR YALNIZ ZƏRBƏ ANINDA HESABLANIR =================
            if (relSpeed < 0) {
              let baseDmg = 1.5 + Math.abs(relSpeed) * 0.5; // Balanslı zərər (1.5 - 5 arası)
              let dmg1 = p1.hasShield ? baseDmg * 0.15 : baseDmg;
              let dmg2 = p2.hasShield ? baseDmg * 0.15 : baseDmg;

              p1.health -= dmg1;
              p2.health -= dmg2;

              createDamageText(p1.x, p1.y, dmg1);
              createDamageText(p2.x, p2.y, dmg2);

              let powerMultiplier = p1.isBerserk || p2.isBerserk ? 3 : 1.5;
              let impulse = (2 * relSpeed) / (p1.radius + p2.radius);
              p1.vx -= impulse * p2.radius * nx * powerMultiplier;
              p1.vy -= impulse * p2.radius * ny * powerMultiplier;
              p2.vx += impulse * p1.radius * nx * powerMultiplier;
              p2.vy += impulse * p1.radius * ny * powerMultiplier;
              playRealSound("carpisma");
              createParticles((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, "#FFF");
              if (Math.abs(relSpeed) > 4)
                createImpactFlash(
                  (p1.x + p2.x) / 2,
                  (p1.y + p2.y) / 2,
                  Math.abs(relSpeed),
                );
            }
          }
        }

        ctx.save();
        ctx.translate(p1.x, p1.y);
        ctx.rotate(frameCount * 0.05 + i);
        ctx.beginPath();
        ctx.arc(0, 0, p1.radius + 6, 0, Math.PI * 2);
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = p1.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p1.color;
        ctx.stroke();
        ctx.restore();
        if (p1.hasShield || p1.isBerserk) {
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, p1.radius + 10, 0, Math.PI * 2);
          ctx.strokeStyle = p1.isBerserk ? "#0000FF" : "#00FFFF";
          ctx.setLineDash([]);
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.closePath();
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.clip();
        if (p1.img && p1.img.complete && p1.img.naturalHeight !== 0) {
          ctx.drawImage(
            p1.img,
            p1.x - p1.radius,
            p1.y - p1.radius,
            p1.radius * 2,
            p1.radius * 2,
          );
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
          ctx.fillRect(
            p1.x - p1.radius,
            p1.y - p1.radius,
            p1.radius * 2,
            p1.radius * 2,
          );
        } else {
          ctx.fillStyle = p1.color;
          ctx.fill();
        }
        ctx.restore();

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.strokeStyle = p1.color;
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        if (p1.isHeli) {
          ctx.save();
          ctx.translate(p1.x, p1.y);
          ctx.rotate(p1.heliAngle);
          ctx.fillStyle = "#AAAAAA";
          ctx.fillRect(-p1.radius - 15, -3, (p1.radius + 15) * 2, 6);
          ctx.restore();
        }

        ctx.fillStyle = "white";
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.fillText(p1.name, p1.x, p1.y - p1.radius - 15);
        let hpText = Math.max(0, Math.floor(p1.health)).toString();
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 16px Arial";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#000000";
        ctx.strokeText(hpText, p1.x, p1.y);
        ctx.fillText(hpText, p1.x, p1.y);
        ctx.textBaseline = "alphabetic";
      }

      for (let i = damageTexts.length - 1; i >= 0; i--) {
        let dt = damageTexts[i];
        dt.y -= 0.8;
        dt.life--;
        if (dt.life <= 0) {
          damageTexts.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = dt.life / dt.maxLife;
          ctx.fillStyle = "#FF3333";
          ctx.font = "black 900 16px Arial";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#000000";
          ctx.textAlign = "center";
          ctx.fillText(dt.text, dt.x, dt.y);
          ctx.restore();
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        let pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        if (pt.life <= 0) particles.splice(i, 1);
        else {
          ctx.globalAlpha = pt.life / pt.maxLife;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
          ctx.closePath();
          ctx.globalAlpha = 1.0;
        }
      }

      if (players.length > 0) {
        let sortedByHP = [...players]
          .sort((a, b) => b.health - a.health)
          .slice(0, 3);
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(canvas.width - 170, 15, 160, 95);
        ctx.strokeStyle = "#00FF41";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width - 170, 15, 160, 95);
        ctx.fillStyle = "#00FF41";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "left";
        ctx.fillText("💚 EN GÜCLÜ HP", canvas.width - 160, 35);

        sortedByHP.forEach((p, idx) => {
          ctx.fillStyle =
            idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : "#CD7F32";
          ctx.font = "bold 13px Arial";
          const safeName = p.name ? String(p.name) : "Oyunçu";
          ctx.fillText(
            `${idx + 1}. ${safeName.substring(0, 8)}: ${Math.floor(p.health)}`,
            canvas.width - 160,
            58 + idx * 18,
          );
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleEnableSound = () => {
    soundEnabledRef.current = true;
    setSoundEnabled(true);
  };

  const filteredPool = Object.values(viewerPool)
    .filter((user) => {
      if (!user) return false;
      const uId = user.uniqueId ? String(user.uniqueId).toLowerCase() : "";
      const uName = user.nickname ? String(user.nickname).toLowerCase() : "";
      const search = searchTerm ? String(searchTerm).toLowerCase() : "";
      return uId.includes(search) || uName.includes(search);
    })
    .reverse();

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#000",
        minHeight: "100vh",
        padding: "15px",
        fontFamily: "sans-serif",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setShowAdmin(!showAdmin)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 100,
          background: "#111",
          border: "1px solid #00BFFF",
          color: "#00BFFF",
          padding: "10px 15px",
          borderRadius: "5px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ⚙️ {showAdmin ? "Paneli Bağla" : "İdarəetmə Paneli"}
      </button>
      {showAdmin && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            left: "20px",
            zIndex: 99,
            width: "350px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            background: "rgba(15, 15, 20, 0.95)",
            border: "2px solid #00BFFF",
            borderRadius: "10px",
            padding: "15px",
            color: "white",
            boxShadow: "5px 5px 25px rgba(0,0,0,0.8)",
          }}
        >
          <h3
            style={{
              margin: "0 0 10px 0",
              borderBottom: "1px solid #444",
              paddingBottom: "10px",
            }}
          >
            Oyunçu Hovuzu
          </h3>
          <div
            style={{
              marginBottom: "15px",
              paddingBottom: "15px",
              borderBottom: "1px solid #333",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: tiktokStatus.includes("Uğurlu") ? "#28a745" : "#aaa",
                marginBottom: "5px",
              }}
            >
              📢 {tiktokStatus}
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <input
                type="text"
                placeholder="TikTok Username (örn: emin)"
                value={tiktokUsername}
                onChange={(e) => setTiktokUsername(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "5px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #555",
                }}
              />
              <button
                onClick={handleConnectTikTok}
                style={{
                  background: "#00BFFF",
                  color: "black",
                  border: "none",
                  padding: "8px 15px",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Qoşul
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder="İstifadəçi adı ilə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "5px",
              background: "#222",
              color: "#fff",
              border: "1px solid #555",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
            {filteredPool.map((user) => (
              <div
                key={user.uniqueId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#222",
                  padding: "10px",
                  marginBottom: "10px",
                  borderRadius: "5px",
                  borderLeft: "3px solid #00BFFF",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color: "#FFF",
                    marginBottom: "8px",
                  }}
                >
                  @{user.uniqueId}
                </div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => adminAction(user.uniqueId, "spawn", user)}
                    style={{
                      flex: 1,
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Oyuna Sal
                  </button>
                  <button
                    onClick={() => adminAction(user.uniqueId, "heal", user)}
                    style={{
                      flex: 1,
                      background: "#17a2b8",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    +50 Can
                  </button>
                  <button
                    onClick={() => adminAction(user.uniqueId, "blade", user)}
                    style={{
                      flex: 1,
                      background: "#ffc107",
                      color: "black",
                      border: "none",
                      padding: "5px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                  >
                    Bıçaq
                  </button>
                  <button
                    onClick={() => adminAction(user.uniqueId, "heli", user)}
                    style={{
                      flex: 1,
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "5px",
                      borderRadius: "3px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Heli
                  </button>
                </div>
              </div>
            ))}
            {filteredPool.length === 0 && (
              <p
                style={{
                  fontSize: "14px",
                  color: "#888",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Heç kim tapılmadı...
              </p>
            )}
          </div>
        </div>
      )}
      <h2
        style={{
          color: "#fff",
          letterSpacing: "2px",
          margin: "5px 0 15px 0",
          textShadow: "0 0 15px #00BFFF",
        }}
      >
        LIVE STREAM BATTLE ARENA
      </h2>
      {!soundEnabled && (
        <button
          onClick={handleEnableSound}
          style={{
            padding: "12px 25px",
            marginBottom: "20px",
            backgroundColor: "#00BFFF",
            color: "black",
            fontWeight: "bold",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 15px #00BFFF",
          }}
        >
          🎮 OYUNU VƏ SƏSLƏRİ BAŞLAT
        </button>
      )}
      <canvas
        ref={canvasRef}
        width={600}
        height={750}
        style={{
          border: "3px solid #333",
          borderRadius: "16px",
          boxShadow: "0 0 40px rgba(0, 191, 255, 0.15)",
        }}
      />
    </div>
  );
}

export default App;
