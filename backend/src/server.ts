import app from './app';
import { AuthService } from './services/authService';

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    // Ensure default admin & dispatcher accounts exist
    await AuthService.ensureDefaultUsers();
  } catch (err) {
    console.error('Warning: could not provision default users on startup:', err);
  }

  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` FleetWise Backend Service Running`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
  });
}

start();
