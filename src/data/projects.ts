

// src/data/projects.ts

export interface Project {
  slug: string;
  title: string;
  liveUrl: string;
  screenshot: string;
  position: [number, number, number];
  type: 'iframe' | 'image';
}

export const projects: Project[] = [
  {
    slug: 'Childress-Digital-Studio',
    title: 'Childress Digital Studio',
    liveUrl: 'https://childressdigitalstudio.com',
    screenshot: '/screenshots/portfolio.png',
    position: [10, 2, -5],   // adjust coordinates as needed
    type: 'iframe',
  },
  // Add additional project entries below following the same structure
];