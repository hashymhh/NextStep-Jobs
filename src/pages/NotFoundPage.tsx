import React from 'react';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <Shell hideLeftRail hideRightRail>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0A66C2] mx-auto flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-500 mb-6">
            The page you requested may have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link to="/">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Go to NextStep Feed
            </Button>
          </Link>
        </Card>
      </div>
    </Shell>
  );
};
