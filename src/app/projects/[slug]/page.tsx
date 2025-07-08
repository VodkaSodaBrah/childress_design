// src/app/projects/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { projects, Project } from '@/data/projects';
import Image from 'next/image';

interface Params {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export default function ProjectPage({ params }: Params) {
  const project = projects.find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
      <div className="mb-6">
        {project.type === 'iframe' ? (
          <iframe
            src={project.liveUrl}
            className="w-full h-[400px] border"
            sandbox="allow-scripts allow-forms"
          />
        ) : (
          <Image
            src={project.screenshot}
            alt={`${project.title} screenshot`}
            width={800}
            height={450}
            className="w-full object-contain"
          />
        )}
      </div>
      <a
        href={project.liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View live project
      </a>
      <a
        href={`https://github.com/mchildress/${project.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 text-blue-600 underline"
      >
        View source on GitHub
      </a>
    </main>
);
}