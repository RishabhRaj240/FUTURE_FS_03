import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const NavigationTest = () => {
  const navigate = useNavigate();

  const handleProgrammaticNavigation = () => {
    navigate("/project/test-123");
  };

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Navigation Test</h3>

      <div className="space-y-2">
        <p>Test Link Navigation:</p>
        <Link
          to="/project/test-123"
          className="block p-2 bg-blue-100 rounded hover:bg-blue-200"
        >
          Click to navigate to /project/test-123
        </Link>
      </div>

      <div className="space-y-2">
        <p>Test Programmatic Navigation:</p>
        <Button onClick={handleProgrammaticNavigation}>
          Navigate Programmatically
        </Button>
      </div>

      <div className="space-y-2">
        <p>Test with real project ID:</p>
        <Link
          to="/project/real-project-id"
          className="block p-2 bg-green-100 rounded hover:bg-green-200"
        >
          Click to navigate to real project
        </Link>
      </div>
    </div>
  );
};
