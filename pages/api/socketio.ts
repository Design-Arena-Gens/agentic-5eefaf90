import { Server as HTTPServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { HyperfSocketIOServer } from '../../lib/server/socketio-server';
import { UserController } from '../../lib/controllers/user.controller';

export const config = {
  api: {
    bodyParser: false,
  },
};

let hyperfServer: HyperfSocketIOServer | null = null;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hyperfServer) {
    const httpServer = (res.socket as any).server as HTTPServer;

    hyperfServer = new HyperfSocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    hyperfServer.registerController(UserController);

    console.log('SocketIO server initialized with auto-validation');
  }

  res.status(200).json({ status: 'ok', message: 'SocketIO server running' });
}
