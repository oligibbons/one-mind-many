// src/pages/NotFoundPage.tsx

import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button'; // <-- Corrected import

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center justify-center space-y-6 text-center">
      <AlertTriangle className="h-24 w-24 text-orange-400" />
      <h1 className="text-6xl font-bold text-white">404</h1>
      <h2 className="text-3xl font-medium text-gray-300">Page Not Found</h2>
      <p className="max-w-md text-lg text-gray-400">
        We're not sure how you got here, but this page doesn't exist. Maybe
        it was consumed by the void?
      </p>
      <div>
        <Button as={Link} to="/" size="lg" variant="game">
          <Home className="mr-2 h-5 w-5" />
          Go Back Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;