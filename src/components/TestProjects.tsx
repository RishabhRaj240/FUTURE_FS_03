import React from "react";
import { ProjectCard } from "./ProjectCard";

// Test component to verify ProjectCard rendering
export const TestProjects = () => {
  const testProjects = [
    {
      id: "test-1",
      title: "Test Project 1",
      image_url: "https://via.placeholder.com/400x300",
      likes_count: 5,
      saves_count: 2,
      views_count: 10,
      user_id: "test-user",
      profiles: {
        id: "test-user",
        username: "testuser",
        full_name: "Test User",
        avatar_url: "https://via.placeholder.com/40x40",
      },
      categories: {
        id: "test-cat",
        name: "Test Category",
      },
    },
    {
      id: "test-2",
      title: "Test Project 2",
      image_url: "https://via.placeholder.com/400x300",
      likes_count: 3,
      saves_count: 1,
      views_count: 8,
      user_id: "test-user-2",
      profiles: {
        id: "test-user-2",
        username: "testuser2",
        full_name: "Test User 2",
        avatar_url: "https://via.placeholder.com/40x40",
      },
      categories: {
        id: "test-cat-2",
        name: "Test Category 2",
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {testProjects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};
