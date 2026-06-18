import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../services/api';

const LAny = L as any;
if (!LAny.Routing) {
  LAny.Routing = (window as any).L.Routing;
}

const RoutingMachine = ({ admin, user }: { admin: any, user: any }) => {
  const map = useMap();
  useEffect(() => {
    const lat = user.locations?.[0]?.latitude;
    const lng = user.locations?.[0]?.longitude;
    if (!map || !lat || !lng) return;

    const control = LAny.Routing.control({
      waypoints: [L.latLng(admin.lat, admin.lng), L.latLng(lat, lng)],
      lineOptions: { styles: [{ color: '#3b82f6', weight: 6 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      createMarker: () => null
    }).addTo(map);

    return () => {
      try { if (map && control) map.removeControl(control); } catch (e) { console.error(e); }
    };
  }, [map, admin, user]);
  return null;
};

export const Dashboard = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const navigate = useNavigate();
  const socket = useRef<any>(null);
  const admin = { lat: 16.8409, lng: 96.1735 };

  const getUserIdFromToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload).sub;
    } catch (e) { return null; }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        const currentMyId = String(getUserIdFromToken(token));
        setMyId(currentMyId);

        const res = await api.get('/users');
        setUsers(res.data);
      } catch (err) { console.error(err); }
    };
    fetchUsers();

    socket.current = io('http://localhost:3000');
    socket.current.on('location_update', (data: any) => {
      setUsers((prev) => prev.map(u =>
        u.id === data.userId ? {
          ...u,
          locations: [{ latitude: parseFloat(data.latitude), longitude: parseFloat(data.longitude) }]
        } : u
      ));
    });

    const watchId = navigator.geolocation.watchPosition((pos) => {
      api.post('/tracking', {
        latitude: parseFloat(pos.coords.latitude.toFixed(6)),
        longitude: parseFloat(pos.coords.longitude.toFixed(6))
      });
    }, null, { enableHighAccuracy: true });

    return () => {
      navigator.geolocation.clearWatch(watchId);
      socket.current.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    socket.current?.disconnect();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 z-[1000] bg-slate-900 text-white p-3 rounded shadow-lg"
      >
        ☰
      </button>

      {/* Sidebar ဧရိယာ */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        fixed top-0 left-0 h-full w-80 bg-slate-900 text-white transition-transform duration-300 z-[1001] flex flex-col shadow-2xl`}
      >
        {/* Sidebar အတွင်းပိုင်း */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-blue-400">User List</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-2xl">✕</button>
        </div>

        {/* Scrollable User List */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {users.filter(u => String(u.id) !== myId).map((u) => (
            <div key={u.id} className={`p-3 rounded mb-2 cursor-pointer ${selectedUser?.id === u.id ? 'bg-blue-900' : 'bg-slate-800'}`}
              onClick={() => { setSelectedUser(u); setIsSidebarOpen(false); }}>
              <p>{u.name}</p>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700">
          <button onClick={handleLogout} className="w-full bg-red-600 py-2 rounded font-bold">
            Logout
          </button>
        </div>
      </div>

      <MapContainer
        center={[admin.lat, admin.lng]}
        zoom={13}
        style={{ flex: 1 }}
        zoomControl={false} // Default နေရာက အပေါင်း/အနှုတ်ကို ပိတ်လိုက်ပါ
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Zoom Control ကို ညာဘက်အောက်ထောင့် (bottomright) မှာ ထားခြင်း */}
        <ZoomControl position="bottomright" />

        <Marker position={[admin.lat, admin.lng]} />
        {users.map((u) => {
          const lat = u.locations?.[0]?.latitude;
          const lng = u.locations?.[0]?.longitude;
          return (lat && lng) ? <Marker key={u.id} position={[lat, lng]} /> : null;
        })}
        {selectedUser && <RoutingMachine admin={admin} user={selectedUser} />}
      </MapContainer>
    </div>
  );
};