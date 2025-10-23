import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
}

interface User {
  id: string;
  username: string;
  email: string;
  age?: number;
}

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch('/api/socketio');
    const socketInstance = io({
      path: '/api/socketio',
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('Connected to SocketIO server');
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from SocketIO server');
    });

    socketInstance.on('message:received', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socketInstance.on('user:joined', (data: { username: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          username: 'System',
          message: `${data.username} joined the chat`,
          timestamp: new Date(),
        },
      ]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const handleCreateUser = () => {
    if (!socket) return;
    setErrors({});

    const userData = {
      username,
      email,
      ...(age && { age: parseInt(age) }),
    };

    socket.emit('user:create', userData, (response: any) => {
      if (response.success) {
        setCurrentUser(response.data);
        setUsername('');
        setEmail('');
        setAge('');
      } else {
        setErrors(response.errors || {});
      }
    });
  };

  const handleSendMessage = () => {
    if (!socket || !currentUser) return;
    setErrors({});

    socket.emit('message:send', { message }, (response: any) => {
      if (response.success) {
        setMessages((prev) => [...prev, response.data]);
        setMessage('');
      } else {
        setErrors(response.errors || {});
      }
    });
  };

  const handleListUsers = () => {
    if (!socket) return;

    socket.emit('user:list', {}, (response: any) => {
      if (response.success) {
        setUsers(response.data);
      }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Hyperf SocketIO Server with Auto-Validation</h1>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: connected ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>
        Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {!currentUser ? (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
          <h2>Create User (with validation)</h2>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Username (min 3 chars)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '8px', width: '300px', marginRight: '10px' }}
            />
            {errors.username && (
              <div style={{ color: 'red', fontSize: '12px' }}>{errors.username.join(', ')}</div>
            )}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '8px', width: '300px', marginRight: '10px' }}
            />
            {errors.email && (
              <div style={{ color: 'red', fontSize: '12px' }}>{errors.email.join(', ')}</div>
            )}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="number"
              placeholder="Age (optional, 13-120)"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              style={{ padding: '8px', width: '300px', marginRight: '10px' }}
            />
            {errors.age && (
              <div style={{ color: 'red', fontSize: '12px' }}>{errors.age.join(', ')}</div>
            )}
          </div>
          <button onClick={handleCreateUser} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Create User
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px' }}>
            <h3>Welcome, {currentUser.username}!</h3>
            <p>Email: {currentUser.email}</p>
            {currentUser.age && <p>Age: {currentUser.age}</p>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleListUsers} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              List All Users
            </button>
            {users.length > 0 && (
              <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd' }}>
                <h4>Active Users:</h4>
                {users.map((user) => (
                  <div key={user.id}>{user.username} ({user.email})</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <h2>Send Message (with validation)</h2>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Message (required)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ padding: '8px', width: '400px', marginRight: '10px' }}
              />
              {errors.message && (
                <div style={{ color: 'red', fontSize: '12px' }}>{errors.message.join(', ')}</div>
              )}
            </div>
            <button onClick={handleSendMessage} style={{ padding: '10px 20px', cursor: 'pointer' }}>
              Send Message
            </button>
          </div>

          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
            <h2>Messages</h2>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '3px' }}>
                  <strong>{msg.username}:</strong> {msg.message}
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✅ Auto-validation using decorators (@IsString, @IsEmail, @MinLength, etc.)</li>
          <li>✅ SocketIO event handlers with @SocketEvent decorator</li>
          <li>✅ DTO validation with @ValidatePayload decorator</li>
          <li>✅ Real-time error messages displayed to users</li>
          <li>✅ Type-safe data transfer objects (DTOs)</li>
          <li>✅ Automatic payload transformation and validation</li>
        </ul>
      </div>
    </div>
  );
}
