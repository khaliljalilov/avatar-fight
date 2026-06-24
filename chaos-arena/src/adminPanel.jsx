import React, { useState, useEffect } from 'react';

const AdminPanel = ({ socket }) => {
    const [username, setUsername] = useState('');
    const [status, setStatus] = useState({ success: null, message: 'Bağlantı gözlənilir...' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Serverdən gələn bağlantı statusunu dinləyirik
        socket.on('tiktok-status', (data) => {
            setLoading(false);
            setStatus({ success: data.success, message: data.message });
        });

        return () => {
            socket.off('tiktok-status');
        };
    }, [socket]);

    const handleConnect = () => {
        if (!username.trim()) return alert('Zəhmət olmasa istifadəçi adı yazın!');
        setLoading(true);
        setStatus({ success: null, message: 'Qoşulur...' });
        
        // Backend-ə siqnal göndəririk
        socket.emit('connect-tiktok', username.trim());
    };

    const handleDisconnect = () => {
        socket.emit('disconnect-tiktok');
    };

    return (
        <div style={styles.panel}>
            <h3 style={styles.title}>Konstruktor Paneli</h3>
            
            <div style={styles.inputGroup}>
                <input 
                    type="text" 
                    placeholder="TikTok Username (örn: aze_blud12)" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={styles.input}
                    disabled={loading}
                />
                <button onClick={handleConnect} style={styles.connectBtn} disabled={loading}>
                    {loading ? '...' : 'Qoşul'}
                </button>
            </div>

            <div style={styles.statusBox(status.success)}>
                {status.message}
            </div>

            <button onClick={handleDisconnect} style={styles.disconnectBtn}>
                Bağlantını Kəs
            </button>
        </div>
    );
};

// Sadə və səliqəli görünüş üçün daxili CSS dizaynı (Bunu CSS faylına da ata bilərsən)
const styles = {
    panel: {
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: 'rgba(20, 20, 30, 0.9)',
        padding: '20px',
        borderRadius: '12px',
        color: '#fff',
        fontFamily: 'sans-serif',
        width: '280px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
        zIndex: 1000,
        border: '1px solid #333'
    },
    title: { margin: '0 0 15px 0', fontSize: '18px', textAlign: 'center', color: '#00f2fe' },
    inputGroup: { display: 'flex', gap: '8px', marginBottom: '15px' },
    input: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #555', backgroundColor: '#222', color: '#fff' },
    connectBtn: { padding: '8px 12px', backgroundColor: '#00f2fe', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
    disconnectBtn: { width: '100%', padding: '8px', backgroundColor: '#ff4b5c', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', marginTop: '10px' },
    statusBox: (success) => ({
        padding: '8px',
        borderRadius: '6px',
        textAlign: 'center',
        fontSize: '13px',
        backgroundColor: success === true ? 'rgba(40, 167, 69, 0.2)' : success === false ? 'rgba(220, 53, 69, 0.2)' : '#333',
        color: success === true ? '#28a745' : success === false ? '#dc3545' : '#aaa',
        border: `1px solid ${success === true ? '#28a745' : success === false ? '#dc3545' : '#555'}`
    })
};

export default AdminPanel;